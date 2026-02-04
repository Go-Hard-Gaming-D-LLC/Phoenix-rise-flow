import { type ActionFunctionArgs } from "@remix-run/cloudflare";
// FIX 2614: Import the default shopify object to match your shopify.server.ts
import shopify from "../shopify.server";

/**
 * Handles the API request for optimizing media images.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  // Use the authenticate method from the default shopify object
  const { admin } = await shopify.authenticate.admin(request);

  try {
    // 1. FETCH: Uses 'media' instead of 'images' to stay ahead of deprecations
    const response = await admin.graphql(
      `#graphql
      query fetchMediaBatch {
        products(first: 40, query: "-tag:visual-locked") {
          nodes {
            id
            title
            media(first: 10) {
              nodes {
                ... on MediaImage {
                  id
                  image {
                    url
                    altText
                  }
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

    for (const product of products) {
      for (const mediaNode of product.media.nodes) {
        // Only process actual images
        if (!mediaNode.image) continue;

        // 2. EXECUTE UPDATE: Product-linked SEO update
        await admin.graphql(
          `#graphql
          mutation updateAlt($productId: ID!, $media: [UpdateMediaInput!]!) {
            productUpdateMedia(productId: $productId, media: $media) {
              media { id }
              userErrors { message }
            }
          }`,
          {
            variables: {
              productId: product.id,
              media: [{
                id: mediaNode.id,
                alt: `Iron Phoenix SEO: ${product.title}`
              }]
            }
          }
        );
      }

      // 3. LOCK: Tag the product so it's not processed twice
      await admin.graphql(
        `#graphql
        mutation lockProduct($id: ID!) {
          tagsAdd(id: $id, tags: ["visual-locked"]) { node { id } }
        }`,
        { variables: { id: product.id } }
      );
      report.push({ id: product.id, status: "MEDIA_LOCKED" });
    }

    return Response.json({ status: "SUCCESS", report });

  } catch (err: any) {
    console.error("Media Optimizer Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
};