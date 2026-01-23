import type { ActionFunctionArgs } from "@remix-run/node";
// FIX 2614: Import the default shopify object and then use authenticate from it
import shopify from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    // FIX 2614: Use the authenticated admin from the shopify object
    const { admin } = await shopify.authenticate.admin(request);

    try {
        const response = await admin.graphql(
            `#graphql
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
      }`
        );

        const responseJson: any = await response.json();
        const products = responseJson.data?.products?.nodes || [];
        const report = [];

        for (const product of products) {
            const vendor = product.vendor || "";
            
            // --- CJ DROPSHIPPING: HIDE IF 0 ---
            if (vendor.includes("CJ") || vendor.includes("Dropshipping")) {
                for (const variant of product.variants.nodes) {
                    if (variant.inventoryQuantity <= 0) {
                        // FIX: Use stable GraphQL syntax for archiving
                        await admin.graphql(
                            `#graphql
                            mutation hideProduct($id: ID!) {
                              productUpdate(input: { id: $id, status: ARCHIVED }) {
                                product { id }
                              }
                            }`,
                            { variables: { id: product.id } }
                        );
                        report.push({ title: product.title, action: "ARCHIVED" });
                    }
                }
            }

            // --- POD VENDORS: SAFETY FLOOR 3 ---
            const podVendors = ["Printify", "Printful", "Teelaunch", "AnywherePod"];
            if (podVendors.some(v => vendor.includes(v))) {
                for (const variant of product.variants.nodes) {
                    if (variant.inventoryQuantity < 3) {
                        await admin.graphql(
                            `#graphql
                            mutation setFloor($input: InventorySetQuantitiesInput!) {
                              inventorySetQuantities(input: $input) {
                                userErrors { message }
                              }
                            }`,
                            { variables: { input: {
                                name: "available",
                                reason: "correction",
                                quantities: [{
                                    inventoryItemId: variant.inventoryItem.id,
                                    locationId: "YOUR_LOCATION_ID", // We still need your real ID here
                                    quantity: 3
                                }]
                            } } }
                        );
                        report.push({ title: product.title, action: "FLOOR_SET_3" });
                    }
                }
            }
        }

        return Response.json({ status: "SYNCED", report });

    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
};