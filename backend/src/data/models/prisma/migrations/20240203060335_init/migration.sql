-- CreateTable
CREATE TABLE "User" (
		"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
		"email" TEXT NOT NULL,
		"name" TEXT,
		"password" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "File" (
		"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
		"name" TEXT NOT NULL,
		"ownerUserId" INTEGER NOT NULL,
		"parentFileId" INTEGER,
		CONSTRAINT "File_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
		CONSTRAINT "File_parentFileId_fkey" FOREIGN KEY ("parentFileId") REFERENCES "File" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
