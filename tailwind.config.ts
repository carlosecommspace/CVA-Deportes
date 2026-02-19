import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fb',
          400: '#36acf7',
          500: '#0c92e8',
          600: '#0073c6',
          700: '#015ba0',
          800: '#064e84',
          900: '#0b416e',
          950: '#072a49',
        },
        cvared: {
          50: '#fff1f1',
          100: '#ffe1e1',
          200: '#ffc7c7',
          300: '#ffa0a0',
          400: '#ff6b6b',
          500: '#f83b3b',
          600: '#e51c1c',
          700: '#c11414',
          800: '#a01414',
          900: '#841717',
          950: '#480707',
        },
      },
    },
  },
  plugins: [],
}
export default config
