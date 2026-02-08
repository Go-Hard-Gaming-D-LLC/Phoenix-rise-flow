/**
 * 🛡️ SHADOW'S FORGE: CORE LOGIC GATE
 * WARNING: DO NOT MODIFY WITHOUT EXPLICIT PERMISSION.
 * ROLE: Batch Optimizer Engine (Execution Only).
 * LIMIT: 5 Products per Burst.
 */
import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { authenticate } from "../shopify.server";
import { analyzeProductData } from "../gemini.server";
import { getPrisma } from "../db.server";
import { recordUsage } from "../utils/usageTracker";

// ✅ CLINICAL FIX: Interface definition to clear Error 2339
interface OptimizerPayload {
  products: any[];
  userContext?: string;
  mode: "analyze" | "apply";
}

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  // 1. SECRETS RESOLUTION: Direct Edge Context to bypass DB property errors
  const apiKey = context.cloudflare.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: "❌ Missing GEMINI_API_KEY." }, { status: 500 });

  try {
    // ✅ CLINICAL FIX: Cast payload to interface
    const body = (await request.json()) as OptimizerPayload;
    const { products, userContext, mode } = body;

    // 2. SAFETY CLAMP: Enforce 5-item burst for Edge stability
    if (!products || !Array.isArray(products)) {
      return json({ error: "Invalid payload: Expected product array." }, { status: 400 });
    }
    const safeBatch = products.slice(0, 5);

    // --- MODE: ANALYZE (Parallel Extraction) ---
    if (mode === "analyze") {
      const results = await Promise.all(safeBatch.map(async (product: any) => {
        // High-precision AI analysis with specific creative context
        const aiData = await analyzeProductData(product, userContext || "Batch Optimization");
        return {
          productId: product.id,
          currentTitle: product.title,
          optimized_title: aiData.optimized_title,
          optimized_html_description: aiData.optimized_html_description,
          json_ld_schema: aiData.json_ld_schema,
          seoScore: aiData.seoScore,
          ready: true
        };
      }));
      return json({ success: true, results });
    }

    // --- MODE: APPLY (Sequential Writing & Schema Shield Injection) ---
    if (mode === "apply") {
      for (const p of safeBatch) {
        await admin.graphql(
          `#graphql
          mutation productUpdate($input: ProductInput!) {
            productUpdate(input: $input) {
              product { id }
              userErrors { field message }
            }
          }`,
          {
            variables: {
              input: {
                id: p.productId,
                title: p.optimized_title,
                // Injecting Schema Shield (JSON-LD) into the storefront
                descriptionHtml: p.optimized_html_description + `\n\n<script type="application/ld+json">${p.json_ld_schema}</script>`,
                tags: ["phoenix-batch-optimized"]
              }
            }
          }
        );
      }

      // 3. TELEMETRY: Record burst optimization usage
      await recordUsage(context, shop, "description", { type: "optimizer_burst", count: safeBatch.length });
      return json({ success: true });
    }

    return json({ error: "Invalid Mode" }, { status: 400 });

  } catch (err: any) {
    console.error("[SHADOW_FORGE] Optimizer Crash:", err.message);
    return json({ error: err.message }, { status: 500 });
  }
};