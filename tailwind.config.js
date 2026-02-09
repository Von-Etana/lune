/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./App.tsx"
    ],
    theme: {
        extend: {
            colors: {
                cream: '#F3F0E7',
                teal: '#1F4D48',
                orange: '#F26430',
                darkblue: '#2B4C55',
                charcoal: '#1E1E1E',
                editor: '#1e1e1e',
                editorSide: '#252526',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['Fira Code', 'monospace'],
            }
        },
    },
    plugins: [],
}
