import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, GitBranch, HelpCircle, ListTree, MessageSquare, Sparkles, X } from "lucide-react";

// 结构编辑页操作引导浮层，两种形态：
//  variant="intro" —— 首次进入时指向工具栏「引导」按钮，询问是否需要操作引导
//  variant="full"  —— 分步走查：① 故事树 ② AI 助手对话 ③ AI 精修 ④ 版本树
// 由 App 用 localStorage 记忆首次提示是否已展示；「引导」按钮可随时再唤起 full。
export function StructureCoachmarks({ variant = "full", leftOpen, leftW, onYes, onNo, onClose }) {
  if (variant === "intro") {
    return (
      <div style={overlay}>
        <div className="anim-fade-up" style={introCard}>
          <ArrowUp size={16} className="anim-arrow-bob-y" style={{ color: "#7F77DD", flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={titleRow}>
              <HelpCircle size={13} style={{ color: "#7F77DD" }} /> 需要操作引导吗？
            </div>
            <div style={desc}>这一页和传统 PPT 很不一样。要不要浮浮酱带你走一遍 4 步上手引导？以后随时点右上角「引导」也能再看。</div>
            <div style={{ display: "flex", gap: 6, marginTop: 9 }}>
              <button type="button" onClick={onYes} style={primaryBtn("#7F77DD")}>
                <Sparkles size={12} /> 好，看看
              </button>
              <button type="button" onClick={onNo} style={ghostBtn}>
                不用了
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <CoachWalkthrough leftOpen={leftOpen} leftW={leftW} onClose={onClose} />;
}

// 四步走查：每步一张卡片 + 指向对应区域的脉冲箭头，底部步进点 + 上一步/下一步/跳过。
function CoachWalkthrough({ leftOpen, leftW, onClose }) {
  const [step, setStep] = useState(0);
  const anchorX = (leftOpen ? leftW : 0) + 18;

  const steps = [
    {
      accent: "#7F77DD",
      Icon: ListTree,
      title: "故事树：内容的骨架",
      body: "左侧故事树按章节组织整篇演示的所有页面。拖动节点可调整叙事顺序；点任意子页就直接跳到该页幻灯——不必像传统 PPT 逐页翻找。",
      pos: { top: 104, left: anchorX, maxWidth: 250 },
      arrow: "left",
    },
    {
      accent: "#1D9E75",
      Icon: MessageSquare,
      title: "有想法？直接对话",
      body: "任何修改想法都可以直接告诉下方的 AI 助手——改措辞、补论据、重排结构都行。也可以把整章拖进对话框，就它单独深聊。",
      pos: { left: "50%", bottom: 118, transform: "translateX(-50%)", maxWidth: 262 },
      arrow: "down",
    },
    {
      accent: "#D85A30",
      Icon: Sparkles,
      title: "进入 AI 精修",
      body: "对结构满意后，点右上角「AI精修」进入精修台——在真实画布上微调文字、图片与排版，并一次生成多版方案对比。",
      pos: { top: 8, right: 92, maxWidth: 252 },
      arrow: "up",
    },
    {
      accent: "#3C7DD9",
      Icon: GitBranch,
      title: "版本树：随时回溯",
      body: "点右上角最右的开关唤起版本树。每次编辑都会自动留存一个版本节点，可对比、收藏，或一键恢复到任意历史版本。",
      pos: { top: 8, right: 14, maxWidth: 252 },
      arrow: "up",
    },
  ];

  const cur = steps[step];
  const last = step === steps.length - 1;
  const ArrowIcon = cur.arrow === "left" ? ArrowLeft : cur.arrow === "down" ? ArrowDown : ArrowUp;
  const arrowAnim = cur.arrow === "left" ? "anim-arrow-bob" : "anim-arrow-bob-y";
  const arrowPos =
    cur.arrow === "left"
      ? { left: -22, top: "50%", transform: "translateY(-50%)" }
      : cur.arrow === "down"
        ? { bottom: -22, left: "50%", transform: "translateX(-50%)" }
        : { top: -22, right: 22 };

  return (
    <div style={overlay}>
      <div key={step} className="anim-fade-up" style={{ ...stepCard, ...cur.pos }}>
        <ArrowIcon size={18} className={arrowAnim} style={{ position: "absolute", color: cur.accent, ...arrowPos }} />
        <button type="button" onClick={onClose} aria-label="跳过引导" style={skipBtn}>
          <X size={13} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, paddingRight: 16 }}>
          <span style={stepBadge(cur.accent)}>{step + 1}</span>
          <cur.Icon size={13} style={{ color: cur.accent, flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, fontWeight: 650, color: "var(--color-text-primary)" }}>{cur.title}</span>
        </div>
        <div style={desc}>{cur.body}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 11 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {steps.map((s, i) => (
              <span
                key={i}
                style={{
                  width: i === step ? 14 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === step ? cur.accent : "var(--color-border-secondary)",
                  transition: "all 0.2s var(--ease-out)",
                }}
              />
            ))}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} style={ghostBtn}>
                上一步
              </button>
            )}
            <button type="button" onClick={() => (last ? onClose() : setStep(step + 1))} style={primaryBtn(cur.accent)}>
              {last ? (
                <>
                  <Sparkles size={12} /> 开始编辑
                </>
              ) : (
                "下一步"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  zIndex: 20,
};

const introCard = {
  position: "absolute",
  top: 10,
  right: 120,
  maxWidth: 258,
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  padding: "11px 13px",
  borderRadius: 12,
  background: "var(--color-background-primary)",
  border: "1px solid #CECBF6",
  boxShadow: "0 14px 34px rgba(127,119,221,0.28)",
  pointerEvents: "auto",
};

const stepCard = {
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  padding: "12px 14px",
  borderRadius: 12,
  background: "var(--color-background-primary)",
  border: "1px solid #CECBF6",
  boxShadow: "0 14px 34px rgba(26,25,21,0.2)",
  pointerEvents: "auto",
};

const stepBadge = (accent) => ({
  width: 18,
  height: 18,
  borderRadius: "50%",
  background: accent,
  color: "#fff",
  fontSize: 11,
  fontWeight: 700,
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
});

const titleRow = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  fontSize: 12,
  fontWeight: 650,
  color: "var(--color-text-primary)",
  marginBottom: 3,
};

const desc = {
  fontSize: 11,
  lineHeight: 1.6,
  color: "var(--color-text-secondary)",
};

const primaryBtn = (accent) => ({
  display: "flex",
  alignItems: "center",
  gap: 4,
  height: 28,
  padding: "0 13px",
  borderRadius: 8,
  border: "none",
  background: accent,
  color: "#fff",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
});

const ghostBtn = {
  height: 28,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid var(--color-border-secondary)",
  background: "transparent",
  color: "var(--color-text-secondary)",
  fontSize: 11,
  cursor: "pointer",
};

const skipBtn = {
  position: "absolute",
  top: 8,
  right: 8,
  width: 20,
  height: 20,
  padding: 0,
  borderRadius: 6,
  border: "none",
  background: "transparent",
  color: "var(--color-text-tertiary)",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};
