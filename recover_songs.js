
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
const HISTORY_FILE = './app/assets/music_history.json';
const OUTPUT_DIR = '../Restored_Suno_Library'; // Creates folder one level up to keep app clean
const CONCURRENCY_LIMIT = 5;
const DELAY_BETWEEN_BATCHES_MS = 1000;

// --- SETUP ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function downloadFile(url, outputPath) {
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        if (error.response && error.response.status === 404) {
            throw new Error("404 Not Found (Link Expired or Invalid)");
        }
        throw error;
    }
}

async function restoreLibrary() {
    console.log("--- 🎵 SUNO LIBRARY RESURRECTION PROTOCOL 🎵 ---");

    // 1. Locate History File
    const historyPath = path.resolve(process.cwd(), HISTORY_FILE);
    if (!fs.existsSync(historyPath)) {
        console.error(`❌ CRITICAL: History file not found at ${historyPath}`);
        return;
    }

    // 2. Load IDs
    console.log(`📄 Reading history from: ${HISTORY_FILE}`);
    let songIds;
    try {
        const rawData = fs.readFileSync(historyPath, 'utf8');
        songIds = JSON.parse(rawData);
    } catch (e) {
        console.error("❌ Error parsing JSON:", e.message);
        return;
    }

    if (!Array.isArray(songIds)) {
        console.error("❌ Invalid format: Expected a JSON array of ID strings.");
        return;
    }

    console.log(`✅ Loaded ${songIds.length} Song IDs.`);

    // 3. Create Output Directory
    const outputAbsPath = path.resolve(process.cwd(), OUTPUT_DIR);
    if (!fs.existsSync(outputAbsPath)) {
        fs.mkdirSync(outputAbsPath, { recursive: true });
        console.log(`📂 Created library folder: ${outputAbsPath}`);
    } else {
        console.log(`📂 Using existing library folder: ${outputAbsPath}`);
    }

    // 4. Download Loop
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    // Process in chunks to respect concurrency
    for (let i = 0; i < songIds.length; i += CONCURRENCY_LIMIT) {
        const chunk = songIds.slice(i, i + CONCURRENCY_LIMIT);
        const promises = chunk.map(async (id) => {
            const fileName = `${id}.mp3`;
            const filePath = path.join(outputAbsPath, fileName);

            // Skip if exists
            if (fs.existsSync(filePath)) {
                // Check size to ensure ot 0 bytes? optional.
                process.stdout.write('.'); // Compact progress
                skipCount++;
                return;
            }

            // Construct Link (Standard Suno CDN pattern)
            const url = `https://cdn1.suno.ai/${id}.mp3`;

            try {
                // console.log(`⬇ Downloading: ${id}`);
                await downloadFile(url, filePath);
                successCount++;
                process.stdout.write('✓');
            } catch (err) {
                failCount++;
                process.stdout.write('X');
                // Optional: Log failed IDs to a separate file
                fs.appendFileSync('failed_downloads.txt', `${id}: ${err.message}\n`);
            }
        });

        await Promise.all(promises);

        // Small delay to be polite
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));

        // Periodic Status Update
        if ((i + chunk.length) % 100 === 0) {
            console.log(`\n--- Progress: ${i + chunk.length}/${songIds.length} (✅ ${successCount} | ⏭ ${skipCount} | ❌ ${failCount}) ---`);
        }
    }

    console.log("\n\n--- 🎉 RESTORE COMPLETE 🎉 ---");
    console.log(`Total IDs: ${songIds.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Skipped (Already There): ${skipCount}`);
    console.log(`Failed: ${failCount} (See failed_downloads.txt)`);
}

restoreLibrary();
