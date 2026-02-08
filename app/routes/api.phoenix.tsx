/**
 * 🛡️ SHADOW'S FORGE: CORE LOGIC GATE
 * WARNING: DO NOT MODIFY THIS FILE WITHOUT EXPLICIT PERMISSION.
 * This file governs the clinical Phoenix Engine: Scan, Analyze, and Apply.
 * Authorized Deployment: ironphoenixflow.com
 */
import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { authenticate } from "../shopify.server";
import { getPrisma } from "../db.server";
import { analyzeProductData } from "../gemini.server";

interface PhoenixRequestBody {
  mode: string;
  products?: Array<Record<string, any>>;
  context?: string;
}

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const db = getPrisma(context);
  const shop = session.shop;
  const contentType = request.headers.get("Content-Type") || "";

  // 1. ANTI-CHURN LOCKDOWN: Prevents trial exploitation
  const churnRecord = await db.antiChurn.findUnique({ where: { shop } });
  if (churnRecord?.trialUsed && churnRecord.lastUninstalled) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    if (churnRecord.lastUninstalled > sixMonthsAgo) {
      return json({ success: false, error: "TRIAL_EXPIRED_LOCKDOWN" }, { status: 403 });
    }
  }

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as PhoenixRequestBody;
      const { mode, products, context: userContext } = body;

      // --- MODE: SCAN (Strict 5-item safety limit for Edge stability) ---
      if (mode === "scan") {
        const response = await admin.graphql(`
          query { products(first: 5, query: "status:active") { edges { node { id title } } } }
        `);
        const data = await response.json();
        return json({
          success: true,
          scannedResults: data.data.products.edges.map((e: any) => ({ id: e.node.id, title: e.node.title }))
        });
      }

      // --- MODE: ANALYZE (High-Precision Sequential Processing) ---
      if (mode === "analyze") {
        const results = [];
        const productList = Array.isArray(products) ? products : [];
        
        for (const product of productList) {
          // Execute High-Precision AI Analysis
          const aiData = await analyzeProductData(product, userContext);

          // Persistent Logging to OptimizationHistory
          await db.optimizationHistory.create({
            data: {
              shop,
              productId: product.id,
              productName: product.title,
              optimizationType: "BULK_SCAN_V1",
              optimizedContent: JSON.stringify({
                title: aiData.optimized_title,
                description: aiData.optimized_html_description,
                schema: aiData.json_ld_schema
              }),
              status: "success"
            }
          });

          results.push({
            productId: product.id,
            currentTitle: product.title,
            optimized_title: aiData.optimized_title || product.title,
            optimized_html_description: aiData.optimized_html_description || "",
            json_ld_schema: aiData.json_ld_schema || "{}",
            seoScore: aiData.seoScore || 8,
            flaggedIssues: aiData.missing_trust_signals || [],
            ready: true
          });
        }
        return json({ success: true, results });
      }

      // --- MODE: APPLY (Schema Shield & Shopify Deployment) ---
      if (mode === "apply") {
        const productList = Array.isArray(products) ? products : [];
        for (const p of productList) {
          const response = await admin.graphql(
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
                  descriptionHtml: p.optimized_html_description + `\n\n<script type="application/ld+json">${p.json_ld_schema}</script>`
                }
              }
            }
          );

          const resJson = await response.json();

          // Finalize the apply phase in database
          if (!resJson.data?.productUpdate?.userErrors?.length) {
            await db.optimizationHistory.updateMany({
              where: { shop, productId: p.productId, status: "success" },
              data: { optimizationType: "APPLIED_TO_SHOPIFY" }
            });
          }
        }
        return json({ success: true });
      }
    }
    return json({ success: true });
  } catch (error: any) {
    console.error("PHOENIX ENGINE FAILURE:", error.message);
    return json({ success: false, error: error.message }, { status: 500 });
  }
};
