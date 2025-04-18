import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { FargateService } from 'aws-cdk-lib/aws-ecs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { IRepository } from 'aws-cdk-lib/aws-ecr';

interface BackendPipelineStackProps extends cdk.StackProps {
	gitHubOwner: string;
	gitHubRepositoryName: string;
	gitHubSecretName: string;

	fargateService: FargateService;
	ecrRepository: IRepository;

	awsRegion: string;
	awsAccountId: string;

	dbUserId: string;
	dbEndpoint: string;
	dbName: string;
}

export class BackendPipelineStack extends cdk.Stack {
  	constructor(scope: Construct, id: string, props: BackendPipelineStackProps) {
		super(scope, id, props);

		const buildProject = new codebuild.Project(this, 'ScsCdkBackendBuildProject', {
			source: codebuild.Source.gitHub({
				owner: props.gitHubOwner,
				repo: props.gitHubRepositoryName,
				webhook: true,
			}),
			buildSpec: codebuild.BuildSpec.fromSourceFilename('backend-buildspec.yml'),
			environment: {
				buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_5,
				privileged: true,
			},
			environmentVariables: {
				AWS_REGION: { value: props.awsRegion },
				AWS_ACCOUNT_ID: { value: props.awsAccountId },
				REPOSITORY_NAME: { value: props.ecrRepository.repositoryName },
				CONTAINER_NAME: { value: 'scs-cdk-container' },
				DATABASE_USER: { value: props.dbUserId },
				DATABASE_NAME: { value: props.dbName },
				DATABASE_ENDPOINT: { value: props.dbEndpoint },
			}
		});

		buildProject.addToRolePolicy(new PolicyStatement({
			actions: [
			  	"ecr:GetDownloadUrlForLayer",
			  	"ecr:BatchGetImage",
			  	"ecr:BatchCheckLayerAvailability",
			  	"ecr:PutImage",
			  	"ecr:InitiateLayerUpload",
			  	"ecr:UploadLayerPart",
			  	"ecr:CompleteLayerUpload",
			  	"ecr:GetAuthorizationToken",
			  	"logs:CreateLogGroup",
			  	"logs:CreateLogStream",
				"logs:PutLogEvents",
				"ssm:GetParameters"
			],
			resources: [
				props.ecrRepository.repositoryArn,
				"*"
			]
		}));

		const pipeline = new codepipeline.Pipeline(this, 'ScsCdkBackendPipeline', {
			pipelineName: 'ScsCdkBackendPipeline',
			pipelineType: codepipeline.PipelineType.V2
		});

		const sourceOutput = new codepipeline.Artifact('SourceArtifact');

		const sourceStage = pipeline.addStage({
			stageName: 'Source',
			actions: [
				new codepipeline_actions.GitHubSourceAction({
					actionName: 'GitHub_Source',
					output: sourceOutput,
					oauthToken: cdk.SecretValue.secretsManager(props.gitHubSecretName, { jsonField: "GitHubToken" }),
					owner: props.gitHubOwner,
					repo: props.gitHubRepositoryName,
					branch: 'main',
				}),
			],
		});

		const buildOutput = new codepipeline.Artifact('BuildArtifact');
		const buildStage = pipeline.addStage({
			stageName: 'Build',
			actions: [
				new codepipeline_actions.CodeBuildAction({
					actionName: 'CodeBuild',
					project: buildProject,
					input: sourceOutput,
					outputs: [buildOutput]
				}),
			],
		});

		const deployStage = pipeline.addStage({
			stageName: 'Deploy',
			actions: [
				new codepipeline_actions.EcsDeployAction(
					{
						actionName: 'DeployAction',
						service: props.fargateService,
						input: buildOutput,
					}
				),
			],
		});
  	}
}
