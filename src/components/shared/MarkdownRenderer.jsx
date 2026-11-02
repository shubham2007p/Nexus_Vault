import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {
  Check,
  Copy,
  FileText,
  ArrowUpRight,
  Info,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Flame,
  Lightbulb,
  HelpCircle,
  Quote,
} from 'lucide-react';

/**
 * Extract optional YAML frontmatter at the very beginning of a Markdown document
 * so `--- ... ---` is not misinterpreted as a Setext H2 heading by CommonMark.
 */
function extractFrontmatter(rawMarkdown) {
  if (typeof rawMarkdown !== 'string') {
    return { frontmatter: null, body: '' };
  }
  const normalized = rawMarkdown.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    return { frontmatter: null, body: normalized };
  }

  const endIdx = normalized.indexOf('\n---\n', 4);
  if (endIdx === -1) {
    return { frontmatter: null, body: normalized };
  }

  const yamlBlock = normalized.slice(4, endIdx).trim();
  const body = normalized.slice(endIdx + 5);
  const pairs = [];

  for (const line of yamlBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line
        .slice(colonIdx + 1)
        .trim()
        .replace(/^['"]|['"]$/g, '');
      if (key && value) {
        pairs.push({ key, value });
      }
    }
  }

  return {
    frontmatter: pairs.length > 0 ? pairs : null,
    body,
  };
}

/**
 * Normalize single-line `$$ ... $$` blocks and multi-line `$$` fences inside lists/blockquotes
 * so `remark-math` reliably parses them as display math (`math`) while leaving fenced code blocks untouched.
 */
function preprocessMathAndCallouts(markdown) {
  if (!markdown) return '';
  const lines = markdown.split('\n');
  const out = [];
  let inFence = false;
  let fenceMarker = '';
  let inMathBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fenceMatch[1][0];
      } else if (line.trim().startsWith(fenceMarker.repeat(3))) {
        inFence = false;
        fenceMarker = '';
      }
      out.push(line);
      continue;
    }

    if (inFence) {
      out.push(line);
      continue;
    }

    // 1. Standalone `$$` fence line (with optional indentation or `>` blockquote prefix)
    const pureMathFence = line.match(/^(\s*(?:>\s*)*)\$\$\s*$/);
    if (pureMathFence) {
      const prefix = pureMathFence[1] || '';
      if (!inMathBlock) {
        // Ensure a blank line (or blank blockquote line) precedes the opening `$$` fence
        const prevLine = out.length > 0 ? out[out.length - 1] : '';
        if (prevLine.trim() !== '' && prevLine.trim() !== '>') {
          out.push(prefix.includes('>') ? prefix.trimEnd() : '');
        }
        inMathBlock = true;
        out.push(`${prefix}$$`);
      } else {
        inMathBlock = false;
        out.push(`${prefix}$$`);
      }
      continue;
    }

    // 2. Single-line display math: optional indentation or `>` blockquote prefix + `$$ expr $$`
    const singleLineDisplayMath = line.match(/^(\s*(?:>\s*)*)\$\$([^$\n]+)\$\$\s*$/);
    if (singleLineDisplayMath && !inMathBlock) {
      const prefix = singleLineDisplayMath[1] || '';
      const expr = singleLineDisplayMath[2].trim();
      const prevLine = out.length > 0 ? out[out.length - 1] : '';
      if (prevLine.trim() !== '' && prevLine.trim() !== '>') {
        out.push(prefix.includes('>') ? prefix.trimEnd() : '');
      }
      out.push(`${prefix}$$`);
      out.push(`${prefix}${expr}`);
      out.push(`${prefix}$$`);
      continue;
    }

    out.push(line);
  }

  return out.join('\n');
}

/**
 * Remark AST plugin: transforms `[[Target]]` and `[[Target | Relationship | Context]]`
 * inside text nodes into custom `wikilink` AST nodes without affecting code or math nodes.
 */
function remarkWikiLinks() {
  return (tree) => {
    function walk(node) {
      if (!node || !Array.isArray(node.children)) return;
      // Do not parse wikilinks inside code or math nodes
      if (
        node.type === 'code' ||
        node.type === 'inlineCode' ||
        node.type === 'math' ||
        node.type === 'inlineMath'
      ) {
        return;
      }

      const nextChildren = [];
      for (const child of node.children) {
        if (child.type === 'text' && typeof child.value === 'string' && child.value.includes('[[')) {
          const regex = /\[\[([^\[\]\n]+?)\]\]/g;
          let lastIndex = 0;
          let match;

          while ((match = regex.exec(child.value)) !== null) {
            if (match.index > lastIndex) {
              nextChildren.push({
                type: 'text',
                value: child.value.slice(lastIndex, match.index),
              });
            }

            const inner = match[1].trim();
            const parts = inner.split('|').map((p) => p.trim());
            const target = parts[0] || inner;
            const relationship = parts.length >= 2 ? parts[1] : '';
            const context = parts.length >= 3 ? parts.slice(2).join(' | ') : '';

            nextChildren.push({
              type: 'wikiLinkNode',
              data: {
                hName: 'wikilink',
                hProperties: {
                  target,
                  relationship,
                  context,
                },
              },
              children: [{ type: 'text', value: target }],
            });

            lastIndex = match.index + match[0].length;
          }

          if (lastIndex < child.value.length) {
            nextChildren.push({
              type: 'text',
              value: child.value.slice(lastIndex),
            });
          }
        } else {
          walk(child);
          nextChildren.push(child);
        }
      }
      node.children = nextChildren;
    }

    walk(tree);
  };
}

/**
 * Remark AST plugin: transforms Obsidian-style callouts (`> [!NOTE] Title`, `> [!ABSTRACT]`, `> [!THEOREM]`, etc.)
 * into custom `callout` elements while preserving standard `blockquote` elements.
 */
function remarkCallouts() {
  return (tree) => {
    function walk(node) {
      if (!node || !Array.isArray(node.children)) return;

      for (const child of node.children) {
        if (child.type === 'blockquote' && Array.isArray(child.children) && child.children.length > 0) {
          const firstBlock = child.children[0];
          if (
            firstBlock.type === 'paragraph' &&
            Array.isArray(firstBlock.children) &&
            firstBlock.children.length > 0 &&
            firstBlock.children[0].type === 'text'
          ) {
            const firstText = firstBlock.children[0].value || '';
            const calloutMatch = firstText.match(/^\[!([A-Za-z0-9_-]+)\][ \t]*([^\n]*)(?:\n([\s\S]*))?$/);

            if (calloutMatch) {
              const calloutType = calloutMatch[1].toUpperCase();
              const explicitTitle = (calloutMatch[2] || '').trim();
              const remainingFirstNodeText = calloutMatch[3];

              // If the first paragraph had additional nodes on the same line as `[!TYPE] Title`
              // (before a newline), or if all remaining content is after a newline:
              if (remainingFirstNodeText !== undefined) {
                firstBlock.children[0] = {
                  type: 'text',
                  value: remainingFirstNodeText,
                };
              } else {
                // Only `[!TYPE] Title` was in the first text node; remove that first line
                firstBlock.children.shift();
                if (
                  firstBlock.children.length > 0 &&
                  firstBlock.children[0].type === 'text' &&
                  firstBlock.children[0].value.startsWith('\n')
                ) {
                  firstBlock.children[0].value = firstBlock.children[0].value.replace(/^\n/, '');
                }
              }

              // Clean up empty first paragraph if nothing remains in it
              if (
                firstBlock.children.length === 0 ||
                (firstBlock.children.length === 1 &&
                  firstBlock.children[0].type === 'text' &&
                  !firstBlock.children[0].value.trim())
              ) {
                child.children.shift();
              }

              child.data = {
                ...(child.data || {}),
                hName: 'callout',
                hProperties: {
                  callouttype: calloutType,
                  callouttitle: explicitTitle,
                },
              };
            }
          }
        }
        walk(child);
      }
    }

    walk(tree);
  };
}

/**
 * Lightweight syntax highlighter for fenced code blocks across all supported languages
 * (JS, TS, Python, C, C++, Java, HTML, CSS, JSON, SQL, Bash, Markdown, Go, Rust, PHP, YAML)
 * so keywords, strings, comments, numbers, and types are visually distinct while preserving exact copyable text.
 */
function highlightCodeTokens(codeText) {
  if (!codeText) return null;
  const tokenRegex =
    /(#.*$|\/\/.*$|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:def|class|return|import|from|as|if|elif|else|for|while|in|try|except|finally|with|yield|lambda|async|await|True|False|None|const|let|var|function|export|default|new|this|typeof|instanceof|interface|type|fn|pub|struct|impl|match|trait|mut|package|func|go|defer|chan|select|range|public|private|protected|static|void|int|char|float|double|bool|boolean|auto|template|typename|namespace|include|extends|implements|override|echo|sudo|cd|mkdir|rm|cat|grep|curl|chmod|chown|php|true|false|null|SELECT|FROM|WHERE|JOIN|LEFT|INNER|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|AND|OR|NOT|NULL|PRIMARY|KEY|FOREIGN)\b|\b\d+(?:\.\d+)?\b)/gm;

  const parts = [];
  let lastIdx = 0;
  let match;
  let key = 0;

  while ((match = tokenRegex.exec(codeText)) !== null) {
    if (match.index > lastIdx) {
      parts.push(codeText.slice(lastIdx, match.index));
    }
    const token = match[0];
    let cls = 'text-[#242824] dark:text-[#E4E4E7]';
    if (token.startsWith('#') || token.startsWith('//') || token.startsWith('/*')) {
      cls = 'text-[#878C85] dark:text-[#71717A] italic';
    } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
      cls = 'text-[#1F6342] dark:text-emerald-400';
    } else if (/^\d/.test(token)) {
      cls = 'text-[#B45309] dark:text-amber-400';
    } else {
      cls = 'text-[#7C3AED] dark:text-purple-400 font-medium';
    }
    parts.push(
      <span key={`tok-${key++}`} className={cls}>
        {token}
      </span>
    );
    lastIdx = match.index + token.length;
  }

  if (lastIdx < codeText.length) {
    parts.push(codeText.slice(lastIdx));
  }

  return parts;
}

/**
 * Fenced Code Block with Language Label & Copy Button
 */
function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const displayLang = (language || 'code').toLowerCase();

  return (
    <div
      data-testid="code-block-container"
      className="my-4 rounded-lg border border-[#DDD9CE] dark:border-[#262830] bg-[#F4F3EE] dark:bg-[#131417] overflow-hidden shadow-2xs"
    >
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-[#DDD9CE] dark:border-[#202228] bg-[#EAE7DF]/85 dark:bg-[#171920] text-[10.5px] font-mono text-[#666B65] dark:text-[#8E8E98] uppercase tracking-wider">
        <span className="font-semibold">{displayLang}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[#666B65] dark:text-[#A1A1AA] hover:text-[#242824] dark:hover:text-[#F4F4F5] hover:bg-[#DDD9CE]/60 dark:hover:bg-[#252830] transition-colors cursor-pointer text-xs normal-case tracking-normal"
          title="Copy code block"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#287D54] dark:text-emerald-400" />
              <span className="text-[#287D54] dark:text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-[13px] leading-[1.62] font-mono tracking-normal text-[#242824] dark:text-[#E4E4E7] overflow-x-auto">
        <code>{highlightCodeTokens(code)}</code>
      </pre>
    </div>
  );
}

/**
 * Callout Styling Palette (Preserving Nexus Vault Warm Editorial Tokens)
 */
const CALLOUT_THEMES = {
  NOTE: {
    label: 'Note',
    icon: Info,
    border: 'border-l-[#287D54] dark:border-l-emerald-400',
    bg: 'bg-[#EBF5F0]/65 dark:bg-emerald-950/20',
    headerText: 'text-[#1F6342] dark:text-emerald-300',
  },
  ABSTRACT: {
    label: 'Formal Synthesis',
    icon: Sparkles,
    border: 'border-l-[#287D54] dark:border-l-emerald-400',
    bg: 'bg-[#EBF5F0]/75 dark:bg-emerald-950/25',
    headerText: 'text-[#1F6342] dark:text-emerald-300',
  },
  SUMMARY: {
    label: 'Summary',
    icon: BookOpen,
    border: 'border-l-[#287D54] dark:border-l-emerald-400',
    bg: 'bg-[#EBF5F0]/65 dark:bg-emerald-950/20',
    headerText: 'text-[#1F6342] dark:text-emerald-300',
  },
  THEOREM: {
    label: 'Theorem',
    icon: BookOpen,
    border: 'border-l-[#E7A23B] dark:border-l-amber-400',
    bg: 'bg-[#FEF7EC]/85 dark:bg-amber-950/25',
    headerText: 'text-[#9A6214] dark:text-amber-300',
  },
  IMPORTANT: {
    label: 'Important',
    icon: Flame,
    border: 'border-l-[#E7A23B] dark:border-l-amber-400',
    bg: 'bg-[#FEF7EC]/80 dark:bg-amber-950/20',
    headerText: 'text-[#9A6214] dark:text-amber-300',
  },
  TIP: {
    label: 'Tip',
    icon: Lightbulb,
    border: 'border-l-[#287D54] dark:border-l-emerald-400',
    bg: 'bg-[#EBF5F0]/65 dark:bg-emerald-950/20',
    headerText: 'text-[#1F6342] dark:text-emerald-300',
  },
  WARNING: {
    label: 'Warning',
    icon: AlertTriangle,
    border: 'border-l-[#D97706] dark:border-l-amber-500',
    bg: 'bg-[#FEF3C7]/60 dark:bg-amber-950/30',
    headerText: 'text-[#92400E] dark:text-amber-300',
  },
  CAUTION: {
    label: 'Caution',
    icon: AlertTriangle,
    border: 'border-l-[#DC2626] dark:border-l-rose-400',
    bg: 'bg-rose-50/70 dark:bg-rose-950/25',
    headerText: 'text-rose-800 dark:text-rose-300',
  },
  QUESTION: {
    label: 'Question',
    icon: HelpCircle,
    border: 'border-l-[#287D54] dark:border-l-emerald-400',
    bg: 'bg-[#F5F4F0] dark:bg-[#1A1C22]',
    headerText: 'text-[#242824] dark:text-[#E4E4E7]',
  },
  QUOTE: {
    label: 'Quote',
    icon: Quote,
    border: 'border-l-[#878C85] dark:border-l-[#52525B]',
    bg: 'bg-[#F5F4F0]/80 dark:bg-[#18191E]',
    headerText: 'text-[#4A4F49] dark:text-[#A1A1AA]',
  },
};

/**
 * Shared Markdown Renderer for Nexus Vault:
 * - ChattyFi AI & User messages (`variant="chat"`)
 * - Notes Reading View (`variant="note"`)
 * - Processed / Formal Synthesized notes (`process/`) & Raw notes (`raw/`)
 */
export default function MarkdownRenderer({
  content = '',
  files = [],
  onNavigateToNote,
  onOpenNote,
  onLinkClick,
  variant = 'chat',
  className = '',
}) {
  const safeFiles = Array.isArray(files) ? files : [];

  const { frontmatter, processedMarkdown } = useMemo(() => {
    const { frontmatter: fm, body } = extractFrontmatter(String(content || ''));
    return {
      frontmatter: fm,
      processedMarkdown: preprocessMathAndCallouts(body),
    };
  }, [content]);

  const resolveNoteByTitle = (title) => {
    if (!title) return null;
    const norm = title.trim().toLowerCase();
    return safeFiles.find((f) => (f.title || '').trim().toLowerCase() === norm) || null;
  };

  const handleWikiLinkClick = (targetTitle) => {
    const matchedFile = resolveNoteByTitle(targetTitle);
    if (onLinkClick) {
      onLinkClick(targetTitle, matchedFile);
      return;
    }
    if (matchedFile && onNavigateToNote) {
      onNavigateToNote(matchedFile.id, matchedFile);
      return;
    }
    if (onOpenNote) {
      onOpenNote(targetTitle, matchedFile);
      return;
    }
    if (onNavigateToNote) {
      onNavigateToNote(null, { title: targetTitle, isUnresolved: true });
    }
  };

  const isNoteVariant = variant === 'note';

  const markdownComponents = useMemo(
    () => ({
      h1: ({ children }) => (
        <h1
          className={
            isNoteVariant
              ? 'font-mono text-2xl sm:text-[26px] font-bold tracking-tight text-[#161718] dark:text-[#F4F4F5] mt-8 mb-4 pb-2.5 border-b border-[#E3E5DF] dark:border-[#272A32] first:mt-0 leading-tight'
              : 'font-mono text-lg sm:text-[20px] font-bold tracking-tight text-[#161718] dark:text-[#F4F4F5] mt-6 mb-2.5 first:mt-0 leading-tight'
          }
        >
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2
          className={
            isNoteVariant
              ? 'font-mono text-xl sm:text-[21px] font-bold tracking-tight text-[#1E2022] dark:text-[#EAEAEA] mt-7 mb-3 first:mt-0 leading-snug'
              : 'font-mono text-base sm:text-[17px] font-bold tracking-tight text-[#1E2022] dark:text-[#EAEAEA] mt-5 mb-2 first:mt-0 leading-snug'
          }
        >
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3
          className={
            isNoteVariant
              ? 'font-mono text-base sm:text-[17px] font-semibold tracking-normal text-[#2C2F33] dark:text-[#DFDFE2] mt-5 mb-2 first:mt-0 leading-snug'
              : 'font-mono text-[15px] font-semibold tracking-normal text-[#2C2F33] dark:text-[#DFDFE2] mt-4 mb-1.5 first:mt-0 leading-snug'
          }
        >
          {children}
        </h3>
      ),
      h4: ({ children }) => (
        <h4 className="font-mono text-[13.5px] sm:text-[14px] font-semibold uppercase tracking-wider text-[#666B65] dark:text-[#A1A1AA] mt-4 mb-1.5 first:mt-0">
          {children}
        </h4>
      ),
      p: ({ children }) => (
        <p
          className={
            isNoteVariant
              ? 'font-mono text-[14.5px] sm:text-[15px] leading-[1.8] tracking-[0.012em] text-[#242824] dark:text-[#E4E4E7] my-3.5 first:mt-0 last:mb-0'
              : 'font-mono text-[14.5px] leading-[1.75] tracking-[0.012em] text-[#242824] dark:text-[#E4E4E7] my-3 first:mt-0 last:mb-0'
          }
        >
          {children}
        </p>
      ),
      ul: ({ children }) => (
        <ul className="font-mono my-3 space-y-2 pl-6 list-disc marker:text-[#878C85] dark:marker:text-[#71717A] text-[14.5px] sm:text-[15px] leading-[1.75] tracking-[0.012em] text-[#242824] dark:text-[#E4E4E7]">
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="font-mono my-3 space-y-2 pl-6 list-decimal marker:font-mono marker:text-xs marker:text-[#666B65] dark:marker:text-[#A1A1AA] text-[14.5px] sm:text-[15px] leading-[1.75] tracking-[0.012em] text-[#242824] dark:text-[#E4E4E7]">
          {children}
        </ol>
      ),
      li: ({ children }) => <li className="pl-1 leading-[1.75]">{children}</li>,
      hr: () => <hr className="my-6 border-t border-[#E3E5DF] dark:border-[#272A32]" />,
      blockquote: ({ children }) => (
        <blockquote className="font-mono my-4 pl-4 py-2 border-l-2 border-[#287D54] dark:border-emerald-500 bg-[#F5F4F0]/60 dark:bg-[#18191E]/60 rounded-r-md text-[14px] sm:text-[14.5px] leading-[1.72] tracking-[0.012em] text-[#4A4F49] dark:text-[#B4B4BB]">
          {children}
        </blockquote>
      ),
      callout: ({ callouttype, callouttitle, children }) => {
        const typeKey = String(callouttype || 'NOTE').toUpperCase();
        const theme = CALLOUT_THEMES[typeKey] || CALLOUT_THEMES.NOTE;
        const IconComp = theme.icon;
        const headerLabel = callouttitle || theme.label;

        return (
          <div
            className={`my-4.5 rounded-lg border border-[#E3E5DF] dark:border-[#272A32] border-l-4 ${theme.border} ${theme.bg} px-4 py-3.5 shadow-2xs font-mono`}
            data-callout-type={typeKey.toLowerCase()}
          >
            <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 ${theme.headerText}`}>
              <IconComp className="w-3.5 h-3.5 shrink-0" />
              <span>{headerLabel}</span>
            </div>
            <div className="text-[13.5px] sm:text-[14px] leading-[1.7] tracking-[0.008em] text-[#242824] dark:text-[#E4E4E7] space-y-2">
              {children}
            </div>
          </div>
        );
      },
      pre: ({ children }) => {
        const child = React.Children.toArray(children)[0];
        if (React.isValidElement(child)) {
          const classNameStr = child.props?.className || '';
          const langMatch = classNameStr.match(/language-([a-zA-Z0-9_-]+)/);
          const language = langMatch ? langMatch[1] : 'code';
          const rawCode = String(child.props?.children || '').replace(/\n$/, '');
          return <CodeBlock language={language} code={rawCode} />;
        }
        return <pre className="my-3 p-3 rounded-lg bg-[#F5F4F0] dark:bg-[#141519] overflow-x-auto">{children}</pre>;
      },
      code: ({ className: codeClassName, children, ...rest }) => {
        const isBlock = Boolean(codeClassName && codeClassName.includes('language-'));
        if (isBlock) {
          return (
            <code className={codeClassName} {...rest}>
              {children}
            </code>
          );
        }
        return (
          <code className="px-1.5 py-0.5 mx-0.5 rounded bg-[#ECE9E0] dark:bg-[#1E2027] border border-[#DCD7CB] dark:border-[#2C2E38] font-mono text-[12.5px] font-medium text-[#1E5F3F] dark:text-[#34D399] tracking-tight">
            {children}
          </code>
        );
      },
      table: ({ children }) => (
        <div className="my-5 overflow-x-auto rounded-lg border border-[#E3E5DF] dark:border-[#272A32] shadow-2xs">
          <table className="w-full text-left border-collapse font-mono text-[13px] tracking-[0.01em]">{children}</table>
        </div>
      ),
      thead: ({ children }) => (
        <thead className="border-b border-[#D8DBD3] dark:border-[#2A2D37] bg-[#EFECE5] dark:bg-[#181920]">
          {children}
        </thead>
      ),
      tbody: ({ children }) => (
        <tbody className="divide-y divide-[#E3E5DF]/70 dark:divide-[#23262E] bg-white/60 dark:bg-[#141519]">
          {children}
        </tbody>
      ),
      tr: ({ children }) => (
        <tr className="hover:bg-[#F5F4F0] dark:hover:bg-[#1C1E26]/60 transition-colors">
          {children}
        </tr>
      ),
      th: ({ children }) => (
        <th className="py-2.5 px-3.5 font-semibold text-[11.5px] uppercase tracking-wider text-[#242824] dark:text-[#F4F4F5]">{children}</th>
      ),
      td: ({ children }) => (
        <td className="py-2.5 px-3.5 text-[#3E433E] dark:text-[#D4D4D8] leading-relaxed align-top">{children}</td>
      ),
      a: ({ href, children }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#287D54] dark:text-emerald-400 underline underline-offset-2 hover:opacity-85 transition-opacity"
        >
          {children}
        </a>
      ),
      span: ({ className: spanClass, children, ...rest }) => {
        if (typeof spanClass === 'string' && spanClass.includes('katex-display')) {
          return (
            <span
              className={`${spanClass} katex-block chattyfi-math-block my-4 py-3.5 px-5 rounded-lg bg-[#F5F4F0] dark:bg-[#181920] border border-[#E3E5DF] dark:border-[#272A32] shadow-2xs overflow-x-auto block text-center`}
              {...rest}
            >
              {children}
            </span>
          );
        }
        if (typeof spanClass === 'string' && spanClass === 'katex') {
          return (
            <span className={`${spanClass} chattyfi-math-inline`} {...rest}>
              {children}
            </span>
          );
        }
        return (
          <span className={spanClass} {...rest}>
            {children}
          </span>
        );
      },
      wikilink: ({ target, relationship, context }) => {
        const targetStr = String(target || '').trim();
        const relStr = String(relationship || '').trim();
        const ctxStr = String(context || '').trim();
        const resolved = resolveNoteByTitle(targetStr);

        if (relStr) {
          return (
            <button
              type="button"
              onClick={() => handleWikiLinkClick(targetStr)}
              className="cm-contextual-link-tag !inline-flex items-center gap-1 mx-0.5 align-baseline cursor-pointer hover:opacity-90 transition-opacity text-left"
              title={
                ctxStr
                  ? `${targetStr} (${relStr}): ${ctxStr}`
                  : `Open note: ${targetStr} (${relStr})`
              }
            >
              <FileText className="w-3 h-3 shrink-0 opacity-75" />
              <span className="font-semibold">{targetStr}</span>
              <span className="opacity-65">·</span>
              <span className="font-mono text-[11px] opacity-90">{relStr}</span>
              {ctxStr && (
                <>
                  <span className="opacity-65">·</span>
                  <span className="italic opacity-85 truncate max-w-[240px]">{ctxStr}</span>
                </>
              )}
              <ArrowUpRight className="w-2.5 h-2.5 shrink-0 opacity-70" />
            </button>
          );
        }

        return (
          <button
            type="button"
            onClick={() => handleWikiLinkClick(targetStr)}
            className={`cm-plain-link-tag !inline-flex items-center gap-1 mx-0.5 align-baseline cursor-pointer hover:opacity-90 transition-opacity ${
              !resolved ? 'opacity-85 border-dashed' : ''
            }`}
            title={resolved ? `Open note: ${targetStr}` : `Unresolved note link: ${targetStr}`}
          >
            <FileText className="w-3 h-3 shrink-0 opacity-75" />
            <span>{targetStr}</span>
            <ArrowUpRight className="w-2.5 h-2.5 shrink-0 opacity-70" />
          </button>
        );
      },
    }),
    [isNoteVariant, safeFiles, onNavigateToNote, onOpenNote, onLinkClick]
  );

  return (
    <div className={`markdown-renderer-root font-mono space-y-2 ${className}`}>
      {/* Optional Frontmatter Pill Bar when viewing notes with YAML metadata */}
      {isNoteVariant && frontmatter && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-[#EFECE5] dark:bg-[#181920] border border-[#DDD9CE] dark:border-[#282B35] flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] font-mono tracking-[0.015em] text-[#666B65] dark:text-[#8E8E98] shadow-2xs">
          {frontmatter.map((item, idx) => (
            <div key={`${item.key}-${idx}`} className="flex items-center gap-1.5">
              <span className="text-[#767C74] dark:text-[#7A7A84] font-medium">{item.key}:</span>
              <span className="text-[#1E201E] dark:text-[#E4E4E7] font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkCallouts, remarkWikiLinks]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={markdownComponents}
      >
        {processedMarkdown}
      </ReactMarkdown>
    </div>
  );
}
