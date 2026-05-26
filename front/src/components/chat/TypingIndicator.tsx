// components/chat/TypingIndicator.tsx
// 도트 3개 깜빡임 — RAG 파이프라인 정보가 아직 없을 때의 폴백.

export function TypingIndicator() {
  return (
    <div className="inline-flex items-center gap-1 px-1 py-2" aria-label="응답 작성 중">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-brand-400"
          style={{
            animation: 'cd-blink 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}
