import { useMemo, useState } from "react";
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

const ROW_H = 30;
const LANE_W = 16;
const PAD_X = 12;
const PAD_Y = 16;
const R = 5;

const countPages = (snap) => (snap || []).reduce((n, s) => n + (s.pages?.length || 0), 0);

// 计算每个节点的行(row)与泳道(lane)，形成类似 git log --graph 的图形布局
function useGraphLayout(vers) {
  return useMemo(() => {
    const byId = Object.fromEntries(vers.map((v) => [v.id, v]));
    const roots = vers.filter((v) => v.par === null);
    const pos = {};
    const order = [];
    let maxLane = 0;

    const visit = (id, lane) => {
      const v = byId[id];
      if (!v || pos[id]) return;
      maxLane = Math.max(maxLane, lane);
      pos[id] = { row: order.length, lane };
      order.push(id);
      v.ch.forEach((cid, i) => visit(cid, i === 0 ? lane : ++maxLane));
    };

    roots.forEach((r, i) => visit(r.id, i === 0 ? 0 : ++maxLane));

    return { pos, order, laneCount: maxLane + 1 };
  }, [vers]);
}

export function VersionTree({ vers, curV, restore }) {
  const [selVid, setSelVid] = useState(curV);
  const [confirming, setConfirming] = useState(false);
  const { pos, order, laneCount } = useGraphLayout(vers);

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

  const graphW = PAD_X * 2 + (laneCount - 1) * LANE_W;
  const svgH = PAD_Y * 2 + (order.length - 1) * ROW_H;
  const cx = (lane) => PAD_X + lane * LANE_W;
  const cy = (row) => PAD_Y + row * ROW_H;

  return (
    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "0.5px solid var(--color-border-tertiary)" }}>
      <div style={panelHead}>
        <GitBranch size={14} style={{ color: "#D85A30" }} /> 版本树
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "6px 4px" }}>
        <div style={{ position: "relative", minHeight: svgH }}>
          {/* 图形层：泳道连线 + 节点圆点 */}
          <svg width={graphW} height={svgH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {vers.map((v) => {
              if (v.par === null || !pos[v.par] || !pos[v.id]) return null;
              const p = pos[v.par];
              const c = pos[v.id];
              const px = cx(p.lane);
              const py = cy(p.row);
              const childX = cx(c.lane);
              const childY = cy(c.row);
              const midY = (py + childY) / 2;
              return (
                <path
                  key={`e-${v.id}`}
                  d={`M ${px} ${py} C ${px} ${midY}, ${childX} ${midY}, ${childX} ${childY}`}
                  fill="none"
                  stroke="var(--color-border-secondary)"
                  strokeWidth={1.5}
                />
              );
            })}
            {order.map((id) => {
              const v = vers.find((x) => x.id === id);
              const p = pos[id];
              const isCur = id === curV;
              const isSel = id === selVid;
              return (
                <circle
                  key={`n-${id}`}
                  cx={cx(p.lane)}
                  cy={cy(p.row)}
                  r={isSel || isCur ? R + 0.5 : R}
                  fill={isCur ? "#D85A30" : "var(--color-background-primary)"}
                  stroke={isSel ? "#D85A30" : isCur ? "#D85A30" : "var(--color-border-primary)"}
                  strokeWidth={isSel ? 2.5 : 1.5}
                  style={{ cursor: "pointer" }}
                  onClick={() => select(v.id)}
                />
              );
            })}
          </svg>

          {/* 文本层：数字版本号 + 标签，按行定位 */}
          {order.map((id) => {
            const v = vers.find((x) => x.id === id);
            const p = pos[id];
            const isCur = id === curV;
            const isSel = id === selVid;
            return (
              <button
                key={`r-${id}`}
                type="button"
                onClick={() => select(id)}
                style={{
                  position: "absolute",
                  top: cy(p.row) - ROW_H / 2,
                  left: graphW,
                  right: 0,
                  height: ROW_H,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0 6px",
                  borderRadius: 6,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  background: isSel ? "var(--color-background-secondary)" : "transparent",
                  border: isSel ? "1px solid #F5C4B3" : "1px solid transparent",
                  transition: "background 0.15s, border 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isSel) e.currentTarget.style.background = "var(--color-background-secondary)";
                }}
                onMouseLeave={(e) => {
                  if (!isSel) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ fontSize: 10, fontFamily: "ui-monospace, monospace", fontWeight: 600, color: isCur ? "#D85A30" : "var(--color-text-tertiary)", flexShrink: 0 }}>{id}</span>
                <span title={v.label} style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11, fontWeight: isCur ? 500 : 400, color: isCur ? "#712B13" : "var(--color-text-secondary)" }}>
                  {v.label}
                </span>
                {isCur && <span style={{ fontSize: 9, color: "#993C1D", flexShrink: 0 }}>当前</span>}
              </button>
            );
          })}
        </div>
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
