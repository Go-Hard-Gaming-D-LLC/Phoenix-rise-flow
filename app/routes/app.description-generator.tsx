/**
 * 🛡️ SHADOW'S FORGE: CORE LOGIC GATE
 * WARNING: DO NOT MODIFY WITHOUT EXPLICIT PERMISSION.
 * ROLE: Creative Batch Description UI (Execution Only).
 * ENFORCED LIMIT: 5 Products per Burst.
 */
import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import { 
  Page, Layout, Card, BlockStack, TextField, 
  Button, Text, Box, InlineStack, Badge, Divider 
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function DescriptionGenerator() {
    const fetcher = useFetcher<any>();
    const [context, setContext] = useState("");
    const [products, setProducts] = useState([
        { id: "1", title: "", features: "" },
        { id: "2", title: "", features: "" },
        { id: "3", title: "", features: "" },
        { id: "4", title: "", features: "" },
        { id: "5", title: "", features: "" },
    ]);

    const handleUpdate = (index: number, field: string, value: string) => {
        const newProducts = [...products];
        (newProducts[index] as any)[field] = value;
        setProducts(newProducts);
    };

    const handleGenerate = () => {
        const activeProducts = products.filter(p => p.title.trim() !== "");
        if (activeProducts.length === 0) return;

        fetcher.submit(
            { products: activeProducts, userContext: context }, 
            { method: "POST", action: "/api/generate-description", encType: "application/json" }
        );
    };

    const isExecuting = fetcher.state !== "idle";
    const results = fetcher.data?.results || [];

    return (
        <Page title="Creative Batch Generator">
            <TitleBar title="Phoenix Creative Mode" />
            <Layout>
                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Global Brand Strategy</Text>
                            <TextField
                                label="Campaign Strategy / Target Audience"
                                placeholder="e.g. Focus on luxury appeal for Gen Z collectors."
                                value={context}
                                onChange={setContext}
                                multiline={2}
                                autoComplete="off"
                            />
                        </BlockStack>
                    </Card>
                </Layout.Section>

                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <InlineStack align="space-between">
                                <Text variant="headingMd" as="h2">Batch Input (Limit: 5)</Text>
                                <Badge tone="info">2026 Edge Safety Locked</Badge>
                            </InlineStack>
                            
                            {products.map((product, index) => (
                                <BlockStack gap="200" key={product.id}>
                                    {/* ✅ CLINICAL FIX: Changed align from "stretch" to "start" to clear Error 2322 */}
                                    <InlineStack gap="400" align="start">
                                        <div style={{ flex: 1 }}>
                                            <TextField
                                                label={`Product ${index + 1} Title`}
                                                value={product.title}
                                                onChange={(val) => handleUpdate(index, "title", val)}
                                                autoComplete="off"
                                                placeholder="Enter title..."
                                            />
                                        </div>
                                        <div style={{ flex: 2 }}>
                                            <TextField
                                                label="Key Features"
                                                value={product.features}
                                                onChange={(val) => handleUpdate(index, "features", val)}
                                                autoComplete="off"
                                                placeholder="Bullet points or traits..."
                                            />
                                        </div>
                                    </InlineStack>
                                    {index < 4 && <Divider />}
                                </BlockStack>
                            ))}

                            <Box paddingBlockStart="400">
                                <Button 
                                    variant="primary" 
                                    onClick={handleGenerate} 
                                    loading={isExecuting}
                                    fullWidth
                                    size="large"
                                >
                                    Launch Creative Burst
                                </Button>
                            </Box>
                        </BlockStack>
                    </Card>
                </Layout.Section>

                {results.length > 0 && (
                    <Layout.Section>
                        <BlockStack gap="400">
                            {results.map((res: any) => (
                                <Card key={res.productId}>
                                    <BlockStack gap="200">
                                        <Text variant="headingSm" as="h3">{res.title}</Text>
                                        <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                                            <Text as="p">{res.content}</Text>
                                        </Box>
                                    </BlockStack>
                                </Card>
                            ))}
                        </BlockStack>
                    </Layout.Section>
                )}
            </Layout>
        </Page>
    );
}