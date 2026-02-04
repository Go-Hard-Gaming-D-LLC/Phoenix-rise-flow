import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import { Page, Layout, Card, BlockStack, TextField, Button, Text, Box } from "@shopify/polaris";

export default function DescriptionGenerator() {
    const fetcher = useFetcher<any>();
    const [productName, setProductName] = useState("");
    const [context, setContext] = useState("");

    const handleGenerate = () => {
        fetcher.submit({ productName, context }, { method: "POST", action: "/api/generate-description" });
    };

    return (
        <Page title="AI Description Generator">
            <Layout>
                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <TextField label="Product Name" value={productName} onChange={setProductName} autoComplete="off" />
                            <TextField
                                label="Strategy / Trend Context"
                                placeholder="e.g. Target Audience: Gen Z"
                                value={context}
                                onChange={setContext}
                                multiline={2}
                                autoComplete="off"
                            />
                            <Button variant="primary" onClick={handleGenerate} loading={fetcher.state !== "idle"}>
                                Generate Description
                            </Button>
                        </BlockStack>
                    </Card>
                </Layout.Section>

                {fetcher.data?.description && (
                    <Layout.Section>
                        <Card>
                            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                                <Text as="p">{fetcher.data.description}</Text>
                            </Box>
                        </Card>
                    </Layout.Section>
                )}
            </Layout>
        </Page>
    );
}
