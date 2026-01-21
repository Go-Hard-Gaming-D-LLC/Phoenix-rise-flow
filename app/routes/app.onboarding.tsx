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

                        <div className="input-row" style={{ marginTop: '20px' }}>
                            <label>ETSY STOREFRONT URL</label>
                            <div className="icon-input-wrapper">
                                <span>🔗</span>
                                <input
                                    type="text"
                                    value={etsyUrl}
                                    onChange={(e) => setEtsyUrl(e.target.value)}
                                    placeholder="https://etsy.com/shop/..."
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '30px' }}>
                            <button
                                className="prime-btn"
                                disabled={isLoading}
                                onClick={() => fetcher.submit({ brandName, etsyUrl }, { method: "POST" })}
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
