import { useState } from "react";
import { GitBranch, RotateCcw, Check, X } from "lucide-react";

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

const countPages = (snap) => (snap || []).reduce((n, s) => n + (s.pages?.length || 0), 0);

export function VersionTree({ vers, curV, restore }) {
  const [selVid, setSelVid] = useState(curV);
  const [confirming, setConfirming] = useState(false);

  const sel = vers.find((x) => x.id === selVid) || vers.find((x) => x.id === curV);
  const parent = sel ? vers.find((x) => x.id === sel.par) : null;

  const select = (vid) => {
    setSelVid(vid);
    setConfirming(false);
  };

  const doRestore = () => {
    if (!sel) return;
    restore(sel.id);
    setSelVid(sel.id);
    setConfirming(false);
  };

  const Tree = ({ vid }) => {
    const v = vers.find((x) => x.id === vid);
    if (!v) return null;
    const isCur = v.id === curV;
    const isSel = v.id === selVid;

    return (
      <div>
        <button
          type="button"
          onClick={() => select(v.id)}
          style={{
            width: "100%",
            padding: "5px 8px",
            borderRadius: 6,
            cursor: "pointer",
            marginBottom: 3,
            background: isCur ? "#FAECE7" : isSel ? "var(--color-background-secondary)" : "transparent",
            border: isSel ? "1px solid #D85A30" : isCur ? "1px solid #F5C4B3" : "1px solid transparent",
            transition: "background 0.15s, border 0.15s",
            textAlign: "left",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            if (!isCur && !isSel) e.currentTarget.style.background = "var(--color-background-secondary)";
          }}
          onMouseLeave={(e) => {
            if (!isCur && !isSel) e.currentTarget.style.background = "transparent";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: isCur ? "#D85A30" : "var(--color-border-secondary)", flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontFamily: "ui-monospace, monospace", color: "var(--color-text-tertiary)", flexShrink: 0 }}>{v.id}</span>
            <span title={v.label} style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11, fontWeight: isCur ? 500 : 400, color: isCur ? "#712B13" : "var(--color-text-secondary)", lineHeight: 1.3 }}>
              {v.label}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 12, marginTop: 3 }}>
            <span style={{ ...tagStyle, background: "#EEEDFE", color: "#3C3489" }}>{STAGE_LABELS[v.stage] || "结构"}</span>
            <span style={{ ...tagStyle, background: v.kind === "jump" ? "#E6F1FB" : "#E1F5EE", color: v.kind === "jump" ? "#1F5F95" : "#085041" }}>{KIND_LABELS[v.kind] || "编辑"}</span>
            {isCur && <span style={{ fontSize: 9, color: "#993C1D" }}>当前</span>}
          </div>
        </button>
        {v.ch.length > 0 && (
          <div style={{ marginLeft: 7, paddingLeft: 9, borderLeft: "1px solid var(--color-border-tertiary)" }}>
            {v.ch.map((cid) => (
              <Tree key={cid} vid={cid} />
            ))}
          </div>
        )}
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

      {sel && (
        <div style={detailPanel}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontFamily: "ui-monospace, monospace", color: "#fff", background: "#D85A30", borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>{sel.id}</span>
            <span title={sel.label} style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11, fontWeight: 500, color: "var(--color-text-primary)" }}>{sel.label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
            <span style={{ ...tagStyle, background: "#EEEDFE", color: "#3C3489" }}>{STAGE_LABELS[sel.stage] || "结构"}</span>
            <span style={{ ...tagStyle, background: sel.kind === "jump" ? "#E6F1FB" : "#E1F5EE", color: sel.kind === "jump" ? "#1F5F95" : "#085041" }}>{KIND_LABELS[sel.kind] || "编辑"}</span>
            {sel.id === curV && <span style={{ fontSize: 9, color: "#993C1D" }}>当前版本</span>}
          </div>
          <div style={detailRow}>
            <span>结构</span>
            <span style={{ color: "var(--color-text-secondary)" }}>{sel.snap.length} 章 · {countPages(sel.snap)} 页</span>
          </div>
          <div style={detailRow}>
            <span>来源</span>
            <span style={{ color: "var(--color-text-secondary)" }}>{parent ? `分叉自 ${parent.id}` : "根节点"}</span>
          </div>
          <div style={detailRow}>
            <span>分叉</span>
            <span style={{ color: "var(--color-text-secondary)" }}>{sel.ch.length} 个子版本</span>
          </div>

          {sel.id === curV ? (
            <button type="button" disabled style={{ ...rollbackBtn, opacity: 0.5, cursor: "default", background: "var(--color-background-secondary)", color: "var(--color-text-tertiary)", border: "1px solid var(--color-border-tertiary)" }}>
              已是当前版本
            </button>
          ) : confirming ? (
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" onClick={doRestore} style={{ ...rollbackBtn, flex: 1, background: "#D85A30", color: "#fff", border: "1px solid #D85A30" }}>
                <Check size={12} /> 确认回滚
              </button>
              <button type="button" onClick={() => setConfirming(false)} style={{ ...rollbackBtn, flex: 1, background: "transparent", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-secondary)" }}>
                <X size={12} /> 取消
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} style={{ ...rollbackBtn, width: "100%", background: "#fff", color: "#993C1D", border: "1px solid #F5C4B3" }}>
              <RotateCcw size={12} /> 回滚到此版本
            </button>
          )}
        </div>
      )}
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

const detailPanel = {
  borderTop: "0.5px solid var(--color-border-tertiary)",
  flexShrink: 0,
  padding: "10px 12px",
  background: "var(--color-background-tertiary)",
};

const detailRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 10,
  color: "var(--color-text-tertiary)",
  marginBottom: 3,
};

const rollbackBtn = {
  marginTop: 8,
  height: 28,
  borderRadius: 6,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 11,
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  transition: "background 0.15s",
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
