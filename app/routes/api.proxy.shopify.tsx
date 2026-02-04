import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { authenticate } from "../shopify.server";
import { generatePhoenixContent } from "../gemini.server";

/**
 * PHOENIX APP PROXY
 * This route handles secure requests from the Shopify Online Store (Theme Extension).
 * It verifies the request signature to ensure it comes from Shopify.
 */

export async function loader({ request }: LoaderFunctionArgs) {
  // App Proxies are generally POST for actions, but we can return basic info on GET
  return json({ status: "Phoenix Proxy Active" });
}

export async function action({ request }: ActionFunctionArgs) {
  // 1. Authenticate the Proxy Request (Signature Verification)
  const { session, liquid } = await authenticate.public.appProxy(request);

  if (!session) {
    return json({ success: false, error: "Unauthorized Proxy Request" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, context } = body;

    console.log(`🔥 PHOENIX PROXY RECEIVED ACTION: ${action}`);

    // 2. Route Actions
    if (action === "generate_description") {
      if (!context?.productName) {
        return json({ success: false, error: "Missing productName" }, { status: 400 });
      }

      // Call Gemini AI
      const aiResult = await generatePhoenixContent(
        context.productName,
        context.features || []
      );

      return json({
        success: true,
        data: aiResult
      });
    }

    return json({ success: false, error: "Unknown Action" }, { status: 400 });

  } catch (error: any) {
    console.error("❌ PHOENIX PROXY ERROR:", error);
    return json({ success: false, error: error.message || "Server Error" }, { status: 500 });
  }
}
