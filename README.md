# ✨ Star(bip)Map

**Transform your BIP-39 Mnemonic Seed Phrases into unique, aesthetic Star Map visualizations.**

Star(bip)Map is a security-focused creative tool that converts the deterministic data of a 12 or 24-word recovery phrase into a beautiful cosmic map. It provides an alternative way to "back up" your keys as a visual artifact that looks like art but contains the structural data of your seed.

---

## 🌌 Features

- **Deterministic Visualization**: Every unique mnemonic phrase generates a unique, reproducible star pattern.
- **Zodiac Integration**: Stars are mapped within a professional-grade Zodiac ring and celestial coordinate system.
- **Customizable HUD**:
  - **Grid System**: Toggle between 'Simple' and 'Full' celestial coordinate grids.
  - **Transformation**: Rotate the map to your preferred orientation before exporting.
  - **High-Resolution Export**: Save your map as a crystal-clear 2048x2048 PNG, perfect for physical printing or digital storage.
- **Responsive Design**: Premium dark-mode UI that works seamlessly on Desktop, iPad, and Mobile.
- **Security First**: All processing happens locally in your browser. No seed phrases are ever sent to a server.

<img width="2024" height="2024" alt="bip39-starmap-1768785108553" src="https://github.com/user-attachments/assets/b18fd813-8e93-402f-ab0f-8ecc4b7bfcce" />

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Exporting**: [html-to-image](https://www.npmjs.com/package/html-to-image)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/BipStarMap.git
   ```
2. Navigate to the directory:
   ```bash
   cd BipStarMap
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the local development server:
```bash
npm run dev
```

### Production Build

Build the project for production (output to `dist/`):
```bash
npm run build
```

## 🔒 Security Disclaimer

This tool is designed for creative and aesthetic purposes. While the star map is a deterministic representation of your seed:
1. **Physical Security**: If you print this map, treat it with the same level of security as a written seed phrase. Anyone with knowledge of the algorithm could reconstruct your words.
2. **Environment**: Ensure you are using this tool in a safe, private environment.
3. **No Storage**: This application does not store your seed phrases. Once you close the tab, the data is gone.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Designed with ❤️ by [aexxa from monoG]*
