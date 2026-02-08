/**
 * 🛡️ SHADOW'S FORGE: CORE LOGIC GATE
 * WARNING: DO NOT MODIFY THIS FILE WITHOUT EXPLICIT PERMISSION.
 * This file governs the clinical high-precision optimization interface.
 * Authorized Deployment: ironphoenixflow.com
 */
import { useFetcher } from "@remix-run/react";
import { 
  Page, Layout, Card, BlockStack, Text, Badge, Box, 
  InlineStack, Button, Banner, Divider 
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function LogicController() {
    const fetcher = useFetcher<any>();
    const results = fetcher.data?.results || [];
    const isExecuting = fetcher.state !== "idle";

    return (
        <Page>
            <TitleBar title="Phoenix Logic Controller" />
            <Layout>
                {/* 1. SYSTEM READINESS: The Triage Trigger */}
                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">System Readiness: 2026 Compliance Mode</Text>
                            <Text as="p" tone="subdued">
                                The Phoenix Engine is locked to your 5-item safety limit for Edge stability. 
                                This prevents API throttling while ensuring clinical precision.
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

                {/* 2. GRADE CARDS: High-Precision Feedback System */}
                {results.length > 0 && (
                    <Layout.Section>
                        <BlockStack gap="500">
                            {results.map((product: any, i: number) => (
                                <Card key={i} padding="0">
                                    <div className="grade-card" style={{ padding: '20px' }}>
                                        <div className="grade-card-header" style={{ marginBottom: '16px' }}>
                                            <InlineStack align="space-between">
                                                <Text variant="headingMd" as="h2">{product.currentTitle}</Text>
                                                {/* Badge logic for Elite vs Manual status */}
                                                <Badge tone={product.seoScore >= 9 ? "success" : "attention"}>
                                                    {product.seoScore >= 9 ? "Elite Optimization" : "Manual Review Required"}
                                                </Badge>
                                            </InlineStack>
                                        </div>

                                        <Divider />

                                        <div className="grade-card-body" style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
                                            {/* Visual Score Circle */}
                                            <div className="score-display" style={{ textAlign: 'center', minWidth: '100px' }}>
                                                <div className="score-circle" style={{ 
                                                    fontSize: '24px', 
                                                    fontWeight: 'bold', 
                                                    border: '4px solid #008060', 
                                                    borderRadius: '50%', 
                                                    width: '60px', 
                                                    height: '60px', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    margin: '0 auto 8px'
                                                }}>
                                                    {product.seoScore * 10}
                                                </div>
                                                <Text variant="bodySm" tone="subdued" as="p">Verification Score</Text>
                                            </div>

                                            <div className="feedback-grid" style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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

                                        {/* Technical Review: JSON-LD Metadata */}
                                        <Box paddingBlockStart="400">
                                            <div className="optimization-section" style={{ background: '#f4f6f8', padding: '12px', borderRadius: '4px' }}>
                                                <Text variant="headingSm" as="h3">Verified JSON-LD Metadata</Text>
                                                <pre style={{ fontSize: '12px', overflow: 'auto', whiteSpace: 'pre-wrap', marginTop: '8px' }}>
                                                    {product.json_ld_schema}
                                                </pre>
                                            </div>
                                        </Box>
                                    </div>
                                </Card>
                            ))}
                        </BlockStack>
                    </Layout.Section>
                )}
            </Layout>
        </Page>
    );
}