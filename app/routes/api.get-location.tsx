import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import shopify from "../shopify.server";

/**
 * Loader to fetch the Location IDs for the Iron Phoenix store.
 * Use this to find the GID needed for api.inventory-sync.tsx
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await shopify.authenticate.admin(request);

  try {
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
} `
    );

    const resJson: any = await response.json();
    return Response.json({
      locations: resJson.data?.locations?.edges.map((e: any) => e.node) || [],
      instructions: "Copy the 'id' (e.g., gid://shopify/Location/12345) and paste it into YOUR_LOCATION_ID in api.inventory-sync.tsx"
    });

  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
};