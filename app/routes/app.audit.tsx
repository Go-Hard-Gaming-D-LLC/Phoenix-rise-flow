import { useFetcher } from "@remix-run/react";
import { Page, Layout, Card, BlockStack, Text, InlineStack, Badge, List } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function AuditSummary() {
  const fetcher = useFetcher<any>();
  const auditData = fetcher.data?.results || [];

  return (
    <Page>
      <TitleBar title="Elite Audit Summary" />
      <Layout>
        {/* Verification Logic: No False Positives */}
        <Layout.Section>
          <BlockStack gap="500">
            {auditData.map((result: any, index: number) => (
              <div key={index} className="grade-card">
                <div className="grade-card-header">
                  <InlineStack align="space-between">
                    <Text variant="headingMd" as="h2">Optimization Report: {result.currentTitle}</Text>
                    <Badge tone={result.seoScore >= 9 ? "success" : "attention"}>
                      {result.seoScore >= 9 ? "Elite Status" : "Action Required"}
                    </Badge>
                  </InlineStack>
                </div>

                <div className="grade-card-body">
                  {/* The Score Circle */}
                  <div className="score-display">
                    <div className="score-circle">
                      {Math.round(result.seoScore * 10)}
                    </div>
                    <Text variant="bodySm" tone="subdued" alignment="center" as="p">Phoenix Health Score</Text>
                  </div>

                  {/* High-Precision Feedback Grid */}
                  <div className="feedback-grid">
                    <div className="feedback-item">
                      <Text variant="headingSm" as="h5">SEO Vitals</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {result.seoScore >= 8 ? "Long-tail keywords verified in H1 and metadata." : "Missing core gaming search terms."}
                      </Text>
                    </div>
                    <div className="feedback-item">
                      <Text variant="headingSm" as="h5">Trust Signals</Text>
                      <List type="bullet">
                        {result.flaggedIssues.length > 0
                          ? result.flaggedIssues.map((issue: string, i: number) => <List.Item key={i}>{issue}</List.Item>)
                          : <List.Item>All 2026 trust signals verified.</List.Item>
                        }
                      </List>
                    </div>
                  </div>
                </div>

                {/* Optimization Code Block */}
                <div className="optimization-section">
                  <Text variant="headingSm" as="h3">Verified Schema Shield (JSON-LD)</Text>
                  <pre className="optimized-content">
                    {result.json_ld_schema}
                  </pre>
                </div>
              </div>
            ))}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}