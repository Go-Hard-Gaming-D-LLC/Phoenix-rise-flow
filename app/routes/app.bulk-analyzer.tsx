import { useEffect, useState } from "react";
import { type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useFetcher } from "@remix-run/react";
import {
  Page, Layout, Card, Button, BlockStack, Text, InlineStack, Badge, Box, ProgressBar,
  DataTable, Modal, TextField, Banner, Scrollable
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

  const productCount = products.split(",").filter(id => id.trim()).length;

  const handleAnalyze = () => {
    setLoading(true);
    fetcher.submit(
      { productIds: products, mode: "analyze" },
      { method: "POST", action: "/api/phoenix", encType: "application/json" }
    );
  };

  useEffect(() => {
    if (fetcher.data?.results) {
      setResults(fetcher.data.results);
      setLoading(false);
    }
  }, [fetcher.data]);

  return (
    <Page>
      <TitleBar title="Iron Phoenix: Bulk Editor" />
      <Layout>
        {productCount > 5 && (
          <Layout.Section>
            <Banner title="Batch Limit Active" tone="info">
              <p>Large inventories are processed in sequential 5-item bursts for Edge stability.</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Analyze & Repair Products</Text>
              <TextField
                label="Product IDs"
                value={products}
                onChange={setProducts}
                multiline={3}
                autoComplete="off"
                placeholder="gid://shopify/Product/123..."
                connectedRight={
                  <Button onClick={() => fetcher.submit({ mode: "scan" }, { method: "POST", action: "/api/phoenix" })}>
                    Scan Store
                  </Button>
                }
              />
              <Button variant="primary" onClick={handleAnalyze} loading={loading}>
                Run Iron Phoenix Analysis
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        {results.length > 0 && (
          <Layout.Section>
            <Card>
              <DataTable
                columnContentTypes={["text", "text", "text", "text"]}
                headings={["Product", "SEO Score", "Status", "Action"]}
                rows={results.map((r) => [
                  r.currentTitle,
                  `${r.seoScore}/10`,
                  <Badge tone={r.ready ? "success" : "warning"}>{r.ready ? "Optimized" : "Review"}</Badge>,
                  <Button onClick={() => setSelectedResult(r)}>View Code</Button>
                ])}
              />
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
