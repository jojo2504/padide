import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ============================================
        // ECO-PLAYFUL SOLARPUNK PALETTE
        // "Nintendo meets Patagonia"
        // ============================================
        
        // Day Mode Colors (Bright, Energetic)
        day: {
          bg: "#F7F5F0",        // Recycled paper cream
          surface: "#FFFFFF",
          elevated: "#FAFAF8",
        },
        
        // Night Mode Colors (Bioluminescent)
        night: {
          bg: "#0B1121",        // Deep ocean blue
          surface: "#131B2E",
          elevated: "#1A2540",
        },
        
        // Primary: Leaf Green (Nature/Growth)
        leaf: {
          DEFAULT: "#22C55E",
          light: "#4ADE80",
          dark: "#16A34A",
          glow: "rgba(34, 197, 94, 0.4)",
        },
        
        // Secondary: Sky Blue (Technology/Trust)
        sky: {
          DEFAULT: "#38BDF8",
          light: "#7DD3FC",
          dark: "#0EA5E9",
          glow: "rgba(56, 189, 248, 0.4)",
        },
        
        // Accent: Sunset Orange (Energy/Action)
        sunset: {
          DEFAULT: "#FB923C",
          light: "#FDBA74",
          dark: "#F97316",
          glow: "rgba(251, 146, 60, 0.4)",
        },
        
        // Neutral: Void (Dark base)
        void: {
          DEFAULT: "#0B1121",
          deep: "#050A15",
          surface: "#131B2E",
        },
        
        // Clay material colors
        clay: {
          light: "#E8E4DC",
          DEFAULT: "#D4CFC4",
          dark: "#B8B3A8",
          warm: "#F5E6D3",
        },
        
        // Frosted glass
        frost: {
          white: "rgba(255, 255, 255, 0.7)",
          blue: "rgba(11, 17, 33, 0.7)",
          border: "rgba(255, 255, 255, 0.2)",
        },
        
        // Legacy colors (for compatibility)
        holographic: {
          DEFAULT: "#E2E8F0",
          muted: "#94A3B8",
          dim: "#64748B",
        },
        chlorophyll: {
          DEFAULT: "#22C55E",
          bright: "#4ADE80",
          dark: "#16A34A",
        },
        cyber: {
          DEFAULT: "#38BDF8",
          bright: "#7DD3FC",
          dark: "#0EA5E9",
        },
        glass: {
          DEFAULT: "rgba(0, 0, 0, 0.2)",
          border: "rgba(255, 255, 255, 0.1)",
          panel: "rgba(255, 255, 255, 0.05)",
        },
      },
      
      fontFamily: {
        heading: ['var(--font-fredoka)', 'Fredoka', 'system-ui', 'sans-serif'],
        body: ['var(--font-nunito)', 'Nunito', 'system-ui', 'sans-serif'],
        sans: ['var(--font-nunito)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      
      fontSize: {
        'display-hero': ['clamp(3.5rem, 12vw, 8rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-xl': ['clamp(3rem, 10vw, 6rem)', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2.5rem, 8vw, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(2rem, 5vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'display-sm': ['clamp(1.5rem, 3vw, 2rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
      
      boxShadow: {
        'clay': '0 8px 30px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08), inset 0 2px 0 rgba(255,255,255,0.4)',
        'clay-lg': '0 20px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.1), inset 0 2px 0 rgba(255,255,255,0.4)',
        'clay-pressed': '0 2px 8px rgba(0,0,0,0.15), inset 0 2px 4px rgba(0,0,0,0.1)',
        'glow-leaf': '0 0 40px rgba(34, 197, 94, 0.3), 0 0 80px rgba(34, 197, 94, 0.15)',
        'glow-sky': '0 0 40px rgba(56, 189, 248, 0.3), 0 0 80px rgba(56, 189, 248, 0.15)',
        'glow-sunset': '0 0 40px rgba(251, 146, 60, 0.3), 0 0 80px rgba(251, 146, 60, 0.15)',
        'frost': '0 8px 32px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.1)',
        'glow': '0 0 40px rgba(34, 197, 94, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      
      animation: {
        'pop-in': 'pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-up-pop': 'slide-up-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-left': 'slide-left 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-right': 'slide-right 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'wiggle': 'wiggle 3s ease-in-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'recycle-spin': 'recycle-spin 1.5s ease-in-out infinite',
        'shockwave': 'shockwave 0.6s ease-out forwards',
        'bounce-in': 'bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
      },
      
      keyframes: {
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '70%': { opacity: '1', transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-up-pop': {
          '0%': { opacity: '0', transform: 'translateY(40px) scale(0.95)' },
          '70%': { opacity: '1', transform: 'translateY(-5px) scale(1.02)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        },
        'slide-left': {
          '0%': { opacity: '0', transform: 'translateX(-100px) skewX(10deg)' },
          '100%': { opacity: '1', transform: 'translateX(0) skewX(0deg)' },
        },
        'slide-right': {
          '0%': { opacity: '0', transform: 'translateX(100px) skewX(-10deg)' },
          '100%': { opacity: '1', transform: 'translateX(0) skewX(0deg)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        'breathe': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.3)' },
        },
        'recycle-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '33%': { transform: 'rotate(120deg)' },
          '66%': { transform: 'rotate(240deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'shockwave': {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        'bounce-in': {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      
      backgroundImage: {
        'paper-grain': `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
      
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      
      borderRadius: {
        'clay': '24px',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
};

export default config;
