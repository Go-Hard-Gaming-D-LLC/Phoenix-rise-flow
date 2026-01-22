import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { GoogleGenAI } from "@google/genai";

// SYSTEM ROLE: PHOENIX FLOW EXECUTIVE ENGINE
// MODE: Radial Execution.
// BATCH SIZE: 15 (User Override).

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin } = await authenticate.admin(request);

    // 1. Initialize AI
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    try {
        // 2. FETCH BATCH (15 Products) - "The 15-Product Burst"
        // Filtering for products that haven't been visual-locked yet to prevent looping.
        const response = await admin.graphql(
            `#graphql
      query fetchBatch {
        products(first: 15, query: "-tag:visual-locked") {
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
              options(first: 3) {
                name
                values
              }
            }
          }
        }
      }`
        );

        const responseJson = await response.json();
        const products = responseJson.data.products.edges.map((e: any) => e.node);

        if (products.length === 0) {
            return json({ status: "IDLE", message: "No unoptimized products found in queue." });
        }

        const report = [];

        // 3. PROCESS BATCH
        for (const product of products) {
            const updates = [];
            const productTitle = product.title;

            // Determine Color option if it exists for renaming context
            const colorOption = product.options.find((o: any) => o.name.toLowerCase().includes("color"));
            // Default to first value if exists, logic can be expanded
            const defaultColor = colorOption ? colorOption.values[0] : "main";

            // 4. VISUALS: Analyze & Generate Commands
            for (const [index, edge] of product.images.edges.entries()) {
                const image = edge.node;

                // AI Analysis for Alt Text
                // strict constraint: 125 chars
                const prompt = `
          Analyze this image URL: ${image.url} for product "${productTitle}".
          Task: Generate SEO Alt-Text.
          Constraints: 
          1. EXACTLY describe the visual.
          2. Max 125 characters. 
          3. No "image of" or "picture of".
          4. Output JSON: { "altText": "..." }
        `;

                try {
                    const result = await model.generateContent(prompt);
                    // Safe parsing logic
                    const text = result.response.text();
                    const cleanJson = text.replace(/```json|```/g, "").trim();
                    const aiData = JSON.parse(cleanJson);

                    const newAlt = aiData.altText || `${productTitle} - View ${index + 1}`;
                    const newFilename = `${product.handle}-${defaultColor}-${index + 1}.jpg`; // Renaming logic

                    updates.push({
                        id: image.id,
                        alt: newAlt,
                        // Note: Shopify GraphQL MediaUpdate doesn't always support direct filename change easily without re-upload, 
                        // but we can update Alt Text strictly as requested.
                        // We will focus on Alt Text injection as the primary "Visual Tool" action supported natively by update.
                    });

                } catch (e) {
                    console.error(`AI Fail on ${product.handle}:`, e);
                }
            }

            // 5. EXECUTE VISUAL LOCK (GraphQL Mutation)
            // We process media updates in a single call if possible, or sequential.
            // Using mediaUpdate API.

            for (const update of updates) {
                await admin.graphql(
                    `#graphql
          mutation updateMedia($input: UpdateMediaInput!) {
            productUpdateMedia(media: [$input], productId: "${product.id}") {
              media {
                alt
              }
              mediaUserErrors {
                field
                message
              }
            }
          }`,
                    {
                        variables: {
                            input: {
                                id: update.id,
                                alt: update.alt
                            }
                        }
                    }
                );
            }

            // 6. TAG & LOCK - Prevent Re-looping
            await admin.graphql(
                `#graphql
        mutation addTags($id: ID!, $tags: [String!]!) {
          tagsAdd(id: $id, tags: $tags) {
            node {
              id
            }
            userErrors {
              message
            }
          }
        }`,
                {
                    variables: {
                        id: product.id,
                        tags: ["visual-locked"] // The "JSON LOCK" equivalent for database
                    }
                }
            );

            report.push({ id: product.id, title: productTitle, status: "LOCKED" });
        }

        return json({
            mode: "scan",
            status: "COMPLETED",
            batchSize: products.length,
            report
        });

    } catch (error) {
        console.error("Executive Engine Failure:", error);
        return json({ error: "Batch processing interrupted." }, { status: 500 });
    }
};
