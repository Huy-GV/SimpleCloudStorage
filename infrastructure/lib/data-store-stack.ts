import * as cdk from 'aws-cdk-lib';
import { InstanceClass, InstanceSize, IVpc, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { DatabaseInstance, DatabaseInstanceEngine, PostgresEngineVersion } from 'aws-cdk-lib/aws-rds';
import { Bucket, IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface VpcStackProps extends cdk.StackProps{
	vpc: IVpc
}

export class DataStoreStack extends cdk.Stack {
    readonly s3Bucket: IBucket;

	constructor(scope: Construct, id: string, props: VpcStackProps) {
        super(scope, id, props);

        this.s3Bucket = new Bucket(this, 'ScsCdkBucket', {
            bucketName: "scs-cdk",
            removalPolicy: cdk.RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE
        });

        const dbPassword = cdk.SecretValue.ssmSecure('DATABASE_PASSWORD');
        const dbName = "scsdb"

        new DatabaseInstance(this, 'ScsCdkRds', {
            engine: DatabaseInstanceEngine.postgres({ version: PostgresEngineVersion.VER_16 }),
            instanceType: cdk.aws_ec2.InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
            vpc: props.vpc,
            vpcSubnets: props.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
            removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
            credentials: {
                username: 'postgres',
                password: dbPassword
            },
            databaseName: dbName
        });
    }
}
