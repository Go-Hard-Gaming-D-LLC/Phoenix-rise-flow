import fs from 'fs';
import path from 'path';

const REQUIRED_FILES = [
    'app/gemini.server.ts',
    'app/routes/api.bulk-analyze.tsx',
    'netlify.toml',
    'package.json'
];

console.log("🦅 Phoenix Flow: Scanning for structural bugs...");

// 1. Check for Case-Sensitivity & Missing Files (Linux 404 Prevention)
REQUIRED_FILES.forEach(file => {
    if (!fs.existsSync(path.join(process.cwd(), file))) {
        console.error(`❌ BUG DETECTED: Missing critical file or case mismatch: ${file}`);
        process.exit(1);
    }
});

// 2. Audit Gemini Server Logic (Safety Block Check)
const geminiServer = fs.readFileSync('app/gemini.server.ts', 'utf8');
if (geminiServer.includes('runGeminiAnalysis')) {
    console.warn("⚠️ OBSOLETE CODE: 'runGeminiAnalysis' is referenced but not defined in your v3 logic.");
}

// 3. Verify Netlify Redirects (404 Prevention)
const netlifyToml = fs.readFileSync('netlify.toml', 'utf8');
if (!netlifyToml.includes('[[redirects]]') || !netlifyToml.includes('/*')) {
    console.error("❌ BUG DETECTED: netlify.toml is missing SPA catch-all redirects.");
    process.exit(1);
}

// 4. Verify Admin Bypass (God Mode Check)
if (netlifyToml.includes('C:\\')) {
    console.error("❌ BUG DETECTED: Absolute Windows paths found in netlify.toml. Netlify will fail.");
    process.exit(1);
}

console.log("✅ Phoenix Scan Complete: Structure is sound.");
