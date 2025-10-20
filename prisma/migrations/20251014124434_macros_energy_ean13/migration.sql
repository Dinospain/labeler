/*
  Warnings:

  - You are about to drop the column `energy` on the `Label` table. All the data in the column will be lost.
  - You are about to drop the column `nutrition` on the `Label` table. All the data in the column will be lost.
  - You are about to drop the column `priceCents` on the `Label` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Label" DROP COLUMN "energy",
DROP COLUMN "nutrition",
DROP COLUMN "priceCents",
ADD COLUMN     "carbs100g" DOUBLE PRECISION,
ADD COLUMN     "fats100g" DOUBLE PRECISION,
ADD COLUMN     "proteins100g" DOUBLE PRECISION,
ALTER COLUMN "barcodeType" SET DEFAULT 'ean13';
