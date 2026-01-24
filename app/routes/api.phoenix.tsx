import type { ActionFunctionArgs } from "@remix-run/node";
import shopify from "../shopify.server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await shopify.authenticate.admin(request);

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const formData = await request.formData();
    const productId = formData.get("productId") as string;
    const aiContent = formData.get("content") as string;

    if (!productId || !aiContent) {
      throw new Error("Missing productId or content");
    }

    const result = await admin.graphql(
      `
      mutation updatePhoenix($id: ID!, $description: String!, $tags: [String!]!) {
        productUpdate(
          input: {
            id: $id
            descriptionHtml: $description
            tags: $tags
          }
        ) {
          product { id }
          userErrors {
            field
            message
          }
        }
      }
      `,
      {
        variables: {
          id: productId,
          description: aiContent,
          tags: ["phoenix-optimized"]
        }
      }
    );

    const json: any = await result.json();
    const errors = json.data?.productUpdate?.userErrors;

    if (errors?.length) {
      throw new Error(errors.map((e: any) => e.message).join(", "));
    }

    return Response.json({ success: true });

  } catch (err: any) {
    console.error("Phoenix Engine Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
};
