import { type ActionFunctionArgs } from "@remix-run/cloudflare";
import shopify from "../shopify.server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const { admin } = await shopify.authenticate.admin(request);
  const env = (context as any).cloudflare?.env || (context as any).env || process.env;
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    // 1. FETCH: Grab all active blog posts
    // We fetch the first 50 articles to check for topical overlap.
    const response = await admin.graphql(
      `#graphql
      query getArticles {
        articles(first: 50) {
          nodes {
            id
            title
            contentHtml
            handle
            blog { id title }
          }
        }
      }`
    );

    const resJson: any = await response.json();
    const articles = resJson.data?.articles?.nodes || [];
    if (!articles.length) return Response.json({ message: "No blogs found." });

    // 2. AUDIT: Use Gemini to identify duplicate "Themes"
    const auditPrompt = `
      Analyze these blog titles/summaries for Iron Phoenix:
      ${articles.map((a: any) => `ID: ${a.id} | Title: ${a.title}`).join("\n")}
      
      Task: Identify any 2 or more blogs that cover the same core topic (e.g., "Energy Supplements").
      Goal: Consolidate duplicate thin content into high-authority pillar posts.
      Output JSON: { "mergeGroups": [ { "keepId": "...", "mergeIds": ["..."], "newPillarTitle": "..." } ] }
    `;

    const auditResult = await model.generateContent(auditPrompt);
    const auditData = JSON.parse(auditResult.response.text().replace(/```json|```/g, "").trim());

    // 3. EXECUTE: Merge and Update
    for (const group of auditData.mergeGroups) {
      // Logic: Take content from mergeIds, combine it into keepId
      // In a production environment, you would also set up 301 redirects for the merged URLs.
      await admin.graphql(
        `#graphql
        mutation updateArticle($id: ID!, $article: ArticleUpdateInput!) {
          articleUpdate(id: $id, article: $article) {
            article { id }
            userErrors { message }
          }
        }`,
        {
          variables: {
            id: group.keepId,
            article: {
              title: group.newPillarTitle,
              tags: ["pillar-content", "blog-optimized"]
            }
          }
        }
      );
    }

    return Response.json({ status: "SUCCESS", merged: auditData.mergeGroups.length });

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};