/**
 * 🛡️ SHADOW'S FORGE: CORE LOGIC GATE
 * WARNING: DO NOT MODIFY THIS FILE WITHOUT EXPLICIT PERMISSION.
 * This file governs the clinical Media SEO Alt-Text optimization.
 * Authorized Deployment: ironphoenixflow.com
 */
import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import shopify from "../shopify.server";
import { getUserTier } from "../utils/tierConfig";
import { canPerformAction, recordUsage } from "../utils/usageTracker";

export const action = async ({ request, context }: ActionFunctionArgs) => {
  // 1. AUTH HANDSHAKE: Establish secure link to the Shopify Admin
  const { admin, session } = await shopify.authenticate.admin(request);
  const shop = session.shop;

  // 2. USAGE VERIFICATION: Checks tier-based limits before execution
  const userTier = await getUserTier(context, shop);
  const allowed = await canPerformAction(context, shop, userTier, "description");
  
  if (!allowed.allowed) {
    return json({ 
      error: allowed.reason || "Monthly limit reached for Media Optimization." 
    }, { status: 403 });
  }

  try {
    // 3. DEEP QUERY: Fetching Vitals and Media Assets
    const response = await admin.graphql(
      `#graphql
      query fetchMediaBatch {
        products(first: 5, query: "-tag:visual-locked") {
          nodes {
            id
            title
            media(first: 5) {
              nodes {
                ... on MediaImage {
                  id
                  alt
                  image { url }
                }
              }
            }
          }
        }
      }`
    );

    const resJson: any = await response.json();
    const products = resJson.data?.products?.nodes || [];
    const report = [];

    // 4. SEQUENTIAL EXECUTION: Staying under the 128MB Cloudflare Edge memory limit
    for (const product of products) {
      let mediaCount = 0;
      for (const mediaNode of product.media.nodes) {
        if (!mediaNode.image) continue;

        // Skip if Alt Text is already optimized to save Shopify API credits
        if (mediaNode.alt?.includes("Iron Phoenix")) continue;

        const updateResponse = await admin.graphql(
          `#graphql
          mutation fileUpdate($files: [FileUpdateInput!]!) {
            fileUpdate(files: $files) {
              files { id alt }
              userErrors { field message }
            }
          }`,
          {
            variables: {
              files: [{
                id: mediaNode.id,
                alt: `Iron Phoenix: ${product.title} optimized SEO image`
              }]
            }
          }
        );
        mediaCount++;
      }

      // 5. LOCK: Tagging product to prevent redundant re-optimization
      await admin.graphql(
        `#graphql
        mutation addVisualLock($id: ID!) {
          tagsAdd(id: $id, tags: ["visual-locked"]) {
            node { id }
          }
        }`,
        { variables: { id: product.id } }
      );

      report.push({ title: product.title, mediaOptimized: mediaCount, status: "SEO_COMPLETE" });
    }

    // 6. TELEMETRY: Recording action in usage tracker
    await recordUsage(context, shop, "description", { type: "media_optimizer" });

    return json({ 
      status: "SUCCESS", 
      count: products.length,
      report,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error(`[SHADOW_FORGE] Media Crash on Edge:`, err.message);
    return json({ error: err.message }, { status: 500 });
  }
};