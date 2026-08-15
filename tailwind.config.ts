import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Sovereign Indigo palette
        indigo: {
          DEFAULT: '#3B4CCA',
          dark: '#2A3A9E',
          50: '#EEF0FB',
          100: '#DDE1F7',
          200: '#BAC3EF',
          300: '#97A5E7',
          400: '#7487DF',
          500: '#3B4CCA',
          600: '#2F3DA2',
          700: '#232E7A',
          800: '#171E52',
          900: '#0B0F29',
        },
        // Semantic
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#0EA5E9',
        // Backgrounds
        background: {
          light: '#FAFAFA',
          DEFAULT: '#FFFFFF',
          dark: '#0F0F14',
          'dark-card': '#1A1A24',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Cal Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      spacing: {
        '18': '4.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-in-top': 'slideInTop 300ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInTop: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
