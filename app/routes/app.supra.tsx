import { useFetcher } from "@remix-run/react";
import { Page, Layout, Card, BlockStack, Text, Badge, InlineStack, Button } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function SupraCheck() {
    const fetcher = useFetcher<any>();
    const checks = fetcher.data?.checks || [];
    const infra = fetcher.data?.infraChecks || [];
    const isRunning = fetcher.state !== "idle";

    return (
        <Page>
            <TitleBar title="Supra System Audit" />
            <Layout>
                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Supra Core Verification</Text>
                            <Text as="p">Execute a clinical scan of the bot's internal logic and connectivity.</Text>
                            <Button
                                variant="primary"
                                loading={isRunning}
                                onClick={() => fetcher.submit({}, { method: "POST", action: "/api/system-status" })}
                            >
                                Run Supra Audit
                            </Button>
                        </BlockStack>
                    </Card>
                </Layout.Section>

                {checks.length > 0 && (
                    <Layout.Section>
                        <div className="grade-card">
                            <div className="grade-card-header">
                                <Text variant="headingMd" as="h3">System Vitals</Text>
                            </div>
                            <div className="grade-card-body">
                                {/* Score Circle as System Health */}
                                <div className="score-display">
                                    <div className="score-circle">
                                        {checks.filter((c: any) => c.status === "PASS" || c.status === "ELITE").length * 25}
                                    </div>
                                    <Text variant="bodySm" tone="subdued" as="p">System Integrity</Text>
                                </div>

                                <div className="feedback-grid">
                                    {checks.map((check: any, i: number) => (
                                        <div key={i} className="feedback-item">
                                            <InlineStack align="space-between">
                                                <Text variant="headingSm" as="h5">{check.label}</Text>
                                                <Badge tone={check.status === "PASS" || check.status === "ELITE" ? "success" : "attention"}>
                                                    {check.status}
                                                </Badge>
                                            </InlineStack>
                                            <Text as="p" variant="bodySm" tone="subdued">{check.detail}</Text>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Layout.Section>
                )}

                {/* NEW: Supabase Infrastructure Pulse */}
                {infra.length > 0 && (
                    <Layout.Section>
                        <div className="grade-card" style={{ borderLeft: '4px solid #34d399' }}>
                            <div className="grade-card-header">
                                <Text variant="headingMd" as="h3">Supabase Infrastructure Pulse</Text>
                            </div>
                            <div className="grade-card-body">
                                <div className="score-display">
                                    <div className="score-circle" style={{ boxShadow: '0 0 30px rgba(52, 211, 153, 0.3)' }}>
                                        {/* Dynamic health based on SSL and Network */}
                                        {infra.every((c: any) => c.status === "PASS") ? "100" : "75"}
                                    </div>
                                    <Text variant="bodySm" tone="subdued" as="p">Database Health</Text>
                                </div>

                                <div className="feedback-grid">
                                    {infra.map((check: any, i: number) => (
                                        <div key={i} className="feedback-item">
                                            <InlineStack align="space-between">
                                                <Text variant="headingSm" as="h5">{check.label}</Text>
                                                <Badge tone={check.status === "PASS" ? "success" : "critical"}>
                                                    {check.status}
                                                </Badge>
                                            </InlineStack>
                                            <Text as="p" variant="bodySm" tone="subdued">{check.detail}</Text>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Layout.Section>
                )}
            </Layout>
        </Page>
    );
}
