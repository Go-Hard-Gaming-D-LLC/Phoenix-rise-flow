import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    // Clinical logging: only errors in production to save Edge memory
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        // Must use the port 6543 URL for Cloudflare stability
        url: process.env.DATABASE_URL,
      },
    },
  });
};

// Global singleton protects against hot-reload leaks
const prisma = global.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}

/**
 * Supra Integrity Check
 * Verified against the Shadow's Forge Postgres cluster
 */
export async function checkDatabaseConnection() {
  try {
    // Clinical ping to Oregon
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true };
  } catch (error) {
    console.error("❌ SUPRA DB FAILURE:", error);
    return { connected: false, error };
  }
}

export default prisma;
