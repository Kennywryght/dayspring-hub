/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Oxford Navy — institutional weight, used for sidebar (fixed) and dark-mode surfaces
        navy: {
          50: '#EEF1F5',
          100: '#D9DFE8',
          200: '#B3C0D1',
          300: '#8394AE',
          400: '#56698A',
          500: '#334764',
          600: '#243652',
          700: '#182842',
          800: '#0F1D33',
          900: '#0A1526',
        },
        // Parchment — warm off-white, main light-mode surface
        parchment: {
          DEFAULT: '#F7F4EC',
          100: '#F0ECE0',
          200: '#E5DFCE',
        },
        // Brass — single restrained accent, the "dayspring" nod
        brass: {
          50: '#FAF5EC',
          100: '#F0E3C7',
          200: '#DEC593',
          300: '#C9A968',
          400: '#B8924E',
          500: '#A87C3F',
          600: '#8C6531',
          700: '#6F4F27',
          800: '#54391C',
          900: '#3A2712',
        },
        // Status colors — muted, institutional rather than saturated/app-y
        forest: {
          50: '#EEF3EE',
          500: '#3E6B44',
          600: '#2F5233',
          700: '#233E27',
        },
        oxbrick: {
          50: '#F4ECE9',
          500: '#96493A',
          600: '#7A3B2E',
          700: '#5C2C22',
        },
        // Ink — warm-tinted neutral scale for text/borders, replaces default gray
        ink: {
          50: '#F5F6F8',
          100: '#E8EAEE',
          200: '#D3D7DF',
          300: '#AEB5C2',
          400: '#828B9E',
          500: '#5C6478',
          600: '#454B5C',
          700: '#333846',
          800: '#20232C',
          900: '#14161B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgba(15, 29, 51, 0.06), 0 1px 3px 0 rgba(15, 29, 51, 0.08)',
        'card': '0 0 0 1px rgba(15, 29, 51, 0.06), 0 1px 2px 0 rgba(15, 29, 51, 0.06)',
        'elevated': '0 4px 6px -2px rgba(15, 29, 51, 0.08), 0 10px 15px -3px rgba(15, 29, 51, 0.08)',
      },
      borderRadius: {
        DEFAULT: '0.375rem',
      },
    },
  },
  plugins: [],
};