/** @type {import('tailwindcss').Config} */

// The accent colour, in one place. Every accent in the app is `brand-*`, so
// retheming means editing this object — not hunting ~250 colour classes across
// 18 files, which is what the previous hardcoded `indigo-*` usage required.
// Values are Tailwind's `orange` scale.
//
// RESTART THE DEV SERVER after editing this file. Tailwind reads its config
// once at startup; a running `npm run dev` keeps serving the old palette and
// reports the new classes as "does not exist" in the Vite error overlay.
// (`FUNNEL_COLOR` in components/common/PipelineFunnel.tsx needs matching by
// hand too — Recharts takes literal colours, not Tailwind classes.)
const brand = {
  50: '#fff7ed',
  100: '#ffedd5',
  200: '#fed7aa',
  300: '#fdba74',
  400: '#fb923c',
  500: '#f97316',
  600: '#ea580c',
  700: '#c2410c',
  800: '#9a3412',
  900: '#7c2d12',
  950: '#431407',
}

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand,
        // Neutral surfaces for the light theme. `gray-*` is used directly
        // throughout; these aliases name the three that carry meaning.
        surface: {
          page: '#f9fafb',   // gray-50  — app background
          card: '#ffffff',   // white    — raised panels
          muted: '#f3f4f6',  // gray-100 — inputs, table headers, hover rows
        },
      },
    },
  },
  plugins: [],
}
