import { useState } from 'react';
import { type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useFetcher, useLoaderData } from '@remix-run/react';
import { Page, Layout, Card, Text, TextField, Button, BlockStack, Banner, Box, List, Link } from '@shopify/polaris';
import shopify from "../shopify.server";

function BatchLimitBanner() {
    return (
        <Banner
            title="Optimization Batch Limit Active"
            tone="info"
            onDismiss={() => { }}
        >
            <p>
                To ensure peak stability and high-quality AI results on the edge,
                batch optimization is currently limited to **5 products** per request.
                Larger selections will be processed in sequential bursts.
                <Link url="/app/settings"> Learn more about system limits.</Link>
            </p>
        </Banner>
    );
}

// THE LOADER: This is the "Eyes" of the app
export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { admin } = await shopify.authenticate.admin(request);

    // Automatically fetches your gaming inventory
    const response = await admin.graphql(`
      query {
        products(first: 10) {
          nodes {
            id
            title
            handle
          }
        }
      }
    `);

    const { data } = await response.json();
    return { products: data.products.nodes };
};

export default function PhoenixFlow() {
    const { products } = useLoaderData<typeof loader>();
    const [prompt, setPrompt] = useState('Analyze these products for gaming trends and SEO optimization.');
    const fetcher = useFetcher<{ content?: string; error?: string }>();

    const isLoading = fetcher.state === 'submitting' || fetcher.state === 'loading';

    const handleBulkAnalyze = () => {
        // Sends all products to the Gemini AI Brain at once
        fetcher.submit(
            {
                prompt,
                productIds: products.map((p: { id: string }) => p.id).join(',')
            },
            { method: 'POST', action: '/api/bulk-analyze', encType: 'application/json' }
        );
    };

    return (
        <Page title="Phoenix Flow: Mission Control">
            {products.length > 5 && <BatchLimitBanner />}
            <Layout>
                {/* AUTOMATION SECTION */}
                <Layout.Section>
                    <Banner tone="info">
                        <Text as="p">The Go-Getter is active. {products.length} products found in your store.</Text>
                    </Banner>
                </Layout.Section>

                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text as="h2" variant="headingMd">Bulk Portfolio Analyzer</Text>
                            <TextField
                                label="AI Instructions"
                                value={prompt}
                                onChange={setPrompt}
                                multiline={3}
                                autoComplete="off"
                                disabled={isLoading}
                            />
                            <Button onClick={handleBulkAnalyze} loading={isLoading} variant="primary" size="large">
                                Run $50k Store Scan
                            </Button>
                        </BlockStack>
                    </Card>
                </Layout.Section>

                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text as="h2" variant="headingMd">Executive Content Burst</Text>
                            <Banner tone="warning">
                                <Text as="p">
                                    ⚠️ <strong>Processing Limit:</strong> Batches of 5 are enforced for Edge stability.
                                </Text>
                            </Banner>
                            <Button
                                variant="primary"
                                tone="critical"
                                onClick={() => fetcher.submit({}, { method: "POST", action: "/api/executive-burst" })}
                                loading={fetcher.state === "submitting" && fetcher.formAction === "/api/executive-burst"}
                            >
                                Ignite Executive Burst
                            </Button>
                        </BlockStack>
                    </Card>
                </Layout.Section>

                {/* PRODUCT LIST SECTION: No more manual copy-pasting! */}
                <Layout.Section variant="oneThird">
                    <Card>
                        <BlockStack gap="200">
                            <Text as="h2" variant="headingMd">Detected Inventory</Text>
                            <List type="bullet">
                                {products.map((product: { id: string; title: string }) => (
                                    <List.Item key={product.id}>{product.title}</List.Item>
                                ))}
                            </List>
                        </BlockStack>
                    </Card>
                </Layout.Section>

                {/* RESULTS SECTION */}
                {fetcher.data?.content && (
                    <Layout.Section>
                        <Card>
                            <BlockStack gap="200">
                                <Text as="h3" variant="headingSm">Gemini Market Insights:</Text>
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