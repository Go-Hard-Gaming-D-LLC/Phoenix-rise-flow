import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData, Link } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Badge,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
// FIX 2614: Import default shopify object
import shopify from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Use the default shopify object to authenticate
  await shopify.authenticate.admin(request);
  return Response.json({ status: "Operational", store: "Iron Phoenix GHG" });
};

export default function Index() {
  const fetcher = useFetcher();
  const data = useLoaderData<typeof loader>();

  return (
    <Page fullWidth>
      <TitleBar title="Phoenix Flow Dashboard" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingLg">
                    Iron Phoenix Command Center 🚀
                  </Text>
                  <Badge tone="success">Vitals: Healthy</Badge>
                </InlineStack>
                <Text as="p" variant="bodyMd">
                  Your digital exoskeleton for SEO, Inventory Logic, and High-Conversion Automation.
                </Text>
              </BlockStack>
            </Card>

            <InlineStack gap="400" align="start">
              {/* TOOL 1: THE BRAIN */}
              <div style={{ flex: 1, minWidth: "300px" }}>
                <Card>
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingMd">✍️ Content Generator</Text>
                    <Text as="p">Deploy Gemini 2.0 to write SEO-heavy supplement descriptions.</Text>
                    <Link to="/app/description-generator">
                      <Button variant="primary" fullWidth>Launch AI Brain</Button>
                    </Link>
                  </BlockStack>
                </Card>
              </div>

              {/* TOOL 2: THE GUARD */}
              <div style={{ flex: 1, minWidth: "300px" }}>
                <Card>
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingMd">⚖️ Compliance Audit</Text>
                    <Text as="p">Scan for NAP errors and missing Google Merchant policies.</Text>
                    <Link to="/app/audit">
                      <Button variant="primary" fullWidth>Run Audit</Button>
                    </Link>
                  </BlockStack>
                </Card>
              </div>

              {/* TOOL 3: THE BRIDGE */}
              <div style={{ flex: 1, minWidth: "300px" }}>
                <Card>
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingMd">📦 Inventory Sync</Text>
                    <Text as="p">POD Safety Floors (3) and CJ Dropshipping Auto-Archiving.</Text>
                    <Button 
                      onClick={() => fetcher.submit({}, { method: "post", action: "/api/inventory-sync" })}
                      loading={fetcher.state !== "idle"}
                    >
                      Quick Sync Now
                    </Button>
                  </BlockStack>
                </Card>
              </div>
            </InlineStack>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}