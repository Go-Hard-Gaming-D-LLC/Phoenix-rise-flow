import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { Page, Box, Banner } from "@shopify/polaris";
// Import shopify as default export
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

    const handleUrlChange = (type: 'etsy' | 'shopify', index: number, value: string) => {
        const newUrls = type === 'etsy' ? [...etsyUrls] : [...shopifyUrls];
        newUrls[index] = value;
        type === 'etsy' ? setEtsyUrls(newUrls) : setShopifyUrls(newUrls);
    };

    const handleAddUrl = (type: 'etsy' | 'shopify') => {
        if (type === 'etsy') {
            setEtsyUrls([...etsyUrls, ""]);
        } else {
            setShopifyUrls([...shopifyUrls, ""]);
        }
    };

    const handleRemoveUrl = (type: 'etsy' | 'shopify', index: number) => {
        if (type === 'etsy' && etsyUrls.length > 1) {
            setEtsyUrls(etsyUrls.filter((_, i) => i !== index));
        } else if (type === 'shopify' && shopifyUrls.length > 1) {
            setShopifyUrls(shopifyUrls.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="mission-control-layout">
            <div className="config-sidebar">
                <div className="sidebar-header"><h3>Phoenix Flow</h3></div>
                <div className="action-card">
                    <h2>Free Tier</h2>
                    <p>Vitals Report: <b>Ready</b></p>
                    <p className="tier-info">• Scan up to 5 products<br/>• PDF Misrepresentation Alert<br/>• Manual policy fixes</p>
                    <button className="download-btn">Download PDF Audit</button>
                    <div className="upgrade-hint">
                        <small>Upgrade to scan 10+ products</small>
                    </div>
                </div>
            </div>

            <div className="mission-board">
                <header className="board-header">
                    <h1>Business Vitals</h1>
                    <p>Set up your store details. We'll scan for policy gaps & misrepresentation risks; you choose the fix.</p>
                </header>

                <div className="action-panel-grid">
                    <div className="brand-identity-setup">
                        <h2>Store Information</h2>
                        <p className="helper-text">Enter your store details so we can scan for policy violations and misrepresentation risks.</p>
                        
                        <label>Store Name</label>
                        <input 
                            type="text" 
                            value={brandName} 
                            onChange={(e) => setBrandName(e.target.value)} 
                            placeholder="e.g., My Handmade Shop" 
                        />
                        
                        <div className="manual-entry-divider"><span>Etsy Store URLs</span></div>
                        {etsyUrls.map((url, i) => (
                            <div key={i} className="url-input-group">
                                <input 
                                    type="text" 
                                    value={url} 
                                    onChange={(e) => handleUrlChange('etsy', i, e.target.value)} 
                                    placeholder="https://www.etsy.com/shop/example"
                                />
                                {etsyUrls.length > 1 && (
                                    <button 
                                        className="remove-btn" 
                                        onClick={() => handleRemoveUrl('etsy', i)}
                                        type="button"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        <button 
                            className="add-url-btn" 
                            onClick={() => handleAddUrl('etsy')}
                            type="button"
                        >
                            + Add Etsy Store
                        </button>

                        <div className="manual-entry-divider"><span>Shopify Store URLs</span></div>
                        {shopifyUrls.map((url, i) => (
                            <div key={i} className="url-input-group">
                                <input 
                                    type="text" 
                                    value={url} 
                                    onChange={(e) => handleUrlChange('shopify', i, e.target.value)} 
                                    placeholder="https://example.myshopify.com"
                                />
                                {shopifyUrls.length > 1 && (
                                    <button 
                                        className="remove-btn" 
                                        onClick={() => handleRemoveUrl('shopify', i)}
                                        type="button"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        <button 
                            className="add-url-btn" 
                            onClick={() => handleAddUrl('shopify')}
                            type="button"
                        >
                            + Add Shopify Store
                        </button>

                        <button 
                            className="prime-btn" 
                            disabled={isLoading || !brandName} 
                            onClick={() => fetcher.submit(
                                { jsonPayload: JSON.stringify({ brandName, etsyUrls: etsyUrls.filter(u => u), shopifyUrls: shopifyUrls.filter(u => u) }) }, 
                                { method: "POST" }
                            )}
                        >
                            {isLoading ? "Saving..." : "Start Scan"}
                        </button>

                        {isSaved && (
                            <Banner tone="success">
                                ✅ Store Configuration Saved. <a href="/app/audit">View your Policy Alert Report →</a>
                            </Banner>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}