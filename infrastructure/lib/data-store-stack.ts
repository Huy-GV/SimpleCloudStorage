import * as cdk from 'aws-cdk-lib';
import { InstanceClass, InstanceSize, ISecurityGroup, IVpc, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { DatabaseInstance, DatabaseInstanceEngine, PostgresEngineVersion } from 'aws-cdk-lib/aws-rds';
import { Bucket, IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface VpcStackProps extends cdk.StackProps{
    vpc: IVpc,
    securityGroups: ISecurityGroup[]
}

export class DataStoreStack extends cdk.Stack {
    readonly envBucket: IBucket;
    readonly dataBucket: IBucket;
    readonly ecrRepository: Repository;
    readonly database: DatabaseInstance;

	constructor(scope: Construct, id: string, props: VpcStackProps) {
        super(scope, id, props);

        this.envBucket = new Bucket(this, 'ScsCdkEnvBucket', {
            bucketName: "scs-cdk-env",
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        this.dataBucket = new Bucket(this, 'ScsCdkDataBucket', {
            bucketName: "scs-cdk-data",
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        this.ecrRepository = new Repository(this, 'ScsCdkRepository', {
            repositoryName: 'scs-cdk-repository',
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        const dbPassword = cdk.SecretValue.ssmSecure('/scs/db/password');

        new DatabaseInstance(this, 'ScsCdkRds', {
            engine: DatabaseInstanceEngine.postgres({ version: PostgresEngineVersion.VER_16 }),
            instanceType: cdk.aws_ec2.InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
            vpc: props.vpc,
            vpcSubnets: props.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_ISOLATED }),
            securityGroups: props.securityGroups,
            removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
            credentials: {
                username: 'postgres',
                password: dbPassword
            }
        });
    }
}
