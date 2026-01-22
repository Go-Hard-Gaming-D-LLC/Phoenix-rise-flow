import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { GoogleGenAI } from "@google/genai";

// SYSTEM ROLE: PHOENIX FLOW VISUAL ENGINE
// FUNCTION: Analyze images, Generate Alt-Text, RENAME Files.
// BATCH: 40 Products Max.

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin } = await authenticate.admin(request);
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = (genAI as any).getGenerativeModel({ model: "gemini-2.0-flash" });

    try {
        // 1. FETCH 40 PRODUCTS needing Visuals
        const response = await admin.graphql(
            `#graphql
      query fetchVisualBatch {
        products(first: 40, query: "-tag:visual-locked") {
          edges {
            node {
              id
              title
              handle
              images(first: 10) {
                edges {
                  node {
                    id
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

        const products = (await response.json()).data.products.edges.map((e: any) => e.node);
        if (!products.length) return json({ message: "No visual tasks pending." });

        const report = [];

        // 2. PROCESS IMAGES
        for (const product of products) {
            const productStringId = String(product.id);

            for (const [index, edge] of product.images.edges.entries()) {
                const img = edge.node;

                // AI Vision Analysis
                const prompt = `
          Analyze this image: ${img.url}
          Product: ${product.title}
          Task: Create SEO Alt-Text & a Filename.
          Output JSON: { "altText": "...", "filename": "slug-style-name.jpg" }
        `;

                try {
                    const result = await model.generateContent(prompt);
                    const ai = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());

                    // 3. EXECUTE UPDATE (Alt Text)
                    // Note: Shopify API for *renaming* the actual source file is limited. 
                    // We update ALT TEXT which is the SEO critical factor. 
                    // If you strictly need filename changes, it requires re-uploading the image blob.
                    // For now, we strictly execute Media Update for ALT tag + "Visual Lock".

                    await admin.graphql(
                        `#graphql
            mutation mediaUpdate($input: UpdateMediaInput!) {
              productUpdateMedia(media: [$input], productId: "${productStringId}") {
                media { id }
              }
            }`,
                        {
                            variables: {
                                input: {
                                    id: String(img.id),
                                    alt: String(ai.altText)
                                }
                            }
                        }
                    );
                } catch (e) {
                    console.error("Visual AI Error", e);
                }
            }

            // 4. LOCK
            await admin.graphql(
                `#graphql
        mutation addTags($id: ID!, $tags: [String!]!) {
          tagsAdd(id: $id, tags: $tags) { node { id } }
        }`,
                { variables: { id: productStringId, tags: ["visual-locked"] } }
            );

            report.push({ id: productStringId, status: "VISUALS_LOCKED" });
        }

        return json({ mode: "scan", report });

    } catch (err) {
        console.error("Visual Engine Crash:", err);
        return json({ error: "Visual Engine Failed" }, { status: 500 });
    }
};
