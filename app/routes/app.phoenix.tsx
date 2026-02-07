import { useState } from 'react';
import { type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useFetcher, useLoaderData, useNavigation } from '@remix-run/react';
import { 
  Page, Layout, Card, Text, TextField, Button, BlockStack, 
  Banner, Box, Link, SkeletonPage, SkeletonBodyText, 
  SkeletonDisplayText, InlineStack 
} from '@shopify/polaris';
import shopify from "../shopify.server";

// 1. LOADER: Direct 5432 migration path established
export const loader = async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const skipAuth = url.searchParams.get("skip_auth") === "true";

    // Development bypass for standalone testing
    if (process.env.NODE_ENV === "development" && skipAuth) {
        return {
            products: [
                { id: "1", title: "Test Gaming Mouse", handle: "test-mouse" },
                { id: "2", title: "Test Mechanical Keyboard", handle: "test-kb" }
            ],
            isTestMode: true
        };
    }

    const { admin } = await shopify.authenticate.admin(request);
    const response = await admin.graphql(`
      query {
        products(first: 10) {
          nodes { id title handle }
        }
      }
    `);
    const { data } = await response.json();
    return { products: data.products.nodes, isTestMode: false };
};

export default function PhoenixFlow() {
    const { products, isTestMode } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const fetcher = useFetcher<{ content?: string; error?: string }>();
    const [prompt, setPrompt] = useState('Analyze these products for gaming trends and SEO optimization.');

    const isPageLoading = navigation.state === "loading";
    const isActionLoading = fetcher.state !== "idle";

    // ✅ BFS REQUIREMENT: Skeleton loading state to prevent flicker
    if (isPageLoading) {
        return (
            <SkeletonPage title="Phoenix Flow: Mission Control">
                <Layout>
                    <Layout.Section>
                        <Card>
                            <SkeletonDisplayText size="small" />
                            <Box paddingBlockStart="400">
                                <SkeletonBodyText lines={3} />
                            </Box>
                        </Card>
                    </Layout.Section>
                </Layout>
            </SkeletonPage>
        );
    }

    return (
        <Page 
            title="Phoenix Flow: Mission Control"
            subtitle="AI-Powered Optimization on the Edge"
        >
            <Layout>
                {/* 2. ERROR & STATUS HANDLING */}
                <Layout.Section>
                    {isTestMode && (
                        <Banner title="Test Mode Active" tone="info">
                            <p>Shopify auth bypassed for local testing via ?skip_auth=true.</p>
                        </Banner>
                    )}
                    {products.length > 5 && (
                        <Banner title="Optimization Batch Limit Active" tone="info">
                            <p>Batch optimization is limited to 5 products for stability. <Link url="/app/settings">System Limits</Link></p>
                        </Banner>
                    )}
                    {fetcher.data?.error && (
                        <Banner title="AI Handshake Failed" tone="critical">
                            <p>{fetcher.data.error}</p>
                        </Banner>
                    )}
                </Layout.Section>

                {/* 3. PRIMARY ACTION: Bulk Portfolio Analyzer */}
                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text as="h2" variant="headingMd">Executive Market Analyzer</Text>
                            <TextField
                                label="AI Instructions"
                                value={prompt}
                                onChange={setPrompt}
                                multiline={3}
                                autoComplete="off"
                                disabled={isActionLoading}
                                helpText="Describe the gaming trends you want the Phoenix to prioritize."
                            />
                            <InlineStack align="end">
                                <Button 
                                    onClick={() => fetcher.submit({ prompt, productIds: products.map(p => p.id).join(',') }, { method: 'POST', action: '/api/bulk-analyze', encType: 'application/json' })} 
                                    loading={isActionLoading} 
                                    variant="primary"
                                >
                                    Run Global Scan
                                </Button>
                            </InlineStack>
                        </BlockStack>
                    </Card>
                </Layout.Section>

                {/* 4. RESULTS: Stable UI placement */}
                {fetcher.data?.content && (
                    <Layout.Section>
                        <Card>
                            <BlockStack gap="200">
                                <Text as="h3" variant="headingSm">Gemini Market Insights</Text>
                                <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                                    <Text as="p">{fetcher.data.content}</Text>
                                </Box>
                            </BlockStack>
                        </Card>
                    </Layout.Section>
                )}
            </Layout>
        </Page>
    );
}
