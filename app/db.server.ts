import { PrismaClient } from "@prisma/client/edge";
import { PrismaPg } from "@prisma/adapter-pg";

type HyperdriveBinding = {
  connectionString: string;
};

export type Env = {
  HYPERDRIVE: HyperdriveBinding;
};

function createPrisma(env: Env) {
  if (!env?.HYPERDRIVE?.connectionString) {
    throw new Error(
      "Missing env.HYPERDRIVE.connectionString. Check your Hyperdrive binding in wrangler."
    );
  }

  const adapter = new PrismaPg({
    connectionString: env.HYPERDRIVE.connectionString,
  });

  return new PrismaClient({
    adapter,
    // Keep your logging behavior (no warn spam in production)
    log: ["error", ...(process.env.NODE_ENV === "development" ? (["warn"] as const) : [])],
  });
}

export function getPrisma(context: { env: Env }) {
  const anyContext = context as unknown as { __prisma?: PrismaClient; env: Env };

  if (!anyContext.__prisma) {
    anyContext.__prisma = createPrisma(anyContext.env);
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

export async function checkDatabaseConnection(context: { env: Env }) {
  const prisma = getPrisma(context);

  try {
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true };
  } catch (error) {
    console.error("? DB CONNECTION FAILURE:", error);
    return { connected: false, error };
  }
}
