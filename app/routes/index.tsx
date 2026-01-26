import { useState, useEffect } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { ShopifyClient } from '../utils/shopifyClient';
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server"; // ✅ Uses your real server file
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- SERVER SIDE ---
export const loader = async ({ request }: LoaderFunctionArgs) => {
  // ✅ AUTHENTICATION: This ensures only logged-in Shopify admins can see this
  const { admin } = await authenticate.admin(request);

  return json({
    apiKey: process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE",
    shop: admin.rest.session.shop
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  // Future: Add logic here to modify themes or products via admin.graphql
  return json({ success: true });
};

// --- CLIENT SIDE ---
export default function Index() {
  const { apiKey, shop } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  // --- STATE ---
  const [config, setConfig] = useState({ brandName: "", shopifyUrl: `https://${shop}`, etsyUrl: "" });
  const [loading, setLoading] = useState({ identity: false, audit: false, editor: false });
  const [analysis, setAnalysis] = useState<any>({});
  const [editorInput, setEditorInput] = useState("");
  const [editorGoal, setEditorGoal] = useState("trust");

  // --- AI ENGINE ---
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // --- ACTIONS ---
  const runAction = async (type: 'identity' | 'audit' | 'editor') => {
    if (type !== 'editor' && !config.shopifyUrl) return alert("Shop URL missing");
    if (type === 'editor' && !editorInput) return alert("Text missing");

    setLoading(prev => ({ ...prev, [type]: true }));

    try {
      let prompt = "";
      if (type === 'identity') {
        prompt = `Analyze ${config.shopifyUrl}. Return JSON: { "summary": "...", "targetAudience": "...", "usp": "..." }`;
      } else if (type === 'audit') {
        prompt = `Audit ${config.shopifyUrl} for Misrepresentation. Return JSON: { "trustAudit": [{ "issue": "...", "location": "...", "recommendation": "..." }] }`;
      } else if (type === 'editor') {
        prompt = `Rewrite for "${editorGoal}": "${editorInput}". Return JSON: { "editedContent": "...", "explanation": "..." }`;
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
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#0f0f12', color: 'white', minHeight: '100vh', padding: '20px' }}>
      <header style={{ borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#a78bfa' }}>Merchant Co-Pilot</h1>
        <p style={{ color: '#888', margin: 0 }}>Connected to: <span style={{ color: '#4ade80' }}>{shop}</span></p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>

        {/* SIDEBAR */}
        <aside style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <h3 style={{ marginTop: 0 }}>⚡ Actions</h3>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '0.8rem', color: '#888' }}>Brand Name</label>
            <input
              value={config.brandName}
              onChange={e => setConfig({ ...config, brandName: e.target.value })}
              style={{ width: '100%', padding: '8px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
              placeholder="e.g. Iron Phoenix"
            />
          </div>

          <button
            onClick={() => runAction('identity')}
            disabled={loading.identity}
            style={{ width: '100%', padding: '10px', background: '#a78bfa', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold' }}
          >
            {loading.identity ? "Analyzing..." : "Detect Identity"}
          </button>

          <button
            onClick={() => runAction('audit')}
            disabled={loading.audit}
            style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #a78bfa', color: '#a78bfa', borderRadius: '6px', cursor: 'pointer' }}
          >
            {loading.audit ? "Scanning..." : "Trust Audit"}
          </button>
        </aside>

        {/* MAIN AREA */}
        <main>
          {analysis.brandIdentity && (
            <div style={{ background: 'rgba(167, 139, 250, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid #a78bfa', marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0, color: '#a78bfa' }}>Identity Detected</h3>
              <p><strong>Summary:</strong> {analysis.brandIdentity.summary}</p>
              <p><strong>USP:</strong> {analysis.brandIdentity.usp}</p>
            </div>
          )}

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
            <h3 style={{ marginTop: 0 }}>Smart Editor</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
              <div>
                <select
                  value={editorGoal} onChange={e => setEditorGoal(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '6px', marginBottom: '10px' }}
                >
                  <option value="trust">Fix Compliance</option>
                  <option value="seo">SEO Optimization</option>
                  <option value="sales">Sales Conversion</option>
                </select>
                <button
                  onClick={() => runAction('editor')}
                  disabled={loading.editor}
                  style={{ width: '100%', padding: '10px', background: '#a78bfa', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {loading.editor ? "Rewriting..." : "✨ Optimize"}
                </button>
              </div>
              <textarea
                rows={5}
                value={editorInput} onChange={e => setEditorInput(e.target.value)}
                placeholder="Paste text here..."
                style={{ width: '100%', padding: '10px', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '6px', fontFamily: 'inherit' }}
              />
            </div>

            {analysis.contentEdits && analysis.contentEdits.map((item: any, i: number) => (
              <div key={i} style={{ marginTop: '20px', background: '#000', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #a78bfa' }}>
                <pre style={{ whiteSpace: 'pre-wrap', color: '#ddd', fontFamily: 'monospace' }}>{item.editedContent}</pre>
                <p style={{ color: '#888', fontSize: '0.9rem', margin: '10px 0 0' }}>{item.explanation}</p>
              </div>
            ))}
          </div>

          {analysis.trustAudit && (
            <div style={{ marginTop: '20px' }}>
              {analysis.trustAudit.map((item: any, i: number) => (
                <div key={i} style={{ background: 'rgba(255, 107, 107, 0.1)', borderLeft: '4px solid #ff6b6b', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                  <strong style={{ color: '#ff6b6b' }}>{item.issue}</strong>
                  <p style={{ margin: '5px 0', color: '#ccc' }}>{item.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}