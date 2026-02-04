import { useEffect, useState } from "react";
import { type LoaderFunctionArgs } from "@remix-run/cloudflare";
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
  Checkbox,
  Scrollable,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
declare const shopify: any;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

// ✅ Iron Phoenix: Elite Interface
interface ProductAnalysis {
  productId: string;
  currentTitle: string;
  optimized_title: string;          // Renamed from suggestedTitle
  optimized_html_description: string; // Renamed from suggestedDescription
  json_ld_schema: string;             // Added Schema Shield
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
  scannedResults?: any[];
}

export default function BulkAnalyzer() {
  const fetcher = useFetcher<BulkResult>();
  const [products, setProducts] = useState<string>("");
  const [scannedDetails, setScannedDetails] = useState<any[]>([]);
  const [context, setContext] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProductAnalysis[]>([]);
  const [selectedResult, setSelectedResult] = useState<ProductAnalysis | null>(null);
  const [progress, setProgress] = useState(0);

  const handleAnalyze = async () => {
    if (!products.trim()) {
      shopify.toast.show("Please enter product IDs (comma-separated) or scan your store.", { isError: true });
      return;
    }

    setLoading(true);
    setProgress(10);

    const productIds = products.split(",").map((id) => id.trim()).filter((id) => id);

    // ⚠️ NOTE: Client-side fetching can sometimes fail due to CORS. 
    // Ideally, move this fetch logic to the server-side API route.
    const productDetails = await Promise.all(
      productIds.map(async (id) => {
        const response = await fetch("/admin/api/2024-01/graphql.json", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              query {
                product(id: "gid://shopify/Product/${id}") {
                  id, title, tags, description, descriptionHtml
                  images(first: 5) { edges { node { id, altText, src } } }
                }
              }
            `,
          }),
        });
        return response.json();
      })
    );

    setProgress(40);

    const analysisPayload = {
      products: productDetails.map((p: any) => ({
        productId: p.data?.product?.id,
        title: p.data?.product?.title,
        tags: p.data?.product?.tags,
        description: p.data?.product?.description,
        images: p.data?.product?.images?.edges?.map((edge: any) => ({
          alt: edge.node.altText,
          src: edge.node.src,
        })),
      })),
      context: context,
      mode: "analyze",
    };

    fetcher.submit(
      analysisPayload as any,
      { method: "POST", action: "/api/phoenix", encType: "application/json" }
    );
  };

  useEffect(() => {
    if (fetcher.data?.results) {
      setResults(fetcher.data.results);
      setLoading(false);
      setProgress(100);
    } else if (fetcher.data?.scannedIds) {
      setProducts(fetcher.data.scannedIds.join(", "));
      if (fetcher.data.scannedResults) setScannedDetails(fetcher.data.scannedResults);
      setLoading(false);
      shopify.toast.show(`Loaded ${fetcher.data.scannedIds.length} priority products`);
    } else if (fetcher.data?.error) {
      setLoading(false);
      shopify.toast.show(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data]);

  const readyToApply = results.filter((r) => r.ready).length;

  return (
    <Page>
      <TitleBar title="Iron Phoenix: Bulk Editor" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Analyze & Repair Products</Text>

              <TextField
                label="Product IDs"
                placeholder="gid://shopify/Product/123..."
                value={products}
                onChange={setProducts}
                multiline={3}
                autoComplete="off"
                disabled={loading}
                connectedRight={
                  <Button
                    onClick={() => {
                      setLoading(true);
                      fetcher.submit({ mode: "scan" }, { method: "POST", action: "/api/phoenix", encType: "application/json" });
                    }}
                    disabled={loading}
                  >
                    Scan Store
                  </Button>
                }
              />

              <Button variant="primary" onClick={handleAnalyze} disabled={loading || !products.trim()}>
                {loading ? "Analyzing..." : "Run Iron Phoenix Analysis"}
              </Button>

              {loading && <ProgressBar progress={progress} />}
            </BlockStack>
          </Card>
        </Layout.Section>

        {results.length > 0 && (
          <Layout.Section>
            <Card>
              <DataTable
                columnContentTypes={["text", "text", "text", "text"]}
                headings={["Product", "Trust Score", "Status", "Action"]}
                rows={results.map((result) => [
                  result.currentTitle.substring(0, 30) + "...",
                  `${result.seoScore}/10`,
                  result.ready ? <Badge tone="success">Optimized</Badge> : <Badge tone="warning">Review</Badge>,
                  <Button onClick={() => setSelectedResult(result)}>View Code</Button>,
                ])}
              />
            </Card>
          </Layout.Section>
        )}

        {selectedResult && (
          <Modal
            open={Boolean(selectedResult)}
            onClose={() => setSelectedResult(null)}
            title="Iron Phoenix Optimization"
            size="large"  // ✅ FIXED: Changed 'large' to 'size="large"'
          >
            <Modal.Section>
              <BlockStack gap="500">
                <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">⚡ Optimized Title (Long-tail)</Text>
                    <Text as="p" fontWeight="bold">{selectedResult.optimized_title}</Text>
                  </BlockStack>
                </Box>

                <BlockStack gap="200">
                  <Text variant="headingSm" as="h3">📱 Mobile-First HTML Description</Text>
                  <Scrollable shadow style={{ height: '200px', border: '1px solid #ccc', padding: '10px' }}>
                    {/* Preview the Actual HTML */}
                    <div dangerouslySetInnerHTML={{ __html: selectedResult.optimized_html_description }} />
                  </Scrollable>
                  {/* ✅ FIXED: Added 'as="p"' below */}
                  <Text variant="bodySm" tone="subdued" as="p">
                    This HTML includes the "Trust Signals" and mobile formatting.
                  </Text>
                </BlockStack>

                <BlockStack gap="200">
                  <Text variant="headingSm" as="h3">🛡️ Schema Shield (JSON-LD)</Text>
                  <TextField
                    labelHidden
                    label="schema"
                    value={selectedResult.json_ld_schema}
                    autoComplete="off"
                    multiline={4}
                    readOnly
                  />
                </BlockStack>

                <InlineStack gap="300" align="end">
                  <Button onClick={() => setSelectedResult(null)}>Close</Button>
                  <Button variant="primary" onClick={() => {
                    // Submit the Apply Action
                    const applyPayload = {
                      products: [selectedResult],
                      mode: "apply"
                    };
                    fetcher.submit(applyPayload as any, { method: "POST", action: "/api/phoenix", encType: "application/json" });
                    setSelectedResult(null);
                  }}>
                    Apply Fixes
                  </Button>
                </InlineStack>
              </BlockStack>
            </Modal.Section>
          </Modal>
        )}
      </Layout>
    </Page>
  );
}
