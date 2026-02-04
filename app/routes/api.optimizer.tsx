import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import shopify from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await shopify.authenticate.admin(request);

  try {
    const response = await admin.graphql(
      `#graphql
      query fetchMediaBatch {
        products(first: 5, query: "-tag:visual-locked") {
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

    // SEQUENTIAL LOOP: Protects Cloudflare Worker 128MB limit
    for (const product of products) {
      for (const mediaNode of product.media.nodes) {
        if (!mediaNode.image) continue;

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
                alt: `Iron Phoenix: ${product.title} SEO`
              }]
            }
          }
        );
      }

      // Tag product to filter it from future scans
      await admin.graphql(
        `#graphql
        mutation lockVisuals($id: ID!, $tags: [String!]!) {
          tagsAdd(id: $id, tags: $tags) { node { id } }
        }`,
        { variables: { id: product.id, tags: ["visual-locked"] } }
      );

      report.push({ title: product.title, status: "SEO_COMPLETE" });
    }

    return json({ status: "SUCCESS", report });

  } catch (err: any) {
    console.error("Media Optimizer Error:", err.message);
    return json({ error: err.message }, { status: 500 });
  }
};