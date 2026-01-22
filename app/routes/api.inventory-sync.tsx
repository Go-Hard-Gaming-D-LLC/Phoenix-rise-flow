import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// SYSTEM ROLE: PHOENIX FLOW LOGISTICS BRIDGE
// FUNCTION: Sync Inventory across platforms.
// LOGIC: Overwrite lower number with higher number.

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin } = await authenticate.admin(request);

    try {
        // 1. FETCH SHOPIFY INVENTORY
        const response = await admin.graphql(
            `#graphql
      query fetchInventory {
        products(first: 50) {
          edges {
            node {
              id
              title
              variants(first: 10) {
                edges {
                  node {
                    id
                    sku
                    inventoryQuantity
                    inventoryItem {
                      id
                    }
                  }
                }
              }
            }
          }
        }
      }`
        );

        const products = (await response.json()).data.products.edges.map((e: any) => e.node);
        const report = [];

        // 2. MOCK EXTERNAL FETCH (Etsy/TikTok)
        // In a real scenario, we'd fetch from Etsy API here using SKU matching.
        // For "Hand-Held" logic demonstration, we simulate an external source.
        const externalInventory = [
            { sku: "DEMO-SKU-1", quantity: 5 }, // Example
        ];

        for (const product of products) {
            for (const edge of product.variants.edges) {
                const variant = edge.node;
                if (!variant.sku) continue;

                // 3. COMPARE LOGIC: Overwrite Lower with Higher
                const shopifyQty = variant.inventoryQuantity;
                // Find matching external SKU
                const externalItem = externalInventory.find(e => e.sku === variant.sku);
                const externalQty = externalItem ? externalItem.quantity : shopifyQty; // Default to match if not found

                if (externalQty !== shopifyQty) {
                    const highestQty = Math.max(shopifyQty, externalQty);

                    // If Shopify is the lower one, update Shopify
                    if (shopifyQty < highestQty) {
                        // EXECUTE UPDATE
                        await admin.graphql(
                            `#graphql
               mutation inventoryAdjust($input: InventoryAdjustQuantityInput!) {
                 inventoryAdjustQuantity(input: $input) {
                   inventoryLevel {
                     quantities(names: ["available"]) {
                       quantity
                     }
                   }
                 }
               }`,
                            {
                                variables: {
                                    input: {
                                        inventoryItemId: variant.inventoryItem.id,
                                        availableDelta: highestQty - shopifyQty // Adjust by difference
                                    }
                                }
                            }
                        );
                        report.push({ sku: variant.sku, action: "UPDATED_SHOPIFY", newQty: highestQty });
                    }
                    // If External is lower, we would call Etsy API here to update it.
                    else {
                        report.push({ sku: variant.sku, action: "PENDING_EXTERNAL_UPDATE", target: "ETSY", newQty: highestQty });
                    }
                }
            }
        }

        return json({ status: "SYNCED", report });

    } catch (error) {
        console.error("Logistics Bridge Error:", error);
        return json({ error: "Sync Failed" }, { status: 500 });
    }
};
