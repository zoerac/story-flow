import { Sparkles } from "lucide-react";

// 意图对齐阶段右栏的只读故事线预览。随 draft 实时重排；
// 卡片以 section.id 为 key，配合动画类让重排 / 切换草案有过渡。
export function IntroStoryline({ sections }) {
  const totalPages = sections.reduce((sum, s) => sum + s.pages.length, 0);

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
