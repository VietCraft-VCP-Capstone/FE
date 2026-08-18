/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0f172a',
                primary: {
                    light: '#f59e0b',
                    DEFAULT: '#d97706',
                    dark: '#b45309',
                },
                accent: {
                    light: '#f43f5e',
                    DEFAULT: '#e11d48',
                    dark: '#be123c',
                }
            },
            fontFamily: {
                sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
