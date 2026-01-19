/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                space: {
                    900: '#0b0d17',
                    800: '#151932',
                    700: '#20264d',
                }
            }
        },
    },
    plugins: [],
}
