import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import shopify from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await shopify.authenticate.admin(request);

  try {
    /* 1. Fetch primary location */
    const locationRes = await admin.graphql(`
      query {
        locations(first: 1) {
          nodes { id }
        }
      }
    `);

    const locationJson: any = await locationRes.json();
    const locationId = locationJson.data.locations.nodes[0]?.id;

    if (!locationId) {
      throw new Error("No active Shopify location found. Ensure locations are configured in your admin.");
    }

    /* 2. Fetch products - Limited to 50 for Edge stability */
    const response = await admin.graphql(`
      query fetchVendorInventory {
        products(first: 50) {
          nodes {
            id
            title
            vendor
            variants(first: 10) {
              nodes {
                id
                inventoryQuantity
                inventoryItem { id }
              }
            }
          }
        }
      }
    `);

    const responseJson: any = await response.json();
    const products = responseJson.data?.products?.nodes || [];
    const report: Array<{ title: string; action: string }> = [];

    const podVendors = ["printify", "printful", "teelaunch", "anywherepod"];

    // 3. STRICT SEQUENTIAL LOOP: Protects 128MB memory isolate
    for (const product of products) {
      const vendor = product.vendor?.toLowerCase() || "";

      /* CJ / Dropshipping → Archive if out of stock */
      if (vendor.includes("cj") || vendor.includes("dropshipping")) {
        const shouldArchive = product.variants.nodes.some(
          (v: any) => v.inventoryQuantity <= 0
        );

        if (shouldArchive) {
          await admin.graphql(
            `mutation hideProduct($id: ID!) {
              productUpdate(input: { id: $id, status: ARCHIVED }) {
                product { id }
              }
            }`,
            { variables: { id: product.id } }
          );

          report.push({ title: product.title, action: "ARCHIVED" });
          continue;
        }
      }

      /* POD vendors → Inventory floor enforcement */
      if (podVendors.some(v => vendor.includes(v))) {
        const quantities = product.variants.nodes
          .filter((v: any) => v.inventoryQuantity < 3)
          .map((v: any) => ({
            inventoryItemId: v.inventoryItem.id,
            locationId,
            quantity: 3
          }));

        if (quantities.length > 0) {
          await admin.graphql(
            `mutation setFloor($input: InventorySetQuantitiesInput!) {
              inventorySetQuantities(input: $input) {
                userErrors { message }
              }
            }`,
            {
              variables: {
                input: {
                  name: "available",
                  reason: "correction",
                  quantities
                }
              }
            }
          );

          report.push({ title: product.title, action: "FLOOR_SET_3" });
        }
      }
    }

    return json({ status: "SYNCED", report });

  } catch (error: any) {
    // 4. Enhanced Error Messaging: Explicit debugging guidance
    console.error("Inventory Sync Error:", error.message);
    return json(
      { status: "ERROR", message: "Inventory sync failed. Check Shopify API quotas or Cloudflare Worker memory usage." },
      { status: 500 }
    );
  }
};
