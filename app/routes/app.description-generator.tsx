import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import {
    Page,
    Layout,
    Card,
    BlockStack,
    TextField,
    Button,
    Text,
    Box,
    Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function DescriptionGenerator() {
    const fetcher = useFetcher<{ description?: string; error?: string }>();
    const [productName, setProductName] = useState("");
    const [features, setFeatures] = useState("");
    const [context, setContext] = useState("");

    const isLoading = fetcher.state === "submitting" || fetcher.state === "loading";
    const result = fetcher.data?.description;
    const error = fetcher.data?.error;

    const handleGenerate = () => {
        if (!productName) return;

        const formData = new FormData();
        formData.append("productName", productName);
        formData.append("features", features);
        formData.append("context", context);

        fetcher.submit(formData, {
            method: "POST",
            action: "/api/generate-description",
        });
    };

    return (
        <Page>
            <TitleBar title="Product Description Generator" />
            <Layout>
                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">
                                Generate AI Product Descriptions
                            </Text>
                            <Text variant="bodyMd" as="p">
                                Enter your product details below and let Phoenix AI write a compelling description for you.
                            </Text>

                            <TextField
                                label="Product Name"
                                value={productName}
                                onChange={setProductName}
                                placeholder="e.g. Luxury Silk Scarf"
                                autoComplete="off"
                            />

                            <TextField
                                label="Features (comma separated)"
                                value={features}
                                onChange={setFeatures}
                                placeholder="e.g. 100% Silk, Hand-painted, 90x90cm"
                                multiline={3}
                                autoComplete="off"
                                helpText="List the key features you want included in the description."
                            />

                            <TextField
                                label="Strategy / Trend Context (Optional)"
                                value={context}
                                onChange={setContext}
                                placeholder="e.g. Target Audience: Gen Z. Trend: 'Demure Fall Fashion'. Goal: Urgency."
                                multiline={2}
                                autoComplete="off"
                                helpText="Guide the AI on *how* to sell this product based on current trends."
                            />

                            <Button
                                variant="primary"
                                onClick={handleGenerate}
                                loading={isLoading}
                                disabled={!productName}
                            >
                                Generate Description
                            </Button>

                            {error && (
                                <Banner tone="critical">
                                    <p>{error}</p>
                                </Banner>
                            )}
                        </BlockStack>
                    </Card>
                </Layout.Section>

                {result && (
                    <Layout.Section>
                        <Card>
                            <BlockStack gap="400">
                                <Text variant="headingMd" as="h2">
                                    Generated Description
                                </Text>
                                <Box
                                    padding="400"
                                    background="bg-surface-secondary"
                                    borderRadius="200"
                                >
                                    <Text as="p">{result}</Text>
                                </Box>
                                <Button
                                    onClick={() => {
                                        navigator.clipboard.writeText(result);
                                        shopify.toast.show("Copied to clipboard");
                                    }}
                                >
                                    Copy to Clipboard
                                </Button>
                            </BlockStack>
                        </Card>
                    </Layout.Section>
                )}
            </Layout>
        </Page>
    );
}
