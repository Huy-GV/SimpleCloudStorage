/*
  Warnings:

  - Added the required column `creationTime` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_File" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "ownerUserId" INTEGER NOT NULL,
    "parentFileId" INTEGER,
    "creationTime" DATETIME NOT NULL,
    CONSTRAINT "File_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "File_parentFileId_fkey" FOREIGN KEY ("parentFileId") REFERENCES "File" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_File" ("id", "name", "ownerUserId", "parentFileId", "uri") SELECT "id", "name", "ownerUserId", "parentFileId", "uri" FROM "File";
DROP TABLE "File";
ALTER TABLE "new_File" RENAME TO "File";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
