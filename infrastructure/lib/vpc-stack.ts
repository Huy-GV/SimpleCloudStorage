import * as cdk from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, Peer, Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class VpcStack extends cdk.Stack {
	readonly vpc: IVpc
	readonly webTierSecurityGroup: ISecurityGroup
	readonly databaseTierSecurityGroup: ISecurityGroup

	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		this.vpc = new Vpc(this, 'scs-vpc', {
			cidr: '10.0.0.0/24',
			maxAzs: 2,
			subnetConfiguration: [
				{
					cidrMask: 28,
					name: 'PublicSubnet',
					subnetType: SubnetType.PUBLIC,
				},
				{
					cidrMask: 28,
					name: 'PrivateEgressSubnet',
					subnetType: SubnetType.PRIVATE_WITH_EGRESS,
				},				{
					cidrMask: 28,
					name: 'PrivateIsolatedSubnet',
					subnetType: SubnetType.PRIVATE_ISOLATED,
				},
			],
		});

		this.webTierSecurityGroup = new SecurityGroup(this, 'scs-web-tier-sg', {
			vpc: this.vpc,
			securityGroupName: 'scs-web-tier-sg',
		});

		this.webTierSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80));

		this.databaseTierSecurityGroup = new SecurityGroup(this, 'scs-db-tier-sg', {
			vpc: this.vpc,
			securityGroupName: 'scs-db-tier-sg',
		});

		this.webTierSecurityGroup.addEgressRule(this.databaseTierSecurityGroup, Port.tcp(5432));
		this.databaseTierSecurityGroup.addIngressRule(this.webTierSecurityGroup, Port.tcp(5432));

		new cdk.CfnOutput(this, 'ScsCdkVpcStackOutput', {
			exportName: 'ScsCdkVpcId',
			value: this.vpc.vpcId
		});
	}
}
