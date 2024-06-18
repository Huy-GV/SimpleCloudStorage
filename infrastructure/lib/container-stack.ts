import * as cdk from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { AppProtocol, AwsLogDriver, Cluster, ContainerImage, EnvironmentFile, FargateService, FargateTaskDefinition, Protocol } from 'aws-cdk-lib/aws-ecs';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface ContainerStackProps extends cdk.StackProps{
    vpc: IVpc,
    securityGroups: ISecurityGroup[]
    s3Bucket: IBucket,
}

export class ContainerStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props: ContainerStackProps) {
        super(scope, id, props);

        const cluster = new Cluster(this, 'ScsCdkCluster', {
            vpc: props.vpc,
            clusterName: 'ScsCdkCluster'
        })

        const exeRole = this.createEcsExecutionRole();
        const taskDefinition = new FargateTaskDefinition(
            this,
            'ScsCdkTaskDefinition',
            {
                cpu: 256,
                memoryLimitMiB: 512,
                taskRole: exeRole,
                executionRole: exeRole,
            },
        );

        const ecrRepository = new Repository(this, 'ScsCdkRepository', {
            repositoryName: 'scs-cdk-repository',
            removalPolicy: cdk.RemovalPolicy.DESTROY
        })

        const logging = new AwsLogDriver({ streamPrefix: "scs" });
        taskDefinition.addContainer(
            'ScsCdkContainer',
            {
                image: ContainerImage.fromEcrRepository(ecrRepository, 'latest'),
                memoryLimitMiB: 256,
                cpu: 128,
                environmentFiles: [
                    EnvironmentFile.fromBucket(props.s3Bucket, 'aws.env')
                ],
                logging: logging,
                portMappings: [
                    {
                        containerPort: 80,
                        hostPort: 80,
                        protocol: Protocol.TCP,
                        appProtocol: AppProtocol.http,
                        name: 'http-mappings'
                    },
                    {
                        containerPort: 443,
                        hostPort: 443,
                        protocol: Protocol.TCP,
                        appProtocol: AppProtocol.http,
                        name: 'https-mappings'
                    },
                    {
                        containerPort: 5432,
                        hostPort: 5432,
                        protocol: Protocol.TCP,
                        appProtocol: AppProtocol.http,
                        name: 'postgresql-mappings'
                    }
                ],
            }
        )

        new FargateService(this, 'ScsCdkFargateService', {
            taskDefinition,
            cluster: cluster,
            desiredCount: 0,
            assignPublicIp: true,
            securityGroups: props.securityGroups,
            vpcSubnets: {
                subnets: props.vpc.publicSubnets
            },
        });
    }

    private createEcsExecutionRole(): Role {
        const taskExecutionRole = new Role(this, 'ScsCdkEcsTaskExecutionRole', {
            assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
        });

        // required to pull images from the ECR repository
        taskExecutionRole.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
        );

        // required to read .env file stored in s3 bucket
        taskExecutionRole.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess')
        );

        return taskExecutionRole;
    }
}
