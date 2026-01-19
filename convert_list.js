
import fs from 'fs';
import { isValidWord, wordToIndex, indexToBinary, processMnemonic, generateMnemonic } from './src/utils/bip39.js'; // We can't import if we overwrite it, but we can read the functions from source or just rewrite them.

// Actually, I will just read the text file, and WRITE the full bip39.js file content with the new array.
// I need the other functions too. I'll duplicate them here to be safe and write the whole file.

const words = fs.readFileSync('official_wordlist.txt', 'utf-8')
    .split(/\r?\n/)
    .map(w => w.trim())
    .filter(w => w.length > 0);

console.log(`Loaded ${words.length} words from file.`);

if (words.length !== 2048) {
    console.error("ERROR: Wordlist length is not 2048!");
    process.exit(1);
}

const fileContent = `// BIP39 English Wordlist
const wordlist = [
    "${words.join('", "')}"
];

/**
 * Checks if a word is in the BIP39 wordlist.
 * @param {string} word - The word to check.
 * @returns {boolean}
 */
export const isValidWord = (word) => {
    return wordlist.includes(word.toLowerCase());
}

/**
 * Gets the index of a word in the BIP39 wordlist (0-2047).
 * @param {string} word 
 * @returns {number} - Index or -1 if not found.
 */
export const wordToIndex = (word) => {
    return wordlist.indexOf(word.toLowerCase());
}

/**
 * Converts a number to an 11-bit binary string.
 * @param {number} index 
 * @returns {string}
 */
export const indexToBinary = (index) => {
    if (index < 0 || index > 2047) return null;
    return index.toString(2).padStart(11, '0');
}

/**
 * Validates and converts an array of 12 words.
 * @param {string[]} words 
 * @returns {{valid: boolean, data: {word: string, index: number, binary: string}[]}}
 */
export const processMnemonic = (words) => {
    if (!words) return { valid: false, data: [] };

    const result = [];
    let allValid = true;

    for (const word of words) {
        const cleanWord = word.trim().toLowerCase();
        
        const index = wordToIndex(cleanWord);
        
        if (index === -1) {
            allValid = false;
        }

        result.push({
            word: cleanWord,
            index,
            binary: index !== -1 ? indexToBinary(index) : null
        });
    }

    // Valid only if exactly 12 or 24 words AND all are valid
    const isValidLength = result.length === 12 || result.length === 24;

    return { valid: allValid && isValidLength, data: result };
}

/**
 * Generates a random dummy mnemonic.
 * @param {number} length - 12 or 24
 * @returns {string}
 */
export const generateMnemonic = (length = 12) => {
    const words = [];
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * wordlist.length);
        words.push(wordlist[randomIndex]);
    }
    return words.join(' ');
}
`;

fs.writeFileSync('./src/utils/bip39.js', fileContent);
console.log("Updated src/utils/bip39.js successfully.");
