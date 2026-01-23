import type { ActionFunctionArgs } from "@remix-run/node";
import shopify from "../shopify.server"; 

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await shopify.authenticate.admin(request);
  
  try {
    const response = await admin.graphql(
      `#graphql
      query fetchMediaBatch {
        products(first: 20, query: "-tag:visual-locked") {
          nodes {
            id
            title
            media(first: 5) {
              nodes {
                ... on MediaImage {
                  id
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

    for (const product of products) {
      for (const mediaNode of product.media.nodes) {
        if (!mediaNode.image) continue;

        // FIX 1160 & 2304: Correct use of backticks and strings
        await admin.graphql(
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
                // Ensure this is a string literal with proper backticks or quotes
                alt: `Iron Phoenix GHG: ${product.title} SEO Optimized`
              }]
            }
          }
        );
      }

      // FIX 2345: Correcting the tags array structure
      await admin.graphql(
        `#graphql
        mutation lockVisuals($id: ID!, $tags: [String!]!) {
          tagsAdd(id: $id, tags: $tags) { 
            node { id } 
          }
        }`,
        { 
          variables: { 
            id: product.id,
            tags: ["visual-locked"] 
          } 
        }
      );
      
      report.push({ title: product.title, status: "SEO_COMPLETE" });
    }

    return Response.json({ status: "SUCCESS", report });

  } catch (err: any) {
    console.error("Optimizer Engine Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
};