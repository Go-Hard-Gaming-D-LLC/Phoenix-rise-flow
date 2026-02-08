/**
 * 🛡️ SHADOW'S FORGE: NEBULA MISSION CONTROL
 * WARNING: DO NOT MODIFY WITHOUT EXPLICIT PERMISSION.
 * ROLE: Brand Identity & Compliance Mission Control UI.
 */
import { useState, useEffect } from "react";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { Badge, Text, Box, Icon } from "@shopify/polaris";
import { CheckCircleIcon, AlertBubbleIcon } from "@shopify/polaris-icons";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Onboarding() {
    const { config } = useLoaderData<any>();
    const fetcher = useFetcher<any>();
    const pdfFetcher = useFetcher<any>();
    const auditFetcher = useFetcher<any>();
    
    const [brandName, setBrandName] = useState(config?.brandName || "");
    const [shopifyUrl, setShopifyUrl] = useState(config?.shop || "mystore.com");

    // ✅ CLINICAL SYNC: Trigger foundation audit on mount
    useEffect(() => {
        auditFetcher.submit({}, { method: "POST", action: "/api/compliance-audit" });
    }, []);

    const auditData = auditFetcher.data || {};

    const generateProfessionalPDF = (data: any) => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text("PHOENIX FLOW: Compliance Audit", 14, 20);
        autoTable(doc, {
            startY: 40,
            head: [['Required Policy', 'Clinical Status']],
            body: [
                ['Privacy Policy', data.compliance?.privacy ? 'PASSED' : 'MISSING'],
                ['Refund Policy', data.compliance?.refund ? 'PASSED' : 'MISSING'],
                ['Terms of Service', data.compliance?.tos ? 'PASSED' : 'MISSING'],
            ],
            headStyles: { fillColor: [195, 151, 255] } // Electric Lavender
        });
        doc.save(`Phoenix-Audit-${brandName || "Store"}.pdf`);
    };

    useEffect(() => {
        if (pdfFetcher.data) {
            generateProfessionalPDF(pdfFetcher.data);
        }
    }, [pdfFetcher.data]);

    return (
        <div className="mission-control-layout">
            {/* 🛡️ SIDEBAR: Store Vitals */}
            <aside className="config-sidebar">
                <div className="vitals-header">
                    <span style={{ color: 'var(--primary)' }}>★</span>
                    <h3>Store Vitals</h3>
                </div>

                <div className="input-row">
                    <label>Brand Name</label>
                    <input 
                        placeholder="e.g. Nebula Arts" 
                        value={brandName} 
                        onChange={(e) => setBrandName(e.target.value)} 
                    />
                </div>

                <div className="input-row">
                    <label>Shopify URL</label>
                    <input 
                        placeholder="mystore.com" 
                        value={shopifyUrl} 
                        onChange={(e) => setShopifyUrl(e.target.value)} 
                    />
                </div>

                {/* 🛡️ ENGINE STATUS */}
                <div className="engine-status-card">
                    <Text variant="headingLg" as="h2">Initialize Engine</Text>
                    <Box paddingBlock="400">
                        <Text as="p" tone="subdued">
                            Connect your storefront to begin your 2026 optimizations.
                        </Text>
                    </Box>
                    <button 
                        className="power-btn"
                        onClick={() => fetcher.submit({ brandName, shopifyUrl }, { method: "POST" })}
                    >
                        Power On
                    </button>
                </div>
            </aside>

            {/* 🛡️ MAIN BOARD: Compliance & Status */}
            <main className="mission-board">
                <header className="board-header">
                    <Text variant="headingXl" as="h1">Nebula Board</Text>
                    <button className="secondary-btn" onClick={() => pdfFetcher.submit({}, { method: "POST", action: "/api/pdf-generator" })}>
                        {pdfFetcher.state !== "idle" ? "Generating Audit..." : "Export PDF Audit"}
                    </button>
                </header>

                <div className="action-panel-grid">
                    <div className="action-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text variant="headingMd" as="h2">System Integrity</Text>
                            <Badge tone={auditData.status === "Healthy" ? "success" : "attention"}>
                                {auditData.status || "Scanning..."}
                            </Badge>
                        </div>
                        <Box paddingBlockStart="400">
                            <Text as="p">
                                Foundation check for Privacy, Refund, and Shipping policies.
                            </Text>
                        </Box>
                    </div>
                </div>
            </main>
        </div>
    );
}
