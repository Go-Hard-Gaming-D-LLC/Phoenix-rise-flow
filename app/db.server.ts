import { PrismaClient } from "@prisma/client/edge";
import { PrismaPg } from "@prisma/adapter-pg";
import { getEnv } from "./utils/env.server";
import type { Env } from "../load-context";

export type EnvContext = { cloudflare?: { env: Env } } | { env: Env };

function resolveConnectionString(env: Env) {
  const connectionString = env?.HYPERDRIVE?.connectionString ?? env?.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Missing database connection. Provide HYPERDRIVE.connectionString or DATABASE_URL."
    );
  }
  return connectionString;
}

function createPrisma(env: Env) {
  const connectionString = resolveConnectionString(env);
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    // Keep your logging behavior (no warn spam in production)
    log: ["error", ...(process.env.NODE_ENV === "development" ? (["warn"] as const) : [])],
  });
}

export function getPrisma(context: EnvContext) {
  const env = getEnv(context);
  const anyContext = context as unknown as { __prisma?: PrismaClient };

  if (!anyContext.__prisma) {
    anyContext.__prisma = createPrisma(env);
  }

  return anyContext.__prisma;
}

const prismaProxy = new Proxy(
  {},
  {
    get(_target, prop) {
      throw new Error(
        `Do not access prisma.${String(
          prop
        )} directly in Cloudflare Workers. Use getPrisma(context) instead.`
      );
    },
  }
) as unknown as PrismaClient;

export default prismaProxy;

export async function checkDatabaseConnection(context: EnvContext) {
  const prisma = getPrisma(context);

  try {
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true };
  } catch (error) {
    console.error("? DB CONNECTION FAILURE:", error);
    return { connected: false, error };
  }
}
