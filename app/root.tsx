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

// 1. ADD THE POLARIS IMPORT HERE (Vite-style)

export const links: LinksFunction = () => [
  // 2. REGISTER POLARIS FIRST
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
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}