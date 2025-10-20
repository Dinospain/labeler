-- AlterTable
ALTER TABLE "Label" ADD COLUMN     "address" TEXT,
ADD COLUMN     "composition" TEXT,
ADD COLUMN     "energy" TEXT,
ADD COLUMN     "manufacturedAt" TIMESTAMP(3),
ADD COLUMN     "mchsInfo" TEXT,
ADD COLUMN     "nutrition" TEXT,
ADD COLUMN     "shelfLife" TEXT,
ADD COLUMN     "standard" TEXT,
ADD COLUMN     "website" TEXT;
