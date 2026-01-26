#!/usr/bin/env node

/**
 * Manual deployment guide for Phoenix Rise & Flow
 * Since Shopify CLI has path resolution issues, follow these steps:
 */

const steps = `
╔════════════════════════════════════════════════════════════════╗
║         MANUAL DEPLOYMENT: Phoenix Rise & Flow                 ║
╚════════════════════════════════════════════════════════════════╝

✅ BUILD COMPLETE! 
   - App built successfully at: ./build/

📋 NEXT STEPS - MANUAL DEPLOYMENT:

1. Go to Shopify Partner Dashboard:
   https://partners.shopify.com/

2. Find your "Phoenix Rise & Flow" app 
   (Client ID: 754341ccac733ecf4f62d1f6bd120d1e)

3. Click "App setup" → "Configuration"

4. Update Application URL:
   https://ourphoenixrise.com

5. Update Allowed redirect URLs:
   https://ourphoenixrise.com/auth/callback

6. Save changes

7. Deploy the /build folder to your server:
   - Build files are ready in: ./build/
   - Use your hosting provider's deploy tool
   - Ensure Node.js 20.19+ is installed

8. Set environment variables on your server:
   GEMINI_API_KEY=your-gemini-key
   SESSION_SECRET=generate-a-secure-random-string

9. Start the server:
   npm run start

10. Shopify will auto-detect the app is live
    and route traffic to https://ourphoenixrise.com

📦 INSTALLATION LINKS:
   After deployment, Shopify generates install links
   for each of your 4 stores. You can find them in:
   Partner Dashboard → App → Installation links

🎯 MULTI-STORE DEPLOYMENT:
   Install the same app on all 4 stores.
   Shopify automatically isolates sessions per store.
   No code changes needed!

════════════════════════════════════════════════════════════════

Need help? Check:
- UNIFIED_APP_README.md
- DEPLOYMENT_4_STORES.md
`;

console.log(steps);
