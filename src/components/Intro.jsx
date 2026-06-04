import { useState } from "react";
import { ArrowRight, Check, GitFork, Sparkles } from "lucide-react";
import { INTRO_EXAMPLE, INTRO_STEPS, buildSummary } from "../data/intro";

export function Intro({ onDone }) {
  const [phase, setPhase] = useState("need"); // need | audience | tone | summary
  const [need, setNeed] = useState("");
  const [answers, setAnswers] = useState({});
  const [bubbles, setBubbles] = useState([]);

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
        background: "var(--color-background-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "min(100%, 480px)",
          background: "var(--color-background-primary)",
          borderRadius: 12,
          border: "0.5px solid var(--color-border-tertiary)",
          boxShadow: "0 14px 40px rgba(26,25,21,0.08)",
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
          <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>意图对齐</span>
        </div>

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
