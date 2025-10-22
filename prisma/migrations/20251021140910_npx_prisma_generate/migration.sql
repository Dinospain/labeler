-- DropIndex
DROP INDEX "Folder_accountId_idx";

-- DropIndex
DROP INDEX "Label_accountId_idx";

-- DropIndex
DROP INDEX "Template_accountId_idx";

-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "updatedAt" DROP DEFAULT;
