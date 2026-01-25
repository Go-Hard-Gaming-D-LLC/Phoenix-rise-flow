# Phoenix Flow: Intelligent Merchant Workstation
**Version 3.0 (Antigravity Integrated)**

## Project Overview
**Phoenix Flow** is an advanced, AI-powered "Mission Control" application designed for high-volume Shopify and Etsy merchants. Unlike standard analytics dashboards, Phoenix Flow is an **agentic workstation** that not only analyzes store performance but actively fixes technical issues and optimizes product data directly via API.

It leverages **Google Gemini 2.0 Flash** for elite-level copywriting and strategic reasoning, combined with direct **Shopify Admin API** integration for immediate execution.

---

## Core Capabilities

### 1. 🧠 Brand Identity Engine
*   **Auto-Detection:** Instantly analyzes a storefront URL to deduce Brand Summary, Target Audience, and Unique Selling Proposition (USP).
*   **Context Retention:** This identity serves as the "System Prompt" for all subsequent AI tasks, ensuring every optimization is on-brand.

### 2. ⚡ Product Optimization & Grading
*   **One-Click Grading:** Analyzes live product listings against Semrush and Google Merchant Center standards.
*   **Multi-Platform Output:** Generates optimized data simultaneously for:
    *   **Shopify:** H1 Titles, Meta Titles, Meta Descriptions (CTR-focused), and Tags.
    *   **Etsy:** Long-tail Titles (no repeats) and strictly formatted 13 tags.
*   **Direct Execution:** Includes an **"Apply to Shopify"** button that pushes changes directly to the live store using the Admin API, bypassing manual copy-pasting.

### 3. 🛡️ Trust & Compliance Audit (Google Merchant Center)
*   **Misrepresentation Shield:** Scans store policies and footers for red flags that trigger Google Merchant Center suspensions.
*   **Antigravity Mobile Fixer:** A specialized tool that detects missing mobile viewports in Shopify themes and **injects the fix directly into `theme.liquid`** via API.

### 4. ✍️ Smart Content Editor
*   **Policy Generator:** Creates Google-compliant policies (Shipping, Return, Privacy) using specific logic (e.g., "Relay Race" shipping calculations) to avoid "Unrealistic Promise" bans.
*   **Rewriter Modes:** Instantly rewrites input text for distinct goals: *Max Trust*, *SEO*, *High Conversion*, or *Professional Tone*.

### 5. 💡 Strategic Brainstorming
*   **Product Ideation:** Generates new product concepts that align with the established Brand Identity and gap analysis.

---

## Technical Architecture

### Stack
*   **Frontend:** React (Vite) + TypeScript
*   **Styling:** Vanilla CSS with "Glassmorphism" UI (Neon accents, dark mode, frosted glass panels).
*   **AI Model:** Google Gemini 2.0 Flash Exp (via `@google/genai`).
*   **State Management:** Local React State + LocalStorage Persistence (Session resumption).

### API Integration Layers
*   **Shopify Admin API:**
    *   **Proxy System:** Uses a Vite `server.proxy` to bypass CORS restrictions for direct browser-to-Shopify communication.
    *   **Scopes:** Requires `write_products`, `read_products`, `write_themes`, `read_themes`.
    *   **Authentication:** Uses manual Admin Access Tokens (`shpat_...`) for secure, user-controlled access.

### Workflow
1.  **Initialize:** User inputs Store URL + Admin Token.
2.  **Analyze:** AI builds the Brand Identity profile.
3.  **Optimize:** User runs Graders or Audits.
4.  **Execute:** User clicks "Apply" or "Fix" buttons to commit changes to the live store immediately.

---

## User Persona
Built for the **Merchant Operator** who needs to wear multiple hats: SEO Specialist, Copywriter, and Technical Developer. Phoenix Flow automates the cognitive load of these roles and provides the "arms" to execute the work.
