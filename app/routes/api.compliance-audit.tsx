import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
// FIX 2614: Using the correct default export for Iron Phoenix
import shopify from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  // 1. AUTHENTICATE: Establish the secure handshake
  const { admin } = await shopify.authenticate.admin(request);

  try {
    // 2. QUERY: Fetching Vitals and Policies in one efficient burst
    const response = await admin.graphql(
      `#graphql
      query checkComplianceVitals {
        shop {
          name
          email
          # FIX: billingAddress is deprecated; shopAddress is the 2026 standard
          shopAddress {
            address1
            city
            country
          }
          # Policies are nested objects, not simple strings
          privacyPolicy { body }
          refundPolicy { body }
          shippingPolicy { body }
          termsOfService { body }
        }
      }`
    );

    const resJson: any = await response.json();

    // Check for GraphQL errors (e.g., missing scopes)
    if (resJson.errors) {
      console.error("GraphQL Error in Audit:", resJson.errors);
      return Response.json({ status: "Error", message: "GraphQL Validation Failed" }, { status: 400 });
    }

    const shop = resJson.data?.shop || {};

    // 3. ANALYZE: Determine if the store foundation is "Action Ready"
    // We check for both the existence of the policy and that the body isn't empty
    const missingPolicies = [
      (!shop.privacyPolicy || !shop.privacyPolicy.body) && "Privacy",
      (!shop.refundPolicy || !shop.refundPolicy.body) && "Refund",
      (!shop.shippingPolicy || !shop.shippingPolicy.body) && "Shipping",
      (!shop.termsOfService || !shop.termsOfService.body) && "ToS"
    ].filter(Boolean);

    // 4. REPORT: Return the status to update the Vitals Badge on the Dashboard
    return Response.json({
      status: missingPolicies.length === 0 ? "Healthy" : "Attention Required",
      missing: missingPolicies,
      shopName: shop.name
    });

  } catch (err: any) {
    console.error("Compliance Audit Critical Failure:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
};