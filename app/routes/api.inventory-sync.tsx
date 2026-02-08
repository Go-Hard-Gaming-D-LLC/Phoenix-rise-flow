/**
 * 🛡️ SHADOW'S FORGE: CORE LOGIC GATE
 * WARNING: DO NOT MODIFY WITHOUT EXPLICIT PERMISSION.
 * ROLE: Inventory Vitals & Floor Enforcement Engine.
 * ENFORCED LIMIT: 50 Products per Sync Isolate.
 */
import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import shopify from "../shopify.server";
import { recordUsage } from "../utils/usageTracker";

export const action = async ({ request, context }: ActionFunctionArgs) => {
  // 1. AUTH HANDSHAKE: Establish secure link to the Shopify Admin
  const { admin, session } = await shopify.authenticate.admin(request);
  const shop = session.shop;

  try {
    // 2. LOCATION RESOLUTION: Fetch primary fulfillment center
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
      throw new Error("❌ SHADOW'S FORGE: No active Shopify location found.");
    }

    // 3. DATA ACQUISITION: 50-item burst for Edge stability
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

    // 4. SEQUENTIAL EXECUTION: One at a time to stay under memory limits
    for (const product of products) {
      const vendor = product.vendor?.toLowerCase() || "";

      /* CLINICAL RULE 1: Dropshipping Automation */
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

      /* CLINICAL RULE 2: POD Floor Enforcement (Min: 3) */
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

    // 5. TELEMETRY: Recording sync vites in usage tracker
    await recordUsage(context, shop, "description", { type: "inventory_sync", count: products.length });

    return json({ status: "SYNCED", report });

  } catch (error: any) {
    console.error("PHOENIX SYNC FAILURE:", error.message);
    return json(
      { status: "ERROR", message: "Inventory sync failed." },
      { status: 500 }
    );
  }
};