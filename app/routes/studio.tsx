/**
 * 🛡️ SHADOW'S FORGE: NEBULA STUDIO GATE
 * ROLE: Standalone Entry & 180-Day Cycle Tracker.
 * SYNC: 2026-02-07
 */
import { useState } from "react";
import { Form } from "@remix-run/react";
import { Text, Box, BlockStack, Badge } from "@shopify/polaris";

export default function StudioEntry() {
  const [shop, setShop] = useState("");
  // Mock data for the 5-product / 180-day recurring loyalty cycle
  const loyaltyStatus = { creditsRemaining: 5, daysUntilReset: 180 };

  return (
    <div className="mission-control-layout">
      <aside className="config-sidebar">
        <BlockStack gap="500">
          <div className="vitals-header">
            <span style={{ color: "var(--primary)" }}>★</span>
            <Text variant="headingSm" as="h3">Link to Store</Text>
          </div>

          <div className="input-row">
            <label>Shopify Domain</label>
            <input
              placeholder="example.myshopify.com"
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              className="nebula-input"
            />
          </div>

          <div className="engine-status-card">
            <Text variant="headingLg" as="h2">Initialize Engine</Text>
            
            <Box paddingBlock="400">
              <BlockStack gap="200">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text as="p" tone="subdued">Credits:</Text>
                  {/* ✅ FIX: Wrapped in template literal to provide a single string */}
                  <Badge tone="success">{`${loyaltyStatus.creditsRemaining} Free`}</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text as="p" tone="subdued">Next Reset:</Text>
                  {/* ✅ FIX: Ensuring single string for reset countdown */}
                  <Text as="p">{`${loyaltyStatus.daysUntilReset} Days`}</Text>
                </div>
              </BlockStack>
            </Box>

            <Form method="get" action="/auth/login">
              <input type="hidden" name="shop" value={shop} />
              <button 
                className="power-btn" 
                type="submit" 
                disabled={!shop.includes(".myshopify.com")}
              >
                Power On
              </button>
            </Form>
          </div>
        </BlockStack>
      </aside>

      <main className="mission-board">
        <header className="board-header">
          <Text variant="headingXl" as="h1">Nebula Studio</Text>
        </header>
        <Box padding="800">
          <Text as="p" variant="bodyLg" tone="subdued">
            Authorized for the 2026 Optimization Sequence. Link your storefront to engage.
          </Text>
        </Box>
      </main>
    </div>
  );
}