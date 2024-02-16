-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_File" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "sizeKb" INTEGER NOT NULL,
    "creationTime" DATETIME NOT NULL,
    "isDirectory" BOOLEAN NOT NULL,
    "ownerUserId" INTEGER NOT NULL,
    "parentFileId" INTEGER,
    CONSTRAINT "File_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "File_parentFileId_fkey" FOREIGN KEY ("parentFileId") REFERENCES "File" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_File" ("creationTime", "id", "isDirectory", "name", "ownerUserId", "parentFileId", "sizeKb", "uri") SELECT "creationTime", "id", "isDirectory", "name", "ownerUserId", "parentFileId", "sizeKb", "uri" FROM "File";
DROP TABLE "File";
ALTER TABLE "new_File" RENAME TO "File";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
