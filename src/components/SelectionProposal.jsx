import { useState } from "react";
import { Check, RefreshCw, Sparkles, X } from "lucide-react";

export function SelectionProposal({ originalText, intent, proposals, onApprove, onReject }) {
  const [idx, setIdx] = useState(0);
  const after = proposals[idx % proposals.length]?.after ?? originalText;

  return (
    <div style={S.card}>
      <div style={S.header}>
        <Sparkles size={12} style={{ color: "#7F77DD" }} />
        <span style={{ flex: 1, fontWeight: 500 }}>AI 提案 · {intent}</span>
        <button type="button" onClick={onReject} style={S.iconBtn}>
          <X size={13} />
        </button>
      </div>

      <div style={S.body}>
        <div style={S.sectionLabel}>原文</div>
        <div style={S.beforeText}>{originalText}</div>
        <div style={{ textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 10, margin: "2px 0" }}>
          ↓ AI 建议
        </div>
        <div style={S.afterText}>{after}</div>
      </div>

      <div style={S.footer}>
        <button type="button" onClick={() => setIdx((i) => i + 1)} style={S.btnSec}>
          <RefreshCw size={10} /> 重新生成
        </button>
        <button type="button" onClick={onReject} style={{ ...S.btnSec, color: "#D4537E", borderColor: "#F4C0D1" }}>
          拒绝
        </button>
        <button type="button" onClick={() => onApprove(after)} style={S.btnPrimary}>
          <Check size={10} /> 批准
        </button>
      </div>
    </div>
  );
}

const S = {
  card: {
    background: "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: 10,
    overflow: "hidden",
    fontSize: 12,
    width: "100%",
    maxWidth: 280,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 12px",
    background: "#EEEDFE",
    color: "#3C3489",
    fontSize: 11,
    borderBottom: "0.5px solid #CECBF6",
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 2,
    color: "#5c5a52",
    display: "flex",
    alignItems: "center",
  },
  body: {
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  sectionLabel: {
    fontSize: 9,
    color: "var(--color-text-tertiary)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  beforeText: {
    fontSize: 11,
    color: "var(--color-text-secondary)",
    textDecoration: "line-through",
    lineHeight: 1.5,
    padding: "4px 6px",
    background: "#FEF2F2",
    borderRadius: 4,
    border: "0.5px solid #FECACA",
  },
  afterText: {
    fontSize: 11,
    color: "#085041",
    lineHeight: 1.5,
    padding: "4px 6px",
    background: "#E1F5EE",
    borderRadius: 4,
    border: "0.5px solid #9FE1CB",
    fontWeight: 500,
  },
  footer: {
    display: "flex",
    gap: 6,
    padding: "8px 12px",
    borderTop: "0.5px solid var(--color-border-tertiary)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  btnSec: {
    display: "flex",
    alignItems: "center",
    gap: 3,
    padding: "4px 8px",
    fontSize: 11,
    borderRadius: 6,
    border: "0.5px solid var(--color-border-secondary)",
    background: "var(--color-background-secondary)",
    cursor: "pointer",
    color: "var(--color-text-secondary)",
  },
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    gap: 3,
    padding: "4px 10px",
    fontSize: 11,
    borderRadius: 6,
    border: "none",
    background: "#1D9E75",
    cursor: "pointer",
    color: "#fff",
    fontWeight: 500,
  },
};
