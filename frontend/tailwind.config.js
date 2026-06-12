/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Token design system "Champagne" (lihat index.css :root / .dark)
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        ink: 'var(--ink)',
        inksoft: 'var(--ink-soft)',
        inkfaint: 'var(--ink-faint)',
        line: 'var(--line)',
        accent: 'var(--accent)',
        accentsoft: 'var(--accent-soft)',
        accentink: 'var(--accent-ink)',
        up: 'var(--up)',
        down: 'var(--down)',
        // legacy
        primary: '#3b82f6',
        secondary: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
