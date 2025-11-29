'use client';

import Navigation from '@/components/navigation/navbar';
import HeroSection from '@/components/sections/hero-section';
import HowItWorksSection from '@/components/sections/how-it-works-section';
import CTASection from '@/components/sections/cta-section';
import Footer from '@/components/sections/footer';

export default function HomePage() {
  return (
    <>
      <Navigation />
      
      <main>
        {/* Hero - Seed drop, 3D phone, floating trees */}
        <HeroSection />
        
        {/* How It Works - Zig-zag scroll with factory, vault, bot */}
        <section id="how-it-works">
          <HowItWorksSection />
        </section>
        
        {/* CTA Section */}
        <CTASection />
        
        {/* Footer */}
        <Footer />
      </main>
    </>
  );
}
