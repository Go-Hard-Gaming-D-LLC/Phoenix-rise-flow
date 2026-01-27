import { useState, useEffect } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Server-Side: Securely get API Key & Authenticate Shopify
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  // Ensure this env var is set in Vercel, or paste key here for temporary testing
  return json({ apiKey: process.env.GEMINI_API_KEY || "YOUR_GEMINI_KEY_HERE" });
};

export default function Index() {
  const { apiKey } = useLoaderData<typeof loader>();

  // --- STATE ---
  const [config, setConfig] = useState({ brandName: "", shopifyUrl: "" });
  const [loading, setLoading] = useState({ identity: false, audit: false, editor: false });
  const [analysis, setAnalysis] = useState<any>({});
  const [editorInput, setEditorInput] = useState("");
  const [editorGoal, setEditorGoal] = useState("trust");

  // --- AI ENGINE ---
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // --- ACTIONS ---
  const runAction = async (type: 'identity' | 'audit' | 'editor') => {
    if (type !== 'editor' && !config.shopifyUrl) return alert("Please enter a Shop URL first.");
    if (type === 'editor' && !editorInput) return alert("Please enter text to edit.");

    setLoading(prev => ({ ...prev, [type]: true }));

    try {
      let prompt = "";
      if (type === 'identity') {
        prompt = `Analyze the e-commerce store at ${config.shopifyUrl}. Return a JSON object with: { "summary": "1 sentence summary", "targetAudience": "Who is it for?", "usp": "Unique Selling Point" }`;
      } else if (type === 'audit') {
        prompt = `Act as a Google Merchant Center Investigator. Audit ${config.shopifyUrl} for "Misrepresentation" triggers (missing address, bad refund policy). Return JSON: { "trustAudit": [{ "issue": "Short title", "location": "Footer", "recommendation": "Fix..." }] }`;
      } else if (type === 'editor') {
        prompt = `Act as a Copywriter. Rewrite this text for the goal "${editorGoal}". Input: "${editorInput}". Return JSON: { "editedContent": "The rewritten text", "explanation": "Why this is better" }`;
      }

      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json|```/g, "").trim();
      const data = JSON.parse(text);

      if (type === 'identity') setAnalysis((p: any) => ({ ...p, brandIdentity: data }));
      if (type === 'audit') setAnalysis((p: any) => ({ ...p, trustAudit: data.trustAudit }));
      if (type === 'editor') setAnalysis((p: any) => ({ ...p, contentEdits: [data, ...(p.contentEdits || [])] }));

    } catch (e: any) {
      console.error(e);
      alert(`AI Error: ${e.message}`);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="app-root">
      {/* INJECT THE CSS YOU PROVIDED (Fixed & Minified for Remix) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Outfit:wght@500;800&family=JetBrains+Mono:wght@400&display=swap');
        :root { --bg-dark: #000; --card-bg: rgba(20,20,20,0.8); --primary: #a78bfa; --text-main: #fff; --text-muted: #9ca3af; --glass-border: rgba(255,255,255,0.1); }
        body { background: var(--bg-dark); color: var(--text-main); font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; }
        .app-root { min-height: 100vh; display: flex; flex-direction: column; background-image: radial-gradient(circle at 10% 20%, rgba(167,139,250,0.08), transparent 40%); }
        .mission-control-layout { display: grid; grid-template-columns: 340px 1fr; height: 100vh; overflow: hidden; }
        
        /* Sidebar */
        .config-sidebar { background: rgba(10,10,12,0.6); backdrop-filter: blur(20px); border-right: 1px solid var(--glass-border); padding: 24px; display: flex; flex-direction: column; gap: 20px; }
        .sidebar-header h3 { font-family: 'Outfit', sans-serif; margin: 0; background: linear-gradient(135deg, #fff, #ccc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 1.2rem; }
        .input-row { display: flex; flex-direction: column; gap: 8px; }
        .input-row label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 700; }
        .input-row input { background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); padding: 12px; border-radius: 8px; color: white; font-family: inherit; transition: 0.2s; }
        .input-row input:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 2px rgba(167,139,250,0.2); }
        
        /* Main Board */
        .mission-board { overflow-y: auto; padding: 0; flex: 1; }
        .board-header { padding: 32px 48px; border-bottom: 1px solid var(--glass-border); background: rgba(5,5,5,0.8); backdrop-filter: blur(10px); position: sticky; top: 0; z-index: 10; }
        .board-header h1 { font-family: 'Outfit', sans-serif; font-size: 2rem; margin: 0; background: linear-gradient(to right, #fff, #aaa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        /* Cards & Grid */
        .action-panel-grid { padding: 32px 48px; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
        .action-card { background: var(--card-bg); border: 1px solid var(--glass-border); padding: 24px; border-radius: 16px; transition: transform 0.2s; display: flex; flex-direction: column; }
        .action-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.2); }
        .action-card h3 { margin-top: 0; font-family: 'Outfit', sans-serif; color: var(--primary); }
        .action-card p { color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; flex-grow: 1; }
        
        /* Buttons */
        .prime-btn { background: linear-gradient(135deg, var(--primary), #b794f6); color: #000; font-weight: 700; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; transition: 0.2s; width: 100%; margin-top: 16px; }
        .prime-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .prime-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(167,139,250,0.3); }
        
        /* Editor & Results */
        .editor-area { margin: 0 48px 48px; background: #0f0f11; border: 1px solid var(--glass-border); border-radius: 16px; padding: 24px; }
        textarea, select { width: 100%; background: #18181b; border: 1px solid var(--glass-border); color: white; padding: 12px; border-radius: 8px; font-family: inherit; margin-bottom: 12px; }
        
        .results-section { margin: 0 48px 48px; display: flex; flex-direction: column; gap: 16px; }
        .result-box { background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 12px; padding: 20px; border-left: 4px solid var(--primary); }
        .result-box strong { color: #f87171; display: block; margin-bottom: 8px; font-family: 'Outfit', sans-serif; letter-spacing: 0.05em; }
        .code-block { background: #000; padding: 15px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: var(--primary); white-space: pre-wrap; margin-top: 10px; border: 1px solid var(--glass-border); }
      `}</style>

      <div className="mission-control-layout">

        {/* SIDEBAR */}
        <aside className="config-sidebar">
          <div className="sidebar-header">
            <h3>⚡ Phoenix Flow</h3>
          </div>

          <div className="input-row">
            <label>Brand Name</label>
            <input
              value={config.brandName}
              onChange={e => setConfig({ ...config, brandName: e.target.value })}
              placeholder="e.g. Iron Phoenix"
            />
          </div>

          <div className="input-row">
            <label>Store URL</label>
            <input
              value={config.shopifyUrl}
              onChange={e => setConfig({ ...config, shopifyUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <button
            className="prime-btn"
            onClick={() => runAction('identity')}
            disabled={loading.identity}
          >
            {loading.identity ? "Analyzing..." : "✨ Detect Identity"}
          </button>
        </aside>

        {/* MAIN BOARD */}
        <main className="mission-board">
          <header className="board-header">
            <h1>Merchant Co-Pilot</h1>
            <p>AI-Powered Optimization Engine</p>
          </header>

          {/* IDENTITY CARD */}
          {analysis.brandIdentity && (
            <div style={{ margin: '32px 48px 0', padding: '24px', background: 'rgba(167, 139, 250, 0.1)', border: '1px solid var(--primary)', borderRadius: '16px' }}>
              <h3 style={{ margin: '0 0 10px', color: 'var(--primary)', fontFamily: 'Outfit' }}>Identity Detected</h3>
              <p><strong>Summary:</strong> {analysis.brandIdentity.summary}</p>
              <p><strong>USP:</strong> {analysis.brandIdentity.usp}</p>
            </div>
          )}

          {/* ACTION GRID */}
          <div className="action-panel-grid">
            <div className="action-card">
              <h3>🛡️ Trust & Compliance</h3>
              <p>Scan for Google Merchant Center "Misrepresentation" triggers.</p>
              <button className="prime-btn" onClick={() => runAction('audit')} disabled={loading.audit}>
                {loading.audit ? "Auditing..." : "Run Audit"}
              </button>
            </div>

            <div className="action-card">
              <h3>📝 Smart Content Editor</h3>
              <p>Rewrite product descriptions, emails, or policies instantly.</p>
              <button className="prime-btn" onClick={() => document.getElementById('editor')?.scrollIntoView({ behavior: 'smooth' })}>
                Go to Editor
              </button>
            </div>
          </div>

          {/* EDITOR AREA */}
          <div id="editor" className="editor-area">
            <h3 style={{ fontFamily: 'Outfit', marginTop: 0 }}>Smart Editor</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: '#888' }}>GOAL</label>
                <select value={editorGoal} onChange={e => setEditorGoal(e.target.value)}>
                  <option value="trust">Fix Trust/Compliance</option>
                  <option value="seo">SEO Optimization</option>
                  <option value="sales">Boost Sales</option>
                  <option value="professional">Professional Tone</option>
                </select>
                <button className="prime-btn" onClick={() => runAction('editor')} disabled={loading.editor}>
                  {loading.editor ? "Rewriting..." : "✨ Optimize"}
                </button>
              </div>
              <textarea
                rows={6}
                placeholder="Paste your text here (Description, Policy, About Us)..."
                value={editorInput}
                onChange={e => setEditorInput(e.target.value)}
              />
            </div>
          </div>

          {/* RESULTS FEED */}
          <div className="results-section">
            {analysis.trustAudit && analysis.trustAudit.map((item: any, i: number) => (
              <div key={`audit-${i}`} className="result-box">
                <strong>⚠️ {item.issue}</strong>
                <p style={{ margin: 0, color: '#ddd' }}>{item.recommendation}</p>
              </div>
            ))}

            {analysis.contentEdits && analysis.contentEdits.map((item: any, i: number) => (
              <div key={`edit-${i}`} className="result-box" style={{ borderLeftColor: '#34d399' }}>
                <strong style={{ color: '#34d399' }}>Result</strong>
                <div className="code-block">{item.editedContent}</div>
                <p style={{ marginTop: '10px', fontSize: '0.9rem', color: '#888' }}>{item.explanation}</p>
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}
