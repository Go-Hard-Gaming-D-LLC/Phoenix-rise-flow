import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
    Page,
    Layout,
    Card,
    Button,
    BlockStack,
    Text,
    TextField,
    Banner,
    InlineStack,
    Box,
    Divider,
    List
} from "@shopify/polaris";
import { PlusIcon, DeleteIcon, SaveIcon } from "@shopify/polaris-icons";
import shopify from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { session } = await shopify.authenticate.admin(request);
    const shop = session.shop;

    const config = await db.configuration.findUnique({ where: { shop } });

    const parsedConfig = config ? {
        ...config,
        etsyUrls: config.etsyUrls ? JSON.parse(config.etsyUrls) : [""],
        shopifyUrls: config.shopifyUrls ? JSON.parse(config.shopifyUrls) : [""]
    } : null;

    return json({ shop, config: parsedConfig });
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const { session } = await shopify.authenticate.admin(request);
    const formData = await request.formData();

    // Clean parsing of the JSON payload
    const jsonString = formData.get("jsonPayload") as string;
    const payload = jsonString ? JSON.parse(jsonString) : { brandName: "", etsyUrls: [], shopifyUrls: [] };

    await db.configuration.upsert({
        where: { shop: session.shop },
        update: {
            brandName: payload.brandName,
            etsyUrls: JSON.stringify(payload.etsyUrls),
            shopifyUrls: JSON.stringify(payload.shopifyUrls)
        },
        create: {
            shop: session.shop,
            brandName: payload.brandName,
            etsyUrls: JSON.stringify(payload.etsyUrls),
            shopifyUrls: JSON.stringify(payload.shopifyUrls)
        }
    });

    return json({ success: true });
};

export default function Onboarding() {
    const { config } = useLoaderData<typeof loader>();
    const fetcher = useFetcher<any>();

    const [brandName, setBrandName] = useState(config?.brandName || "");
    const [etsyUrls, setEtsyUrls] = useState<string[]>(config?.etsyUrls || [""]);
    const [shopifyUrls, setShopifyUrls] = useState<string[]>(config?.shopifyUrls || [""]);

    const isLoading = fetcher.state === "submitting";
    const isSaved = fetcher.data?.success;

    // --- HANDLERS ---
    const handleUrlChange = (type: 'etsy' | 'shopify', index: number, value: string) => {
        const newUrls = type === 'etsy' ? [...etsyUrls] : [...shopifyUrls];
        newUrls[index] = value;
        if (type === 'etsy') setEtsyUrls(newUrls);
        else setShopifyUrls(newUrls);
    };

    const handleAddUrl = (type: 'etsy' | 'shopify') => {
        if (type === 'etsy') setEtsyUrls([...etsyUrls, ""]);
        else setShopifyUrls([...shopifyUrls, ""]);
    };

    const handleRemoveUrl = (type: 'etsy' | 'shopify', index: number) => {
        if (type === 'etsy') {
            if (etsyUrls.length > 1) setEtsyUrls(etsyUrls.filter((_, i) => i !== index));
        } else {
            if (shopifyUrls.length > 1) setShopifyUrls(shopifyUrls.filter((_, i) => i !== index));
        }
    };

    const handleSave = () => {
        const cleanEtsy = etsyUrls.filter(u => u.trim() !== "");
        const cleanShopify = shopifyUrls.filter(u => u.trim() !== "");

        fetcher.submit(
            { jsonPayload: JSON.stringify({ brandName, etsyUrls: cleanEtsy, shopifyUrls: cleanShopify }) },
            { method: "POST" }
        );
    };

    return (
        <Page
            title="Mission Control"
            subtitle="Configure your brand identity and monitoring targets."
            primaryAction={{
                content: isLoading ? "Saving..." : "Save Configuration",
                onAction: handleSave,
                loading: isLoading,
                icon: SaveIcon,
            }}
        >
            <Layout>
                {/* --- LEFT COLUMN: SETTINGS --- */}
                <Layout.Section>
                    <BlockStack gap="500">
                        {isSaved && (
                            <Banner tone="success" title="Configuration Saved">
                                <p>Your brand vitals are being tracked. <Button variant="plain" url="/app/audit">View Audit Report →</Button></p>
                            </Banner>
                        )}

                        <Card>
                            <BlockStack gap="400">
                                <Text variant="headingMd" as="h2">Brand Identity</Text>
                                <TextField
                                    label="Official Store Name"
                                    value={brandName}
                                    onChange={setBrandName}
                                    placeholder="e.g. Iron Phoenix Apparel"
                                    autoComplete="off"
                                    helpText="This name will be used to scan for unauthorized copycats."
                                />
                            </BlockStack>
                        </Card>

                        <Card>
                            <BlockStack gap="400">
                                <Text variant="headingMd" as="h2">Monitoring Targets</Text>
                                <Text as="p" tone="subdued">Add competitor or unauthorized URLs you want to track.</Text>

                                <Box paddingBlockStart="200"><Divider /></Box>

                                <BlockStack gap="300">
                                    <Text variant="headingSm" as="h3">Etsy Stores to Monitor</Text>
                                    {etsyUrls.map((url, i) => (
                                        <InlineStack key={`etsy-${i}`} gap="300" wrap={false}>
                                            <Box width="100%">
                                                <TextField
                                                    label="Etsy URL"
                                                    labelHidden
                                                    value={url}
                                                    onChange={(val) => handleUrlChange('etsy', i, val)}
                                                    placeholder="https://etsy.com/shop/..."
                                                    autoComplete="off"
                                                />
                                            </Box>
                                            <Button
                                                icon={DeleteIcon}
                                                tone="critical"
                                                variant="plain"
                                                onClick={() => handleRemoveUrl('etsy', i)}
                                                disabled={etsyUrls.length === 1}
                                            />
                                        </InlineStack>
                                    ))}
                                    <Button icon={PlusIcon} variant="plain" onClick={() => handleAddUrl('etsy')}>Add Etsy URL</Button>
                                </BlockStack>

                                <Box paddingBlockStart="200"><Divider /></Box>

                                <BlockStack gap="300">
                                    <Text variant="headingSm" as="h3">Shopify Stores to Monitor</Text>
                                    {shopifyUrls.map((url, i) => (
                                        <InlineStack key={`shopify-${i}`} gap="300" wrap={false}>
                                            <Box width="100%">
                                                <TextField
                                                    label="Shopify URL"
                                                    labelHidden
                                                    value={url}
                                                    onChange={(val) => handleUrlChange('shopify', i, val)}
                                                    placeholder="https://competitor.myshopify.com"
                                                    autoComplete="off"
                                                />
                                            </Box>
                                            <Button
                                                icon={DeleteIcon}
                                                tone="critical"
                                                variant="plain"
                                                onClick={() => handleRemoveUrl('shopify', i)}
                                                disabled={shopifyUrls.length === 1}
                                            />
                                        </InlineStack>
                                    ))}
                                    <Button icon={PlusIcon} variant="plain" onClick={() => handleAddUrl('shopify')}>Add Shopify URL</Button>
                                </BlockStack>
                            </BlockStack>
                        </Card>
                    </BlockStack>
                </Layout.Section>

                {/* --- RIGHT COLUMN: VITALS REPORT --- */}
                <Layout.Section variant="oneThird">
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Phoenix Status</Text>

                            <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                                <BlockStack gap="200">
                                    <Text variant="headingSm" as="h3">Current Plan: Free Tier</Text>
                                    <List type="bullet">
                                        <List.Item>Scan Limit: 5 Products</List.Item>
                                        <List.Item>PDF Audit: <Text as="span" tone="success" fontWeight="bold">Active</Text></List.Item>
                                        <List.Item>Auto-Fix: Manual Only</List.Item>
                                    </List>
                                </BlockStack>
                            </Box>

                            <Button fullWidth variant="primary" tone="critical">Download PDF Audit</Button>
                            <Text as="p" variant="bodySm" tone="subdued" alignment="center">Upgrade to Pro for 100+ Scans</Text>
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}