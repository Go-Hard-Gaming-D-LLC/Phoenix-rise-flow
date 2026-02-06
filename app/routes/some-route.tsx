// app/routes/some-route.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";

export async function loader({ context }: LoaderFunctionArgs) {
  const kv = context.cloudflare.env.SESSION_KV;
  
  // Read from KV
  const value = await kv.get("my-key");
  
  // Write to KV
  await kv.put("my-key", "my-value");
  
  // Write with expiration (in seconds)
  await kv.put("my-key", "my-value", { expirationTtl: 3600 });
  
  // Delete from KV
  await kv.delete("my-key");
  
  // List keys
  const list = await kv.list({ prefix: "user:" });
  
  return json({ value });
}
