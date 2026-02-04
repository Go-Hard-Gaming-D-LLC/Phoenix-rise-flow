import { useState, useEffect } from "react";
import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Server-Side: Securely get API Key
export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  // COMPATIBILITY: Try context.env (Cloudflare) then process.env (Node/Polyfill)
  const env = (context as any).cloudflare?.env || (context as any).env || process.env;
  return json({ apiKey: env.GEMINI_API_KEY || "" });
};

export default function Index() {
  const { apiKey } = useLoaderData<typeof loader>();
  const fetcher = useFetcher(); // Used to talk to api.phoenix.tsx

  // --- STATE ---
  const [config, setConfig] = useState({ brandName: "", shopifyUrl: "" });
  const [loading, setLoading] = useState({ identity: false, audit: false, editor: false, media: false });
  const [analysis, setAnalysis] = useState<any>({});
  const [editorInput, setEditorInput] = useState("");
  const [editorGoal, setEditorGoal] = useState("trust");

  // --- NEW STATE: MEDIA STUDIO & LEGAL SHIELD ---
  const [legalAgreed, setLegalAgreed] = useState(false);
  const [mediaType, setMediaType] = useState("product_ad");
  const [productName, setProductName] = useState("");

  // --- CLIENT-SIDE AI (Text) ---
  const [genAI, setGenAI] = useState<GoogleGenerativeAI | null>(null);

  useEffect(() => {
    if (apiKey) {
      try {
        setGenAI(new GoogleGenerativeAI(apiKey));
      } catch (e) {
        console.error("Failed to initialize Google AI:", e);
      }
    }
  }, [apiKey]);

  const runAction = async (type: 'identity' | 'audit' | 'editor') => {
    if (!genAI) return alert("AI Service is causing an initialization error (Missing Key). check console.");
    if (type !== 'editor' && !config.shopifyUrl) return alert("Please enter a Shop URL first.");

    setLoading(prev => ({ ...prev, [type]: true }));

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      let prompt = "";
      if (type === 'identity') prompt = `Analyze ${config.shopifyUrl}.JSON: { "summary": "...", "targetAudience": "...", "usp": "..." } `;
      if (type === 'audit') prompt = `Audit ${config.shopifyUrl} for Trust / Compliance.JSON: { "trustAudit": [{ "issue": "...", "recommendation": "..." }] } `;
      if (type === 'editor') prompt = `Rewrite for ${editorGoal}: "${editorInput}".JSON: { "editedContent": "...", "explanation": "..." } `;

      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json | ```/g, "").trim();
      const data = JSON.parse(text);

      if (type === 'identity') setAnalysis((p: any) => ({ ...p, brandIdentity: data }));
      if (type === 'audit') setAnalysis((p: any) => ({ ...p, trustAudit: data.trustAudit }));
      if (type === 'editor') setAnalysis((p: any) => ({ ...p, contentEdits: [data, ...(p.contentEdits || [])] }));

    } catch (e: any) {
      alert(`AI Error: ${e.message} `);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="app-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Outfit:wght@500;800&family=JetBrains+Mono:wght@400&display=swap');
        :root { --bg-dark: #000; --card-bg: rgba(20, 20, 20, 0.8); --primary: #a78bfa; --text-main: #fff; --text-muted: #9ca3af; --glass-border: rgba(255, 255, 255, 0.1); }
        body { background: var(--bg-dark); color: var(--text-main); font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; }
        .app-root { min-height: 100vh; display: flex; flex-direction: column; background-image: radial-gradient(circle at 10% 20%, rgba(167, 139, 250, 0.08), transparent 40%); }
        .mission-control-layout { display: grid; grid-template-columns: 340px 1fr; height: 100vh; overflow: hidden; }
        
        .config-sidebar { background: rgba(10, 10, 12, 0.6); backdrop-filter: blur(20px); border-right: 1px solid var(--glass-border); padding: 24px; display: flex; flex-direction: column; gap: 20px; }
        .input-row { display: flex; flex-direction: column; gap: 8px; }
        .input-row label { font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; }
        .input-row input, .input-row select { background: rgba(0, 0, 0, 0.3); border: 1px solid var(--glass-border); padding: 12px; border-radius: 8px; color: white; }
        
        .mission-board { overflow-y: auto; padding: 0; flex: 1; }
        .board-header { padding: 32px 48px; border-bottom: 1px solid var(--glass-border); background: rgba(5, 5, 5, 0.8); position: sticky; top: 0; z-index: 10; }
        
        .action-panel-grid { padding: 32px 48px; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
        .action-card { background: var(--card-bg); border: 1px solid var(--glass-border); padding: 24px; border-radius: 16px; transition: transform 0.2s; display: flex; flex-direction: column; }
        .action-card h3 { color: var(--primary); font-family: 'Outfit'; margin-top: 0; }
        
        .prime-btn { background: linear-gradient(135deg, var(--primary), #b794f6); color: #000; font-weight: 700; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; width: 100%; margin-top: 16px; }
        .prime-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* LEGAL SHIELD CSS */
        .legal-shield { background: rgba(255, 0, 0, 0.05); border: 1px solid rgba(255, 0, 0, 0.2); padding: 15px; border-radius: 8px; margin-top: 15px; }
        .legal-shield label { display: flex; align-items: center; cursor: pointer; color: #fca5a5; font-size: 0.85rem; font-weight: 600; }
        .legal-shield input { margin-right: 10px; width: 18px; height: 18px; accent-color: #ef4444; }

        .editor-area { margin: 0 48px 48px; background: #0f0f11; border: 1px solid var(--glass-border); border-radius: 16px; padding: 24px; }
        .results-section { margin: 0 48px 48px; display: flex; flex-direction: column; gap: 16px; }
        .result-box { background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); border-radius: 12px; padding: 20px; border-left: 4px solid var(--primary); }
        .code-block { background: #000; padding: 15px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: var(--primary); white-space: pre-wrap; margin-top: 10px; border: 1px solid var(--glass-border); }
      `}</style>

      <div className="mission-control-layout">
        {/* SIDEBAR */}
        <aside className="config-sidebar">
          <h3 style={{ color: 'white', fontFamily: 'Outfit' }}>⚡ Phoenix Flow</h3>
          <div className="input-row">
            <label>Store URL</label>
            <input value={config.shopifyUrl} onChange={e => setConfig({ ...config, shopifyUrl: e.target.value })} placeholder="https://..." />
          </div>
          <button className="prime-btn" onClick={() => runAction('identity')} disabled={loading.identity}>
            {loading.identity ? "Analyzing..." : "✨ Detect Identity"}
          </button>
        </aside>

        {/* MAIN BOARD */}
        <main className="mission-board">
          <header className="board-header">
            <h1 style={{ color: 'white', margin: 0 }}>Merchant Co-Pilot</h1>
          </header>

          <div className="action-panel-grid">
            <div className="action-card">
              <h3>🛡️ Trust Audit</h3>
              <p>Scan for Google compliance issues.</p>
              <button className="prime-btn" onClick={() => runAction('audit')} disabled={loading.audit}>Run Audit</button>
            </div>

            <div className="action-card">
              <h3>📝 Smart Editor</h3>
              <p>Rewrite text for SEO or Trust.</p>
              <button className="prime-btn" onClick={() => document.getElementById('editor')?.scrollIntoView({ behavior: 'smooth' })}>Open Editor</button>
            </div>

            {/* MEDIA STUDIO CARD */}
            <div className="action-card" style={{ borderColor: '#a78bfa' }}>
              <h3>🎬 Media Studio</h3>
              <p>Generate Viral Ads & Music Videos.</p>
              <button className="prime-btn" onClick={() => document.getElementById('media-studio')?.scrollIntoView({ behavior: 'smooth' })}>Open Studio</button>
            </div>
          </div>

          {/* --- MEDIA STUDIO SECTION (WITH LEGAL SHIELD) --- */}
          <div id="media-studio" className="editor-area" style={{ border: '1px solid #a78bfa' }}>
            <h3 style={{ fontFamily: 'Outfit', marginTop: 0, color: '#a78bfa' }}>Phoenix Media Studio</h3>

            <fetcher.Form method="post" action="/api/phoenix">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="input-row">
                  <label>Product Name</label>
                  <input name="productName" value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. Neon Gaming Headset" required />
                </div>
                <div className="input-row">
                  <label>Format</label>
                  <select name="contentType" value={mediaType} onChange={e => setMediaType(e.target.value)}>
                    <option value="product_ad">TikTok Ad Strategy (JSON)</option>
                    <option value="music_video">Music Video Script (JSON)</option>
                  </select>
                </div>
              </div>

              <input type="hidden" name="actionType" value="generate_media" />
              <input type="hidden" name="brandContext" value={config.brandName || "My Brand"} />

              {/* ✅ THE LEGAL SHIELD (CHECKBOX) IS HERE ✅ */}
              <div className="legal-shield">
                <label>
                  <input
                    type="checkbox"
                    name="rightsConfirmed"
                    value="true"
                    checked={legalAgreed}
                    onChange={(e) => setLegalAgreed(e.target.checked)}
                  />
                  <span>I certify that I own the commercial rights to any music/audio used here.</span>
                </label>
              </div>

              <button
                className="prime-btn"
                type="submit"
                disabled={!legalAgreed || fetcher.state === "submitting"}
                style={{ opacity: !legalAgreed ? 0.5 : 1 }}
              >
                {fetcher.state === "submitting" ? "Generating..." : "🚀 Generate Media Asset"}
              </button>
            </fetcher.Form>

            {/* RESULTS */}
            {fetcher.data && (
              <div className="code-block" style={{ marginTop: '20px', border: '1px solid #a78bfa' }}>
                {JSON.stringify(fetcher.data, null, 2)}
              </div>
            )}
          </div>

          {/* EDITOR SECTION */}
          <div id="editor" className="editor-area">
            <h3 style={{ fontFamily: 'Outfit', marginTop: 0 }}>Smart Editor</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
              <div>
                <select value={editorGoal} onChange={e => setEditorGoal(e.target.value)}>
                  <option value="trust">Fix Trust/Compliance</option>
                  <option value="seo">SEO Optimization</option>
                </select>
                <button className="prime-btn" onClick={() => runAction('editor')} disabled={loading.editor}>Optimize</button>
              </div>
              <textarea rows={6} value={editorInput} onChange={e => setEditorInput(e.target.value)} placeholder="Paste text here..." />
            </div>
          </div>

          {/* RESULTS FEED */}
          <div className="results-section">
            {analysis.trustAudit && analysis.trustAudit.map((item: any, i: number) => (
              <div key={i} className="result-box"><strong>⚠️ {item.issue}</strong><p>{item.recommendation}</p></div>
            ))}
            {analysis.contentEdits && analysis.contentEdits.map((item: any, i: number) => (
              <div key={i} className="result-box"><div className="code-block">{item.editedContent}</div></div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}