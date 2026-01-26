# App Consolidation: Phoenix Rise + Phoenix Flow → One App

## Current State
- **Phoenix Flow** (merchant-co-pilot-app/): Remix full-stack Shopify app
- **Phoenix Rise** (root): Vite/React frontend with Gemini AI logic

## Plan
1. Keep Phoenix Flow as the canonical app
2. Move it to root level (delete duplicate nested structure)
3. Merge Phoenix Rise's Gemini logic into Phoenix Flow's routes
4. Add bulk product processor
5. Configure for 4-store deployment

## Key Merges
- Phoenix Rise's `index.tsx` → Phoenix Flow's new product analysis route
- Gemini API integration → New `routes/api.analyze-product.tsx`
- Bulk processor → New `routes/api.bulk-process.tsx`
- Components → Merge into Phoenix Flow's component structure

## Status
- [ ] Move Phoenix Flow to root
- [ ] Update package.json with Gemini dependency
- [ ] Create product analysis routes
- [ ] Build bulk processor
- [ ] Test with single store
- [ ] Deploy to all 4 stores
