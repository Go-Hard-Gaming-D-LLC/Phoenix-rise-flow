# Deployment Guide: 4-Store Setup

## One App. Four Stores. Automatic Session Handling.

When you deploy this Shopify app, each store gets **its own session automatically**. You don't need separate code for each store.

---

## Step 1: Verify App Registration

Your app is already registered:
- **Client ID:** `754341ccac733ecf4f62d1f6bd120d1e`
- **Name:** Phoenix Rise & Flow
- **Scopes:** Full read/write on products, themes, content

✅ Same app serves all 4 stores.

---

## Step 2: Test Locally

### Option A: Test with one store (recommended first)
```bash
cd merchant-co-pilot-app
npm install
npm run dev
```

This opens a tunnel and asks you to pick a test store. Pick **Store 1**.

✅ Verify the bulk analyzer works before deploying to production.

---

## Step 3: Build for Production

```bash
npm run build
```

This creates optimized bundles for all platforms.

---

## Step 4: Deploy to All 4 Stores

```bash
npm run deploy
```

This:
1. Builds the app
2. Deploys to Shopify infrastructure
3. Creates install links for each store

Or manually:
1. Go to Shopify Partner Dashboard
2. Find "Phoenix Rise & Flow" app
3. Click "Installation links"
4. Send links to your 4 store owners (or install yourself on each)

---

## Step 5: How Sessions Work (Automatic)

When a merchant installs your app:
1. Shopify redirects to your app
2. OAuth flow creates a **session for that store**
3. App detects which store by session
4. Returns store-specific data

**You don't code for this.** Shopify handles it.

```tsx
// Remix automatically knows which store is using the app
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  // admin.graphql() automatically queries THIS store's data
};
```

---

## Step 6: Multi-Store Data Isolation

Each store sees ONLY its own products:

```
Store 1: 600 products → Bulk analyzer lists only Store 1 products
Store 2: 400 products → Bulk analyzer lists only Store 2 products
Store 3: 250 products → Bulk analyzer lists only Store 3 products
Store 4: 150 products → Bulk analyzer lists only Store 4 products
```

No cross-store mixing. Shopify handles this via session tokens.

---

## Monitoring

After deployment, check each store:

```bash
# Store 1
shopify app dev --store=store1.myshopify.com

# Store 2
shopify app dev --store=store2.myshopify.com

# etc.
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "App not found" | Run `npm run deploy` again |
| "Permission denied" | Check scopes in `shopify.app.toml` |
| "Session error" | Reinstall app on that store |
| "GEMINI_API_KEY missing" | Set env var in `.env.local` |

---

## Summary

✅ **One app** = Phoenix Rise & Flow  
✅ **Four stores** = Auto-isolated sessions  
✅ **No code changes** between stores  
✅ **Deploy once** = Works everywhere  

**Ready to automate 1000+ products across 4 stores? Let's go.** 🚀
