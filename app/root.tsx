/**
 * 🛡️ SHADOW'S FORGE: CORE ROOT GATE
 * WARNING: DO NOT MODIFY WITHOUT EXPLICIT PERMISSION.
 * ROLE: Global Application Layout & Polaris UI Provider.
 */
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import workstationStyles from "./styles/workstation.css?url";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/cloudflare";
import { AppProvider } from "@shopify/polaris";

// ✅ CLINICAL SYNC: Global styles for Mission Control
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: polarisStyles },
  { rel: "stylesheet", href: workstationStyles },
  { rel: "stylesheet", href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css" },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <Meta />
        <Links />
      </head>
      <body>
        {/* ✅ CLINICAL FIX: Removed invalid 'isEmbeddedApp' prop to clear Error 2322 */}
        <AppProvider i18n={{}}>
          <Outlet />
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}