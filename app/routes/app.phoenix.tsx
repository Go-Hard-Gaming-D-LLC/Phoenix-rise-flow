/**
 * 🛡️ SHADOW'S FORGE: CORE LOGIC GATE
 * WARNING: DO NOT MODIFY THIS FILE WITHOUT EXPLICIT PERMISSION.
 * This file governs the clinical SEO Health Scan and Gemini burst logic.
 */
import { useState, useMemo } from 'react';
import { type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useFetcher, useLoaderData, useNavigation } from '@remix-run/react';
import { 
  Page, Layout, Card, Text, TextField, Button, BlockStack, 
  Banner, Box, Link, SkeletonPage, SkeletonBodyText, 
  SkeletonDisplayText, InlineStack, Badge, DataTable 
} from '@shopify/polaris';
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    // Standard Shopify Handshake for the main store
    const { admin } = await authenticate.admin(request);
    
    // ✅ STAGE 1: Full SEO Metadata Scan
    const response = await admin.graphql(`
      query {
        products(first: 50) {
          nodes {
            id
            title
            descriptionHtml
            handle
            seo { title description }
          }
        }
      }
    `);

    const { data } = await response.json();
    
    // ✅ STAGE 2: Calculate Health Scores (The SEO Deficit Rule)
    const auditedProducts = data.products.nodes.map((p: any) => {
        let score = 100;
        const issues = [];
        
        if (!p.descriptionHtml || p.descriptionHtml.length < 50) {
            score -= 40;
            issues.push("Critical Description Gap");
        }
        if (!p.seo?.description) {
            score -= 30;
            issues.push("Missing Meta Description");
        }
        
        return { ...p, healthScore: score, issues };
    });

    // Sort by worst score first and take the top 15 offenders
    const worstOffenders = auditedProducts
        .sort((a: any, b: any) => a.healthScore - b.healthScore)
        .slice(0, 15);

    return { products: worstOffenders };
};

export default function PhoenixFlow() {
    const { products } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const fetcher = useFetcher<{ content?: string; error?: string }>();
    const [prompt, setPrompt] = useState('Optimize the SEO and descriptions for these high-priority products.');

    const isPageLoading = navigation.state === "loading";
    const isActionLoading = fetcher.state !== "idle";

    // Prepare top 5 for the next AI burst
    const topFiveIds = useMemo(() => 
        products.slice(0, 5).map(p => p.id).join(','), 
    [products]);

    // ✅ BFS REQUIREMENT: Skeleton loading state
    if (isPageLoading) {
        return (
            <SkeletonPage title="Phoenix Flow: Mission Control">
                <Layout>
                    <Layout.Section>
                        <Card>
                            <BlockStack gap="200">
                                <SkeletonDisplayText size="small" />
                                <Box paddingBlockStart="400">
                                    <SkeletonBodyText lines={3} />
                                </Box>
                            </BlockStack>
                        </Card>
                    </Layout.Section>
                </Layout>
            </SkeletonPage>
        );
    }

    return (
        <Page title="Phoenix Flow: Mission Control" subtitle="AI-Powered SEO Optimization">
            <Layout>
                <Layout.Section>
                    <Banner title="Audit Complete" tone="info">
                        <p>Identified the 15 products with the lowest SEO health scores in your inventory.</p>
                    </Banner>
                    {fetcher.data?.error && (
                        <Banner title="AI Handshake Failed" tone="critical">
                            <p>{fetcher.data.error}</p>
                        </Banner>
                    )}
                </Layout.Section>

                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text as="h2" variant="headingMd">Priority Optimization Burst (Next 5)</Text>
                            <TextField
                                label="AI Optimization Directives"
                                value={prompt}
                                onChange={setPrompt}
                                multiline={3}
                                autoComplete="off"
                                disabled={isActionLoading}
                                helpText="These instructions guide Gemini in fixing your top 5 offenders."
                            />
                            <InlineStack align="end">
                                <Button 
                                    onClick={() => fetcher.submit(
                                        { mode: "analyze", prompt, productIds: topFiveIds }, 
                                        { method: 'POST', action: '/api/bulk-analyze', encType: 'application/json' }
                                    )} 
                                    loading={isActionLoading} 
                                    variant="primary"
                                >
                                    Fix Top 5 Worst Products
                                </Button>
                            </InlineStack>
                        </BlockStack>
                    </Card>
                </Layout.Section>

                <Layout.Section>
                    {/* ✅ FIXED: Card no longer uses 'title' prop to avoid Error 2322 */}
                    <Card>
                        <BlockStack gap="400">
                            <Text as="h2" variant="headingMd">SEO Hit List (Worst 15)</Text>
                            <DataTable
                                columnContentTypes={['text', 'numeric', 'text']}
                                headings={['Product', 'Health Score', 'Top Issue']}
                                rows={products.map(p => [
                                    p.title,
                                    /* ✅ FIXED: Badge uses string template to avoid Error 2322 */
                                    <Badge tone={p.healthScore < 50 ? "critical" : "warning"}>
                                        {`${p.healthScore}%`}
                                    </Badge>,
                                    p.issues[0] || "None"
                                ])}
                            />
                        </BlockStack>
                    </Card>
                </Layout.Section>

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