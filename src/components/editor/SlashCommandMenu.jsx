import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Code2,
  Table as TableIcon,
  Sigma,
  AlertCircle,
  Link2,
  FileText,
  ChevronRight,
  ArrowLeft,
  Search,
  Check,
  Plus,
} from 'lucide-react';

// 16 common languages requested in specification
export const CODE_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: 'js' },
  { id: 'typescript', label: 'TypeScript', ext: 'ts' },
  { id: 'python', label: 'Python', ext: 'py' },
  { id: 'c', label: 'C', ext: 'c' },
  { id: 'cpp', label: 'C++', ext: 'cpp' },
  { id: 'java', label: 'Java', ext: 'java' },
  { id: 'html', label: 'HTML', ext: 'html' },
  { id: 'css', label: 'CSS', ext: 'css' },
  { id: 'json', label: 'JSON', ext: 'json' },
  { id: 'sql', label: 'SQL', ext: 'sql' },
  { id: 'bash', label: 'Bash', ext: 'sh' },
  { id: 'markdown', label: 'Markdown', ext: 'md' },
  { id: 'go', label: 'Go', ext: 'go' },
  { id: 'rust', label: 'Rust', ext: 'rs' },
  { id: 'php', label: 'PHP', ext: 'php' },
  { id: 'yaml', label: 'YAML', ext: 'yml' },
];

// 9 callout types requested in specification
export const CALLOUT_TYPES = [
  { id: 'NOTE', label: 'Note', desc: 'Standard informative notice' },
  { id: 'ABSTRACT', label: 'Abstract', desc: 'Summary or overview of technical topic' },
  { id: 'TIP', label: 'Tip', desc: 'Helpful advice or recommended practice' },
  { id: 'IMPORTANT', label: 'Important', desc: 'Crucial requirement or essential detail' },
  { id: 'WARNING', label: 'Warning', desc: 'Caveat, potential risk or breaking change' },
  { id: 'CAUTION', label: 'Caution', desc: 'High-risk action or safety notice' },
  { id: 'QUESTION', label: 'Question', desc: 'FAQ, open inquiry or discussion prompt' },
  { id: 'QUOTE', label: 'Quote', desc: 'Referenced or attributed quotation' },
  { id: 'THEOREM', label: 'Theorem', desc: 'Formal mathematical or algorithmic theorem' },
];

export default function SlashCommandMenu({
  isOpen,
  coords,
  query = '',
  from,
  to,
  lineStart = false,
  view,
  onClose,
  theme = 'light',
  noteTitle = '',
}) {
  const [activeSubmenu, setActiveSubmenu] = useState(null); // null | 'code' | 'callout' | 'table' | 'equation'
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [subQuery, setSubQuery] = useState('');
  const [tableCols, setTableCols] = useState(3);
  const [tableRows, setTableRows] = useState(3);

  const menuRef = useRef(null);
  const listRef = useRef(null);
  const subInputRef = useRef(null);

  // Reset submenu and selection when menu opens or query changes
  useEffect(() => {
    if (isOpen) {
      setActiveSubmenu(null);
      setSelectedIndex(0);
      setSubQuery('');
    }
  }, [isOpen, query]);

  // Focus sub-search input when entering a submenu
  useEffect(() => {
    if (activeSubmenu === 'code') {
      setTimeout(() => subInputRef.current?.focus(), 50);
    }
  }, [activeSubmenu]);

  // Main Command Registry
  const allCommands = useMemo(
    () => [
      // Basic Blocks
      {
        id: 'heading-1',
        title: 'Heading 1',
        desc: 'Top-level section heading',
        category: 'Basic blocks',
        icon: Heading1,
        keywords: ['h1', 'heading', 'title', 'large'],
        execute: (editorView) => {
          replaceAndSetCursor(editorView, from, to, '# ', from + 2);
        },
      },
      {
        id: 'heading-2',
        title: 'Heading 2',
        desc: 'Medium subsection heading',
        category: 'Basic blocks',
        icon: Heading2,
        keywords: ['h2', 'heading', 'subtitle', 'medium'],
        execute: (editorView) => {
          replaceAndSetCursor(editorView, from, to, '## ', from + 3);
        },
      },
      {
        id: 'heading-3',
        title: 'Heading 3',
        desc: 'Small topic heading',
        category: 'Basic blocks',
        icon: Heading3,
        keywords: ['h3', 'heading', 'small'],
        execute: (editorView) => {
          replaceAndSetCursor(editorView, from, to, '### ', from + 4);
        },
      },
      {
        id: 'bullet-list',
        title: 'Bullet list',
        desc: 'Unordered bulleted list',
        category: 'Basic blocks',
        icon: List,
        keywords: ['ul', 'bullet', 'list', 'item'],
        execute: (editorView) => {
          replaceAndSetCursor(editorView, from, to, '- ', from + 2);
        },
      },
      {
        id: 'numbered-list',
        title: 'Numbered list',
        desc: 'Ordered sequential list',
        category: 'Basic blocks',
        icon: ListOrdered,
        keywords: ['ol', 'number', 'numbered', 'ordered', 'list'],
        execute: (editorView) => {
          replaceAndSetCursor(editorView, from, to, '1. ', from + 3);
        },
      },
      {
        id: 'checklist',
        title: 'Checklist',
        desc: 'Task list with checkboxes',
        category: 'Basic blocks',
        icon: CheckSquare,
        keywords: ['todo', 'task', 'check', 'box', 'checklist'],
        execute: (editorView) => {
          replaceAndSetCursor(editorView, from, to, '- [ ] ', from + 6);
        },
      },
      {
        id: 'blockquote',
        title: 'Blockquote',
        desc: 'Indented quotation or note',
        category: 'Basic blocks',
        icon: Quote,
        keywords: ['quote', 'blockquote', 'cite'],
        execute: (editorView) => {
          replaceAndSetCursor(editorView, from, to, '> ', from + 2);
        },
      },
      {
        id: 'divider',
        title: 'Divider',
        desc: 'Horizontal visual separator rule',
        category: 'Basic blocks',
        icon: Minus,
        keywords: ['divider', 'hr', 'line', 'rule', 'separator'],
        execute: (editorView) => {
          const insertText = '\n---\n\n';
          replaceAndSetCursor(editorView, from, to, insertText, from + insertText.length);
        },
      },

      // Technical Blocks
      {
        id: 'code-block',
        title: 'Code block',
        desc: 'Fenced code with language syntax highlighting',
        category: 'Technical blocks',
        icon: Code2,
        keywords: ['code', 'block', 'snippet', 'syntax', 'programming', ...CODE_LANGUAGES.map((l) => l.id)],
        hasSubmenu: true,
        onSelect: () => setActiveSubmenu('code'),
      },
      {
        id: 'table',
        title: 'Table',
        desc: 'Markdown data table with columns and rows',
        category: 'Technical blocks',
        icon: TableIcon,
        keywords: ['table', 'grid', 'columns', 'rows', 'matrix'],
        hasSubmenu: true,
        onSelect: () => setActiveSubmenu('table'),
      },
      {
        id: 'equation',
        title: 'Equation',
        desc: 'Mathematical formula with KaTeX support',
        category: 'Technical blocks',
        icon: Sigma,
        keywords: ['math', 'equation', 'latex', 'katex', 'formula', 'inline', 'display'],
        hasSubmenu: true,
        onSelect: () => setActiveSubmenu('equation'),
      },
      {
        id: 'callout',
        title: 'Callout',
        desc: 'Obsidian-style highlighted advisory box',
        category: 'Technical blocks',
        icon: AlertCircle,
        keywords: ['callout', 'admonition', 'alert', 'note', 'warning', 'tip', 'theorem'],
        hasSubmenu: true,
        onSelect: () => setActiveSubmenu('callout'),
      },

      // Wiki and Metadata
      {
        id: 'wikilink',
        title: 'Wiki link',
        desc: 'Bidirectional link to another vault note: [[Note]]',
        category: 'Wiki and metadata',
        icon: Link2,
        keywords: ['wiki', 'link', 'internal', 'backlink', 'bracket'],
        execute: (editorView) => {
          replaceAndSetCursor(editorView, from, to, '[[  ]]', from + 2);
        },
      },
      {
        id: 'frontmatter',
        title: 'YAML frontmatter',
        desc: 'Document metadata header with title and tags',
        category: 'Wiki and metadata',
        icon: FileText,
        keywords: ['yaml', 'frontmatter', 'metadata', 'header', 'tags'],
        execute: (editorView) => {
          insertFrontmatter(editorView, from, to, noteTitle);
        },
      },
    ],
    [from, to, noteTitle]
  );

  // Filter commands by typed query
  const filteredCommands = useMemo(() => {
    if (!query || query.trim() === '') return allCommands;
    const clean = query.trim().toLowerCase();
    return allCommands.filter((cmd) => {
      if (cmd.title.toLowerCase().includes(clean)) return true;
      if (cmd.desc.toLowerCase().includes(clean)) return true;
      if (cmd.keywords.some((k) => k.toLowerCase().includes(clean))) return true;
      return false;
    });
  }, [allCommands, query]);

  // Filter languages for code block submenu
  const filteredLanguages = useMemo(() => {
    if (!subQuery) return CODE_LANGUAGES;
    const q = subQuery.toLowerCase().trim();
    return CODE_LANGUAGES.filter(
      (lang) => lang.id.includes(q) || lang.label.toLowerCase().includes(q) || lang.ext.includes(q)
    );
  }, [subQuery]);

  // Filter callouts for callout submenu
  const filteredCallouts = useMemo(() => {
    if (!subQuery) return CALLOUT_TYPES;
    const q = subQuery.toLowerCase().trim();
    return CALLOUT_TYPES.filter(
      (c) => c.id.toLowerCase().includes(q) || c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
    );
  }, [subQuery]);

  // Keep selected index in bounds when list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length, activeSubmenu, filteredLanguages.length, filteredCallouts.length]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Execute Code Block insertion with chosen language
  const handleInsertCodeBlock = (langId) => {
    if (!view) return;
    const fence = '```';
    const insertText = `${fence}${langId}\n\n${fence}\n`;
    // Place cursor on the empty line inside the code block
    const cursorOffset = from + fence.length + langId.length + 1;
    replaceAndSetCursor(view, from, to, insertText, cursorOffset);
    onClose();
  };

  // Execute Callout insertion with chosen type
  const handleInsertCallout = (calloutType) => {
    if (!view) return;
    const placeholder = `Write your ${calloutType.toLowerCase()} here.`;
    const insertText = `> [!${calloutType}]\n> ${placeholder}\n\n`;
    // Place cursor selecting the placeholder text so user can immediately type
    const cursorOffset = from + `> [!${calloutType}]\n> `.length;
    replaceAndSetCursor(view, from, to, insertText, cursorOffset, cursorOffset + placeholder.length);
    onClose();
  };

  // Execute Table insertion with rows and cols
  const handleInsertTable = (cols = tableCols, rows = tableRows) => {
    if (!view) return;
    const c = Math.max(1, Math.min(10, cols));
    const r = Math.max(1, Math.min(20, rows));

    const headerRow = '| ' + Array.from({ length: c }, (_, i) => `Header ${i + 1}`).join(' | ') + ' |\n';
    const dividerRow = '| ' + Array.from({ length: c }, () => '---').join(' | ') + ' |\n';
    const bodyRows = Array.from({ length: r - 1 }, (_, rowIdx) => {
      return '| ' + Array.from({ length: c }, (_, colIdx) => `Cell ${rowIdx * c + colIdx + 1}`).join(' | ') + ' |\n';
    }).join('');

    const fullTable = `${headerRow}${dividerRow}${bodyRows}\n`;
    // Place cursor right inside the first header cell ('Header 1')
    const firstCellStart = from + 2;
    const firstCellEnd = from + 2 + 'Header 1'.length;
    replaceAndSetCursor(view, from, to, fullTable, firstCellStart, firstCellEnd);
    onClose();
  };

  // Execute Equation insertion
  const handleInsertEquation = (type) => {
    if (!view) return;
    if (type === 'inline') {
      const text = '$equation$';
      const cursorOffset = from + 1;
      replaceAndSetCursor(view, from, to, text, cursorOffset, cursorOffset + 8);
    } else {
      const text = '$$\nequation\n$$\n';
      const cursorOffset = from + 3;
      replaceAndSetCursor(view, from, to, text, cursorOffset, cursorOffset + 8);
    }
    onClose();
  };

  // Key navigation handler dispatched from extension
  useEffect(() => {
    if (!isOpen) return;

    window.__nexusSlashKeyAction = (action) => {
      if (action === 'escape') {
        if (activeSubmenu) {
          setActiveSubmenu(null);
          return true;
        }
        onClose();
        return true;
      }

      if (action === 'down') {
        let max = filteredCommands.length;
        if (activeSubmenu === 'code') max = filteredLanguages.length;
        if (activeSubmenu === 'callout') max = filteredCallouts.length;
        if (activeSubmenu === 'equation') max = 2;
        if (max === 0) return true;
        setSelectedIndex((prev) => (prev + 1) % max);
        return true;
      }

      if (action === 'up') {
        let max = filteredCommands.length;
        if (activeSubmenu === 'code') max = filteredLanguages.length;
        if (activeSubmenu === 'callout') max = filteredCallouts.length;
        if (activeSubmenu === 'equation') max = 2;
        if (max === 0) return true;
        setSelectedIndex((prev) => (prev - 1 + max) % max);
        return true;
      }

      if (action === 'enter') {
        if (activeSubmenu === 'code') {
          const lang = filteredLanguages[selectedIndex];
          if (lang) handleInsertCodeBlock(lang.id);
          return true;
        }
        if (activeSubmenu === 'callout') {
          const callout = filteredCallouts[selectedIndex];
          if (callout) handleInsertCallout(callout.id);
          return true;
        }
        if (activeSubmenu === 'equation') {
          handleInsertEquation(selectedIndex === 0 ? 'inline' : 'display');
          return true;
        }
        if (activeSubmenu === 'table') {
          handleInsertTable();
          return true;
        }

        const cmd = filteredCommands[selectedIndex];
        if (cmd) {
          if (cmd.hasSubmenu) {
            cmd.onSelect();
          } else if (cmd.execute && view) {
            cmd.execute(view);
            onClose();
          }
        }
        return true;
      }

      return false;
    };

    return () => {
      delete window.__nexusSlashKeyAction;
    };
  }, [
    isOpen,
    activeSubmenu,
    selectedIndex,
    filteredCommands,
    filteredLanguages,
    filteredCallouts,
    tableCols,
    tableRows,
    view,
  ]);

  if (!isOpen || !coords) return null;

  // Responsive floating positioning relative to cursor
  const menuWidth = 320;
  const menuHeight = 360;
  let top = coords.bottom + 6;
  let left = coords.left;

  // Keep within viewport boundaries
  if (top + menuHeight > window.innerHeight - 16) {
    top = Math.max(16, coords.top - menuHeight - 6);
  }
  if (left + menuWidth > window.innerWidth - 20) {
    left = Math.max(16, window.innerWidth - menuWidth - 20);
  }

  return (
    <div
      ref={menuRef}
      data-testid="slash-command-menu"
      style={{ top: `${top}px`, left: `${left}px` }}
      className="fixed z-50 w-80 max-h-[380px] flex flex-col rounded-xl shadow-2xl border bg-[#FAF9F6] dark:bg-[#18191E] border-[#DDD9CE] dark:border-[#272A32] text-[#242824] dark:text-[#E4E4E7] select-none overflow-hidden animate-in fade-in duration-150"
    >
      {/* 1. Submenu: Code Block Language Selector */}
      {activeSubmenu === 'code' && (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 p-2.5 border-b border-[#E3E5DF] dark:border-[#272A32] bg-[#EFECE5] dark:bg-[#15161A]">
            <button
              type="button"
              onClick={() => setActiveSubmenu(null)}
              className="p-1 rounded hover:bg-[#DDD9CE] dark:hover:bg-[#252830] text-[#666B65] dark:text-[#A1A1AA] transition-colors"
              title="Back to commands"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#878C85] dark:text-[#71717A]" />
              <input
                ref={subInputRef}
                type="text"
                value={subQuery}
                onChange={(e) => setSubQuery(e.target.value)}
                placeholder="Search language (Python, Rust, SQL)..."
                className="w-full pl-8 pr-2 py-1 text-xs font-mono rounded-md bg-white dark:bg-[#1E2027] border border-[#DDD9CE] dark:border-[#2C2E38] text-[#242824] dark:text-[#F4F4F5] outline-none focus:border-[#287D54] dark:focus:border-emerald-500"
              />
            </div>
          </div>
          <div ref={listRef} className="overflow-y-auto max-h-[300px] p-1.5 space-y-0.5 font-mono">
            {filteredLanguages.map((lang, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={lang.id}
                  type="button"
                  data-selected={isSelected}
                  onClick={() => handleInsertCodeBlock(lang.id)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#287D54]/10 dark:bg-emerald-500/15 text-[#1F6342] dark:text-emerald-300 font-semibold'
                      : 'hover:bg-[#F2EFE8] dark:hover:bg-[#202229] text-[#242824] dark:text-[#D4D4D8]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Code2 className="w-4 h-4 text-[#287D54] dark:text-emerald-400" />
                    <span>{lang.label}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-[#878C85] dark:text-[#71717A]">
                    .{lang.ext}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Submenu: Callout Type Selector */}
      {activeSubmenu === 'callout' && (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 p-2.5 border-b border-[#E3E5DF] dark:border-[#272A32] bg-[#EFECE5] dark:bg-[#15161A]">
            <button
              type="button"
              onClick={() => setActiveSubmenu(null)}
              className="p-1 rounded hover:bg-[#DDD9CE] dark:hover:bg-[#252830] text-[#666B65] dark:text-[#A1A1AA] transition-colors"
              title="Back to commands"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold font-mono text-[#242824] dark:text-[#F4F4F5]">
              Select Callout Type
            </span>
          </div>
          <div ref={listRef} className="overflow-y-auto max-h-[300px] p-1.5 space-y-0.5">
            {filteredCallouts.map((callout, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={callout.id}
                  type="button"
                  data-selected={isSelected}
                  onClick={() => handleInsertCallout(callout.id)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#287D54]/10 dark:bg-emerald-500/15 text-[#1F6342] dark:text-emerald-300 font-semibold'
                      : 'hover:bg-[#F2EFE8] dark:hover:bg-[#202229] text-[#242824] dark:text-[#D4D4D8]'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#287D54] dark:text-emerald-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold">{callout.label}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#E4E1D7] dark:bg-[#252832] text-[#666B65] dark:text-[#A1A1AA]">
                        [!{callout.id}]
                      </span>
                    </div>
                    <p className="text-[11px] text-[#666B65] dark:text-[#8E8E98] truncate">{callout.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Submenu: Table Dimension Picker */}
      {activeSubmenu === 'table' && (
        <div className="flex flex-col p-3 space-y-3 font-mono">
          <div className="flex items-center gap-2 border-b border-[#E3E5DF] dark:border-[#272A32] pb-2">
            <button
              type="button"
              onClick={() => setActiveSubmenu(null)}
              className="p-1 rounded hover:bg-[#DDD9CE] dark:hover:bg-[#252830] text-[#666B65] dark:text-[#A1A1AA] transition-colors"
              title="Back to commands"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-[#242824] dark:text-[#F4F4F5]">Insert Markdown Table</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] text-[#666B65] dark:text-[#8E8E98]">Columns</label>
              <div className="flex items-center border border-[#DDD9CE] dark:border-[#2C2E38] rounded-md overflow-hidden bg-white dark:bg-[#1E2027]">
                <button
                  type="button"
                  onClick={() => setTableCols((c) => Math.max(1, c - 1))}
                  className="px-2.5 py-1 hover:bg-[#EFECE5] dark:hover:bg-[#272A32] transition-colors"
                >
                  -
                </button>
                <span className="flex-1 text-center font-bold">{tableCols}</span>
                <button
                  type="button"
                  onClick={() => setTableCols((c) => Math.min(8, c + 1))}
                  className="px-2.5 py-1 hover:bg-[#EFECE5] dark:hover:bg-[#272A32] transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#666B65] dark:text-[#8E8E98]">Rows</label>
              <div className="flex items-center border border-[#DDD9CE] dark:border-[#2C2E38] rounded-md overflow-hidden bg-white dark:bg-[#1E2027]">
                <button
                  type="button"
                  onClick={() => setTableRows((r) => Math.max(2, r - 1))}
                  className="px-2.5 py-1 hover:bg-[#EFECE5] dark:hover:bg-[#272A32] transition-colors"
                >
                  -
                </button>
                <span className="flex-1 text-center font-bold">{tableRows}</span>
                <button
                  type="button"
                  onClick={() => setTableRows((r) => Math.min(12, r + 1))}
                  className="px-2.5 py-1 hover:bg-[#EFECE5] dark:hover:bg-[#272A32] transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10.5px] text-[#878C85] dark:text-[#71717A] mr-1">Presets:</span>
            {[
              [2, 2],
              [3, 3],
              [4, 3],
              [4, 4],
            ].map(([c, r]) => (
              <button
                key={`${c}x${r}`}
                type="button"
                onClick={() => {
                  setTableCols(c);
                  setTableRows(r);
                }}
                className={`px-2 py-0.5 rounded text-[10.5px] border transition-colors ${
                  tableCols === c && tableRows === r
                    ? 'border-[#287D54] bg-[#287D54]/10 text-[#1F6342] dark:text-emerald-400 font-bold'
                    : 'border-[#DDD9CE] dark:border-[#2C2E38] hover:bg-[#EFECE5] dark:hover:bg-[#202229]'
                }`}
              >
                {c}×{r}
              </button>
            ))}
          </div>

          <button
            type="button"
            data-testid="insert-table-btn"
            onClick={() => handleInsertTable(tableCols, tableRows)}
            className="w-full py-1.5 rounded-lg bg-[#287D54] hover:bg-[#1F6342] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Insert {tableCols}×{tableRows} Table</span>
          </button>
        </div>
      )}

      {/* 4. Submenu: Equation Type Selector */}
      {activeSubmenu === 'equation' && (
        <div className="flex flex-col h-full font-mono">
          <div className="flex items-center gap-2 p-2.5 border-b border-[#E3E5DF] dark:border-[#272A32] bg-[#EFECE5] dark:bg-[#15161A]">
            <button
              type="button"
              onClick={() => setActiveSubmenu(null)}
              className="p-1 rounded hover:bg-[#DDD9CE] dark:hover:bg-[#252830] text-[#666B65] dark:text-[#A1A1AA] transition-colors"
              title="Back to commands"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-[#242824] dark:text-[#F4F4F5]">Insert KaTeX Equation</span>
          </div>
          <div ref={listRef} className="p-2 space-y-1">
            <button
              type="button"
              data-selected={selectedIndex === 0}
              onClick={() => handleInsertEquation('inline')}
              onMouseEnter={() => setSelectedIndex(0)}
              className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                selectedIndex === 0
                  ? 'bg-[#287D54]/10 dark:bg-emerald-500/15 text-[#1F6342] dark:text-emerald-300 font-semibold'
                  : 'hover:bg-[#F2EFE8] dark:hover:bg-[#202229] text-[#242824] dark:text-[#D4D4D8]'
              }`}
            >
              <Sigma className="w-4 h-4 mt-0.5 text-[#287D54] dark:text-emerald-400" />
              <div>
                <span className="text-xs font-semibold">Inline Equation</span>
                <p className="text-[11px] text-[#666B65] dark:text-[#8E8E98]">
                  Formula inside text: <code className="text-[#287D54] dark:text-emerald-400">$...$</code>
                </p>
              </div>
            </button>

            <button
              type="button"
              data-selected={selectedIndex === 1}
              onClick={() => handleInsertEquation('display')}
              onMouseEnter={() => setSelectedIndex(1)}
              className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                selectedIndex === 1
                  ? 'bg-[#287D54]/10 dark:bg-emerald-500/15 text-[#1F6342] dark:text-emerald-300 font-semibold'
                  : 'hover:bg-[#F2EFE8] dark:hover:bg-[#202229] text-[#242824] dark:text-[#D4D4D8]'
              }`}
            >
              <Sigma className="w-4 h-4 mt-0.5 text-[#287D54] dark:text-emerald-400" />
              <div>
                <span className="text-xs font-semibold">Display Equation Block</span>
                <p className="text-[11px] text-[#666B65] dark:text-[#8E8E98]">
                  Centered standalone block: <code className="text-[#287D54] dark:text-emerald-400">$$...$$</code>
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 0. Main Menu: Categorized Command Palette */}
      {!activeSubmenu && (
        <div ref={listRef} className="overflow-y-auto max-h-[360px] p-1.5 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-6 px-4 text-center font-mono text-xs text-[#878C85] dark:text-[#71717A]">
              No matching commands for <span className="font-semibold text-[#242824] dark:text-[#E4E4E7]">/{query}</span>
            </div>
          ) : (
            renderCategorizedCommands(filteredCommands, selectedIndex, (cmd, idx) => {
              if (cmd.hasSubmenu) {
                cmd.onSelect();
              } else if (cmd.execute && view) {
                cmd.execute(view);
                onClose();
              }
            }, setSelectedIndex)
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Group and render commands by their category with Notion-style typography
 */
function renderCategorizedCommands(commands, selectedIndex, onSelect, onHover) {
  const categories = ['Basic blocks', 'Technical blocks', 'Wiki and metadata'];
  let globalIdx = 0;

  return categories.map((cat) => {
    const catCommands = commands.filter((c) => c.category === cat);
    if (catCommands.length === 0) return null;

    return (
      <div key={cat} className="space-y-0.5">
        <div className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider font-semibold text-[#878C85] dark:text-[#71717A]">
          {cat}
        </div>
        {catCommands.map((cmd) => {
          const currentIndex = globalIdx++;
          const isSelected = currentIndex === selectedIndex;
          const Icon = cmd.icon;

          return (
            <button
              key={cmd.id}
              type="button"
              data-command-id={cmd.id}
              data-selected={isSelected}
              onClick={() => onSelect(cmd, currentIndex)}
              onMouseEnter={() => onHover(currentIndex)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer group ${
                isSelected
                  ? 'bg-[#287D54]/10 dark:bg-emerald-500/15 text-[#1F6342] dark:text-emerald-300 font-medium'
                  : 'hover:bg-[#F2EFE8] dark:hover:bg-[#202229] text-[#242824] dark:text-[#D4D4D8]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-[#287D54] text-white'
                      : 'bg-[#EAE7DF] dark:bg-[#22242B] text-[#555A54] dark:text-[#A1A1AA] group-hover:text-[#287D54] dark:group-hover:text-emerald-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{cmd.title}</div>
                  <div className="text-[10.5px] text-[#767C74] dark:text-[#8E8E98] truncate">{cmd.desc}</div>
                </div>
              </div>
              {cmd.hasSubmenu && (
                <ChevronRight className="w-3.5 h-3.5 text-[#878C85] dark:text-[#71717A] opacity-70 shrink-0 ml-1" />
              )}
            </button>
          );
        })}
      </div>
    );
  });
}

/**
 * Replace text from `from` to `to` and set cursor/selection in CodeMirror
 */
function replaceAndSetCursor(editorView, from, to, insertText, selStart, selEnd = selStart) {
  editorView.dispatch({
    changes: { from, to, insert: insertText },
    selection: { anchor: selStart, head: selEnd },
  });
  editorView.focus();
}

/**
 * Insert or edit YAML Frontmatter at top of document
 */
function insertFrontmatter(editorView, from, to, title) {
  const docText = editorView.state.doc.toString();
  const cleanTitle = title || 'Untitled Note';
  const today = new Date().toISOString().split('T')[0];

  // If document already starts with YAML frontmatter, position inside it
  if (docText.startsWith('---\n')) {
    editorView.dispatch({
      changes: { from, to, insert: '' },
      selection: { anchor: 4 },
    });
    editorView.focus();
    return;
  }

  // Remove the `/` trigger first
  editorView.dispatch({
    changes: { from, to, insert: '' },
  });

  // Prepend frontmatter at start of file
  const frontmatterText = `---\ntitle: "${cleanTitle}"\ntags: []\ndate: ${today}\n---\n\n`;
  editorView.dispatch({
    changes: { from: 0, to: 0, insert: frontmatterText },
    selection: { anchor: frontmatterText.indexOf('tags: [') + 7 },
  });
  editorView.focus();
}

