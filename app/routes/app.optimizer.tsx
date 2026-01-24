interface OptimizationData {
  listingGrade?: {
    score: number;
    feedback: { seo: string; description: string; photography: string; };
    optimization: {
      shopifyProductTitle: string;
      shopifyMetaDescription: string;
      optimizedDescription: string;
    };
  };
  error?: string;
}
import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  BlockStack,
  Text,
  TextField,
  Box,
  Banner,
  List,
  Divider,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";

export default function Optimizer() {
  const shopify = useAppBridge();
  const fetcher = useFetcher<any>();
  const [productUrl, setProductUrl] = useState("");

  const isLoading = fetcher.state === "submitting" || fetcher.state === "loading";
  const data = fetcher.data;

  const handleAnalyze = () => {
    if (!productUrl) return;
    fetcher.submit(
      { url: productUrl, mode: "grade" },
      { method: "POST", action: "/api/optimizer" }
    );
  };

  return (
    <Page>
      <TitleBar title="Product Optimizer" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                AI Listing Grader & Optimizer
              </Text>
              <Text variant="bodyMd" as="p">
                Enter a product URL to grade its SEO, accessibility, and conversion potential.
              </Text>

              <BlockStack gap="200">
                <TextField
                  label="Product URL"
                  value={productUrl}
                  onChange={setProductUrl}
                  placeholder="https://mystore.com/products/my-product"
                  autoComplete="off"
                />
                <Button variant="primary" onClick={handleAnalyze} loading={isLoading} disabled={!productUrl}>
                  Analyze Listing
                </Button>
              </BlockStack>

              {data?.error && (
                <Banner tone="critical">
                  <p>{data.error}</p>
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {data?.listingGrade && (
          <Layout.Section>
            <BlockStack gap="400">
              {/* Score Card */}
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingLg" as="h2">
                    Grade: {data.listingGrade.score}/100
                  </Text>
                  <Divider />
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">Feedback</Text>
                    <List>
                      <List.Item><strong>SEO:</strong> {data.listingGrade.feedback.seo}</List.Item>
                      <List.Item><strong>Description:</strong> {data.listingGrade.feedback.description}</List.Item>
                      <List.Item><strong>Photography:</strong> {data.listingGrade.feedback.photography}</List.Item>
                    </List>
                  </BlockStack>
                </BlockStack>
              </Card>

              {/* Optimization Card */}
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">Optimized Content</Text>

                  <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="200">
                      <Text variant="headingSm" as="h3">Shopify Title (H1)</Text>
                      <Text as="p">{data.listingGrade.optimization.shopifyProductTitle}</Text>
                    </BlockStack>
                  </Box>

                  <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="200">
                      <Text variant="headingSm" as="h3">Meta Description</Text>
                      <Text as="p">{data.listingGrade.optimization.shopifyMetaDescription}</Text>
                    </BlockStack>
                  </Box>

                  <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="200">
                      <Text variant="headingSm" as="h3">Optimized Description</Text>
                      <div dangerouslySetInnerHTML={{ __html: data.listingGrade.optimization.optimizedDescription }} />
                    </BlockStack>
                  </Box>

                  <Button
                    onClick={() => {
                      // TODO: Implement apply logic
                      shopify.toast.show("Apply feature coming soon");
                    }}
                  >
                    Apply to Shopify
                  </Button>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
