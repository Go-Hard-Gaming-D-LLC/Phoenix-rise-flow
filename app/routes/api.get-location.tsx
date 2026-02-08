/**
 * 🛡️ SHADOW'S FORGE: CORE LOGIC GATE
 * WARNING: DO NOT MODIFY WITHOUT EXPLICIT PERMISSION.
 * ROLE: Geographic Discovery Engine (Location Vitals).
 * GOAL: Resolve Location GIDs for api.inventory-sync.tsx
 */
import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import shopify from "../shopify.server";

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
    const locations = resJson.data?.locations?.edges.map((e: any) => e.node) || [];

    // 4. REPORT: Returning GIDs for inventory floor synchronization
    return json({
      success: true,
      locations,
      instructions: "Copy the GID (e.g., gid://shopify/Location/12345) for use in your inventory floor enforcement logic."
    });

  } catch (error: any) {
    // Clinical error trap for Edge debugging
    console.error("[SHADOW_FORGE] Location Discovery Failure:", error.message);
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
};