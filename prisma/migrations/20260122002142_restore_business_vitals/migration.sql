-- CreateTable
CREATE TABLE "Configuration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "brandName" TEXT,
    "etsyUrls" TEXT,
    "shopifyUrls" TEXT,
    "identitySummary" TEXT,
    "targetAudience" TEXT,
    "usp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Configuration_shop_key" ON "Configuration"("shop");
