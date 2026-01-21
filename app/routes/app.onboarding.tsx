import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
    Page,
    Layout,
    Card,
    Text,
    TextField,
    Button,
    BlockStack,
    Box,
    Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";

// LOADER: Check if Business Vitals exist
export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;

    // Try to find existing branding
    // Storing in a simple Key-Value way or just checking if we have a record
    // For now, returning null to force input if we haven't stored it
    // In a full implementation, we'd query the DB
    return json({ shop });
};

// ACTION: Save Business Vitals
export const action = async ({ request }: ActionFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();

    const brandName = formData.get("brandName");
    const etsyUrl = formData.get("etsyUrl");

    // Here we would save to Prisma DB
    // For now, we simulate success
    return json({ success: true, brandName });
};

export default function Onboarding() {
    const { shop } = useLoaderData<typeof loader>();
    const fetcher = useFetcher<any>();

    const [brandName, setBrandName] = useState("");
    const [etsyUrl, setEtsyUrl] = useState("");

    const isLoading = fetcher.state === "submitting";
    const isSaved = fetcher.data?.success;

    return (
        <div style={{ background: "#0D0D0D", minHeight: "100vh", color: "white", padding: "20px" }}>
            <Box padding="400">
                <BlockStack gap="800">

                    {/* HEADER SECTION mimicking the screenshot */}
                    <Box>
                        <Text as="h1" variant="headingxl" fontWeight="bold">
                            <span style={{ color: "#A68AFE" }}>✦</span> Business Vitals
                        </Text>
                        <Text as="p" tone="subdued">
                            First, Define Your Brand Identity. This is essential context for the AI.
                        </Text>
                    </Box>

                    <Card>
                        <div style={{ padding: "20px" }}>
                            <BlockStack gap="500">
                                {/* Form mimicking the dark mode input style (using Polaris for function, custom style later) */}

                                <TextField
                                    label="OFFICIAL BRAND NAME *"
                                    value={brandName}
                                    onChange={setBrandName}
                                    placeholder="e.g. Iron Phoenix"
                                    autoComplete="off"
                                />

                                <TextField
                                    label="ETSY STOREFRONT URL"
                                    value={etsyUrl}
                                    onChange={setEtsyUrl}
                                    placeholder="https://etsy.com/shop/..."
                                    autoComplete="off"
                                />

                                <Button
                                    variant="primary"
                                    size="large"
                                    loading={isLoading}
                                    onClick={() => fetcher.submit({ brandName, etsyUrl }, { method: "POST" })}
                                >
                                    Save Identity & Initialize Engine
                                </Button>
                            </BlockStack>
                        </div>
                    </Card>

                    {isSaved && (
                        <Banner tone="success">
                            <Text as="p">Identity Established. The Product Optimization Engine is ready.</Text>
                            <Button url="/app/bulk-analyzer" variant="plain">Go to Engine</Button>
                        </Banner>
                    )}

                </BlockStack>
            </Box>
        </div>
    );
}
