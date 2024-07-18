import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ITXClientDenyList } from '@prisma/client/runtime/library';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
	async onModuleInit() {
		await this.$connect();
	}
}

export type TransactionClientAlias = Omit<PrismaClient, ITXClientDenyList>
