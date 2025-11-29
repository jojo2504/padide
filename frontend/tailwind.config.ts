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
        // Day Mode (The Surface) - Organic, Clean
        day: {
          bg: '#FEFEFE',
          surface: '#F5F5F5',
          glass: 'rgba(255, 255, 255, 0.7)',
          accent: '#22C55E', // Organic green
          text: '#0A0A0A',
          muted: '#737373',
        },
        // Night Mode (The Ledger) - Deep, Neon
        night: {
          bg: '#050505',
          surface: '#0A0A0A',
          void: '#000000',
          neon: {
            cyan: '#00FFFF',
            magenta: '#FF00FF',
            green: '#00FF88',
            purple: '#A855F7',
          },
          text: '#FAFAFA',
          muted: '#A3A3A3',
        },
        // Brand Colors
        cyclr: {
          primary: '#00FF88',
          secondary: '#A855F7',
          gold: '#FFD700',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        logo: ['var(--font-logo)', 'Space Grotesk', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'magnetic': 'magnetic 0.3s ease-out',
        'ripple': 'ripple 1s ease-out forwards',
        'shockwave': 'shockwave 0.8s ease-out forwards',
        'data-stream': 'dataStream 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(3deg)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(0, 255, 136, 0.6)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        shockwave: {
          '0%': { transform: 'scale(0.5)', opacity: '1' },
          '50%': { opacity: '0.5' },
          '100%': { transform: 'scale(3)', opacity: '0' },
        },
        dataStream: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'clay': '20px 20px 60px #d9d9d9, -20px -20px 60px #ffffff',
        'clay-dark': '20px 20px 60px #040404, -20px -20px 60px #060606',
        'neon-green': '0 0 20px rgba(0, 255, 136, 0.5), 0 0 40px rgba(0, 255, 136, 0.3)',
        'neon-purple': '0 0 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
