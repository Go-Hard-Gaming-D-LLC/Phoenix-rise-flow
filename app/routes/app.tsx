import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

// FIX 2614: Using the default shopify object for consistent authentication
import shopify from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Authenticate the admin session to enable the 'Eyes' of the app
  await shopify.authenticate.admin(request);

  return { 
    apiKey: process.env.SHOPIFY_API_KEY || "",
    // We return the shop name to help ground the 'Iron Phoenix' identity
    shop: "Iron Phoenix GHG" 
  };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      {/* The NavMenu connects your tiered 5/10/15 scan logic */}
      <NavMenu>
        <Link to="/app" rel="home">
          Phoenix Flow
        </Link>
        <Link to="/app/description-generator">Description Gen</Link>
        <Link to="/app/bulk-analyzer">Bulk Analysis</Link>
        <Link to="/app/phoenix">Phoenix Chat</Link>
        <Link to="/app/onboarding">Business Vitals</Link>
      </NavMenu>
      
      {/* This Outlet is where your Phase 1 & 2 logic files render */}
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch responses so headers are included correctly
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};