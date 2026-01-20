# Phoenix Rise & Flow - Unified App

**One app. Four stores. Unlimited accessibility & SEO optimization.**

## What This Does

- **Bulk analyze** 100s of products for accessibility & SEO issues
- **AI-powered suggestions** using Gemini API (title, description, alt text, keywords)
- **Review before apply** - human review required for flagged changes
- **Deploy to 4 stores** with a single codebase

## Setup

### Prerequisites
- Node.js 20.19+
- Shopify Partner account
- Gemini API key (get at [aistudio.google.com](https://aistudio.google.com))

### 1. Install dependencies
```bash
npm install
```

### 2. Set environment variables
Create `.env.local` in `merchant-co-pilot-app/`:
```
GEMINI_API_KEY=your-gemini-key-here
```

### 3. Run locally
```bash
npm run dev
```

This starts the app on `http://localhost:3000` with your test store.

## Multi-Store Deployment

### For 4 stores:
1. Install the app from Shopify Partner dashboard
2. Each store installs via OAuth → gets own session
3. Run `npm run deploy` to ship to all 4 stores

No code changes needed between stores. Session handling is automatic.

## How to Use

1. **Go to the Bulk Analyzer** from the dashboard
2. **Paste product IDs** (comma-separated)
3. **Click "Analyze"** - Gemini reviews each product
4. **Review flagged issues** - manually approve risky changes
5. **Apply ready changes** - auto-apply safe optimizations
6. **Repeat** until all products are optimized

## Optimization Rules (No Misrepresentation)

✅ **Can change:**
- Title (clarity improvements, SEO)
- Meta description & keywords
- Alt text for images
- Description structure/formatting

❌ **Cannot change:**
- Product price
- Product type/category
- Core product meaning
- Factual errors (must be reviewed)

## Files Structure

```
merchant-co-pilot-app/
├── app/
│   ├── routes/
│   │   ├── app._index.tsx (dashboard)
│   │   ├── app.bulk-analyzer.tsx (UI)
│   │   └── api.bulk-analyze.tsx (Gemini API handler)
│   ├── shopify.server.ts (session handling)
│   └── root.tsx (layout)
├── prisma/ (database)
├── shopify.app.toml (app config)
└── package.json
```

## Features Included (MVP)

1. ✅ Bulk product analyzer
2. ✅ Gemini AI suggestions
3. ✅ Accessibility scoring
4. ✅ SEO scoring
5. ✅ Review workflow (prevents misrepresentation)
6. ✅ Multi-store ready

## Roadmap (Future)

- [ ] Collections organizer
- [ ] Blog post optimizer
- [ ] Duplicate content detector
- [ ] Theme accessibility scanner
- [ ] Bulk scheduling for changes
- [ ] Change history & rollback

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run deploy` | Deploy to all stores |
| `npm run setup` | Initialize database |

## Support

If you hit issues:
1. Check GEMINI_API_KEY is set
2. Verify Shopify API permissions (in shopify.app.toml)
3. Check product IDs are correct format (gid://shopify/Product/123)
4. Review server logs: `npm run dev` shows all errors

---

**Built for Karen's 4-store empire. Let's automate this. 🚀**
