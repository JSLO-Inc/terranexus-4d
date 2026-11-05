import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Robust, lightweight Markdown Renderer for scientific text and AI copilot responses.
 * Parses headers, bold, italics, inline code, code blocks, lists, tables, blockquotes, and dividers.
 * Zero external markdown library dependencies required.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split into lines for block-level parsing
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = '';
  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];
  let inList = false;
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' = 'ul';

  const flushList = () => {
    if (inList && listItems.length > 0) {
      if (listType === 'ul') {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-2 space-y-1 list-none pl-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-300">
                <span className="text-cyan-400 font-bold select-none shrink-0 text-[10px] mt-0.5">•</span>
                <span className="flex-1">{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${elements.length}`} className="my-2 space-y-1 list-none pl-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-300">
                <span className="text-cyan-400 font-mono font-semibold select-none shrink-0 text-[10px] min-w-[14px]">
                  {idx + 1}.
                </span>
                <span className="flex-1">{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        );
      }
      listItems = [];
      inList = false;
    }
  };

  const flushTable = () => {
    if (inTable && (tableHeader.length > 0 || tableRows.length > 0)) {
      elements.push(
        <div key={`table-${elements.length}`} className="my-3 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/80">
          <table className="w-full text-left border-collapse text-[11px]">
            {tableHeader.length > 0 && (
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800">
                  {tableHeader.map((th, idx) => (
                    <th key={idx} className="px-3 py-1.5 font-mono font-semibold text-cyan-300">
                      {renderInline(th.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-800/60 font-mono text-[10px]">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-900/40">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-1.5 text-slate-300 whitespace-nowrap">
                      {renderInline(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeader = [];
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. Code blocks: ```lang ... ```
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        elements.push(
          <div key={`code-${elements.length}`} className="my-2.5 rounded-lg border border-slate-800 bg-slate-950 font-mono text-[11px] overflow-hidden shadow-inner">
            {codeBlockLang && (
              <div className="px-3 py-1 bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] uppercase font-semibold flex items-center justify-between">
                <span>{codeBlockLang}</span>
              </div>
            )}
            <pre className="p-3 overflow-x-auto text-cyan-300 leading-relaxed font-mono">
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          </div>
        );
        codeBlockContent = [];
        codeBlockLang = '';
        inCodeBlock = false;
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(rawLine);
      continue;
    }

    // 2. Table rows: | Col 1 | Col 2 |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map(c => c.trim());

      // Check if it's separator row like |---|---|
      const isSeparator = cells.every(c => /^:?-+:?$/.test(c));
      if (isSeparator) {
        inTable = true;
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    // 3. Unordered List item (- item, * item, • item)
    const ulMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
      }
      listItems.push(ulMatch[1]);
      continue;
    }

    // 4. Ordered List item (1. item, 2. item)
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
      }
      listItems.push(olMatch[2]);
      continue;
    }

    // Non-list line, flush any active list
    flushList();

    // 5. Horizontal rule: --- or *** or ___
    if (/^([-*_]){3,}$/.test(trimmed)) {
      elements.push(<hr key={`hr-${elements.length}`} className="my-3 border-t border-slate-800" />);
      continue;
    }

    // 6. LaTeX Display Math Block: $$ ... $$ (QA-05 / AI-03)
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
      const mathExpr = trimmed.slice(2, -2).trim();
      elements.push(
        <div
          key={`math-${elements.length}`}
          className="my-3 p-3 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-center font-mono text-cyan-200 text-xs shadow-inner overflow-x-auto tracking-wide"
        >
          {renderMathFormatted(mathExpr)}
        </div>
      );
      continue;
    }

    // 7. Headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${elements.length}`} className="text-xs font-bold text-cyan-300 font-mono mt-3 mb-1 tracking-wide flex items-center gap-1.5 border-b border-slate-800/80 pb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${elements.length}`} className="text-sm font-bold text-slate-100 font-mono mt-3.5 mb-1.5 tracking-wide flex items-center gap-1.5 border-b border-slate-800 pb-1">
          <span className="w-2 h-2 rounded-sm bg-cyan-500" />
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${elements.length}`} className="text-base font-extrabold text-white mt-4 mb-2 tracking-wide border-b border-slate-700 pb-1">
          {renderInline(trimmed.slice(2))}
        </h1>
      );
      continue;
    }

    // 7. Blockquote: > text
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${elements.length}`} className="my-2 pl-3 border-l-2 border-cyan-500/80 italic text-slate-400 text-[11px] bg-slate-900/30 py-1 rounded-r">
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    // 8. Empty line / paragraph break
    if (!trimmed) {
      elements.push(<div key={`sp-${elements.length}`} className="h-1.5" />);
      continue;
    }

    // 9. Standard paragraph
    elements.push(
      <p key={`p-${elements.length}`} className="my-1 leading-relaxed text-slate-200">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();
  flushTable();

  return <div className={`markdown-body space-y-1 ${className}`}>{elements}</div>;
};

/**
 * Formats LaTeX symbols and sub/superscripts into clean React nodes
 */
function renderMathFormatted(expr: string): React.ReactNode {
  let cleaned = expr
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\pi/g, 'π')
    .replace(/\\theta/g, 'θ')
    .replace(/\\mu/g, 'µ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\approx/g, '≈')
    .replace(/\\ne/g, '≠')
    .replace(/\\pm/g, '±')
    .replace(/\\infty/g, '∞')
    .replace(/\\partial/g, '∂')
    .replace(/\\nabla/g, '∇')
    .replace(/\\text\{([^}]+)\}/g, '$1');

  const parts = cleaned.split(/(_\{[^}]+\}|\^\{[^}]+\}|_[0-9a-zA-Z]|\^[0-9a-zA-Z])/g);

  return parts.map((part, pIdx) => {
    if (part.startsWith('_{') && part.endsWith('}')) {
      return <sub key={pIdx} className="text-[9px] text-cyan-400">{part.slice(2, -1)}</sub>;
    }
    if (part.startsWith('^{') && part.endsWith('}')) {
      return <sup key={pIdx} className="text-[9px] text-amber-300">{part.slice(2, -1)}</sup>;
    }
    if (part.startsWith('_') && part.length === 2) {
      return <sub key={pIdx} className="text-[9px] text-cyan-400">{part[1]}</sub>;
    }
    if (part.startsWith('^') && part.length === 2) {
      return <sup key={pIdx} className="text-[9px] text-amber-300">{part[1]}</sup>;
    }
    return <span key={pIdx}>{part}</span>;
  });
}

/**
 * Parses inline formatting: bold (**text**), italic (*text*), code (`code`), math ($math$), links ([title](url))
 */
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Tokenize string with regex matching inline markers including math ($...$)
  const regex = /(\$[^$]+\$|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Inline LaTeX math: $math$
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2 && !part.startsWith('$$')) {
      return (
        <span
          key={index}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 font-mono text-cyan-300 text-[11px]"
        >
          {renderMathFormatted(part.slice(1, -1))}
        </span>
      );
    }

    // Inline code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-cyan-300 text-[10px]">
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={index} className="italic text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Markdown link: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors font-mono"
        >
          {linkMatch[1]}
        </a>
      );
    }

    // Plain text
    return <span key={index}>{part}</span>;
  });
}
