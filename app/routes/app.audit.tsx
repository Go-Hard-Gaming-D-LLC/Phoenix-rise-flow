import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  BlockStack,
  Text,
  Banner,
  List,
  Box,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

// FIX 2614: Standardized default import for the Shopify object
import shopify from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Authenticate the session using the default shopify object
  await shopify.authenticate.admin(request);
  return json({ status: "Audit Engine Ready" });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await shopify.authenticate.admin(request);

  try {
    // PHASE 0: Executive Triage for Misrepresentation
    // FIX: Using only valid Shop fields to clear GraphQL Validation errors
    const response = await admin.graphql(
      `#graphql
      query getShopVitals {
        shop {
          name
          url
          contactEmail
          primaryDomain {
            url
          }
        }
      }`
    );

    const responseJson = await response.json();
    const shop = responseJson.data.shop;

    const issues = [];
    // Basic compliance check for the $50k Store Goal
    if (!shop.contactEmail) {
      issues.push("Missing Contact Email: High risk for Google Merchant Center suspension.");
    }

    // Placeholder for deeper policy checks via Shopify API
    if (shop.url.includes("myshopify.com")) {
      issues.push("Primary Domain: Using a .myshopify.com URL can impact trust scores.");
    }

    return json({
      success: true,
      issues,
      shopName: shop.name
    });
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};

export default function AuditPage() {
  const { status } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<any>();
  const isLoading = fetcher.state !== "idle";
  const results = fetcher.data;

  return (
    <Page>
      <TitleBar title="Compliance Audit" />
      <Layout>
        <Layout.Section>
          <Banner tone="info">
            <Text as="p">{status}: Safeguarding the Iron Phoenix from Misrepresentation flags.</Text>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Store Trust & Policy Audit</Text>
              <Text as="p">Run a Phase 0 scan to identify legal gaps before scaling your designs.</Text>
              <Button
                variant="primary"
                onClick={() => fetcher.submit({}, { method: "POST" })}
                loading={isLoading}
              >
                Run Compliance Check
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        {results?.issues && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">Audit Findings for {results.shopName}</Text>
                {results.issues.length === 0 ? (
                  <Banner tone="success">No critical misrepresentation issues found!</Banner>
                ) : (
                  /* FIX 2820: Using 'bg-fill-critical-secondary' to resolve TypeScript error */
                  <Box
                    padding="400"
                    background="bg-fill-critical-secondary"
                    borderRadius="200"
                  >
                    <BlockStack gap="200">
                      <Text as="p" fontWeight="bold">Compliance Gaps Detected:</Text>
                      <List type="bullet">
                        {results.issues.map((issue: string, i: number) => (
                          <List.Item key={i}>{issue}</List.Item>
                        ))}
                      </List>
                    </BlockStack>
                  </Box>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}