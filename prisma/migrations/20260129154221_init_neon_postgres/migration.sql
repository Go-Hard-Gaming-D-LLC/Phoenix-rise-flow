-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuration" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "brandName" TEXT,
    "etsyUrls" TEXT,
    "shopifyUrls" TEXT,
    "identitySummary" TEXT,
    "targetAudience" TEXT,
    "usp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationHistory" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "optimizationType" TEXT NOT NULL,
    "optimizedContent" TEXT NOT NULL,
    "aiModel" TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    "status" TEXT NOT NULL DEFAULT 'success',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OptimizationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Session_shop_idx" ON "Session"("shop");

-- CreateIndex
CREATE INDEX "Session_expires_idx" ON "Session"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "Configuration_shop_key" ON "Configuration"("shop");

-- CreateIndex
CREATE INDEX "Configuration_shop_idx" ON "Configuration"("shop");

-- CreateIndex
CREATE INDEX "OptimizationHistory_shop_idx" ON "OptimizationHistory"("shop");

-- CreateIndex
CREATE INDEX "OptimizationHistory_createdAt_idx" ON "OptimizationHistory"("createdAt");

-- CreateIndex
CREATE INDEX "OptimizationHistory_shop_optimizationType_createdAt_idx" ON "OptimizationHistory"("shop", "optimizationType", "createdAt");
