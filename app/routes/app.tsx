import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server"; // Using standard named import

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Authenticate the admin session to enable the 'Eyes' of the app
  await authenticate.admin(request);

  return {
    apiKey: process.env.SHOPIFY_API_KEY || ""
  };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  if (!apiKey) {
    return (
      <div style={{ padding: '20px', background: '#ffe6e6', color: '#900', fontFamily: 'sans-serif' }}>
        <h1>CRITICAL ERROR: Missing Shopify API Key</h1>
        <p>The <code>SHOPIFY_API_KEY</code> environment variable is missing.</p>
        <p>If running on Cloudflare Pages:</p>
        <ul>
          <li>Go to Settings &rarr; Environment Variables</li>
          <li>Add <code>SHOPIFY_API_KEY</code> (get this from your Shopify Partner Dashboard)</li>
          <li>Add <code>SHOPIFY_API_SECRET</code></li>
          <li>Add <code>SCOPES</code> (e.g., read_products,write_products)</li>
          <li>Add <code>SHOPIFY_APP_URL</code> (your Cloudflare URL)</li>
          <li>Trigger a new deploy.</li>
        </ul>
      </div>
    );
  }

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      {/* The NavMenu connects your tiered logic */}
      <NavMenu>
        <Link to="/app" rel="home">
          Phoenix Flow
        </Link>

        {/* These links will work once you build these specific pages */}
        <Link to="/app/description-generator">Description Gen</Link>
        <Link to="/app/bulk-analyzer">Bulk Analysis</Link>

        {/* This is your new Media Studio (it lives on the home page for now, but good to have a link) */}
        <Link to="/app">Media Studio</Link>
      </NavMenu>

      {/* This Outlet is where your Dashboard (app._index.tsx) renders */}
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