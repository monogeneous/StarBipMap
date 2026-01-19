
import fs from 'fs';

const content = fs.readFileSync('./src/utils/bip39.js', 'utf-8');
const match = content.match(/const wordlist = \[(.*?)\];/s);

if (match) {
    const rawList = match[1];
    const words = rawList.split(',').map(w => w.trim().replace(/^"|"$/g, ''));

    // Sort to see weird stuff at top/bottom
    const sorted = [...words].sort();

    console.log("First 5:", sorted.slice(0, 5));
    console.log("Last 5:", sorted.slice(-5));

    // Check for empty string
    const emptyCount = words.filter(w => w === '').length;
    console.log("Empty strings:", emptyCount);

    // Check for non-alpha
    const weird = words.filter(w => !/^[a-z]+$/.test(w));
    console.log("Weird words:", weird);
}
