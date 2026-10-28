import React from 'react';
import { ArrowRight, Github, Sparkles } from 'lucide-react';

export default function FinalCtaSection({ onLaunchApp }) {
  return (
    <section className="py-24 md:py-32 px-6 bg-[#FAF8F5] relative overflow-hidden">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="w-12 h-12 rounded-xl bg-[#2D5A43] flex items-center justify-center text-white mx-auto mb-6 shadow-md shadow-[#2D5A43]/20">
          <Sparkles className="w-6 h-6" />
        </div>

        <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#1C1917] leading-[1.1] mb-6">
          Start with one raw note. <br />
          <span className="italic font-normal text-[#2D5A43]">Synthesize and connect the rest.</span>
        </h2>

        <p className="text-[#66605A] text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-9">
          Write freely in plain Markdown. When you are ready, synthesize formal textbook companions and uncover how your ideas connect—under your complete control.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
          <button
            onClick={onLaunchApp}
            className="w-full sm:w-auto px-8 py-4 text-sm font-semibold text-white bg-[#2D5A43] hover:bg-[#1C3A2B] rounded-lg transition-all shadow-md shadow-[#2D5A43]/20 hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Launch Live Workspace</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <a
            href="https://github.com/shubham2007p/Nexus_Vault"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-4 text-sm font-medium text-[#1C1917] hover:text-[#2D5A43] bg-white hover:bg-[#F4EFEA] border border-[#E7E2DA] rounded-lg transition-all shadow-2xs flex items-center justify-center gap-2"
          >
            <Github className="w-4 h-4" />
            <span>View Source on GitHub</span>
          </a>
        </div>

        <p className="text-xs font-mono text-[#66605A] mb-10">
          Instant browser access · Pre-loaded starter vault · No signup required
        </p>

        <div className="inline-flex flex-wrap items-center justify-center gap-6 text-xs text-[#8C827A] font-mono border-t border-[#E7E2DA] pt-8">
          <span>• 100% Local SQLite + Physical .md Sync</span>
          <span>• 7 AI Providers + Local Ollama</span>
          <span>• Zero Vendor Lock-In</span>
        </div>
      </div>
    </section>
  );
}
