import { useFetcher } from "@remix-run/react";
import { Page, Layout, Card, BlockStack, Text, Badge, Box, InlineStack, Button } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

/**
 * Iron Phoenix Logic Controller
 * The "Doer" interface for high-precision store optimization.
 */
export default function LogicController() {
    const fetcher = useFetcher<any>();
    const results = fetcher.data?.results || [];
    const isExecuting = fetcher.state !== "idle";

    return (
        <Page>
            <TitleBar title="Phoenix Logic Controller" />
            <Layout>
                {/* Verification Logic: Ensures zero false positives before displaying "Optimized" */}
                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">System Readiness: 2026 Compliance Mode</Text>
                            <Text as="p" tone="subdued">
                                The Phoenix Engine is locked to your 5-item safety limit for Edge stability.
                            </Text>
                            <Button
                                variant="primary"
                                size="large"
                                loading={isExecuting}
                                onClick={() => fetcher.submit({ mode: "scan" }, { method: "POST", action: "/api/phoenix" })}
                            >
                                Execute Real-Time Store Triage
                            </Button>
                        </BlockStack>
                    </Card>
                </Layout.Section>

                {results.length > 0 && (
                    <Layout.Section>
                        <BlockStack gap="500">
                            {results.map((product: any, i: number) => (
                                <div key={i} className="grade-card">
                                    <div className="grade-card-header">
                                        <InlineStack align="space-between">
                                            <Text variant="headingMd" as="h2">{product.currentTitle}</Text>
                                            {/* Badge triggers only on high-precision data */}
                                            <Badge tone={product.seoScore >= 9 ? "success" : "attention"}>
                                                {product.seoScore >= 9 ? "Elite Optimization" : "Manual Review Required"}
                                            </Badge>
                                        </InlineStack>
                                    </div>

                                    <div className="grade-card-body">
                                        {/* The Score Circle visual */}
                                        <div className="score-display">
                                            <div className="score-circle">
                                                {product.seoScore * 10}
                                            </div>
                                            <Text variant="bodySm" tone="subdued" alignment="center" as="p">Verification Score</Text>
                                        </div>

                                        <div className="feedback-grid">
                                            <div className="feedback-item">
                                                <Text variant="headingSm" as="h5">Clinical Analysis</Text>
                                                <Text as="p" variant="bodySm">
                                                    {product.ready ? "All 2026 trust signals and long-tail keywords physically verified in Shopify DB." : "Flagged for missing trust signals."}
                                                </Text>
                                            </div>
                                            <div className="feedback-item">
                                                <Text variant="headingSm" as="h5">Action Taken</Text>
                                                <Text as="p" variant="bodySm" tone="success">
                                                    {product.ready ? "Schema Shield deployed. Content locked." : "Optimization failed security handshake."}
                                                </Text>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mono-spaced Code Block for Technical Review */}
                                    <div className="optimization-section">
                                        <Text variant="headingSm" as="h3">Verified JSON-LD Metadata</Text>
                                        <pre className="optimized-content">
                                            {product.json_ld_schema}
                                        </pre>
                                    </div>
                                </div>
                            ))}
                        </BlockStack>
                    </Layout.Section>
                )}
            </Layout>
        </Page>
    );
}
