import { json, type LoaderFunctionArgs } from '@remix-run/node';

/**
 * This route acts as a proxy for Shopify Admin API calls.
 * It forwards requests from the frontend to Shopify and adds the necessary auth headers.
 * This solves the CORS issue and allows dynamic store switching.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Get query params
    const url = new URL(request.url);
    const shopifyUrl = url.searchParams.get('shopify_url');
    const path = url.searchParams.get('path');
    const adminToken = url.searchParams.get('token');

    if (!shopifyUrl || !path || !adminToken) {
      return json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Build the full Shopify API URL
    const targetUrl = new URL(`${shopifyUrl}${path}`);

    // Forward the request
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken,
      },
    });

    const data = await response.json();
    return json(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return json(
      { error: error.message || 'Proxy request failed' },
      { status: 500 }
    );
  }
}

export async function action({ request }: LoaderFunctionArgs) {
  if (request.method !== 'POST' && request.method !== 'PUT') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { shopify_url, path, token, method = request.method, data } = body;

    if (!shopify_url || !path || !token) {
      return json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Build the full Shopify API URL
    const targetUrl = new URL(`${shopify_url}${path}`);

    // Forward the request
    const response = await fetch(targetUrl.toString(), {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return json(result);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return json(
      { error: error.message || 'Proxy request failed' },
      { status: 500 }
    );
  }
}
