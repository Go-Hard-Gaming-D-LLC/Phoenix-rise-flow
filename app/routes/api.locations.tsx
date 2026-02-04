import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import shopify from "../shopify.server";

/**
 * Loader to fetch the Location IDs for the Iron Phoenix store.
 * Optimized for Cloudflare Remix and authenticated Shopify sessions.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  // 1. Authenticate the admin session
  const { admin } = await shopify.authenticate.admin(request);

  try {
    // 2. Execute GraphQL query to find active locations
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

    // 3. Return clean JSON response using Remix helper
    return json({
      locations: resJson.data?.locations?.edges.map((e: any) => e.node) || [],
      instructions: "Copy the 'id' (e.g., gid://shopify/Location/12345) for use in your inventory sync configuration."
    });

  } catch (error: any) {
    // 4. Enhanced Error Messaging for Edge debugging
    console.error("Location Fetch Error:", error.message);
    return json({
      success: false,
      error: "Failed to fetch locations. Please check your Cloudflare logs and Shopify API permissions."
    }, { status: 500 });
  }
};
