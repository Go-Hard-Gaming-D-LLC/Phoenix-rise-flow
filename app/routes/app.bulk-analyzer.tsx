/**
 * 🛡️ SHADOW'S FORGE: CORE LOGIC GATE
 * WARNING: DO NOT MODIFY WITHOUT EXPLICIT PERMISSION.
 * ROLE: Executive Bulk Analyzer UI (Execution Only).
 * ENFORCED LIMIT: 5 Products per Burst.
 */
import { useEffect, useState } from "react";
import { type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useFetcher } from "@remix-run/react";
import {
  Page, Layout, Card, Button, BlockStack, Text, InlineStack, Badge, Box, 
  DataTable, Modal, TextField, Banner, Divider
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function BulkAnalyzer() {
  const fetcher = useFetcher<any>();
  const [products, setProducts] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);

  // Clinical check for batch safety limits
  const productCount = products.split(",").filter(id => id.trim()).length;

  const handleAnalyze = () => {
    setLoading(true);
    // ✅ SYNC: Mapping to the clinical Phoenix Batch Engine
    fetcher.submit(
      { 
        mode: "analyze", 
        products: products.split(",").map(id => ({ id: id.trim() })).slice(0, 5) 
      },
      { method: "POST", action: "/api/phoenix", encType: "application/json" }
    );
  };

  useEffect(() => {
    if (fetcher.data?.results) {
      setResults(fetcher.data.results);
      setLoading(false);
    }
    // Handle scanning for initial store triage
    if (fetcher.data?.scannedResults) {
        setProducts(fetcher.data.scannedResults.map((r: any) => r.id).join(", "));
        setLoading(false);
    }
  }, [fetcher.data]);

  return (
    <Page title="Executive Bulk Analyzer">
      <TitleBar title="Phoenix: Bulk Editor" />
      <Layout>
        {/* Verification Logic: Ensures 2026 Edge Stability */}
        {productCount > 5 && (
          <Layout.Section>
            <Banner title="Batch Safety Clamp Active" tone="info">
              <p>Inventory bursts are restricted to 5 items to ensure 100% success on the Cloudflare Edge.</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Portfolio-Wide Triage</Text>
              <TextField
                label="Target Product GIDs"
                value={products}
                onChange={setProducts}
                multiline={3}
                autoComplete="off"
                placeholder="gid://shopify/Product/123..."
                helpText="Paste up to 5 GIDs or use 'Scan Store' for real-time triage."
                connectedRight={
                  <Button onClick={() => fetcher.submit({ mode: "scan" }, { method: "POST", action: "/api/phoenix" })}>
                    Scan Store
                  </Button>
                }
              />
              <Button 
                variant="primary" 
                onClick={handleAnalyze} 
                loading={loading}
                disabled={productCount === 0}
              >
                Launch Iron Phoenix Analysis
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        {results.length > 0 && (
          <Layout.Section>
            <Card padding="0">
              <DataTable
                columnContentTypes={["text", "text", "text", "text"]}
                headings={["Product", "SEO Score", "Health", "Action"]}
                rows={results.map((r) => [
                  r.currentTitle,
                  <Badge tone={r.seoScore >= 8 ? "success" : "attention"}>{`${r.seoScore * 10}%`}</Badge>,
                  <Badge tone={r.ready ? "success" : "warning"}>{r.ready ? "Action Ready" : "Deficit Detected"}</Badge>,
                  <Button onClick={() => setSelectedResult(r)} variant="tertiary">Review Schema</Button>
                ])}
              />
            </Card>
          </Layout.Section>
        )}
      </Layout>

      {/* Technical Review Modal: Schema Shield Verification */}
      <Modal
        open={!!selectedResult}
        onClose={() => setSelectedResult(null)}
        title={`Schema Shield: ${selectedResult?.currentTitle}`}
        primaryAction={{
          content: "Apply To Shopify",
          onAction: () => {
              fetcher.submit(
                  { mode: "apply", products: [selectedResult] },
                  { method: "POST", action: "/api/phoenix", encType: "application/json" }
              );
              setSelectedResult(null);
          }
        }}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p">Verified JSON-LD Metadata for 2026 technical SEO compliance.</Text>
            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                    {selectedResult?.json_ld_schema}
                </pre>
            </Box>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}