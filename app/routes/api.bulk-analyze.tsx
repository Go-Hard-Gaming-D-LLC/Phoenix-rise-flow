import { json, type ActionFunctionArgs } from "@remix-run/node";
import shopify from "../shopify.server";
import { analyzeProductData } from "../gemini.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await shopify.authenticate.admin(request);

  // 1. PARSE JSON (The UI sends JSON, not FormData)
  const body = await request.json();
  const { mode, products, context } = body;

  try {
    // ============================================================
    // MODE 1: SCAN (Fetch Products from Shopify)
    // ============================================================
    if (mode === "scan") {
      const response = await admin.graphql(
        `#graphql
        query {
          products(first: 50, query: "status:active", sortKey: CREATED_AT, reverse: true) {
            edges {
              node {
                id
                title
                description
                descriptionHtml
                images(first: 1) { edges { node { altText } } }
              }
            }
          }
        }`
      );
      const data = await response.json();

      const scannedIds = data.data.products.edges.map((edge: any) => edge.node.id.split('/').pop());

      // Return simple list for the UI
      return json({
        success: true,
        scannedIds,
        scannedResults: data.data.products.edges.map((e: any) => ({
          id: e.node.id,
          title: e.node.title,
          reasons: ["Recent Product"]
        }))
      });
    }

    // ============================================================
    // MODE 2: ANALYZE (Run Iron Phoenix AI)
    // ============================================================
    if (mode === "analyze") {
      const analysisResults = await Promise.all(
        products.map(async (product: any) => {
          // CALL THE BRAIN
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
        })
      );

      return json({ success: true, results: analysisResults });
    }

    // ============================================================
    // MODE 3: APPLY (Save Changes to Shopify)
    // ============================================================
    if (mode === "apply") {
      const updates = await Promise.all(
        products.map(async (p: any) => {
          // 1. Update Product Title & Description
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
                  id: p.productId.startsWith('gid://') ? p.productId : `gid://shopify/Product/${p.productId}`,
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

    return json({ error: "Invalid Mode" }, { status: 400 });

  } catch (error: any) {
    console.error("Bulk Analyze Error:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
};