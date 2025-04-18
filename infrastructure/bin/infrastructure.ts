#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { DataStoreStack } from '../lib/data-store-stack';
import { ContainerStack } from '../lib/container-stack';
import { config } from "dotenv";
import { join } from 'path';
import { exit } from 'process';
import { BackendPipelineStack } from '../lib/backend-pipeline-stack';

export interface AppConfiguration {
    awsCertificateArn: string;
    awsHostedZoneName: string;
    awsRegion: string;
    awsAccountId: string;

    gitHubOwner:  string;
	gitHubRepositoryName: string;
	gitHubSecretName: string;
}

export function parseEnvFile(): AppConfiguration | null {
    const envFilePath = join(__dirname, '.env');
    console.log(`Reading environment variables from '${envFilePath}'`)
    const envConfigResult = config({
        path: envFilePath
    });

    if (envConfigResult.error) {
        console.error(envConfigResult.error);
        return null;
    }

    const parsedConfig = envConfigResult.parsed;
    if (parsedConfig === undefined || parsedConfig === null) {
        return null;
    }

    if (Object.values(parsedConfig).some(x => x === undefined || x === null)) {
        return null;
    }

    const appConfiguration: AppConfiguration = {
        awsCertificateArn: parsedConfig.Aws__CertificateArn,
        awsHostedZoneName: parsedConfig.Aws__HostedZoneName
    }

    return appConfiguration;
}

const appConfig = parseEnvFile() || exit(1);
const app = new cdk.App();

const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };
const vpcStack = new VpcStack(app, 'ScsVpcStack', {
	env: env,
});

const dataStoreStack = new DataStoreStack(app, 'ScsDataStoreStack', {
	env: env,
	vpc: vpcStack.vpc,
	securityGroups: [vpcStack.databaseTierSecurityGroup]
});

const containerStack = new ContainerStack(app, 'ScsContainerStack', {
	env: env,
	vpc: vpcStack.vpc,
	envBucket: dataStoreStack.envBucket,
	dataBucket: dataStoreStack.dataBucket,
	webTierSecurityGroups: [vpcStack.webTierSecurityGroup],
	loadBalancerTierSecurityGroup: vpcStack.loadBalancerTierSecurityGroup,
	awsCertificateArn: appConfig.awsCertificateArn,
    awsHostedZoneName: appConfig.awsHostedZoneName,
    ecrRepository: dataStoreStack.ecrRepository
});

new BackendPipelineStack(app, 'ScsBackendPipelineStack', {
    env: env,

	gitHubOwner: appConfig.gitHubOwner,
	gitHubRepositoryName: appConfig.gitHubRepositoryName,
    gitHubSecretName: appConfig.gitHubSecretName,

	fargateService: containerStack.fargateService,
	ecrRepository: dataStoreStack.ecrRepository,
	awsRegion: appConfig.awsRegion,
    awsAccountId: appConfig.awsAccountId,
    
	dbUserId: 'postgres',
	dbEndpoint: dataStoreStack.database.dbInstanceEndpointAddress,
	dbName: dataStoreStack.database.instanceIdentifier,
})

app.synth();
