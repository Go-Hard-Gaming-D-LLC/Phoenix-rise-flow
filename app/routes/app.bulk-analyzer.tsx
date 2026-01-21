import { useEffect, useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  BlockStack,
  Text,
  InlineStack,
  Badge,
  Box,
  ProgressBar,
  DataTable,
  Modal,
  TextField,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

interface ProductAnalysis {
  productId: string;
  currentTitle: string;
  suggestedTitle: string;
  seoScore: number;
  accessibilityScore: number;
  flaggedIssues: string[];
  ready: boolean;
}

interface BulkResult {
  success: boolean;
  analyzed: number;
  ready: number;
  flaggedForReview: number;
  results?: ProductAnalysis[];
  error?: string;
  scannedIds?: string[];
  scannedResults?: any[]; // { id, title, reasons }
}

export default function BulkAnalyzer() {
  const fetcher = useFetcher<BulkResult>();
  const [products, setProducts] = useState<string>("");
  const [scannedDetails, setScannedDetails] = useState<any[]>([]); // Detailed audit results
  const [context, setContext] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProductAnalysis[]>([]);
  const [selectedResult, setSelectedResult] = useState<ProductAnalysis | null>(
    null
  );
  const [progress, setProgress] = useState(0);

  const handleAnalyze = async () => {
    if (!products.trim()) {
      alert("Please enter product IDs (comma-separated)");
      return;
    }

    setLoading(true);
    setProgress(0);

    const productIds = products
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id);

    // Fetch product details from Shopify
    const productDetails = await Promise.all(
      productIds.map(async (id) => {
        const response = await fetch("/admin/api/2024-01/graphql.json", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              query {
                product(id: "gid://shopify/Product/${id}") {
                  id
                  title
                  tags
                  description
                  descriptionHtml
                  images(first: 5) {
                    edges {
                      node {
                        id
                        altText
                        src
                      }
                    }
                  }
                }
              }
            `,
          }),
        });
        return response.json();
      })
    );

    // Send to bulk analyzer
    fetcher.submit(
      {
        products: productDetails.map((p: any) => ({
          productId: p.data?.product?.id,
          title: p.data?.product?.title,
          description: p.data?.product?.description,
          images: p.data?.product?.images?.edges?.map((edge: any) => ({
            alt: edge.node.altText,
            src: edge.node.src,
          })),
        })),
        context: context,
        mode: "analyze",
      },
      { method: "POST", action: "/api/bulk-analyze", encType: "application/json" }
    );
  };

  useEffect(() => {
    if (fetcher.data?.results) {
      setResults(fetcher.data.results);
      setLoading(false);
    } else if (fetcher.data?.scannedIds) {
      // Handle the result of the "Scan" action
      setProducts(fetcher.data.scannedIds.join(", "));
      if (fetcher.data.scannedResults) {
        setScannedDetails(fetcher.data.scannedResults);
      }
      setLoading(false);
      shopify.toast.show(`Loaded ${fetcher.data.scannedIds.length} priority products`);
    } else if (fetcher.data?.error) {
      setLoading(false);
      shopify.toast.show(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data]);

  const readyToApply = results.filter((r) => r.ready).length;
  const needsReview = results.filter((r) => !r.ready).length;

  return (
    <Page>
      <TitleBar title="Bulk Product Analyzer" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Analyze Products for Accessibility & SEO
              </Text>

              {scannedDetails.length > 0 && (
                <Banner tone="warning" title={`Audit Report: ${scannedDetails.length} Priority Items Found`}>
                  <Box padding="200">
                    <BlockStack gap="200">
                      {scannedDetails.map((item: any, i) => (
                        <Text as="p" key={i}>
                          <strong>{item.title}</strong>: {item.reasons.join(", ")}
                        </Text>
                      ))}
                    </BlockStack>
                  </Box>
                </Banner>
              )}

              <TextField
                label="Product IDs (comma-separated)"
                placeholder="gid://shopify/Product/123, gid://shopify/Product/456"
                value={products}
                onChange={setProducts}
                multiline={3}
                autoComplete="off"
                disabled={loading} // Disable if analyzing or scanning
                connectedRight={
                  <Button
                    onClick={() => {
                      // Trigger scan - we'll handle this via a separate fetcher or mode
                      setLoading(true);
                      const formData = new FormData();
                      formData.append("action", "scan");
                      // We need a way to trigger the scan. 
                      // Using the same fetcher but with a specific mode "scan" and explicit JSON encoding
                      fetcher.submit(
                        { mode: "scan" },
                        { method: "POST", action: "/api/bulk-analyze", encType: "application/json" }
                      );
                    }}
                    variant="primary"
                    disabled={loading}
                    loading={loading && !products}
                  >
                    Scan Store (Auto-Load)
                  </Button>
                }
              />

              <TextField
                label="Strategy / Trend Context (Optional)"
                placeholder="e.g. Trend: 'Cottagecore'. Goal: Increase organic traffic."
                value={context}
                onChange={setContext}
                multiline={2}
                autoComplete="off"
                helpText="Context to guide the AI's analysis of these products."
              />

              <InlineStack gap="200">
                <Button
                  variant="primary"
                  onClick={handleAnalyze}
                  disabled={loading || !products.trim()}
                >
                  {loading ? "Analyzing..." : "Analyze Products"}
                </Button>
              </InlineStack>

              {fetcher.data?.error && (
                <div style={{ marginTop: '1rem' }}>
                  <Banner tone="critical">
                    <p>{fetcher.data.error}</p>
                  </Banner>
                </div>
              )}

              {loading && progress > 0 && (
                <Box>
                  <ProgressBar progress={progress} />
                  <Text variant="bodySm" as="p">
                    Processing {Math.round(progress * 100)}%
                  </Text>
                </Box>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {results.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack>
                  <Badge tone="success">
                    {readyToApply} Ready to Apply
                  </Badge>
                  <Badge tone="warning">
                    {needsReview} Needs Review
                  </Badge>
                </InlineStack>

                <DataTable
                  columnContentTypes={[
                    "text",
                    "numeric",
                    "numeric",
                    "text",
                    "text",
                  ]}
                  headings={[
                    "Product",
                    "SEO Score",
                    "A11y Score",
                    "Status",
                    "Action",
                  ]}
                  rows={results.map((result) => [
                    result.currentTitle.substring(0, 40),
                    `${result.seoScore}/100`,
                    `${result.accessibilityScore}/100`,
                    result.ready ? (
                      <Badge tone="success">Ready</Badge>
                    ) : (
                      <Badge tone="warning">Review</Badge>
                    ),
                    <Button
                      variant="plain"
                      onClick={() => setSelectedResult(result)}
                    >
                      Details
                    </Button>,
                  ])}
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {selectedResult && (
          <Modal
            open={Boolean(selectedResult)}
            onClose={() => setSelectedResult(null)}
            title="Analysis Details"
          >
            <Box padding="400">
              <BlockStack gap="300">
                <div>
                  <Text variant="headingSm" as="h3">Current Title</Text>
                  <Text as="p">{selectedResult.currentTitle}</Text>
                </div>

                <div>
                  <Text variant="headingSm" as="h3">Suggested Title</Text>
                  <Text as="p">{selectedResult.suggestedTitle}</Text>
                </div>

                {selectedResult.flaggedIssues.length > 0 && (
                  <div>
                    <Text variant="headingSm" as="h3">⚠️ Flagged Issues</Text>
                    <BlockStack gap="100">
                      {selectedResult.flaggedIssues.map((issue, i) => (
                        <Text key={i} as="p">• {issue}</Text>
                      ))}
                    </BlockStack>
                  </div>
                )}

                <InlineStack gap="200">
                  <Button
                    variant="primary"
                    disabled={!selectedResult.ready}
                    onClick={() => {
                      // Apply this product's changes
                      fetcher.submit(
                        {
                          products: [selectedResult],
                          mode: "apply",
                        },
                        { method: "POST", action: "/api/bulk-analyze", encType: "application/json" }
                      );
                      setSelectedResult(null);
                    }}
                  >
                    Apply Changes
                  </Button>
                  <Button onClick={() => setSelectedResult(null)}>
                    Close
                  </Button>
                </InlineStack>
              </BlockStack>
            </Box>
          </Modal>
        )}
      </Layout>
    </Page>
  );
}
