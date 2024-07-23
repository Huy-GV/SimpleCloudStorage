import { mockDeep, DeepMockProxy } from 'jest-mock-extended'
import { DatabaseService } from '../../src/database/database.service'

type TestPrismaProxy = {
	// this is needed to resolve the issue with circular types definition
	// https://github.com/prisma/prisma/issues/10203
	[K in keyof DatabaseService]: K extends 'user' | 'file'
		? Omit<DatabaseService[K], "groupBy">
		: DatabaseService[K];
}

export type MockDatabaseContext = {
	databaseService: DeepMockProxy<TestPrismaProxy>
}

export type DatabaseContext = {
	databaseService: TestPrismaProxy
}

export const createMockDbContext = (): MockDatabaseContext => {
	return {
		databaseService: mockDeep<TestPrismaProxy>(),
	}
}
