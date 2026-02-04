import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import shopify from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({ status: "Phoenix Proxy Active" });
}

export async function action({ request }: ActionFunctionArgs) {
  // Use authenticate.public.appProxy for storefront requests
  const { session } = await shopify.authenticate.public.appProxy(request);

  if (!session) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  return json({ success: true, message: "Proxy Auth Verified" });
}
