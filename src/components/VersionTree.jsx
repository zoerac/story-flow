import { GitBranch } from "lucide-react";

const STAGE_LABELS = {
  intent: "意图",
  visual: "主视觉",
  structure: "结构",
  refine: "精修",
};

const KIND_LABELS = {
  init: "初始",
  jump: "跳转",
  edit: "编辑",
  refine: "精修",
};

export function VersionTree({ vers, curV, restore }) {
  const Tree = ({ vid, depth = 0 }) => {
    const v = vers.find((x) => x.id === vid);
    if (!v) return null;
    const cur = v.id === curV;

    return (
      <div style={{ marginLeft: depth * 16 }}>
        <button
          type="button"
          onClick={() => restore(v.id)}
          style={{
            width: "100%",
            padding: "5px 8px",
            borderRadius: 6,
            cursor: "pointer",
            marginBottom: 3,
            background: cur ? "#FAECE7" : "transparent",
            border: cur ? "1px solid #F5C4B3" : "1px solid transparent",
            transition: "background 0.15s, border 0.15s",
            textAlign: "left",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            if (!cur) e.currentTarget.style.background = "var(--color-background-secondary)";
          }}
          onMouseLeave={(e) => {
            if (!cur) e.currentTarget.style.background = "transparent";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: cur ? "#D85A30" : "var(--color-border-secondary)", flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: cur ? 500 : 400, color: cur ? "#712B13" : "var(--color-text-secondary)", lineHeight: 1.3 }}>
              {v.label}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 12, marginTop: 3 }}>
            <span style={{ ...tagStyle, background: "#EEEDFE", color: "#3C3489" }}>{STAGE_LABELS[v.stage] || "结构"}</span>
            <span style={{ ...tagStyle, background: v.kind === "jump" ? "#E6F1FB" : "#E1F5EE", color: v.kind === "jump" ? "#1F5F95" : "#085041" }}>{KIND_LABELS[v.kind] || "编辑"}</span>
            {cur && <span style={{ fontSize: 9, color: "#993C1D" }}>当前</span>}
          </div>
        </button>
        {v.ch.map((cid) => (
          <Tree key={cid} vid={cid} depth={depth + 1} />
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "0.5px solid var(--color-border-tertiary)" }}>
      <div style={panelHead}>
        <GitBranch size={14} style={{ color: "#D85A30" }} /> 版本树
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
        {vers.filter((v) => v.par === null).map((v) => (
          <Tree key={v.id} vid={v.id} />
        ))}
      </div>
      <div style={{ padding: "8px 10px", borderTop: "0.5px solid var(--color-border-tertiary)", flexShrink: 0, fontSize: 10, color: "var(--color-text-tertiary)", textAlign: "center", lineHeight: 1.5 }}>
        顶部步骤跳转会写入版本树<br />点击历史节点可恢复并继续分叉
      </div>
    </div>
  );
}

const tagStyle = {
  height: 16,
  borderRadius: 5,
  padding: "0 5px",
  display: "inline-flex",
  alignItems: "center",
  fontSize: 9,
  lineHeight: "16px",
};

const panelHead = {
  padding: "10px 14px",
  borderBottom: "0.5px solid var(--color-border-tertiary)",
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexShrink: 0,
  fontSize: 12,
  fontWeight: 500,
  color: "var(--color-text-secondary)",
};
