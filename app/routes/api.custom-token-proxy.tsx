/**
 * 🛡️ SHADOW'S FORGE: CUSTOM TOKEN PROXY
 * ROLE: Secured Standalone Handshake for 2026 Workstation.
 */
import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";

// ✅ FIX 2339: Define strict interface for the incoming payload
interface ProxyPayload {
  shop: string;
  token: string;
  endpoint: string;
  method?: string;
  body?: any;
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    // ✅ FIX 2339: Cast json() to the ProxyPayload interface
    const bodyData = await request.json() as ProxyPayload;
    const { shop, token, endpoint, method = "GET", body } = bodyData;

    if (!shop || !token || !endpoint) {
      return json({ 
        error: "Missing required parameters: shop, token, endpoint" 
      }, { status: 400 });
    }

    const apiUrl = `https://${shop}/admin/api/2024-07/${endpoint}`;

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(apiUrl, fetchOptions);
    const data = await response.json();

    return json({ success: true, data });

  } catch (error: any) {
    return json({ error: "Proxy request failed", message: error.message }, { status: 500 });
  }
}