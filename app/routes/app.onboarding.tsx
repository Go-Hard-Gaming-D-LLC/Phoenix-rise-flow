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

    const config = await db.configuration.findUnique({
        where: { shop },
    });

    // Parse JSON strings back to arrays if they exist
    const parsedConfig = config ? {
        ...config,
        etsyUrls: config.etsyUrls ? JSON.parse(config.etsyUrls) : [""],
        shopifyUrls: config.shopifyUrls ? JSON.parse(config.shopifyUrls) : [""]
    } : null;

    return json({ shop, config: parsedConfig });
};

// ACTION: Save Business Vitals
export const action = async ({ request }: ActionFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    // Parse JSON payload from frontend
    const formData = await request.formData();
    const jsonString = formData.get("jsonPayload") as string;

    let brandName, etsyUrls, shopifyUrls;

    if (jsonString) {
        const payload = JSON.parse(jsonString);
        brandName = payload.brandName;
        etsyUrls = payload.etsyUrls;
        shopifyUrls = payload.shopifyUrls;
    } else {
        // Fallback or empty
        brandName = "";
        etsyUrls = [];
        shopifyUrls = [];
    }

    // Save to database
    await db.configuration.upsert({
        where: { shop: session.shop },
        update: {
            brandName,
            etsyUrls: JSON.stringify(etsyUrls),
            shopifyUrls: JSON.stringify(shopifyUrls)
        },
        create: {
            shop: session.shop,
            brandName,
            etsyUrls: JSON.stringify(etsyUrls),
            shopifyUrls: JSON.stringify(shopifyUrls)
        }
    });

    return json({ success: true });
};

export default function Onboarding() {
    const { shop, config } = useLoaderData<typeof loader>();
    const fetcher = useFetcher<any>();

    // State for dynamic multi-url management - Initialize from DB if available
    const [brandName, setBrandName] = useState(config?.brandName || "");
    const [etsyUrls, setEtsyUrls] = useState<string[]>(config?.etsyUrls || [""]);
    const [shopifyUrls, setShopifyUrls] = useState<string[]>(config?.shopifyUrls || [""]);

    const isLoading = fetcher.state === "submitting"; // Changed from navigation.state to fetcher.state to align with fetcher.submit
    const isSaved = fetcher.data?.success;

    // Handlers for dynamic fields
    const handleUrlChange = (type: 'etsy' | 'shopify', index: number, value: string) => {
        if (type === 'etsy') {
            const newUrls = [...etsyUrls];
            newUrls[index] = value;
            setEtsyUrls(newUrls);
        } else {
            const newUrls = [...shopifyUrls];
            newUrls[index] = value;
            setShopifyUrls(newUrls);
        }
    };

    const addUrl = (type: 'etsy' | 'shopify') => {
        if (type === 'etsy') setEtsyUrls([...etsyUrls, ""]);
        else setShopifyUrls([...shopifyUrls, ""]);
    };

    const removeUrl = (type: 'etsy' | 'shopify', index: number) => {
        if (type === 'etsy') {
            const newUrls = etsyUrls.filter((_, i) => i !== index);
            setEtsyUrls(newUrls.length ? newUrls : [""]); // Keep at least one
        } else {
            const newUrls = shopifyUrls.filter((_, i) => i !== index);
            setShopifyUrls(newUrls.length ? newUrls : [""]);
        }
    };

    return (
        <div className="mission-control-layout">
            {/* Sidebar (Visual only for now, matching the screenshot layout) */}
            <div className="config-sidebar">
                <div className="sidebar-header">
                    <span style={{ fontSize: "1.5rem" }}>✦</span>
                    <h3>Merchant Co-Pilot</h3>
                </div>
                <div className="sidebar-content">
                    <div className="action-card">
                        <h2>Command Center</h2>
                        <p>System Online</p>
                    </div>
                </div>
            </div>

            {/* Main Board */}
            <div className="mission-board">
                <header className="board-header">
                    <div>
                        <h1>Business Vitals</h1>
                        <p>First, Define Your Brand Identity. This is essential context for the AI.</p>
                    </div>
                </header>

                <div className="action-panel-grid" style={{ marginTop: '20px' }}>
                    <div className="brand-identity-setup">
                        <h2>Identity Configuration</h2>

                        <div className="input-row">
                            <label>OFFICIAL BRAND NAME *</label>
                            <div className="icon-input-wrapper">
                                <span>✦</span>
                                <input
                                    type="text"
                                    value={brandName}
                                    onChange={(e) => setBrandName(e.target.value)}
                                    placeholder="e.g. Iron Phoenix"
                                />
                            </div>
                        </div>

                        {/* Dynamic Etsy URLs */}
                        <div style={{ marginTop: '20px' }}>
                            <div className="manual-entry-divider"><span>Etsy Storefronts</span></div>
                            {etsyUrls.map((url, index) => (
                                <div className="input-row with-remove" key={`etsy-${index}`} style={{ marginBottom: '10px' }}>
                                    <div className="icon-input-wrapper">
                                        <span>🔗</span>
                                        <input
                                            type="text"
                                            value={url}
                                            onChange={(e) => handleUrlChange('etsy', index, e.target.value)}
                                            placeholder="https://etsy.com/shop/..."
                                        />
                                    </div>
                                    {etsyUrls.length > 1 && (
                                        <button className="remove-btn" onClick={() => removeUrl('etsy', index)}>🗑️</button>
                                    )}
                                </div>
                            ))}
                            <button className="add-url-btn" onClick={() => addUrl('etsy')}>+ Add Another Etsy Store</button>
                        </div>

                        {/* Dynamic Shopify URLs */}
                        <div style={{ marginTop: '20px' }}>
                            <div className="manual-entry-divider"><span>Shopify Storefronts</span></div>
                            {shopifyUrls.map((url, index) => (
                                <div className="input-row with-remove" key={`shopify-${index}`} style={{ marginBottom: '10px' }}>
                                    <div className="icon-input-wrapper">
                                        <span>🛍️</span>
                                        <input
                                            type="text"
                                            value={url}
                                            onChange={(e) => handleUrlChange('shopify', index, e.target.value)}
                                            placeholder="https://yourstore.myshopify.com"
                                        />
                                    </div>
                                    {shopifyUrls.length > 1 && (
                                        <button className="remove-btn" onClick={() => removeUrl('shopify', index)}>🗑️</button>
                                    )}
                                </div>
                            ))}
                            <button className="add-url-btn" onClick={() => addUrl('shopify')}>+ Add Another Shopify Store</button>
                        </div>

                        <div style={{ marginTop: '30px' }}>
                            <button
                                className="prime-btn"
                                disabled={isLoading}
                                onClick={() => {
                                    // Submit all data
                                    const payload = {
                                        brandName,
                                        etsyUrls: etsyUrls.filter(u => u.trim() !== ""),
                                        shopifyUrls: shopifyUrls.filter(u => u.trim() !== "")
                                    };
                                    // Convert payload to FormData-compatible or JSON submit
                                    // Since action expects formData usually, but we can send JSON if we adjust action or use hidden inputs.
                                    // Easiest is to just submit JSON string via fetcher
                                    fetcher.submit(
                                        { jsonPayload: JSON.stringify(payload) },
                                        { method: "POST" }
                                    );
                                }}
                            >
                                {isLoading ? "Saving..." : "Save Identity & Initialize Engine"}
                            </button>
                        </div>

                        {isSaved && (
                            <div className="status-toast" style={{ marginTop: '20px', padding: '15px', borderRadius: '8px' }}>
                                ✅ Identity Established. The Product Optimization Engine is ready.
                                <a href="/app/bulk-analyzer" style={{ marginLeft: '10px', color: 'black', fontWeight: 'bold' }}>Go to Engine →</a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
