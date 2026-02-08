/**
 * 🛡️ SHADOW'S FORGE: CORE LOGIC GATE
 * WARNING: DO NOT MODIFY WITHOUT EXPLICIT PERMISSION.
 * ROLE: Geographic Discovery Engine (Location Vitals).
 * GOAL: Resolve Location GIDs for Inventory Sync and Compliance Audits.
 */
import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import shopify from "../shopify.server";

/**
 * Loader to fetch the Location IDs for the Iron Phoenix store.
 * Optimized for Cloudflare Remix and authenticated Shopify sessions.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  // 1. AUTH HANDSHAKE: Establish secure link to Shopify Admin
  const { admin } = await shopify.authenticate.admin(request);

  try {
    // 2. QUERY ENGINE: Fetching active location vitals
    const response = await admin.graphql(
      `#graphql
      query getStoreLocations {
        locations(first: 5) {
          edges {
            node {
              id
              name
              isActive
            }
          }
        }
      }`
    );

    const resJson: any = await response.json();

    // 3. CLINICAL DATA EXTRACTION: Mapping nodes for Mission Control
    return json({
      locations: resJson.data?.locations?.edges.map((e: any) => e.node) || [],
      instructions: "Copy the 'id' (e.g., gid://shopify/Location/12345) for use in your inventory sync configuration."
    });

  } catch (error: any) {
    // 4. ERROR TRAP: Enhanced messaging for Edge debugging
    console.error("Location Fetch Error:", error.message);
    return json({
      success: false,
      error: "Failed to fetch locations. Check Cloudflare logs and Shopify API permissions."
    }, { status: 500 });
  }
};