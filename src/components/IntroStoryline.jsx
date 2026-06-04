import { useLayoutEffect, useRef } from "react";
import { Sparkles } from "lucide-react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// 意图对齐阶段右栏的只读故事线预览。随 draft 实时重排：
// 新章节用 anim-fade-up 入场，移动的章节用 FLIP 平滑滑到新位置，
// 被 AI 改写内容的章节触发高亮脉冲，让“AI 刚改了哪里”一目了然。
export function IntroStoryline({ sections }) {
  const totalPages = sections.reduce((sum, s) => sum + s.pages.length, 0);

  const nodeRefs = useRef(new Map());   // id -> DOM 节点
  const prevRects = useRef(new Map());  // id -> 上一轮位置
  const prevSig = useRef(new Map());    // id -> 上一轮内容签名

  useLayoutEffect(() => {
    const reduce = prefersReducedMotion();
    const nextRects = new Map();

    sections.forEach((s) => {
      const node = nodeRefs.current.get(s.id);
      if (!node) return;
      const rect = node.getBoundingClientRect();
      nextRects.set(s.id, rect);

      const prev = prevRects.current.get(s.id);
      const sig = JSON.stringify(s);
      const wasSig = prevSig.current.get(s.id);

      if (prev && !reduce) {
        // FLIP：先把节点位移回旧位置，再让它过渡到新位置
        const dx = prev.left - rect.left;
        const dy = prev.top - rect.top;
        if (dx || dy) {
          node.style.transition = "none";
          node.style.transform = `translate(${dx}px, ${dy}px)`;
          requestAnimationFrame(() => {
            node.style.transition = "transform var(--motion-slow) var(--ease-out)";
            node.style.transform = "";
          });
        }
        // 同一章节内容被改写（加页 / 调性等）→ 高亮脉冲
        if (wasSig !== undefined && wasSig !== sig) {
          node.classList.remove("anim-highlight");
          void node.offsetWidth; // 强制回流以重启动画
          node.classList.add("anim-highlight");
        }
      }
    });

    prevRects.current = nextRects;
    prevSig.current = new Map(sections.map((s) => [s.id, JSON.stringify(s)]));
  }, [sections]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 2px 10px",
          flexShrink: 0,
          color: "#3C3489",
          fontWeight: 650,
          fontSize: 11,
        }}
      >
        <Sparkles size={12} /> 当前故事线方案
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--color-text-tertiary)", fontWeight: 500 }}>
          {sections.length} 章 · {totalPages} 页
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 2 }}>
        {sections.map((s, i) => (
          <div
            key={s.id}
            ref={(el) => {
              if (el) nodeRefs.current.set(s.id, el);
              else nodeRefs.current.delete(s.id);
            }}
            className="anim-fade-up"
            style={{
              animationDelay: `${i * 30}ms`,
              borderRadius: 10,
              border: `0.5px solid ${s.bd}`,
              borderLeft: `3px solid ${s.c}`,
              background: s.bg,
              padding: "9px 11px",
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span
                style={{
                  flexShrink: 0,
                  width: 17,
                  height: 17,
                  borderRadius: "50%",
                  background: s.c,
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 650, color: "var(--color-text-primary)", lineHeight: 1.3 }}>
                {s.title}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  flexShrink: 0,
                  fontSize: 9,
                  color: s.c,
                  background: "rgba(255,255,255,0.7)",
                  border: `0.5px solid ${s.bd}`,
                  borderRadius: 20,
                  padding: "1px 7px",
                  fontWeight: 600,
                }}
              >
                {s.pages.length} 页
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: "var(--color-text-secondary)", lineHeight: 1.5, paddingLeft: 24 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
