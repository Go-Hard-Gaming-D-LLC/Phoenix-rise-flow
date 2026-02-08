/**
 * SHADOW'S FORGE: NEBULA STUDIO GATE
 * ROLE: Standalone Entry & Store Linking Interface.
 */
import { useState } from "react";
import { Form } from "@remix-run/react";
import { Text, Box } from "@shopify/polaris";

export default function StudioEntry() {
  const [shop, setShop] = useState("");

  return (
    <div className="mission-control-layout">
      <aside className="config-sidebar">
        <div className="vitals-header">
          <span style={{ color: "var(--primary)" }}>★</span>
          <h3>Link to Store</h3>
        </div>

        <div className="input-row">
          <label>Shopify Domain</label>
          <input
            placeholder="example.myshopify.com"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
          />
        </div>

        <div className="engine-status-card">
          <Text variant="headingLg" as="h2">Initialize Engine</Text>
          <Box paddingBlock="400">
            <Text as="p" tone="subdued">
              Link your storefront to begin your 2026 optimizations.
            </Text>
          </Box>
          {/* Redirects to OAuth Flow */}
          <Form method="get" action="/auth/login">
            <input type="hidden" name="shop" value={shop} />
            <button className="power-btn" type="submit" disabled={!shop}>
              Power On
            </button>
          </Form>
        </div>
      </aside>

      <main className="mission-board">
        <header className="board-header">
          <Text variant="headingXl" as="h1">Nebula Studio</Text>
        </header>
        <Box padding="800">
          <Text as="p" variant="bodyLg" tone="subdued">
            Enter your store domain on the left to authorize the Iron Phoenix
            workstation.
          </Text>
        </Box>
      </main>
    </div>
  );
}
