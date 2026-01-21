import { useEffect, useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import {
    Page,
    Layout,
    Card,
    BlockStack,
    Text,
    Button,
    Banner,
    List,
    Box,
    ProgressBar
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    await authenticate.admin(request);
    return null;
};

// Define structure for Audit Results
interface AuditResult {
    brandVoice: string;
    complianceRisk: "Low" | "Medium" | "High";
    flaggedPolicies: string[];
    topProducts: string[];
    recommendations: string[];
}

export default function AuditPage() {
    const fetcher = useFetcher<AuditResult>();
    const [loading, setLoading] = useState(false);
    const [complete, setComplete] = useState(false);

    const startAudit = () => {
        setLoading(true);
        fetcher.submit({ action: "audit_brand" }, { method: "POST", action: "/api/phoenix" });
    };

    useEffect(() => {
        if (fetcher.data) {
            setLoading(false);
            setComplete(true);
        }
    }, [fetcher.data]);

    return (
        <Page>
            <TitleBar title="Phoenix Flow: Brand Audit" />
            <Layout>
                <Layout.Section>
                    <Card>
                        <BlockStack gap="500">
                            <Text as="h2" variant="headingLg">Initial Brand & Compliance Audit</Text>
                            <Text as="p">
                                Before taking action, Phoenix must analyze your store's brand voice and compliance policies to ensure
                                all future actions (like alt-text injection) are aligned and safe.
                            </Text>

                            {!loading && !complete && (
                                <Button variant="primary" size="large" onClick={startAudit}>
                                    Start Brand Audit
                                </Button>
                            )}

                            {loading && (
                                <Box padding="400">
                                    <ProgressBar progress={80} tone="highlight" />
                                    <Text as="p" alignment="center">Analyzing Store Policies & Top Products...</Text>
                                </Box>
                            )}

                            {complete && fetcher.data && (
                                <BlockStack gap="400">
                                    <Banner tone={fetcher.data.complianceRisk === "High" ? "critical" : "success"}>
                                        <Text as="h3" variant="headingMd">Compliance Risk: {fetcher.data.complianceRisk}</Text>
                                    </Banner>

                                    <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                                        <Text as="h3" variant="headingSm">Detected Brand Voice</Text>
                                        <Text as="p">{fetcher.data.brandVoice}</Text>
                                    </Box>

                                    {fetcher.data.flaggedPolicies.length > 0 && (
                                        <Box>
                                            <Text as="h3" variant="headingSm">⚠️ Policy Misrepresentations Detected</Text>
                                            <List>
                                                {fetcher.data.flaggedPolicies.map((policy, i) => (
                                                    <List.Item key={i}>{policy}</List.Item>
                                                ))}
                                            </List>
                                        </Box>
                                    )}

                                    <Button url="/app/bulk-analyzer" variant="primary">
                                        Proceed to Visual Exoskeleton (Bulk Analyzer)
                                    </Button>
                                </BlockStack>
                            )}
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
