import * as cdk from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, Peer, Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class VpcStack extends cdk.Stack {
	readonly vpc: IVpc
	readonly webTierSecurityGroup: ISecurityGroup

	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		this.vpc = new Vpc(this, 'scs-vpc', {
			cidr: '10.0.0.0/24',
			maxAzs: 2,
			subnetConfiguration: [
			{
				cidrMask: 26,
				name: 'PublicSubnet',
				subnetType: SubnetType.PUBLIC,
			},
			{
				cidrMask: 26,
				name: 'PrivateSubnet',
				subnetType: SubnetType.PRIVATE_WITH_EGRESS,
			},
			],
		});

		this.webTierSecurityGroup = new SecurityGroup(this, 'scs-web-tier-sg', {
			vpc: this.vpc,
			securityGroupName: 'scs-web-tier-sg',
		});

		this.webTierSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80));

		const rdsSecurityGroup = new SecurityGroup(this, 'scs-db-tier-sg', {
			vpc: this.vpc,
			securityGroupName: 'scs-db-tier-sg',
		});

		this.webTierSecurityGroup.addEgressRule(rdsSecurityGroup, Port.tcp(5432));
		rdsSecurityGroup.addIngressRule(this.webTierSecurityGroup, Port.tcp(5432));

		new cdk.CfnOutput(this, 'ScsCdkVpcStackOutput', {
			exportName: 'ScsCdkVpcId',
			value: this.vpc.vpcId
		});
	}
}
