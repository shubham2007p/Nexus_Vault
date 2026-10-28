import React from 'react';
import LandingHeader from './LandingHeader';
import HeroSection from './HeroSection';
import FragmentedProblemSection from './FragmentedProblemSection';
import SynthesisShowcaseSection from './SynthesisShowcaseSection';
import ContextualLinksSection from './ContextualLinksSection';
import AiDiscoverySection from './AiDiscoverySection';
import KnowledgeGraphSection from './KnowledgeGraphSection';
import RealWorkUseCasesSection from './RealWorkUseCasesSection';
import FinalCtaSection from './FinalCtaSection';
import LandingFooter from './LandingFooter';

export default function LandingPage({ onLaunchApp }) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] selection:bg-[#2D5A43]/15 selection:text-[#1E3E2E] font-sans">
      {/* 1. Header & Responsive Navigation */}
      <LandingHeader onLaunchApp={onLaunchApp} />

      <main>
        {/* 2. Hero: Messy Notes Become Connected, Formal Knowledge */}
        <HeroSection onLaunchApp={onLaunchApp} />

        {/* 3. The Problem: Capture-Time Friction & Isolated Notes */}
        <FragmentedProblemSection />

        {/* 4. Raw-to-Formal Companion Synthesis (raw/ -> process/) */}
        <SynthesisShowcaseSection />

        {/* 5. Meaningful Contextual Links (Destination + Relationship + Why) */}
        <ContextualLinksSection />

        {/* 6. Human-in-the-Loop AI Discovery & 7-Provider Model Hub */}
        <AiDiscoverySection />

        {/* 7. Spatial Knowledge Graph Exploration */}
        <KnowledgeGraphSection />

        {/* 8. Real-World Workflows (Students, Engineers, Researchers) */}
        <RealWorkUseCasesSection onLaunchApp={onLaunchApp} />

        {/* 9. Final Conversion CTA */}
        <FinalCtaSection onLaunchApp={onLaunchApp} />
      </main>

      {/* 10. Footer */}
      <LandingFooter onLaunchApp={onLaunchApp} />
    </div>
  );
}
