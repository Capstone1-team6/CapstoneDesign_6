// utils/parseMarkdown.tsx
// react-markdown 호출을 한 곳에 모아 보안 옵션(rehype-sanitize) 일관 적용.
// 컴포넌트에서는 `<Markdown>{text}</Markdown>` 로만 호출하도록 캡슐화.

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import type { ReactElement } from 'react';

interface Props {
  children: string;
  className?: string;
}

export function Markdown({ children, className }: Props): ReactElement {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

/** "**bold**" 만 처리하는 초경량 인라인 파서 — 출처 카드 summary 등에 사용 */
export function highlightBold(text: string): Array<string | { bold: string }> {
  const out: Array<string | { bold: string }> = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push({ bold: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
