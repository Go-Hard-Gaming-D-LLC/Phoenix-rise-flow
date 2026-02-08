import { useState } from "react";
import { Card, TextField, Button, Banner, Text } from "@shopify/polaris";

interface CustomTokenAuthProps {
  onTokenSubmit: (token: string, shop: string) => void;
}

export function CustomTokenAuth({ onTokenSubmit }: CustomTokenAuthProps) {
  const [shop, setShop] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!shop || !token) {
      setError("Both Shop URL and Access Token are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Validate the token format
      if (!token.startsWith("shpat_") && !token.startsWith("shpca_")) {
        throw new Error("Invalid token format. Must start with 'shpat_' or 'shpca_'");
      }

      // Validate shop format
      const shopDomain = shop.includes(".myshopify.com") 
        ? shop 
        : `${shop}.myshopify.com`;

      // Test the token with a simple API call
      const testResponse = await fetch(`https://${shopDomain}/admin/api/2024-07/shop.json`, {
        headers: {
          "X-Shopify-Access-Token": token,
          "Content-Type": "application/json",
        },
      });

      if (!testResponse.ok) {
        throw new Error("Invalid token or shop URL. Please verify your credentials.");
      }

      // Store in localStorage for persistence
      localStorage.setItem("phoenix_custom_token", token);
      localStorage.setItem("phoenix_shop_domain", shopDomain);

      onTokenSubmit(token, shopDomain);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div style={{ padding: "20px" }}>
        <Text variant="headingMd" as="h2">
          🔐 Direct Access Mode
        </Text>
        <Text variant="bodyMd" as="p" tone="subdued">
          Bypass OAuth by using a Custom App access token
        </Text>

        <div style={{ marginTop: "20px" }}>
          {error && (
            <Banner tone="critical" onDismiss={() => setError("")}>
              {error}
            </Banner>
          )}

          <div style={{ marginTop: "16px" }}>
            <TextField
              label="Shop Domain"
              value={shop}
              onChange={setShop}
              placeholder="your-store.myshopify.com"
              autoComplete="off"
              helpText="Your Shopify store URL"
            />
          </div>

          <div style={{ marginTop: "16px" }}>
            <TextField
              label="Custom App Access Token"
              value={token}
              onChange={setToken}
              placeholder="shpat_..."
              type="password"
              autoComplete="off"
              helpText={
                <span>
                  Get this from: Shopify Admin → Settings → Apps and sales channels → 
                  Develop apps → Create custom app
                </span>
              }
            />
          </div>

          <div style={{ marginTop: "20px" }}>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
              fullWidth
            >
              ⚡ Power On Workstation
            </Button>
          </div>

          <div style={{ marginTop: "16px", padding: "12px", background: "#f6f6f7", borderRadius: "8px" }}>
            <Text variant="bodySm" as="p" fontWeight="semibold">
              How to get a Custom App Token:
            </Text>
            <ol style={{ marginTop: "8px", paddingLeft: "20px", fontSize: "13px", color: "#616161" }}>
              <li>Go to Shopify Admin → Settings</li>
              <li>Apps and sales channels → Develop apps</li>
              <li>Create app → Configure Admin API scopes</li>
              <li>Enable: read_products, write_products, write_content</li>
              <li>Install app → Copy Admin API access token</li>
            </ol>
          </div>
        </div>
      </div>
    </Card>
  );
}
