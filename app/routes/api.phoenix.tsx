import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { authenticate } from "../shopify.server";
import { getUserTier, hasReachedLimit } from "../utils/tierConfig";
import { sendDeveloperAlert } from "../utils/developerAlert";
// ✅ IMPORT THE IRON PHOENIX BRAIN
import {
  generatePhoenixContent,
  generateAltText,
  generateAIContent,
  ignitePhoenix,
  analyzeProductData
} from "../gemini.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const contentType = request.headers.get("Content-Type") || "";

  try {
    // ============================================================
    // TRAFFIC LANE 1: BULK ANALYZER (JSON DATA)
    // ============================================================
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { mode, products, context } = body;

      // --- BULK MODE: SCAN ---
      if (mode === "scan") {
        const response = await admin.graphql(
          `#graphql
          query {
            products(first: 50, query: "status:active", sortKey: CREATED_AT, reverse: true) {
              edges {
                node {
                  id
                  title
                  descriptionHtml
                }
              }
            }
          }`
        );
        const data = await response.json();
        return json({
          success: true,
          scannedIds: data.data.products.edges.map((e: any) => e.node.id),
          scannedResults: data.data.products.edges.map((e: any) => ({
            id: e.node.id,
            title: e.node.title,
            reasons: ["Recent Product"]
          }))
        });
      }

      // --- BULK MODE: ANALYZE (IRON PHOENIX) ---
      if (mode === "analyze") {
        const analysisResults = await Promise.all(
          products.map(async (product: any) => {
            // Call the Iron Phoenix Brain
            try {
              const aiData = await analyzeProductData(product, context);

              return {
                productId: product.productId || product.id,
                currentTitle: product.title,
                optimized_title: aiData.optimized_title || product.title,
                optimized_html_description: aiData.optimized_html_description || "",
                json_ld_schema: aiData.json_ld_schema || "{}",
                seoScore: aiData.seoScore || 8,
                accessibilityScore: 10,
                flaggedIssues: aiData.missing_trust_signals || [],
                ready: true
              };
            } catch (e) {
              return {
                productId: product.productId || product.id,
                currentTitle: product.title,
                optimized_title: product.title,
                optimized_html_description: product.descriptionHtml || "<p>Analysis Failed</p>",
                json_ld_schema: "{}",
                seoScore: 0,
                accessibilityScore: 0,
                flaggedIssues: ["AI Analysis Failed"],
                ready: false
              };
            }
          })
        );
        return json({ success: true, results: analysisResults });
      }

      // --- BULK MODE: APPLY ---
      if (mode === "apply") {
        const updates = await Promise.all(
          products.map(async (p: any) => {
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
            return response.json();
          })
        );
        return json({ success: true, updates });
      }
    }

    // ============================================================
    // TRAFFIC LANE 2: SINGLE GENERATOR (FORM DATA)
    // ============================================================
    const formData = await request.formData();
    const actionType = formData.get("actionType") as string;
    const productName = formData.get("productName") as string;
    const featuresAttr = formData.get("features");
    const features = featuresAttr ? JSON.parse(featuresAttr as string) : [];
    const contentMediaType = formData.get("contentType") as any;

    // --- 1. LIMIT CHECKS ---
    const tier = await getUserTier(shop);
    let limitType: any = null;
    if (actionType === 'generate_desc') limitType = 'descriptionsPerMonth';
    if (actionType === 'generate_ad' || contentMediaType === 'product_ad') limitType = 'adsPerMonth';

    if (limitType && hasReachedLimit(tier, limitType, 0)) {
      return json({ success: false, error: "Plan limit reached." }, { status: 402 });
    }

    // --- 2. EXECUTE AI ---
    let result;
    if (actionType === 'generate_desc') {
      result = await generatePhoenixContent(productName, features);
    }
    else if (actionType === 'generate_alt_text') {
      result = await generateAltText(productName);
    }
    else if (actionType === 'generate_media') {
      result = await generateAIContent({
        contentType: contentMediaType,
        shop: shop,
        userTier: tier,
        productDetails: productName,
        brandContext: formData.get("brandContext") as string || "Our Brand",
        targetAudience: formData.get("targetAudience") as string || "General Audience"
      });
    }
    else if (actionType === 'perform_scan') {
      const graphqlResponse = await admin.graphql(`
        query ShopScan {
          shop { name, description, primaryDomain { url } }
          shopPolicies { title, body }
          products(first: 5) { edges { node { title, descriptionHtml } } }
        }
      `);
      const shopData = await graphqlResponse.json();

      const prompt = `
        [STRICT JSON ANALYST]
        Analyze this shop data: ${JSON.stringify(shopData)}
        Return JSON with "brandIdentity" (summary, usp) and "trustAudit" (policy gaps).
      `;

      const rawText = await ignitePhoenix(prompt, "Senior Data Analyst");
      const cleanText = rawText.replace(/```json|```/g, "").trim();
      result = JSON.parse(cleanText);
    }

    return json({ success: true, data: result });

  } catch (error: any) {
    console.error("❌ PHOENIX API ERROR:", error);
    return json({ success: false, error: error.message || "System Error" }, { status: 500 });
  }
};