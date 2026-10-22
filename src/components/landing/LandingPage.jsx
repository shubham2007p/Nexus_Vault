import React from 'react';
import LandingHeader from './LandingHeader';
import HeroSection from './HeroSection';
import FragmentedProblemSection from './FragmentedProblemSection';
import ContextualLinksSection from './ContextualLinksSection';
import AiDiscoverySection from './AiDiscoverySection';
import KnowledgeGraphSection from './KnowledgeGraphSection';
import RealWorkUseCasesSection from './RealWorkUseCasesSection';
import FinalCtaSection from './FinalCtaSection';
import LandingFooter from './LandingFooter';

export default function LandingPage({ onLaunchApp }) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] selection:bg-[#2D5A43]/15 selection:text-[#1E3E2E] font-sans">
      {/* 1. Header */}
      <LandingHeader onLaunchApp={onLaunchApp} />

      {/* 2. Hero: The Promise */}
      <main>
        <HeroSection onLaunchApp={onLaunchApp} />

        {/* 3. The Problem: Knowledge Becomes Fragmented */}
        <FragmentedProblemSection />

        {/* 4. Contextual Links: A Link With Meaning */}
        <ContextualLinksSection />

        {/* 5. AI-Assisted Discovery */}
        <AiDiscoverySection />

        {/* 6. Knowledge Graph */}
        <KnowledgeGraphSection />

        {/* 7. Real Work Workflows */}
        <RealWorkUseCasesSection />

        {/* 8. Final Conversion */}
        <FinalCtaSection onLaunchApp={onLaunchApp} />
      </main>

      {/* 9. Restrained Footer */}
      <LandingFooter onLaunchApp={onLaunchApp} />
    </div>
  );
}
