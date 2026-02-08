/**
 * 🛡️ SHADOW'S FORGE: CORE LOGIC GATE
 * WARNING: DO NOT MODIFY WITHOUT EXPLICIT PERMISSION.
 * ROLE: Foundation & Compliance Audit Engine.
 */
import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import shopify from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  // 1. AUTHENTICATE: Establish secure handshake
  const { admin } = await shopify.authenticate.admin(request);

  try {
    // 2. QUERY: Fetching Vitals and Policies (2026 shopAddress Standard)
    const response = await admin.graphql(
      `#graphql
      query checkComplianceVitals {
        shop {
          name
          email
          shopAddress {
            address1
            city
            country
          }
          privacyPolicy { body }
          refundPolicy { body }
          shippingPolicy { body }
          termsOfService { body }
        }
      }`
    );

    const resJson: any = await response.json();

    if (resJson.errors) {
      console.error("GraphQL Error in Audit:", resJson.errors);
      return json({ status: "Error", message: "GraphQL Validation Failed" }, { status: 400 });
    }

    const shop = resJson.data?.shop || {};

    // 3. ANALYZE: Determine if foundation is "Action Ready"
    const missingPolicies = [
      (!shop.privacyPolicy || !shop.privacyPolicy.body) && "Privacy",
      (!shop.refundPolicy || !shop.refundPolicy.body) && "Refund",
      (!shop.shippingPolicy || !shop.shippingPolicy.body) && "Shipping",
      (!shop.termsOfService || !shop.termsOfService.body) && "ToS"
    ].filter(Boolean);

    // 4. REPORT: Return status for the Dashboard Vitals Badge
    return json({
      status: missingPolicies.length === 0 ? "Healthy" : "Attention Required",
      missing: missingPolicies,
      shopName: shop.name
    });

  } catch (err: any) {
    console.error("Compliance Audit Critical Failure:", err);
    return json({ error: err.message }, { status: 500 });
  }
};