#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { DataStoreStack } from '../lib/data-store-stack';
import { ContainerStack } from '../lib/container-stack';
import { SecurityGroup } from 'aws-cdk-lib/aws-ec2';

const app = new cdk.App();
// new InfrastructureStack(app, 'InfrastructureStack', {
//   /* If you don't specify 'env', this stack will be environment-agnostic.
//    * Account/Region-dependent features and context lookups will not work,
//    * but a single synthesized template can be deployed anywhere. */

//   /* Uncomment the next line to specialize this stack for the AWS Account
//    * and Region that are implied by the current CLI configuration. */
//   // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

//   /* Uncomment the next line if you know exactly what Account and Region you
//    * want to deploy the stack to. */
//   // env: { account: '123456789012', region: 'us-east-1' },

//   /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
// });

const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };

const vpcStack = new VpcStack(app, 'VpcStack', {
	env: env,
});

const dataStoreStack = new DataStoreStack(app, 'DataStoreStack', {
	env: env,
	vpc: vpcStack.vpc
});

new ContainerStack(app, 'ContainerStack', {
	env: env,
	vpc: vpcStack.vpc,
	s3Bucket: dataStoreStack.s3Bucket,
	securityGroups: [vpcStack.webTierSecurityGroup]
})

app.synth();
