# CYCLR Frontend

> **"Stripe meets National Geographic in the year 2050"**

An immersive, maximalist web experience for CYCLR - a regenerative finance platform built on XRPL.

## 🎨 Design Philosophy: "Organic Tech Maximalism"

CYCLR blends high-end FinTech precision with organic ecological motion, creating a living digital organism.

### The "Dual World" Concept

- **Day Mode (The Surface)**: Blindingly clean white, soft "clay" 3D shadows, frosted glass, floating organic shapes
- **Night Mode (The Ledger)**: Deep void black, neon data streams, glowing wireframes

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Production Build

```bash
npm run build
npm start
```

## 🏗️ Architecture

### Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + clsx |
| Theme | next-themes (Class-based) |
| 3D Graphics | React Three Fiber + Drei |
| Motion | GSAP + Framer Motion |
| Smooth Scroll | Lenis |

### Component Structure

```
src/
├── app/
│   ├── layout.tsx       # Root layout with providers
│   ├── page.tsx         # Main landing page
│   └── globals.css      # Global styles & CSS variables
├── components/
│   ├── effects/         # Visual effects (MouseTrail, ImageReveal)
│   ├── hero/           # Hero section with 3D portal
│   ├── journey/        # Escrow scrollytelling
│   ├── layout/         # Header, Footer
│   ├── loading/        # Loading screen animation
│   ├── providers/      # Context providers
│   ├── sections/       # Page sections (Features, Stats, CTA)
│   └── theme/          # Theme toggle component
```

## ✨ Key Components

### 1. LoadingScreen
3D logo assembly animation with:
- Magnetic physics for shape collision
- Shockwave explosion effect
- Progress indicator

### 2. ThemeToggle
Premium 3D toggle switch featuring:
- Circular clip-path transition
- Ripple effects on toggle
- Day/Night labels

### 3. HeroPortal
WebGL portal with:
- Custom shader for organic patterns
- Mouse-based distortion
- Day (forest) / Night (blockchain) visuals
- Floating decorative elements

### 4. EscrowJourney
Scrollytelling section showing:
- 3D coin traveling through stages
- Processing station visualization
- Split distribution animation

## 🎭 Animation Details

### Mouse Effects
- **Day Mode**: Digital pollen particles (soft, organic circles)
- **Night Mode**: Data glitches (sharp squares with streaks)

### Image Reveals
- Diagonal curtain slide
- Jagged edge clip-path
- Scale focus pull (1.2 → 1.0)

### Theme Transition
- Circular clip-path expansion from toggle button
- Multiple ripple rings
- Full-screen color consumption

## 🎯 Performance Optimizations

1. **Viewport-based 3D rendering** using `@react-three/drei` View
2. **Code splitting** for heavy shader components
3. **Careful `will-change` usage** to prevent memory leaks
4. **Lenis smooth scroll** for 60fps scrolling
5. **Dynamic imports** for non-critical components

## 📱 Responsive Design

- Mobile-first approach
- Reduced parallax on smaller screens
- Simplified 3D on lower-end devices
- Touch-optimized interactions

## 🌙 Theme Variables

```css
/* Day Mode */
--bg-primary: #FEFEFE;
--accent: #22C55E;

/* Night Mode */
--bg-primary: #050505;
--accent: #00FF88;
--neon-cyan: #00FFFF;
--neon-purple: #A855F7;
```

## 🔧 Configuration

### Tailwind
Extended with custom colors, animations, and shadows in `tailwind.config.ts`

### Next.js
Configured for Three.js transpilation and GLSL shader support in `next.config.js`

## 📄 License

MIT © CYCLR
