import { GitFork, Maximize2, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Sparkles } from "lucide-react";

export function Toolbar({ leftOpen, rightOpen, setLeftOpen, setRightOpen, activeStage = "structure", onOpenRefine }) {
  const focused = !leftOpen && !rightOpen;
  const stages = [
    { id: "intent", label: "1 意图对齐" },
    { id: "visual", label: "2 主视觉" },
    { id: "structure", label: "3 结构编辑" },
    { id: "refine", label: "4 AI精修" },
  ];

  return (
    <div style={{ height: 34, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)" }}>
      <GitFork size={14} style={{ color: "#7F77DD", flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap" }}>StoryFlow Demo</span>
      <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>结构驱动演示文稿编辑器</span>
      <div style={{ display: "flex", alignItems: "center", gap: 3, marginLeft: 6, minWidth: 0 }}>
        {stages.map((stage) => {
          const active = stage.id === activeStage;
          return (
            <span
              key={stage.id}
              style={{
                fontSize: 10,
                lineHeight: "18px",
                height: 18,
                padding: "0 7px",
                borderRadius: 6,
                border: active ? "1px solid #CECBF6" : "1px solid transparent",
                background: active ? "#EEEDFE" : "var(--color-background-secondary)",
                color: active ? "#3C3489" : "var(--color-text-tertiary)",
                whiteSpace: "nowrap",
              }}
            >
              {stage.label}
            </span>
          );
        })}
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
        <button
          type="button"
          onClick={onOpenRefine}
          style={{
            height: 24,
            padding: "0 9px",
            borderRadius: 6,
            border: activeStage === "refine" ? "1px solid #CECBF6" : "1px solid var(--color-border-tertiary)",
            background: activeStage === "refine" ? "#EEEDFE" : "var(--color-background-primary)",
            color: activeStage === "refine" ? "#3C3489" : "var(--color-text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <Sparkles size={12} />
          AI精修
        </button>
        <IconButton
          title={leftOpen ? "收起故事线" : "展开故事线"}
          onClick={() => setLeftOpen((v) => !v)}
        >
          {leftOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
        </IconButton>
        <IconButton
          title={focused ? "恢复两侧面板" : "聚焦预览"}
          active={focused}
          onClick={() => {
            if (focused) {
              setLeftOpen(true);
              setRightOpen(true);
            } else {
              setLeftOpen(false);
              setRightOpen(false);
            }
          }}
        >
          <Maximize2 size={14} />
        </IconButton>
        <IconButton
          title={rightOpen ? "收起版本树" : "展开版本树"}
          onClick={() => setRightOpen((v) => !v)}
        >
          {rightOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({ children, title, onClick, active = false }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      style={{
        width: 24,
        height: 24,
        padding: 0,
        borderRadius: 6,
        border: active ? "1px solid #CECBF6" : "1px solid transparent",
        background: active ? "#EEEDFE" : "transparent",
        color: active ? "#3C3489" : "var(--color-text-secondary)",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
