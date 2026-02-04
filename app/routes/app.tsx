import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import LockdownUI from "../components/LockdownUI";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request); // Get session data
  const shop = session.shop;

  // --- ANTI-CHURN CHECK ---
  let isLocked = false;
  try {
    const churnRecord = await db.antiChurn.findUnique({ where: { shop } });
    if (churnRecord?.lastUninstalled) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      if (churnRecord.lastUninstalled > sixMonthsAgo) {
        isLocked = true;
      }
    }
  } catch (e) {
    console.error("Anti-Churn DB Check Failed: ", e);
    // Fail OPEN so legitimate users aren't blocked by DB errors
    isLocked = false;
  }

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    isLocked
  };
};

export default function App() {
  const { apiKey, isLocked } = useLoaderData<typeof loader>();

  if (!apiKey) {
    return (
      <div style={{ padding: '20px', background: '#ffe6e6', color: '#900', fontFamily: 'sans-serif' }}>
        <h1>CRITICAL ERROR: Missing Shopify API Key</h1>
        <p>Please check your Cloudflare Environment Variables.</p>
      </div>
    );
  }

  // --- TRIAL LOCKDOWN ENFORCEMENT ---
  if (isLocked) {
    return (
      <AppProvider isEmbeddedApp apiKey={apiKey}>
        <LockdownUI />
      </AppProvider>
    );
  }

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">Phoenix Flow</Link>
        <Link to="/app/description-generator">Description Gen</Link>
        <Link to="/app/bulk-analyzer">Bulk Analysis</Link>
        <Link to="/app/history">History Ledger</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};