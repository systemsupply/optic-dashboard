import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#111111',
        surface: '#1A1A1A',
        border: '#2A2A2A',
        muted: '#707070',
        body: '#A0A0A0',
        heading: '#F1F1F1',
        green: '#4ade80',
        error: '#E75C5C',
      },
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
