import React from 'react';
import { ArrowRight, BookOpen, Compass, Sparkles, Network, Github, Terminal } from 'lucide-react';

export default function LandingHeader({ onLaunchApp }) {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E7E2DA] transition-all">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#2D5A43] flex items-center justify-center text-white shadow-sm shadow-[#2D5A43]/20">
            <span className="font-serif font-bold text-lg leading-none">N</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-xl tracking-tight text-[#1C1917]">Nexusvault</span>
            <span className="hidden sm:inline-block text-[11px] font-mono uppercase tracking-wider text-[#66605A] px-2 py-0.5 rounded border border-[#E7E2DA] bg-[#F4EFEA]">
              Markdown Vault
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#66605A]">
          <button onClick={() => scrollTo('problem')} className="hover:text-[#1C1917] transition-colors">
            The Problem
          </button>
          <button onClick={() => scrollTo('contextual-links')} className="hover:text-[#1C1917] transition-colors">
            Contextual Links
          </button>
          <button onClick={() => scrollTo('ai-discovery')} className="hover:text-[#1C1917] transition-colors">
            AI Discovery
          </button>
          <button onClick={() => scrollTo('graph-view')} className="hover:text-[#1C1917] transition-colors">
            Knowledge Graph
          </button>
          <button onClick={() => scrollTo('use-cases')} className="hover:text-[#1C1917] transition-colors">
            Workflows
          </button>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
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
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2D5A43] hover:bg-[#1C3A2B] rounded-md transition-all shadow-sm shadow-[#2D5A43]/20 hover:shadow"
          >
            <span>Launch App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
