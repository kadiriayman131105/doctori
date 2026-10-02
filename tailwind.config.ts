import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
        },
        fb: {
          DEFAULT: '#1877F2',
          dark: '#166FE5',
          deep: '#0C4DA2',
          soft: '#E7F3FF',
          bg: '#F0F2F5',
          ink: '#050505',
          muted: '#65676B',
          line: '#CED0D4',
          green: '#31A24C',
        },
        ink: '#0f172a',
      },
      boxShadow: {
        card: '0 12px 32px -20px rgba(15, 23, 42, 0.45)',
      },
    },
  },
  plugins: [],
};

export default config;
