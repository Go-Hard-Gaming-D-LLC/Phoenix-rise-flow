/**
 * 🛡️ SHADOW'S FORGE: CORE LOGIC GATE
 * WARNING: DO NOT MODIFY THIS FILE WITHOUT EXPLICIT PERMISSION.
 * This file governs the clinical store vital check and compliance audit.
 * Authorized Deployment: ironphoenixflow.com
 */
import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import shopify from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  // 1. AUTH HANDSHAKE: Establish secure link to the Shopify Admin
  const { admin, session } = await shopify.authenticate.admin(request);
  const shopDomain = session.shop;

  try {
    // 2. DEEP QUERY: Fetching Vitals, Policies, and Theme Assets
    const response = await admin.graphql(
      `#graphql
      query checkComplianceVitals {
        shop {
          name
          email
          myshopifyDomain
          plan { displayName }
          shopAddress {
            address1
            city
            province
            country
            zip
          }
          privacyPolicy { body title }
          refundPolicy { body title }
          shippingPolicy { body title }
          termsOfService { body title }
        }
      }`
    );

    const resJson: any = await response.json();

    // 3. ERROR TRAP: Identifying GraphQL scope or connection failures
    if (resJson.errors) {
      console.error(`[SHADOW_FORGE] Audit Failure for ${shopDomain}:`, resJson.errors);
      return json({ 
        status: "Critical Error", 
        message: "Handshake interrupted by Shopify API." 
      }, { status: 400 });
    }

    const shop = resJson.data?.shop || {};

    // 4. CLINICAL ANALYSIS: Determining "Action Ready" status
    const report = {
      policies: {
        privacy: !!shop.privacyPolicy?.body && shop.privacyPolicy.body.length > 100,
        refund: !!shop.refundPolicy?.body && shop.refundPolicy.body.length > 100,
        shipping: !!shop.shippingPolicy?.body && shop.shippingPolicy.body.length > 100,
        tos: !!shop.termsOfService?.body && shop.termsOfService.body.length > 100
      },
      vitals: {
        hasAddress: !!shop.shopAddress?.address1,
        hasEmail: !!shop.email,
        isCustomDomain: !shop.myshopifyDomain?.includes("myshopify.com")
      }
    };

    // 5. MISSING FIELD EXTRACTION: For the Dashboard Vitals Badge
    const missing = [
      !report.policies.privacy && "Privacy Policy",
      !report.policies.refund && "Refund Policy",
      !report.policies.shipping && "Shipping Policy",
      !report.policies.tos && "Terms of Service",
      !report.vitals.hasAddress && "Store Address",
      !report.vitals.hasEmail && "Public Contact Email"
    ].filter(Boolean);

    // 6. HEALTH SCORING: Calculating the supra-integrity percentage
    const totalChecks = 6;
    const passedChecks = totalChecks - missing.length;
    const healthPercentage = Math.round((passedChecks / totalChecks) * 100);

    // 7. FINAL REPORT: Returning the clinical outcome
    return json({
      status: missing.length === 0 ? "Healthy" : "Attention Required",
      score: healthPercentage,
      missing: missing,
      shopName: shop.name,
      plan: shop.plan?.displayName,
      auditTimestamp: new Date().toISOString(),
      authorizedDomain: "ironphoenixflow.com"
    });

  } catch (err: any) {
    // Clinical logging for Cloudflare Edge debugging
    console.error(`[SHADOW_FORGE] Audit Crash on Edge:`, err.message);
    return json({ 
      error: "Compliance Audit Critical Failure",
      details: err.message 
    }, { status: 500 });
  }
};