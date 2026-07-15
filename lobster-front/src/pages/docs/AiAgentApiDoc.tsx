import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, FileText, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const MANUAL_SOURCE = '/docs/ai-agent-api.md';

type MarkdownBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; language: string; text: string }
  | { type: 'table'; rows: string[][] };

const parseMarkdown = (source: string): MarkdownBlock[] => {
  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  const pushParagraph = (paragraphLines: string[]) => {
    const text = paragraphLines.join(' ').trim();
    if (text) {
      blocks.push({ type: 'paragraph', text });
    }
  };

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const fenceMatch = trimmed.match(/^```(.*)$/);
    if (fenceMatch) {
      const language = fenceMatch[1]?.trim() || 'text';
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      blocks.push({ type: 'code', language, text: codeLines.join('\n') });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim() });
      index += 1;
      continue;
    }

    if (trimmed.startsWith('|') && lines[index + 1]?.trim().match(/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/)) {
      const rows: string[][] = [];
      rows.push(splitTableRow(trimmed));
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        rows.push(splitTableRow(lines[index].trim()));
        index += 1;
      }
      blocks.push({ type: 'table', rows });
      continue;
    }

    const listMatch = trimmed.match(/^(-|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const ordered = /\d+\./.test(listMatch[1]);
      const items: string[] = [];
      while (index < lines.length) {
        const itemMatch = lines[index].trim().match(/^(-|\d+\.)\s+(.+)$/);
        if (!itemMatch || /\d+\./.test(itemMatch[1]) !== ordered) {
          break;
        }
        items.push(itemMatch[2].trim());
        index += 1;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (!next || next.startsWith('#') || next.startsWith('```') || next.startsWith('|') || next.match(/^(-|\d+\.)\s+/)) {
        break;
      }
      paragraphLines.push(next);
      index += 1;
    }
    pushParagraph(paragraphLines);
  }

  return blocks;
};

const splitTableRow = (row: string): string[] => {
  return row.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
};

export default function AiAgentApiDoc() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadManual = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${MANUAL_SOURCE}?t=${Date.now()}`, {
          signal: controller.signal,
          headers: { Accept: 'text/markdown;charset=utf-8,text/plain;charset=utf-8,*/*' },
        });
        if (!response.ok) {
          throw new Error('接入手册加载失败');
        }
        setContent(await response.text());
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : '接入手册加载失败');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadManual();

    return () => controller.abort();
  }, []);

  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] px-4 py-6 text-[#1A1A1A] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="inline-flex w-fit items-center gap-2 text-sm font-black text-[#555] hover:text-[#1A1A1A]">
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
          <a
            href={MANUAL_SOURCE}
            download
            className="inline-flex min-h-10 w-fit items-center gap-2 rounded-xl border-2 border-[#1A1A1A] bg-[#FFD93D] px-4 text-sm font-black shadow-[3px_3px_0px_0px_#1A1A1A] transition-all hover:-translate-y-0.5"
          >
            <Download className="h-4 w-4" />
            下载 Markdown
          </a>
        </div>

        <header className="rounded-3xl border-4 border-[#1A1A1A] bg-white p-6 shadow-[6px_6px_0px_0px_#1A1A1A] sm:p-8">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-[#1A1A1A] bg-[#FFD93D] shadow-[4px_4px_0px_0px_#1A1A1A]">
            <FileText className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">AI Agent 接入手册</h1>
          <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-[#555] sm:text-base">
            这是面向外部 Agent 的 API 接入说明。页面会以 UTF-8 读取 Markdown 文件并渲染成前端预览，避免浏览器直接打开静态 .md 时出现中文乱码。
          </p>
        </header>

        <main className="mt-6 rounded-3xl border-4 border-[#1A1A1A] bg-white p-5 shadow-[6px_6px_0px_0px_#1A1A1A] sm:p-8">
          {loading && (
            <div className="flex items-center gap-3 rounded-2xl border-2 border-[#1A1A1A] bg-[#F7F7F7] p-4 text-sm font-black">
              <RefreshCw className="h-4 w-4 animate-spin" />
              正在加载手册...
            </div>
          )}

          {error && !loading && (
            <div className="rounded-2xl border-2 border-[#1A1A1A] bg-[#FFEDEB] p-4 text-sm font-black text-[#B42318]">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-5">
              {blocks.map((block, index) => (
                <MarkdownBlockView key={`${block.type}-${index}`} block={block} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function MarkdownBlockView({ block }: { block: MarkdownBlock }) {
  if (block.type === 'heading') {
    const className = "mt-8 scroll-mt-6 font-black tracking-tight text-[#1A1A1A] first:mt-0";
    if (block.level <= 1) {
      return <h2 className={`${className} text-3xl`}>{block.text}</h2>;
    }
    if (block.level === 2) {
      return <h3 className={`${className} text-2xl`}>{block.text}</h3>;
    }
    return <h4 className={`${className} text-xl`}>{block.text}</h4>;
  }

  if (block.type === 'paragraph') {
    return <p className="text-sm font-bold leading-7 text-[#444] sm:text-base">{block.text}</p>;
  }

  if (block.type === 'list') {
    const ListTag = block.ordered ? 'ol' : 'ul';
    return (
      <ListTag className={`space-y-2 pl-6 text-sm font-bold leading-7 text-[#444] sm:text-base ${block.ordered ? 'list-decimal' : 'list-disc'}`}>
        {block.items.map((item) => <li key={item}>{item}</li>)}
      </ListTag>
    );
  }

  if (block.type === 'code') {
    return (
      <div className="overflow-hidden rounded-2xl border-2 border-[#1A1A1A] bg-[#111]">
        <div className="border-b border-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#FFD93D]">{block.language}</div>
        <pre className="overflow-x-auto p-4 text-xs leading-6 text-[#F7F7F7] sm:text-sm"><code>{block.text}</code></pre>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-[#1A1A1A]">
      <table className="min-w-full border-collapse text-left text-sm font-bold">
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={`${row.join('-')}-${rowIndex}`} className={rowIndex === 0 ? 'bg-[#FFD93D]' : 'odd:bg-white even:bg-[#FAF9F6]'}>
              {row.map((cell, cellIndex) => {
                const CellTag = rowIndex === 0 ? 'th' : 'td';
                return <CellTag key={`${cell}-${cellIndex}`} className="border-r-2 border-[#1A1A1A] px-4 py-3 last:border-r-0">{cell}</CellTag>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

