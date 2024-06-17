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

		this.webTierSecurityGroup = new SecurityGroup(this, 'scs-cdk-web-sg', {
			vpc: this.vpc,
			securityGroupName: 'scs-cdk-web-sg',
			allowAllOutbound: false
		});

		this.webTierSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80));
		this.webTierSecurityGroup.addEgressRule(Peer.anyIpv4(), Port.HTTPS);

		this.databaseTierSecurityGroup = new SecurityGroup(this, 'scs-cdkd-db-sg', {
			vpc: this.vpc,
			securityGroupName: 'scs-cdk-db-sg',
			allowAllOutbound: false
		});

		this.webTierSecurityGroup.addEgressRule(this.databaseTierSecurityGroup, Port.tcp(5432));
		this.databaseTierSecurityGroup.addIngressRule(this.webTierSecurityGroup, Port.tcp(5432));
	}
}
