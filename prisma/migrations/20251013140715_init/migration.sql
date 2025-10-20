-- CreateTable
CREATE TABLE "Label" (
    "id" SERIAL NOT NULL,
    "productName" TEXT NOT NULL,
    "weight" TEXT,
    "packagedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "barcode" TEXT,
    "barcodeType" TEXT NOT NULL DEFAULT 'code128',
    "priceCents" INTEGER,
    "extra" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);
