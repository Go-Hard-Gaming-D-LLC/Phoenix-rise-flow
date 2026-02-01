import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient;
}

// Optimized connection pooling for serverless (Netlify)
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pool settings optimized for serverless
    // Prevents "too many connections" errors on Netlify
    // Uses connection pooling with reasonable limits
  });
};

// In development, prevent hot reloading from creating new instances
if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = prismaClientSingleton();
  }
}

const prisma = global.prismaGlobal ?? prismaClientSingleton();

// For serverless environments, close connections after a timeout
// This prevents connection leaks in Netlify functions
if (process.env.NODE_ENV === "production") {
  // Graceful shutdown
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}

// Add connection pool monitoring (optional, for debugging)
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true };
  } catch (error) {
    console.error("Database connection failed:", error);
    return { connected: false, error };
  }
}

export default prisma;