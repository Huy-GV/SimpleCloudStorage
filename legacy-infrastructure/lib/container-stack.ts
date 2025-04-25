import * as cdk from 'aws-cdk-lib';
import { aws_elasticloadbalancingv2, Duration } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { AppProtocol, AwsLogDriver, Cluster, ContainerImage, EnvironmentFile, FargateService, FargateTaskDefinition, Protocol } from 'aws-cdk-lib/aws-ecs';
import { Effect, ManagedPolicy, Policy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { ARecord, PublicHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { LoadBalancerTarget } from 'aws-cdk-lib/aws-route53-targets';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface ContainerStackProps extends cdk.StackProps{
    vpc: IVpc,
    webTierSecurityGroups: ISecurityGroup[],
    loadBalancerTierSecurityGroup: ISecurityGroup,
    envBucket: IBucket,
    dataBucket: IBucket,
    awsCertificateArn: string,
    awsHostedZoneName: string
}

export class ContainerStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props: ContainerStackProps) {
        super(scope, id, props);

        const cluster = new Cluster(this, 'ScsCdkCluster', {
            vpc: props.vpc,
            clusterName: 'ScsCdkCluster'
        });

        const exeRole = this.createEcsExecutionRole(
            props.dataBucket.bucketName,
            props.envBucket.bucketName
        );

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
        });

        const logging = new AwsLogDriver({ streamPrefix: "scs" });
        taskDefinition.addContainer(
            'ScsCdkContainer',
            {
                containerName: 'scs-cdk-container',
                image: ContainerImage.fromEcrRepository(ecrRepository, 'latest'),
                memoryLimitMiB: 256,
                cpu: 128,
                environmentFiles: [
                    EnvironmentFile.fromBucket(props.envBucket, 'aws.env')
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
        );

        const fargateService = new FargateService(this, 'ScsCdkFargateService', {
            taskDefinition,
            cluster: cluster,

            // set to 0 so the stack deployment succeeds even when the pipeline has not run
            desiredCount: 0,
            assignPublicIp: true,
            securityGroups: props.webTierSecurityGroups,
            vpcSubnets: {
                subnets: props.vpc.publicSubnets
            },
        });

        const appLoadBalancer = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
			this,
			'ScsCdkAlb',
			{
				vpc: props.vpc,
				securityGroup: props.loadBalancerTierSecurityGroup,
				vpcSubnets: props.vpc.selectSubnets({ subnetType: SubnetType.PUBLIC }),
				internetFacing: true
			}
		);

		const listener = appLoadBalancer.addListener('HttpsListener', {
			port: 443,
			open: true,
            certificates: [
                cdk.aws_certificatemanager.Certificate.fromCertificateArn(
				    this,
				    'ScsCdkHttpsCertificateArn',
                    props.awsCertificateArn
                )
            ]
		});

		const targetGroup = new aws_elasticloadbalancingv2.ApplicationTargetGroup(
			this,
			'ScsAlbTargetGroup',
			{
				vpc: props.vpc,
				port: 80,
				targets: [fargateService],
				targetType: aws_elasticloadbalancingv2.TargetType.IP,
				healthCheck: {
					path: '/api/v1/health',
					interval: Duration.seconds(30),
					timeout: Duration.seconds(5)
				}
			}
		);

		listener.addTargetGroups('DefaultTargetGroup', {
			targetGroups: [targetGroup]
        });

        const hostedZone = PublicHostedZone.fromLookup(
			this,
			'ScsCdkHostedZone',
			{
				domainName: props.awsHostedZoneName
			}
		);

		new ARecord(this, 'ScsCdkAliasRecord', {
			zone: hostedZone,
			target: RecordTarget.fromAlias(new LoadBalancerTarget(appLoadBalancer)),
			recordName: 'scs-api'
		});
    }

    private createEcsExecutionRole(
        dataBucketName: string,
        envBucketName: string
    ): Role {
        const taskExecutionRole = new Role(this, 'ScsCdkEcsTaskExecutionRole', {
            assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
        });

        // required to pull images from the ECR repository
        taskExecutionRole.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
        );

        const envBucketAccessPolicy = new PolicyDocument({
            statements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                        "s3:Get*",
                        "s3:List*",
                        "s3:Describe*",
                        "s3-object-lambda:Get*",
                        "s3-object-lambda:List*"
                    ],
                    resources: [
                        `arn:aws:s3:::${envBucketName}/*`,
                        `arn:aws:s3:::${envBucketName}`
                    ],
                }),
            ],
        });

        const dataBucketAccessPolicy = new PolicyDocument({
            statements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                        's3:GetObject',
                        's3:PutObject',
                        's3:DeleteObject'
                    ],
                    resources: [
                        `arn:aws:s3:::${dataBucketName}/*`,
                        `arn:aws:s3:::${dataBucketName}`
                    ],
                }),
            ],
        });

        // required to read .env file stored in s3 bucket
        taskExecutionRole.attachInlinePolicy(new Policy(this, 'ScsCdkEnvBucketAccessPolicy', {
            document: envBucketAccessPolicy,
        }));

        // required to store files at runtime
        taskExecutionRole.attachInlinePolicy(new Policy(this, 'ScsCdkDataBucketAccessPolicy', {
            document: dataBucketAccessPolicy,
        }));

        return taskExecutionRole;
    }
}
