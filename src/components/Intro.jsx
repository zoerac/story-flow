import { useCallback, useRef, useState } from "react";
import { ArrowRight, Check, FileText, GitFork, Sparkles } from "lucide-react";
import { GALLERY_TILES, INTRO_EXAMPLE, INTRO_STEPS, buildSummary } from "../data/intro";
import { DocModal } from "./DocModal";

export function Intro({ onDone }) {
  const [phase, setPhase] = useState("need"); // need | audience | tone | summary
  const [need, setNeed] = useState("");
  const [answers, setAnswers] = useState({});
  const [bubbles, setBubbles] = useState([]);
  const [showDoc, setShowDoc] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const rafRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setMouse({
        x: (e.clientX - cx) / cx,
        y: (e.clientY - cy) / cy,
      });
    });
  }, []);

  const pushBubble = (from, text) => setBubbles((prev) => [...prev, { from, text }]);

  const submitNeed = () => {
    const val = need.trim();
    if (!val) return;
    pushBubble("user", val);
    setTimeout(() => {
      pushBubble("ai", INTRO_STEPS[0].question);
      setPhase("audience");
    }, 300);
  };

  const pickChip = (stepIdx, chip) => {
    const step = INTRO_STEPS[stepIdx];
    pushBubble("user", chip);
    setAnswers((prev) => ({ ...prev, [step.id]: chip }));

    const nextIdx = stepIdx + 1;
    if (nextIdx < INTRO_STEPS.length) {
      setTimeout(() => {
        pushBubble("ai", INTRO_STEPS[nextIdx].question);
        setPhase(INTRO_STEPS[nextIdx].id);
      }, 300);
    } else {
      setTimeout(() => {
        pushBubble("ai", "明白了，帮你整理一下意图摘要——");
        setPhase("summary");
      }, 300);
    }
  };

  const summary = phase === "summary"
    ? buildSummary({ need: need.trim() || INTRO_EXAMPLE, ...answers })
    : null;

  const currentStepIdx = INTRO_STEPS.findIndex((s) => s.id === phase);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "linear-gradient(135deg, #f0eefc 0%, #e8f5f0 50%, #eaf1fb 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        overflow: "hidden",
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Keyframe injection for idle float animation */}
      <style>{`
        @keyframes floatY { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
      `}</style>

      {/* Gallery background layer */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {GALLERY_TILES.map((tile) => (
          <div
            key={tile.id}
            style={{
              position: "absolute",
              left: `${tile.x}%`,
              top: `${tile.y}%`,
              transform: `translate(${mouse.x * tile.depth}px, ${mouse.y * tile.depth}px)`,
              transition: "transform 0.35s ease-out",
              opacity: 0.55,
            }}
          >
            <div style={{ animation: `floatY ${tile.dur}s ease-in-out infinite` }}>
              <MiniSlide tile={tile} />
            </div>
          </div>
        ))}
      </div>

      {/* Glass panel */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(100%, 480px)",
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderRadius: 14,
          border: "0.5px solid rgba(255,255,255,0.9)",
          boxShadow: "0 20px 60px rgba(26,25,21,0.14), 0 1px 0 rgba(255,255,255,0.8) inset",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "calc(100vh - 48px)",
        }}
      >
        {/* Brand header */}
        <div
          style={{
            height: 34,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 14px",
            borderBottom: "0.5px solid var(--color-border-tertiary)",
            flexShrink: 0,
          }}
        >
          <GitFork size={14} style={{ color: "#7F77DD" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>StoryFlow</span>
          <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", flex: 1 }}>意图对齐</span>
          <button
            type="button"
            onClick={() => setShowDoc(true)}
            style={{
              display: "flex", alignItems: "center", gap: 4, fontSize: 10,
              color: "var(--color-text-tertiary)", background: "none", border: "none",
              cursor: "pointer", padding: "2px 6px", borderRadius: 5,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-background-secondary)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--color-text-tertiary)"; }}
          >
            <FileText size={11} /> 产品文档
          </button>
        </div>
        {showDoc && <DocModal onClose={() => setShowDoc(false)} />}

        {/* Chat area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 8 }}>

          {/* Initial AI prompt */}
          <AiBubble>
            <Sparkles size={10} style={{ marginRight: 4, verticalAlign: -1 }} />
            你好！先告诉我这次演示的需求，我会帮你梳理故事线结构。
          </AiBubble>

          {/* Replayed conversation bubbles */}
          {bubbles.map((b, i) => (
            b.from === "user"
              ? <UserBubble key={i}>{b.text}</UserBubble>
              : <AiBubble key={i}><Sparkles size={10} style={{ marginRight: 4, verticalAlign: -1 }} />{b.text}</AiBubble>
          ))}

          {/* Summary card */}
          {summary && (
            <div
              style={{
                background: "#FAFAFE",
                border: "0.5px solid #CECBF6",
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#3C3489", fontWeight: 600, fontSize: 11 }}>
                <Check size={12} /> 意图摘要
              </div>
              {[
                { label: "目标", value: summary.goal },
                { label: "听众", value: summary.audience },
                { label: "核心论点", value: summary.thesis },
                { label: "调性节奏", value: summary.tone },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 9, color: "var(--color-text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-primary)", lineHeight: 1.5 }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input / chips area */}
        <div
          style={{
            padding: "10px 14px",
            borderTop: "0.5px solid var(--color-border-tertiary)",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* need phase */}
          {phase === "need" && (
            <>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  autoFocus
                  value={need}
                  onChange={(e) => setNeed(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && submitNeed()}
                  placeholder="描述你要做的演示..."
                  style={{
                    flex: 1,
                    fontSize: 12,
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: "0.5px solid var(--color-border-tertiary)",
                    background: "var(--color-background-secondary)",
                    color: "var(--color-text-primary)",
                    outline: "none",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#CECBF6"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--color-border-tertiary)"; }}
                />
                <button
                  type="button"
                  onClick={submitNeed}
                  style={{
                    padding: "6px 12px",
                    fontSize: 12,
                    borderRadius: 8,
                    border: "none",
                    background: "#7F77DD",
                    color: "#fff",
                    cursor: need.trim() ? "pointer" : "default",
                    opacity: need.trim() ? 1 : 0.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    whiteSpace: "nowrap",
                  }}
                >
                  <ArrowRight size={12} /> 继续
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>示例：</span>
                <button
                  type="button"
                  onClick={() => setNeed(INTRO_EXAMPLE)}
                  style={{
                    fontSize: 10,
                    color: "#7F77DD",
                    background: "#EEEDFE",
                    border: "0.5px solid #CECBF6",
                    borderRadius: 20,
                    padding: "3px 10px",
                    cursor: "pointer",
                  }}
                >
                  {INTRO_EXAMPLE}
                </button>
              </div>
            </>
          )}

          {/* audience / tone chip phase */}
          {currentStepIdx >= 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {INTRO_STEPS[currentStepIdx].chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => pickChip(currentStepIdx, chip)}
                  style={{
                    fontSize: 11,
                    color: "var(--color-text-secondary)",
                    background: "var(--color-background-secondary)",
                    border: "0.5px solid var(--color-border-secondary)",
                    borderRadius: 20,
                    padding: "5px 12px",
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#EEEDFE"; e.currentTarget.style.borderColor = "#CECBF6"; e.currentTarget.style.color = "#3C3489"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-background-secondary)"; e.currentTarget.style.borderColor = "var(--color-border-secondary)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* summary phase — enter button */}
          {phase === "summary" && (
            <button
              type="button"
              onClick={onDone}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                border: "none",
                background: "#1D9E75",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              进入编辑 <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniSlide({ tile }) {
  return (
    <div
      style={{
        width: 88,
        background: "#fff",
        borderRadius: 7,
        boxShadow: "0 3px 12px rgba(26,25,21,0.10)",
        overflow: "hidden",
        border: "0.5px solid rgba(255,255,255,0.7)",
      }}
    >
      <div style={{ height: 4, background: tile.c }} />
      <div style={{ padding: "7px 8px 8px" }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: "#1a1915", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {tile.title}
        </div>
        <div style={{ height: 3, borderRadius: 2, background: tile.bg, marginBottom: 3 }} />
        <div style={{ height: 3, borderRadius: 2, background: tile.bg, width: "70%", marginBottom: 3 }} />
        <div style={{ height: 3, borderRadius: 2, background: tile.bg, width: "85%" }} />
      </div>
    </div>
  );
}

function AiBubble({ children }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start" }}>
      <div
        style={{
          padding: "7px 11px",
          borderRadius: 10,
          borderBottomLeftRadius: 3,
          maxWidth: "88%",
          fontSize: 12,
          lineHeight: 1.65,
          background: "#E1F5EE",
          color: "#085041",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function UserBubble({ children }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div
        style={{
          padding: "7px 11px",
          borderRadius: 10,
          borderBottomRightRadius: 3,
          maxWidth: "88%",
          fontSize: 12,
          lineHeight: 1.65,
          background: "#EEEDFE",
          color: "#3C3489",
        }}
      >
        {children}
      </div>
    </div>
  );
}
