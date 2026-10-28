import React, { useState } from 'react';
import { ArrowRight, Github, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'problem', label: 'The Problem' },
  { id: 'synthesis', label: 'Raw → Formal' },
  { id: 'contextual-links', label: 'Contextual Links' },
  { id: 'ai-discovery', label: 'AI & Models' },
  { id: 'graph-view', label: 'Knowledge Graph' },
  { id: 'use-cases', label: 'Workflows' },
];

export default function LandingHeader({ onLaunchApp }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollTo = (id) => {
    setIsMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E7E2DA] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-md bg-[#2D5A43] flex items-center justify-center text-white shadow-sm shadow-[#2D5A43]/20">
            <span className="font-serif font-bold text-lg leading-none">N</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-xl tracking-tight text-[#1C1917]">
              Nexus Vault
            </span>
            <span className="hidden xl:inline-block text-[10px] font-mono uppercase tracking-wider text-[#2D5A43] px-2 py-0.5 rounded border border-[#B7D0C2] bg-[#EBF2EE] font-semibold">
              v2.1 Local-First
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-medium text-[#66605A]">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="hover:text-[#1C1917] transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <a
            href="https://github.com/shubham2007p/Nexus_Vault"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#66605A] hover:text-[#1C1917] border border-[#E7E2DA] hover:border-[#1C1917]/30 rounded-md bg-white transition-all shadow-2xs"
          >
            <Github className="w-3.5 h-3.5" />
            <span>Source</span>
          </a>

          <button
            onClick={onLaunchApp}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#2D5A43] hover:bg-[#1C3A2B] rounded-md transition-all shadow-sm shadow-[#2D5A43]/20 hover:shadow cursor-pointer"
          >
            <span>Open Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-md text-[#1C1917] hover:bg-[#F4EFEA] border border-[#E7E2DA] transition-colors cursor-pointer"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E7E2DA] bg-[#FAF8F5] px-6 py-4 space-y-3 shadow-lg">
          <div className="grid grid-cols-2 gap-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-left px-3 py-2 rounded-md text-xs font-medium text-[#1C1917] hover:bg-[#F4EFEA] border border-[#E7E2DA]/70 transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-[#E7E2DA] flex items-center justify-between gap-3">
            <a
              href="https://github.com/shubham2007p/Nexus_Vault"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-[#66605A] hover:text-[#1C1917]"
            >
              <Github className="w-3.5 h-3.5" />
              <span>View GitHub Source</span>
            </a>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onLaunchApp();
              }}
              className="px-4 py-2 rounded-md text-xs font-semibold text-white bg-[#2D5A43] hover:bg-[#1C3A2B] flex items-center gap-1.5 cursor-pointer"
            >
              <span>Launch Live Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
