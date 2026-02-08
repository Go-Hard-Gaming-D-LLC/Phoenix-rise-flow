/**
 * 🛡️ SHADOW'S FORGE: PHOENIX PROXY CORE
 * ROLE: Secured Standalone Handshake & Loyalty Tracking.
 * SYNC: 2026-02-07
 */
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/cloudflare";
// ✅ CORRECTION: Import 'authenticate' as a named export from your server file
import { authenticate } from "../shopify.server"; 

export async function loader({ request }: LoaderFunctionArgs) {
  return json({ status: "Phoenix Proxy Active" });
}

export async function action({ request }: ActionFunctionArgs) {
  // ✅ CORRECTION: Use the named 'authenticate' export
  // This manages the HMAC handshake required for the 180-day loyalty cycle
  const { session } = await authenticate.public.appProxy(request);

  if (!session) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // 🛡️ RECURRING CYCLE GATE (180-day refresh logic goes here)
  return json({ 
    success: true, 
    shop: session.shop,
    message: "Proxy Auth Verified" 
  });
}