/**
 * SHADOW'S FORGE: CORE LOGIC GATE
 * WARNING: DO NOT MODIFY WITHOUT EXPLICIT PERMISSION.
 * ROLE: Clinical PDF Audit Generator (Execution Only).
 * OUTPUT: Standardized Store Compliance Report.
 */
import { type ActionFunctionArgs } from "@remix-run/cloudflare";
import shopify from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  // 1. AUTHENTICATE: Verify the secure link
  const { admin } = await shopify.authenticate.admin(request);

  try {
    // 2. DATA ACQUISITION: Pulling the same vitals used in the live audit
    const response = await admin.graphql(
      `#graphql
      query fetchPdfAuditVitals {
        shop {
          name
          email
          shopAddress { city country }
          privacyPolicy { body }
          refundPolicy { body }
          shippingPolicy { body }
          termsOfService { body }
        }
      }`
    );

    const resJson: any = await response.json();
    const shop = resJson.data?.shop || {};

    // 3. CLINICAL DOCUMENT CONSTRUCTION: Plain text/JSON response for the PDF bridge
    // Note: In a production Cloudflare Worker, you'd typically stream this to a PDF service or use a worker-compatible lib.
    const auditReport = {
      store: shop.name,
      timestamp: new Date().toISOString(),
      vitals: {
        address: `${shop.shopAddress?.city}, ${shop.shopAddress?.country}` || "Missing",
        email: shop.email,
      },
      compliance: {
        privacy: !!shop.privacyPolicy?.body,
        refund: !!shop.refundPolicy?.body,
        shipping: !!shop.shippingPolicy?.body,
        tos: !!shop.termsOfService?.body,
      },
    };

    // Returning the clinical data object which the UI will trigger for download
    return new Response(JSON.stringify(auditReport, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="Iron-Phoenix-Audit-${shop.name}.json"`,
      },
    });
  } catch (err: any) {
    console.error("PDF Generation Failure:", err.message);
    return new Response("Audit Export Failed", { status: 500 });
  }
};
