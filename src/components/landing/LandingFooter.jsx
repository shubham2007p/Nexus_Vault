import React from 'react';
import { Github, ArrowUp, FileText, Layers, ShieldCheck } from 'lucide-react';

export default function LandingFooter({ onLaunchApp }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#1C1917] text-stone-300 py-16 px-6 border-t border-stone-800 text-xs">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800">
          {/* Col 1: Brand & Thesis */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-[#2D5A43] flex items-center justify-center text-white font-serif font-bold text-sm">
                N
              </div>
              <span className="font-serif font-bold text-lg tracking-tight text-white">Nexusvault</span>
            </div>
            <p className="text-stone-400 leading-relaxed max-w-sm font-sans">
              An AI-native knowledge vault designed to bridge unstructured note capture with automated, persistent semantic relationship discovery.
            </p>
            <div className="pt-2 text-stone-400 font-mono text-[11px]">
              Single Source of Truth: Markdown files on your local drive.
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <div className="font-mono uppercase tracking-wider text-stone-400 font-semibold mb-3">
              Architecture & Concepts
            </div>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button onClick={() => scrollTo('problem')} className="hover:text-white transition-colors cursor-pointer">
                  The Friction of Capture
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('contextual-links')} className="hover:text-white transition-colors cursor-pointer">
                  3-Tuple Semantic Grammar
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('ai-discovery')} className="hover:text-white transition-colors cursor-pointer">
                  Human-in-the-Loop Curation
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('graph-view')} className="hover:text-white transition-colors cursor-pointer">
                  Force-Directed Graph
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('use-cases')} className="hover:text-white transition-colors cursor-pointer">
                  Real-World Workflows
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Project & Source */}
          <div>
            <div className="font-mono uppercase tracking-wider text-stone-400 font-semibold mb-3">
              Project Provenance
            </div>
            <ul className="space-y-2 text-stone-400 font-sans">
              <li>B.Tech Mini Project (2026–27)</li>
              <li>Dept. of Computer Science & Engineering (AI/ML)</li>
              <li>GNIOT, Greater Noida</li>
              <li>Affiliated to AKTU, Lucknow</li>
              <li className="pt-2">
                <a
                  href="https://github.com/shubham2007p/Nexus_Vault"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-mono transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-400 text-[11px]">
          <div>
            © 2026 Nexusvault. Built by <a href="https://github.com/shubham2007p" target="_blank" rel="noopener noreferrer" className="text-stone-300 hover:text-white underline">@shubham2007p</a> & team. Source Available for academic and research use.
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3 h-3" />
          </button>
        </div>
      </div>
    </footer>
  );
}
