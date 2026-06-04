import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, FileText, Sparkles } from "lucide-react";
import { INTRO_EXAMPLE, INTRO_STEPS } from "../data/intro";
import { buildInitialDraft, refineDraft } from "../lib/introEngine";
import { IntroStoryline } from "./IntroStoryline";
import { DocModal } from "./DocModal";

export function Intro({ onDone }) {
  const [phase, setPhase] = useState("need"); // need | audience | tone | refine
  const [need, setNeed] = useState("");
  const [answers, setAnswers] = useState({});
  const [bubbles, setBubbles] = useState([]);
  const [showDoc, setShowDoc] = useState(false);

  // 精修阶段状态
  const [draft, setDraft] = useState(null);
  const [draftId, setDraftId] = useState("default");
  const [refineChips, setRefineChips] = useState([]);
  const [accumulated, setAccumulated] = useState("");
  const [refineInput, setRefineInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const chatEndRef = useRef(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bubbles, thinking]);

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

  // 生成初版故事线方案，进入精修阶段
  const startRefine = (merged) => {
    const { sections, draftId: id, summary, chips } = buildInitialDraft({
      need: need.trim() || INTRO_EXAMPLE,
      audience: merged.audience,
      tone: merged.tone,
    });
    setDraft(sections);
    setDraftId(id);
    setRefineChips(chips);
    setAccumulated([need.trim() || INTRO_EXAMPLE, merged.audience, merged.tone].filter(Boolean).join(" "));
    setPhase("refine");
    setTimeout(() => pushBubble("ai", summary), 300);
  };

  const pickChip = (stepIdx, chip) => {
    const step = INTRO_STEPS[stepIdx];
    const merged = { ...answers, [step.id]: chip };
    pushBubble("user", chip);
    setAnswers(merged);

    const nextIdx = stepIdx + 1;
    if (nextIdx < INTRO_STEPS.length) {
      setTimeout(() => {
        pushBubble("ai", INTRO_STEPS[nextIdx].question);
        setPhase(INTRO_STEPS[nextIdx].id);
      }, 300);
    } else {
      setTimeout(() => {
        pushBubble("ai", "明白了，我先生成一版故事线方案——");
        startRefine(merged);
      }, 300);
    }
  };

  // 单轮精修：应用用户澄清，实时改写右侧故事线
  const sendRefine = (raw) => {
    const val = (raw ?? "").trim();
    if (!val || thinking) return;
    pushBubble("user", val);
    setRefineInput("");
    setThinking(true);
    setTimeout(() => {
      const { sections, draftId: id, summary, chips } = refineDraft(draft, val, {
        accumulatedText: accumulated,
        draftId,
        lastChips: refineChips,
      });
      setDraft(sections);
      setDraftId(id);
      setRefineChips(chips);
      setAccumulated((prev) => `${prev} ${val}`);
      setThinking(false);
      pushBubble("ai", summary);
    }, 500 + Math.random() * 400);
  };

  const currentStepIdx = INTRO_STEPS.findIndex((s) => s.id === phase);
  const isRefine = phase === "refine";

  return (
    <div
      className="anim-fade"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        boxSizing: "border-box",
        zIndex: 100,
        background: "linear-gradient(135deg, #f7f6ff 0%, #f4fbf8 52%, #f6f9fd 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: isRefine ? 18 : 34,
        padding: "40px 20px 28px",
        overflow: "auto",
      }}
    >
      {showDoc && <DocModal onClose={() => setShowDoc(false)} />}

      {/* 标题区：精修阶段收窄，给双栏留出空间 */}
      <div style={{ textAlign: "center", width: "min(calc(100vw - 40px), 980px)", flexShrink: 0, boxSizing: "border-box" }}>
        <h1
          style={{
            margin: 0,
            fontSize: isRefine ? "clamp(26px, 4vw, 38px)" : "clamp(48px, 8vw, 86px)",
            lineHeight: 1,
            fontWeight: 720,
            color: "var(--color-text-primary)",
            transition: "font-size 0.4s ease",
          }}
        >
          StoryFlow{isRefine && <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-tertiary)", marginLeft: 10 }}>· 意图对齐</span>}
        </h1>
        {!isRefine && (
          <p
            style={{
              margin: "16px 0 0",
              maxWidth: 620,
              marginLeft: "auto",
              marginRight: "auto",
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--color-text-secondary)",
              overflowWrap: "anywhere",
            }}
          >
            用一轮对话对齐演示意图，再把结构、版本与局部精修交给 AI 持续协作。
          </p>
        )}
        <button
          type="button"
          onClick={() => setShowDoc(true)}
          style={{
            height: 28,
            marginTop: isRefine ? 8 : 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            color: "var(--color-text-secondary)",
            background: "rgba(255,255,255,0.72)",
            border: "0.5px solid var(--color-border-tertiary)",
            cursor: "pointer",
            padding: "0 10px",
            borderRadius: 7,
            boxShadow: "0 2px 10px rgba(26,25,21,0.05)",
          }}
        >
          <FileText size={12} /> 产品文档
        </button>
      </div>

      {isRefine ? (
        /* —— 精修阶段：左对话 + 右故事线预览 —— */
        <div
          style={{
            width: "min(calc(100vw - 40px), 980px)",
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            boxSizing: "border-box",
          }}
        >
          {/* 左栏：对话 */}
          <div
            className="anim-fade-up"
            style={{
              flex: "1 1 380px",
              minWidth: 300,
              maxHeight: "min(64vh, 520px)",
              display: "flex",
              flexDirection: "column",
              borderRadius: 12,
              border: "0.5px solid var(--color-border-tertiary)",
              background: "var(--color-background-primary)",
              boxShadow: "0 18px 52px rgba(26,25,21,0.12)",
              overflow: "hidden",
            }}
          >
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              <AiBubble>
                <Sparkles size={10} style={{ marginRight: 4, verticalAlign: -1 }} />
                你好！先告诉我这次演示的需求，我会帮你梳理故事线结构。
              </AiBubble>
              {bubbles.map((b, i) => (
                b.from === "user"
                  ? <UserBubble key={i}>{b.text}</UserBubble>
                  : <AiBubble key={i}><Sparkles size={10} style={{ marginRight: 4, verticalAlign: -1 }} />{b.text}</AiBubble>
              ))}
              {thinking && (
                <div className="anim-fade-up" style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ padding: "9px 12px", borderRadius: 10, borderBottomLeftRadius: 3, background: "#E1F5EE", display: "flex", gap: 4 }}>
                    {[0, 1, 2].map((d) => (
                      <span key={d} className="anim-blink" style={{ animationDelay: `${d * 160}ms`, width: 5, height: 5, borderRadius: "50%", background: "#1D9E75" }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* AI 建议 chips */}
            <div style={{ padding: "8px 14px 0", display: "flex", flexWrap: "wrap", gap: 6, flexShrink: 0 }}>
              {refineChips.map((chip, i) => (
                <button
                  key={chip}
                  type="button"
                  disabled={thinking}
                  onClick={() => sendRefine(chip)}
                  className="anim-fade-up"
                  style={{
                    animationDelay: `${i * 40}ms`,
                    minHeight: 28,
                    fontSize: 11,
                    color: "var(--color-text-secondary)",
                    background: "var(--color-background-primary)",
                    border: "0.5px solid var(--color-border-secondary)",
                    borderRadius: 8,
                    padding: "0 10px",
                    cursor: thinking ? "default" : "pointer",
                    opacity: thinking ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => { if (thinking) return; e.currentTarget.style.background = "#EEEDFE"; e.currentTarget.style.borderColor = "#CECBF6"; e.currentTarget.style.color = "#3C3489"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-background-primary)"; e.currentTarget.style.borderColor = "var(--color-border-secondary)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* 自由输入 + 进入编辑 */}
            <div style={{ padding: "10px 14px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
                <input
                  value={refineInput}
                  onChange={(e) => setRefineInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && sendRefine(refineInput)}
                  placeholder="还想怎么调整？也可以直接描述..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    fontSize: 12,
                    padding: "7px 44px 7px 10px",
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
                  onClick={() => sendRefine(refineInput)}
                  style={{
                    width: 32,
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    border: "none",
                    background: "#7F77DD",
                    color: "#fff",
                    cursor: refineInput.trim() ? "pointer" : "default",
                    opacity: refineInput.trim() ? 1 : 0.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                  }}
                  aria-label="发送"
                >
                  <ArrowRight size={12} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onDone(draft)}
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
                <Check size={14} /> 满意，进入编辑 <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* 右栏：故事线预览 */}
          <div
            className="anim-slide-in-right"
            style={{
              flex: "1 1 360px",
              minWidth: 280,
              maxHeight: "min(64vh, 520px)",
              boxSizing: "border-box",
              borderRadius: 12,
              border: "0.5px solid var(--color-border-tertiary)",
              background: "var(--color-background-primary)",
              boxShadow: "0 18px 52px rgba(26,25,21,0.12)",
              padding: "14px 14px 12px",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            {draft && <IntroStoryline sections={draft} />}
          </div>
        </div>
      ) : (
        /* —— 采集阶段：单卡对话 + 弹出选项 —— */
        <div
          style={{
            position: "relative",
            width: "min(calc(100vw - 40px), 520px)",
            minHeight: 0,
            maxHeight: "min(54vh, 430px)",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            borderRadius: 12,
            border: "0.5px solid var(--color-border-tertiary)",
            background: "var(--color-background-primary)",
            boxShadow: "0 18px 52px rgba(26,25,21,0.12)",
            overflow: "visible",
          }}
        >
          {currentStepIdx >= 0 && (
            <div
              className="anim-pop"
              style={{
                position: "absolute",
                left: 14,
                right: 14,
                top: "calc(100% + 10px)",
                borderRadius: 10,
                border: "0.5px solid #CECBF6",
                background: "#FAFAFF",
                boxShadow: "0 12px 32px rgba(26,25,21,0.12)",
                padding: 10,
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 650, color: "#3C3489" }}>
                {INTRO_STEPS[currentStepIdx].question}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {INTRO_STEPS[currentStepIdx].chips.map((chip, i) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => pickChip(currentStepIdx, chip)}
                    className="anim-fade-up"
                    style={{
                      animationDelay: `${i * 40}ms`,
                      minHeight: 30,
                      fontSize: 11,
                      color: "var(--color-text-secondary)",
                      background: "var(--color-background-primary)",
                      border: "0.5px solid var(--color-border-secondary)",
                      borderRadius: 8,
                      padding: "0 10px",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#EEEDFE"; e.currentTarget.style.borderColor = "#CECBF6"; e.currentTarget.style.color = "#3C3489"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-background-primary)"; e.currentTarget.style.borderColor = "var(--color-border-secondary)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            <AiBubble>
              <Sparkles size={10} style={{ marginRight: 4, verticalAlign: -1 }} />
              你好！先告诉我这次演示的需求，我会帮你梳理故事线结构。
            </AiBubble>

            {bubbles.map((b, i) => (
              b.from === "user"
                ? <UserBubble key={i}>{b.text}</UserBubble>
                : <AiBubble key={i}><Sparkles size={10} style={{ marginRight: 4, verticalAlign: -1 }} />{b.text}</AiBubble>
            ))}
            <div ref={chatEndRef} />
          </div>

          {phase === "need" && (
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
              <div style={{ position: "relative", width: "100%", maxWidth: "100%", overflow: "hidden" }}>
                <input
                  autoFocus
                  value={need}
                  onChange={(e) => setNeed(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && submitNeed()}
                  placeholder="描述你要做的演示..."
                  style={{
                    flex: 1,
                    minWidth: 0,
                    width: "100%",
                    boxSizing: "border-box",
                    fontSize: 12,
                    padding: "7px 48px 7px 10px",
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
                    width: 36,
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    padding: 0,
                    fontSize: 12,
                    borderRadius: 8,
                    border: "none",
                    background: "#7F77DD",
                    color: "#fff",
                    cursor: need.trim() ? "pointer" : "default",
                    opacity: need.trim() ? 1 : 0.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    whiteSpace: "nowrap",
                  }}
                  aria-label="继续"
                >
                  <ArrowRight size={12} />
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AiBubble({ children }) {
  return (
    <div className="anim-fade-up" style={{ display: "flex", justifyContent: "flex-start" }}>
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
    <div className="anim-fade-up" style={{ display: "flex", justifyContent: "flex-end" }}>
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
