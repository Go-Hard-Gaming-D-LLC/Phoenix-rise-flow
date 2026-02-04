import { useState } from "react";
import { Page, Layout, Card, Button, BlockStack, Text, TextField, List, Box } from "@shopify/polaris";
import { SaveIcon } from "@shopify/polaris-icons";
import { useFetcher, useLoaderData } from "@remix-run/react";

export default function Onboarding() {
    const { config } = useLoaderData<any>();
    const fetcher = useFetcher<any>();
    const [brandName, setBrandName] = useState(config?.brandName || "");

    return (
        <Page
            title="Mission Control"
            primaryAction={{
                content: "Save Configuration",
                onAction: () => fetcher.submit({ brandName }, { method: "POST" }),
                icon: SaveIcon
            }}
        >
            <Layout>
                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Brand Identity</Text>
                            <TextField label="Official Store Name" value={brandName} onChange={setBrandName} autoComplete="off" />
                        </BlockStack>
                    </Card>
                </Layout.Section>

                <Layout.Section variant="oneThird">
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Phoenix Status</Text>
                            <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                                <List type="bullet">
                                    <List.Item>Scan Limit: 5 Products</List.Item>
                                    <List.Item>PDF Audit: Active</List.Item>
                                </List>
                            </Box>
                            <Button fullWidth variant="primary" tone="critical">Download PDF Audit</Button>
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}