#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { DataStoreStack } from '../lib/data-store-stack';
import { ContainerStack } from '../lib/container-stack';

const app = new cdk.App();

const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };

const vpcStack = new VpcStack(app, 'VpcStack', {
	env: env,
});

const dataStoreStack = new DataStoreStack(app, 'DataStoreStack', {
	env: env,
	vpc: vpcStack.vpc,
	securityGroups: [vpcStack.databaseTierSecurityGroup]
});

new ContainerStack(app, 'ContainerStack', {
	env: env,
	vpc: vpcStack.vpc,
	s3Bucket: dataStoreStack.s3Bucket,
	securityGroups: [vpcStack.webTierSecurityGroup]
});

app.synth();
