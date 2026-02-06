import { Session } from "@shopify/shopify-api";

type SessionStorage = {
  storeSession(session: Session): Promise<boolean>;
  loadSession(id: string): Promise<Session | undefined>;
  deleteSession(id: string): Promise<boolean>;
  deleteSessions(ids: string[]): Promise<boolean>;
  findSessionsByShop(shop: string): Promise<Session[]>;
};

let sessionKv: KVNamespace | undefined;

export function setSessionKv(namespace: KVNamespace) {
  sessionKv = namespace;
}

function requireSessionKv(): KVNamespace {
  if (!sessionKv) {
    throw new Error("SESSION_KV is not initialized");
  }
  return sessionKv;
}

const SESSION_PREFIX = "shopify:session:";
const SHOP_PREFIX = "shopify:shop:";

function sessionKey(id: string) {
  return `${SESSION_PREFIX}${id}`;
}

function shopKey(shop: string, id: string) {
  return `${SHOP_PREFIX}${shop}:${id}`;
}

export class KvSessionStorage implements SessionStorage {
  async storeSession(session: Session): Promise<boolean> {
    const kv = requireSessionKv();
    const payload = JSON.stringify(session.toObject());
    await kv.put(sessionKey(session.id), payload);
    await kv.put(shopKey(session.shop, session.id), session.id);
    return true;
  }

  async loadSession(id: string): Promise<Session | undefined> {
    const kv = requireSessionKv();
    const raw = await kv.get(sessionKey(id));
    if (!raw) return undefined;
    const data = JSON.parse(raw) as Record<string, any>;
    return new Session(data as any);
  }

  async deleteSession(id: string): Promise<boolean> {
    const kv = requireSessionKv();
    const existing = await this.loadSession(id);
    await kv.delete(sessionKey(id));
    if (existing?.shop) {
      await kv.delete(shopKey(existing.shop, id));
    }
    return true;
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    const results = await Promise.all(ids.map((id) => this.deleteSession(id)));
    return results.every(Boolean);
  }

  async findSessionsByShop(shop: string): Promise<Session[]> {
    const kv = requireSessionKv();
    const prefix = `${SHOP_PREFIX}${shop}:`;
    const list = await kv.list({ prefix });
    const sessions = await Promise.all(
      list.keys.map(async (key) => {
        const id = key.name.substring(prefix.length);
        return this.loadSession(id);
      })
    );
    return sessions.filter((session): session is Session => Boolean(session));
  }
}
