/**
 * 🛡️ SHADOW'S FORGE: NEBULA STUDIO GATE
 * ROLE: Standalone Entry & Store Linking Interface.
 * SYNC: 2026-02-07 21:17 PM
 */
import { useState, useEffect } from "react";
import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
// ✅ FIX 2307: Use relative path to link from app/routes to app/components
import { CustomTokenAuth } from "../components/CustomTokenAuth"; 
import { Page, Layout, Card, Text } from "@shopify/polaris";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({ 
    standalone: true,
    appUrl: process.env.SHOPIFY_APP_URL || "https://ironphoenixflow.com"
  });
};

export default function StudioStandalone() {
  const { appUrl } = useLoaderData<typeof loader>();
  const [authenticated, setAuthenticated] = useState(false);
  const [shopData, setShopData] = useState<{ shop: string; token: string } | null>(null);

  useEffect(() => {
    // 🛡️ Persistence Handshake
    const token = localStorage.getItem("phoenix_custom_token");
    const shop = localStorage.getItem("phoenix_shop_domain");
    
    if (token && shop) {
      setAuthenticated(true);
      setShopData({ shop, token });
    }
  }, []);

  const handleTokenSubmit = (token: string, shop: string) => {
    setAuthenticated(true);
    setShopData({ shop, token });
    // ⚡ Redirect to main mission board
    window.location.href = "/app";
  };

  const handleLogout = () => {
    localStorage.removeItem("phoenix_custom_token");
    localStorage.removeItem("phoenix_shop_domain");
    setAuthenticated(false);
    setShopData(null);
  };

  if (!authenticated) {
    return (
      <Page>
        <style>{`
          body {
            background: linear-gradient(135deg, #000000 0%, #1a0033 100%);
            min-height: 100vh;
          }
          .phoenix-container {
            max-width: 600px;
            margin: 80px auto;
            padding: 0 20px;
          }
          .phoenix-header {
            text-align: center;
            margin-bottom: 40px;
            color: #fff;
          }
          .phoenix-header h1 {
            font-size: 48px;
            font-weight: 800;
            background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0 0 16px 0;
          }
          .phoenix-header p {
            font-size: 18px;
            color: #9ca3af;
            margin: 0;
          }
        `}</style>

        <div className="phoenix-container">
          <div className="phoenix-header">
            <h1>⚡ Phoenix Flow Rise</h1>
            <p>Standalone Merchant Workstation</p>
          </div>

          <CustomTokenAuth onTokenSubmit={handleTokenSubmit} />
        </div>
      </Page>
    );
  }

  return (
    <Page title="⚡ Authenticated">
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: "20px", textAlign: "center" }}>
              <Text variant="headingLg" as="h2">
                ✅ Connected to {shopData?.shop}
              </Text>
              <div style={{ marginTop: "20px" }}>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: "12px 24px",
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Disconnect
                </button>
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}