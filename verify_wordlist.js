
import { wordToIndex } from './src/utils/bip39.js';
import fs from 'fs';

// Read the file directly to avoid export issues if not using module
// Or just regex parse it because it's a single file

const content = fs.readFileSync('./src/utils/bip39.js', 'utf-8');
const match = content.match(/const wordlist = \[(.*?)\];/s);

if (match) {
    const rawList = match[1];
    // Split by comma and clean quotes
    const words = rawList.split(',').map(w => w.trim().replace(/^"|"$/g, ''));

    console.log(`Total words: ${words.length}`);

    const unique = new Set(words);
    console.log(`Unique words: ${unique.size}`);

    if (words.length !== unique.size) {
        console.log("Duplicates found!");
    }

    if (words.length !== 2048) {
        console.log("Length check FAILED");
    } else {
        console.log("Length check PASSED");
    }
} else {
    console.log("Could not find wordlist in file");
}
