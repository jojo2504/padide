'use client';

import { useState, useEffect } from 'react';
import { LoadingScreen } from '@/components/loading/LoadingScreen';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CreativeLanding } from '@/components/sections/CreativeLanding';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Prevent scrolling during loading
    if (isLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoading]);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    // Small delay before showing content for smooth transition
    setTimeout(() => setShowContent(true), 100);
  };

  return (
    <>
      {/* Loading Screen */}
      {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}

      {/* Main Content */}
      {showContent && (
        <main className="relative">
          {/* Header */}
          <Header />

          {/* Creative Landing - Single page experience */}
          <CreativeLanding />

          {/* Footer */}
          <Footer />
        </main>
      )}
    </>
  );
}
