import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// SYSTEM ROLE: PHOENIX FLOW TRUST GUARDIAN
// FUNCTION: Compliance Audit (NAP & Policies).
// LOGIC: Check Footer/Policies vs Product Details.

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin } = await authenticate.admin(request);

    try {
        // 1. FETCH SHOP POLICIES & INFO
        const shopQuery = await admin.graphql(
            `#graphql
      query getShopDetails {
        shop {
          name
          email
          billingAddress {
            address1
            city
            country
            zip
          }
          privacyPolicy { body }
          refundPolicy { body }
          shippingPolicy { body }
          termsOfService { body }
        }
      }`
        );

        const shopData = (await shopQuery.json()).data.shop;
        const report = [];

        // 2. NAP CHECK (Name, Address, Phone/Email)
        // Google Merchant Center strict requirement.
        const hasAddress = !!shopData.billingAddress;
        const hasEmail = !!shopData.email;

        if (!hasAddress || !hasEmail) {
            report.push({ status: "FAIL", type: "NAP", message: "Missing Billing Address or Email in Store Settings." });
        } else {
            report.push({ status: "PASS", type: "NAP", details: "Address and Email detected." });
        }

        // 3. POLICY CHECK
        const requiredPolicies = ["privacyPolicy", "refundPolicy", "shippingPolicy", "termsOfService"];

        for (const policy of requiredPolicies) {
            if (!shopData[policy]?.body) {
                report.push({ status: "FAIL", type: "POLICY", message: `Missing ${policy}.` });
            } else {
                report.push({ status: "PASS", type: "POLICY", message: `${policy} detected.` });
            }
        }

        // 4. MISREPRESENTATION CHECK (Logic)
        // If shipping policy exists but is empty or too short (< 50 words), flag it.
        if (shopData.shippingPolicy?.body) {
            const wordCount = shopData.shippingPolicy.body.split(/\s+/).length;
            if (wordCount < 50) {
                report.push({ status: "WARNING", type: "MISREPRESENTATION", message: "Shipping Policy is too short. Risk of suspension." });
            }
        }

        return json({ status: "AUDITED", report });

    } catch (error) {
        console.error("Trust Guardian Error:", error);
        return json({ error: "Audit Failed" }, { status: 500 });
    }
};
