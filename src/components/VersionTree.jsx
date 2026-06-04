import { GitBranch } from "lucide-react";

export function VersionTree({ vers, curV, restore }) {
  const Tree = ({ vid, depth = 0 }) => {
    const v = vers.find((x) => x.id === vid);
    if (!v) return null;
    const cur = v.id === curV;

    return (
      <div style={{ marginLeft: depth * 16 }}>
        <div
          onClick={() => restore(v.id)}
          style={{
            padding: "5px 8px",
            borderRadius: 6,
            cursor: "pointer",
            marginBottom: 3,
            background: cur ? "#FAECE7" : "transparent",
            border: cur ? "1px solid #F5C4B3" : "1px solid transparent",
            transition: "background 0.15s, border 0.15s",
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
          {cur && <span style={{ fontSize: 9, color: "#993C1D", marginLeft: 12 }}>当前</span>}
        </div>
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
        点击任意版本可回溯<br />回溯后拖拽即自动分叉
      </div>
    </div>
  );
}

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
