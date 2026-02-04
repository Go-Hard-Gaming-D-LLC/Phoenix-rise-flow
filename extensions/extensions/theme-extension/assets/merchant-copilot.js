import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
// We use the Google GenAI SDK loaded from the CDN via importmap
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Animated Background Component ---
function AnimatedBackground({ gap = 60, radius = 1.2, color = "rgba(224, 187, 228, 0.1)", glowColor = "rgba(255, 209, 220, 0.5)" }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        const ctx = canvas.getContext("2d");

        const resize = () => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        };
        window.addEventListener("resize", resize);
        resize();

        const points = [];
        for (let x = 0; x < canvas.width; x += gap) {
            for (let y = 0; y < canvas.height; y += gap) {
                points.push({ x, y, phase: Math.random() * Math.PI * 2 });
            }
        }

        let animationFrame;
        const animate = (time) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            points.forEach(p => {
                const intensity = 0.5 + 0.5 * Math.sin(time * 0.001 + p.phase);
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = intensity > 0.8 ? glowColor : color;
                ctx.fill();
            });
            animationFrame = requestAnimationFrame(animate);
        };
        animate(0);

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrame);
        };
    }, [gap, radius, color, glowColor]);

    return (
        <div ref={containerRef} style={{ position: "fixed", inset: 0, zIndex: -1, background: "#0f0f12" }}>
            <canvas ref={canvasRef} style={{ display: "block" }} />
        </div>
    );
}

// --- Icons ---
const IconCheck = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418L9.743 3.25l2.579.375a.75.75 0 0 1 .416 1.285l-1.867 1.82.44 2.569a.75.75 0 0 1-1.088.791L8 8.975l-2.302 1.21a.75.75 0 0 1-1.088-.79l.44-2.57-1.867-1.82a.75.75 0 0 1 .416-1.285l2.579-.375L7.327.668A.75.75 0 0 1 8 .25z" /></svg>
);

// --- Main App Component ---
async function askPhoenix(productName) {
    // 1. We call the Shopify Proxy URL (not your App URL directly)
    // Note: /apps/phoenix maps to your secure api.proxy.shopify.tsx
    const proxyUrl = "/apps/phoenix";

    try {
        const response = await fetch(proxyUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Shopify automatically adds the signature header here
            },
            body: JSON.stringify({
                action: "generate_description",
                context: {
                    productName: productName,
                    features: ["Handmade", "Organic"]
                }
            })
        });

        if (!response.ok) throw new Error("Proxy Error");

        const data = await response.json();
        console.log("Phoenix Says:", data.data);
        return data.data;

    } catch (error) {
        console.error("AI Generation Failed:", error);
    }
}

function App() {
    // State Management
    const [loading, setLoading] = useState({});
    const [notification, setNotification] = useState("");
    const [config, setConfig] = useState({
        brandName: "",
        shopifyUrl: "",
        etsyUrl: ""
    });
    const [analysis, setAnalysis] = useState(null);

    // Editor State
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorGoal, setEditorGoal] = useState("trust");
    const [editorInput, setEditorInput] = useState("");

    // Initialize Google AI
    // ⚠️ WARNING: In a real app, never put keys in frontend code. 
    // This is for local prototyping only.
    const genAI = new GoogleGenerativeAI("YOUR_API_KEY_HERE");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // --- Helper Functions ---
    const showMessage = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(""), 3000);
    };

    const updateConfig = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    // --- AI Actions ---

    // 1. Auto-Detect Brand Identity
    const detectIdentity = async () => {
        const url = config.shopifyUrl || config.etsyUrl;
        if (!url) return showMessage("Please enter a URL first.");

        setLoading(prev => ({ ...prev, identity: true }));
        try {
            const prompt = `Analyze the e-commerce storefront at ${url}. Deduce the Brand Identity in JSON format:
            { "summary": "One sentence summary", "targetAudience": "Specific ideal customer", "usp": "Unique Selling Proposition" }`;

            const result = await model.generateContent(prompt);
            const response = result.response.text();

            // Basic cleanup to parse JSON
            const jsonStr = response.replace(/```json|```/g, "").trim();
            const data = JSON.parse(jsonStr);

            setAnalysis(prev => ({ ...prev, brandIdentity: data }));
            showMessage("Brand Identity Detected!");
        } catch (error) {
            console.error(error);
            showMessage("Failed to detect identity.");
        } finally {
            setLoading(prev => ({ ...prev, identity: false }));
        }
    };

    // 2. Trust Audit
    const runTrustAudit = async () => {
        const url = config.shopifyUrl || config.etsyUrl;
        if (!url) return showMessage("Please enter a URL first.");

        setLoading(prev => ({ ...prev, trust: true }));
        try {
            const prompt = `Act as a Google Merchant Center Investigator. Audit ${url} for "Misrepresentation" triggers.
            Check:
            1. Identity Consistency (Address/Phone/Email visibility).
            2. Refund Policy clarity (Restocking fees, who pays shipping).
            3. Secure checkout indicators.
            
            Respond in JSON format: { "trustAudit": [ { "issue": "...", "location": "...", "recommendation": "..." } ] }`;

            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json|```/g, "").trim();
            const data = JSON.parse(text);

            setAnalysis(prev => ({ ...prev, trustAudit: data.trustAudit }));
            showMessage("Trust Audit Complete.");
        } catch (error) {
            console.error(error);
            showMessage("Audit failed.");
        } finally {
            setLoading(prev => ({ ...prev, trust: false }));
        }
    };

    // 3. Smart Content Editor
    const runSmartEditor = async () => {
        if (!editorInput) return showMessage("Please enter some text to edit.");

        setLoading(prev => ({ ...prev, editor: true }));
        try {
            const context = analysis?.brandIdentity
                ? `Brand Context: ${analysis.brandIdentity.summary}. USP: ${analysis.brandIdentity.usp}.`
                : "";

            const prompt = `Act as an expert copywriter. Rewrite the following text.
            Goal: ${editorGoal} (Make it compliant, persuasive, or SEO optimized).
            ${context}
            
            Input Text: "${editorInput}"
            
            Respond in JSON: { "editedContent": "...", "explanation": "..." }`;

            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json|```/g, "").trim();
            const data = JSON.parse(text);

            setAnalysis(prev => ({
                ...prev,
                contentEdits: [data, ...(prev?.contentEdits || [])]
            }));
            showMessage("Content Rewritten!");
        } catch (error) {
            console.error(error);
            showMessage("Editor failed.");
        } finally {
            setLoading(prev => ({ ...prev, editor: false }));
        }
    };

    return (
        <div className="app-container">
            <AnimatedBackground />

            {/* Notification Toast */}
            {notification && <div className="toast">{notification}</div>}

            <div className="layout">
                {/* Sidebar Configuration */}
                <aside className="sidebar">
                    <div className="sidebar-header">
                        <IconCheck /> <h3>Business Vitals</h3>
                    </div>

                    <div className="input-group">
                        <label>Brand Name</label>
                        <input
                            value={config.brandName}
                            onChange={(e) => updateConfig('brandName', e.target.value)}
                            placeholder="My Brand"
                        />
                    </div>

                    <div className="input-group">
                        <label>Shopify URL</label>
                        <input
                            value={config.shopifyUrl}
                            onChange={(e) => updateConfig('shopifyUrl', e.target.value)}
                            placeholder="myshop.com"
                        />
                    </div>

                    <div className="action-row">
                        <button
                            className="btn primary"
                            onClick={detectIdentity}
                            disabled={loading.identity}
                        >
                            {loading.identity ? "Analyzing..." : "✨ Detect Identity"}
                        </button>
                    </div>
                </aside>

                {/* Main Mission Board */}
                <main className="main-board">
                    <header>
                        <h1>Merchant Co-Pilot</h1>
                        <p>Optimization & Compliance Engine</p>
                    </header>

                    {/* Brand Identity Card */}
                    {analysis?.brandIdentity && (
                        <div className="card brand-card">
                            <h3>Brand Identity Detected</h3>
                            <p><strong>Summary:</strong> {analysis.brandIdentity.summary}</p>
                            <p><strong>Target:</strong> {analysis.brandIdentity.targetAudience}</p>
                            <p><strong>USP:</strong> {analysis.brandIdentity.usp}</p>
                        </div>
                    )}

                    {/* Action Grid */}
                    <div className="grid-actions">
                        <div className="card">
                            <h3>Trust & Compliance</h3>
                            <p>Scan for Google Merchant Center blocks.</p>
                            <button
                                className="btn secondary"
                                onClick={runTrustAudit}
                                disabled={loading.trust}
                            >
                                {loading.trust ? "Scanning..." : "Run Audit"}
                            </button>
                        </div>

                        <div className="card">
                            <h3>Smart Editor</h3>
                            <p>Rewrite policies and descriptions.</p>
                            <button
                                className="btn secondary"
                                onClick={() => setEditorOpen(!editorOpen)}
                            >
                                {editorOpen ? "Close Editor" : "Open Editor"}
                            </button>
                        </div>
                    </div>

                    {/* Editor Interface */}
                    {editorOpen && (
                        <div className="card editor-panel">
                            <h3>Content Editor</h3>
                            <select value={editorGoal} onChange={(e) => setEditorGoal(e.target.value)}>
                                <option value="trust">Fix Trust/Compliance</option>
                                <option value="seo">Optimize for SEO</option>
                                <option value="sales">Boost Conversion</option>
                            </select>
                            <textarea
                                value={editorInput}
                                onChange={(e) => setEditorInput(e.target.value)}
                                placeholder="Paste your text here..."
                                rows={5}
                            />
                            <button
                                className="btn primary"
                                onClick={runSmartEditor}
                                disabled={loading.editor}
                            >
                                {loading.editor ? "Rewriting..." : "Optimize Content"}
                            </button>
                        </div>
                    )}

                    {/* Results Display */}
                    {analysis?.trustAudit && (
                        <div className="results-section">
                            <h3>Audit Results</h3>
                            {analysis.trustAudit.map((item, i) => (
                                <div key={i} className="result-item">
                                    <strong style={{ color: '#ff6b6b' }}>{item.issue}</strong>
                                    <p>{item.recommendation}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {analysis?.contentEdits && (
                        <div className="results-section">
                            <h3>Editor Output</h3>
                            {analysis.contentEdits.map((item, i) => (
                                <div key={i} className="result-item">
                                    <pre>{item.editedContent}</pre>
                                    <p className="explanation">{item.explanation}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);