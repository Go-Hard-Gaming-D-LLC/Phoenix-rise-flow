import { useState, useEffect } from 'react';
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher } from '@remix-run/react';
import { Page, Layout, Card, Text, TextField, Button, BlockStack, Banner, Box } from '@shopify/polaris';
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    await authenticate.admin(request);
    return null;
};

export default function PhoenixFlow() {
    const [prompt, setPrompt] = useState('');
    const fetcher = useFetcher<{ content?: string; error?: string }>();

    const isLoading = fetcher.state === 'submitting' || fetcher.state === 'loading';

    const handleGenerate = () => {
        // Use fetcher for cleaner SPA-like interaction
        fetcher.submit(
            { prompt },
            { method: 'POST', action: '/api/phoenix', encType: 'application/json' }
        );
    };

    return (
        <Page title="Phoenix Flow AI">
            <Layout>
                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text as="h2" variant="headingMd">Generate Content</Text>
                            <TextField
                                label="Prompt"
                                value={prompt}
                                onChange={setPrompt}
                                multiline={4}
                                autoComplete="off"
                                disabled={isLoading}
                            />

                            <Button onClick={handleGenerate} loading={isLoading} variant="primary">
                                Generate with Gemini
                            </Button>

                            {fetcher.data?.error && (
                                <Banner tone="critical">
                                    <p>{fetcher.data.error}</p>
                                </Banner>
                            )}

                            {fetcher.data?.content && (
                                <BlockStack gap="200">
                                    <Text as="h3" variant="headingSm">Result:</Text>
                                    <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                                        <Text as="p">{fetcher.data.content}</Text>
                                    </Box>
                                </BlockStack>
                            )}
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
