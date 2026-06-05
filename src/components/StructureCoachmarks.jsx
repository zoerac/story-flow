import { ArrowLeft, GripVertical, MousePointerClick, Sparkles } from "lucide-react";

// 一次性浮层引导：首次进入结构编辑页时点明两条核心动线
//  1) 拖拽故事线节点调整叙事 / 把章节拖进对话框深聊
//  2) 点击故事树任意页直接切到该页幻灯（区别于传统 PPT 逐页翻找）
// 交互或点击「知道了」后整体淡出，由 App 用 localStorage 记忆已读。
export function StructureCoachmarks({ leftOpen, leftW, onDismiss }) {
  const anchorX = (leftOpen ? leftW : 0) + 18;

  return (
    <div style={overlay}>
      {/* 引导一：拖拽故事线 */}
      <div className="anim-fade-up" style={{ ...card, top: 92, left: anchorX }}>
        <ArrowLeft size={16} className="anim-arrow-bob" style={{ color: "#7F77DD", flexShrink: 0 }} />
        <span style={dot} className="anim-coach-pulse" />
        <div>
          <div style={titleRow}>
            <GripVertical size={12} style={{ color: "#7F77DD" }} /> 拖拽改叙事
          </div>
          <div style={desc}>拖动故事线节点即可调整叙事顺序，或把整章拖进下方对话框深聊。</div>
        </div>
      </div>

      {/* 引导二：点击故事树切页 */}
      <div className="anim-fade-up" style={{ ...card, top: 188, left: anchorX, animationDelay: "120ms" }}>
        <ArrowLeft size={16} className="anim-arrow-bob" style={{ color: "#1D9E75", flexShrink: 0 }} />
        <span style={{ ...dot, background: "#1D9E75" }} className="anim-coach-pulse" />
        <div>
          <div style={titleRow}>
            <MousePointerClick size={12} style={{ color: "#1D9E75" }} /> 点击直接切页
          </div>
          <div style={desc}>点故事树任意页就跳到该页幻灯——不必像传统 PPT 逐页翻找。</div>
        </div>
      </div>

      {/* 知道了 */}
      <button type="button" onClick={onDismiss} className="anim-fade-up" style={dismissBtn}>
        <Sparkles size={12} /> 知道了，开始编辑
      </button>
    </div>
  );
}

const overlay = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  zIndex: 20,
};

const card = {
  position: "absolute",
  maxWidth: 232,
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  padding: "9px 11px",
  borderRadius: 10,
  background: "var(--color-background-primary)",
  border: "1px solid #CECBF6",
  boxShadow: "0 10px 28px rgba(26,25,21,0.16)",
  pointerEvents: "auto",
};

const dot = {
  position: "absolute",
  left: -4,
  top: 14,
  width: 7,
  height: 7,
  borderRadius: "50%",
  background: "#7F77DD",
};

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
  lineHeight: 1.55,
  color: "var(--color-text-secondary)",
};

const dismissBtn = {
  position: "absolute",
  bottom: 84,
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  alignItems: "center",
  gap: 5,
  height: 32,
  padding: "0 14px",
  borderRadius: 16,
  border: "none",
  background: "#7F77DD",
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 8px 22px rgba(127,119,221,0.4)",
  pointerEvents: "auto",
};
