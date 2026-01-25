import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { authenticate } from "../shopify.server";

// 1. LOADER: Auto-detects the shop (No more typing URLs!)
export const loader = async ({ request }: { request: Request }) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`
    {
      shop {
        name
        email
        myshopifyDomain
      }
    }
  `);
  const data = await response.json();
  return json({ shop: data.data.shop });
};

// 2. THE NEW UI: "Soft Gamer" Look + Real Functionality
export default function Index() {
  const { shop } = useLoaderData<typeof loader>();
  const fetcher = useFetcher(); // This powers the "Quick Sync" button without reloading

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-20">
      
      {/* --- TOP BAR: Command Deck --- */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-200">
            P
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              Iron Phoenix
            </h1>
            <p className="text-xs font-medium text-purple-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              SYSTEM ONLINE
            </p>
          </div>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm font-bold text-slate-700">{shop.name}</p>
          <p className="text-xs text-slate-400 font-mono">{shop.myshopifyDomain}</p>
        </div>
      </header>

      {/* --- MAIN DASHBOARD AREA --- */}
      <main className="max-w-7xl mx-auto p-8">
        
        {/* HERO SECTION: The "Active Mission" */}
        <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden mb-10">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-100 rounded-full blur-3xl opacity-50 -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-100 rounded-full blur-3xl opacity-50 -ml-10 -mb-10"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                Command Center 🚀
              </h2>
              <p className="text-slate-500 text-lg max-w-xl">
                Your digital exoskeleton is active. Ready to deploy Gemini 2.0 for SEO, compliance checks, and inventory logic.
              </p>
            </div>
            
            {/* BIG ACTION BUTTON */}
            <Link to="/app/description-generator">
              <button className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-pink-200 transform transition hover:-translate-y-1 flex items-center gap-3">
                <span className="text-2xl">🧠</span>
                <span className="text-left">
                  <span className="block text-xs opacity-80 uppercase tracking-wider">Primary Mission</span>
                  <span className="text-lg">Launch Content Brain</span>
                </span>
              </button>
            </Link>
          </div>
        </div>

        {/* --- THE TOOL GRID (Merged Functionality) --- */}
        <h3 className="text-slate-400 font-bold uppercase tracking-wider text-sm mb-4 ml-1">Operational Modules</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* CARD 1: CONTENT GENERATOR */}
          <Link to="/app/description-generator" className="group">
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition h-full flex flex-col">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition">
                ✍️
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Content Generator</h3>
              <p className="text-slate-500 text-sm mb-4 flex-grow">
                Deploy Gemini to write SEO-heavy descriptions and fix "boring" copy.
              </p>
              <span className="text-blue-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                Open Module →
              </span>
            </div>
          </Link>

          {/* CARD 2: COMPLIANCE AUDIT */}
          <Link to="/app/audit" className="group">
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition h-full flex flex-col">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition">
                ⚖️
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Compliance Guard</h3>
              <p className="text-slate-500 text-sm mb-4 flex-grow">
                Scan for NAP errors, missing policies, and Google Merchant flags.
              </p>
              <span className="text-orange-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                Run Audit →
              </span>
            </div>
          </Link>

          {/* CARD 3: INVENTORY SYNC (Uses Fetcher!) */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition h-full flex flex-col">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl mb-4">
              📦
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">Inventory Sync</h3>
            <p className="text-slate-500 text-sm mb-4 flex-grow">
              Auto-archive dropshipping items and enforce safety stock levels.
            </p>
            
            {/* THE FUNCTIONAL SYNC BUTTON */}
            <button 
              onClick={() => fetcher.submit({}, { method: "post", action: "/api/inventory-sync" })}
              disabled={fetcher.state !== "idle"}
              className="mt-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              {fetcher.state !== "idle" ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin"></span>
                  Syncing...
                </>
              ) : (
                <>
                  <span>⚡ Quick Sync Now</span>
                </>
              )}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}