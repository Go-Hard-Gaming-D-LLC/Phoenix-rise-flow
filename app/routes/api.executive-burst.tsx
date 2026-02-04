import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { authenticate } from "../shopify.server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// SYSTEM ROLE: PHOENIX FLOW EXECUTIVE ENGINE (CONTENT BURST)
// FUNCTION: Batch Processor for Titles & Descriptions.
// LIMIT: 40 Products.

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  // ENFORCEMENT: Use Cloudflare context for the API key (No process.env)
  const env = (context as any).cloudflare?.env || (context as any).env || process.env;
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    // 1. FETCH: Strictly limited to 5 products for Edge stability
    const response = await admin.graphql(
      `#graphql
      query fetchBatch {
        products(first: 5, query: "-tag:content-locked") {
          edges {
            node {
              id
              title
              descriptionHtml
              handle
            }
          }
        }
      }`
    );

    const responseJson = await response.json();
    const products = responseJson.data.products.edges.map((e: any) => e.node);

    if (products.length === 0) {
      return json({ status: "IDLE", message: "No unoptimized products found." });
    }

    const report: any[] = [];

    // 2. SEQUENTIAL BURST: Using map for parallel execution but on a small 5-item set
    await Promise.all(products.map(async (product: any) => {
      const productStringId = String(product.id);

      const prompt = `
        Analyze this Shopify Product:
        Title: ${product.title}
        Desc: ${product.descriptionHtml}

        Task: Generate an Optimized H1 Title and a Persuasive Description(HTML).
          Constraints:
        1. Title: User - focused, descriptive, clean.
                2. Description: 2 sentences max, sales - driven.
                3. Output JSON: { "title": "...", "descriptionHtml": "..." }
        `;

      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanJson = text.replace(/```json | ```/g, "").trim();
        const aiData = JSON.parse(cleanJson);

        // 3. UPDATE SHOPIFY (Content)
        await admin.graphql(
          `#graphql
          mutation productUpdate($input: ProductInput!) {
            productUpdate(input: $input) {
              product { id }
            }
          }`,
          {
            variables: {
              input: {
                id: productStringId,
                title: String(aiData.title),
                descriptionHtml: String(aiData.descriptionHtml)
              }
            }
          }
        );

        // 4. LOCK (Tagging)
        await admin.graphql(
          `#graphql
          mutation addTags($id: ID!, $tags: [String!]!) {
            tagsAdd(id: $id, tags: $tags) {
              node { id }
            }
          }`,
          {
            variables: {
              id: productStringId,
              tags: ["content-locked"]
            }
          }
        );

        report.push({ id: productStringId, status: "OPTIMIZED", title: aiData.title });

      } catch (e) {
        console.error(`Failed ID ${productStringId}: `, e);
        report.push({ id: productStringId, status: "FAILED" });
      }
    }));

    return json({
      mode: "scan",
      count: products.length,
      report
    });

  } catch (error) {
    console.error("Content Burst Error:", error);
    return json({ error: "Batch failed" }, { status: 500 });
  }
};
