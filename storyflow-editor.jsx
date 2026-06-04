import { useState, useRef } from "react";
import { GitBranch, GitFork, Send, GripVertical, RotateCcw, Sparkles, BookOpen, Bot } from "lucide-react";

/* ── mock data ── */
const INIT = [
  { id: "s1", title: "开场与背景", sub: "行业趋势与市场机会", slides: 2, c: "#7F77DD", bg: "#EEEDFE", bd: "#CECBF6" },
  { id: "s2", title: "核心问题",   sub: "用户痛点深度剖析",   slides: 1, c: "#D4537E", bg: "#FBEAF0", bd: "#F4C0D1" },
  { id: "s3", title: "方法论",     sub: "技术方案与架构设计",   slides: 3, c: "#1D9E75", bg: "#E1F5EE", bd: "#9FE1CB" },
  { id: "s4", title: "实验结果",   sub: "关键数据与对比分析",   slides: 3, c: "#378ADD", bg: "#E6F1FB", bd: "#B5D4F4" },
  { id: "s5", title: "结论与展望", sub: "核心发现与下一步",     slides: 2, c: "#D85A30", bg: "#FAECE7", bd: "#F5C4B3" },
  { id: "s6", title: "致谢",       sub: "团队与参考",           slides: 1, c: "#888780", bg: "#F1EFE8", bd: "#D3D1C7" },
];

const SLIDES = {
  s1: ["AI 重塑演示文稿工作流", "从手动逐页制作到人机协作的全新范式"],
  s2: ["三大核心痛点",         "结构僵化 · 意图丢失 · 生成与编辑割裂"],
  s3: ["StoryFlow 设计理念",   "故事线驱动 · 意图版本管理 · AI 持续响应"],
  s4: ["用户测试核心指标",     "结构调整效率 ↑68%　满意度 4.6 / 5"],
  s5: ["结论：叙事结构层是关键", "AI Native 编辑器最核心的缺失与机会"],
  s6: ["感谢聆听",             "团队成员与参考文献"],
};

const AI_DRAG = [
  (t, d, p) => `已将「${t}」${d}至第 ${p} 位。前后过渡逻辑已自动调整，衔接文案已更新。`,
  (t, d, p) => `结构变更：「${t}」${d}至第 ${p} 位。我重新组织了相关页面论证顺序，确保叙事连贯。`,
  (t, d, p) => `「${t}」${d}完成。检测到论证链条变化，已自动补充过渡段落并微调视觉节奏。`,
];

const AI_CHAT = [
  "建议将「结论」提前到「实验结果」之前——'倒金字塔'结构更适合高管汇报，先亮结论再展开论证。你可以直接在左侧拖拽试试。",
  "当前叙事节奏：前半部分 3 页 vs 后半部分 5 页，比例合理。如果觉得开头太长，可以合并「开场」与「核心问题」为一个章节。",
  "「方法论」有 3 页内容偏密。建议拆成 '技术选型' 和 '实现路径' 两个子章节，听众更容易跟上。",
  "从听众视角看，先展示结果再解释方法可能更吸引注意力——试试拖动「实验结果」到「方法论」前面？",
  "当前版本的故事线逻辑清晰。如果想进一步打磨，可以考虑在「核心问题」后加一页 '解决方案概览' 作为过渡。",
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ── component ── */
export default function StoryFlowEditor() {
  const [secs, setSecs] = useState(INIT);
  const [vers, setVers] = useState([
    { id: "v0", label: "初始生成", snap: INIT.map((s) => s.id), par: null, ch: [] },
  ]);
  const [curV, setCurV] = useState("v0");
  const [sel, setSel] = useState(0);
  const [msgs, setMsgs] = useState([
    { from: "ai", text: "你好！我已根据你的需求生成了 12 页演示文稿。左侧是自动提取的故事线结构——直接拖拽节点即可调整叙事顺序，我会实时适配所有内容。" },
  ]);
  const [inp, setInp] = useState("");
  const [dragI, setDragI] = useState(null);
  const [overI, setOverI] = useState(null);
  const [thinking, setThinking] = useState(false);
  const vc = useRef(1);
  const chatEnd = useRef(null);
  const scroll = () => setTimeout(() => chatEnd.current?.scrollIntoView({ behavior: "smooth" }), 80);

  const addMsg = (from, text) => {
    setMsgs((p) => [...p, { from, text }]);
    scroll();
  };

  /* ── drag & drop ── */
  const onDrop = (to) => {
    if (dragI === null || dragI === to) { setDragI(null); setOverI(null); return; }
    const next = [...secs];
    const [mv] = next.splice(dragI, 1);
    next.splice(to, 0, mv);
    const dir = to < dragI ? "前移" : "后移";
    const vid = `v${vc.current++}`;
    setVers((p) => {
      const u = p.map((v) => (v.id === curV ? { ...v, ch: [...v.ch, vid] } : v));
      return [...u, { id: vid, label: `${mv.title}${dir}`, snap: next.map((s) => s.id), par: curV, ch: [] }];
    });
    setCurV(vid);
    setSecs(next);
    setSel(to);
    setDragI(null);
    setOverI(null);
    addMsg("ai", pick(AI_DRAG)(mv.title, dir, to + 1));
  };

  /* ── version restore ── */
  const restore = (vid) => {
    const v = vers.find((x) => x.id === vid);
    if (!v) return;
    setSecs(v.snap.map((id) => INIT.find((s) => s.id === id)).filter(Boolean));
    setCurV(vid);
    setSel(0);
    addMsg("sys", `已回溯至版本「${v.label}」，可从此处继续编辑或分叉探索新方向。`);
  };

  /* ── chat ── */
  const send = () => {
    if (!inp.trim()) return;
    addMsg("user", inp.trim());
    setInp("");
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      addMsg("ai", pick(AI_CHAT));
    }, 600 + Math.random() * 500);
  };

  /* ── version tree renderer ── */
  const Tree = ({ vid, depth = 0 }) => {
    const v = vers.find((x) => x.id === vid);
    if (!v) return null;
    const cur = v.id === curV;
    return (
      <div style={{ marginLeft: depth * 16 }}>
        <div
          onClick={() => restore(v.id)}
          style={{
            padding: "5px 8px", borderRadius: 6, cursor: "pointer", marginBottom: 3,
            background: cur ? "#FAECE7" : "transparent",
            border: cur ? "1px solid #F5C4B3" : "1px solid transparent",
            transition: "background 0.15s, border 0.15s",
          }}
          onMouseEnter={(e) => { if (!cur) e.currentTarget.style.background = "var(--color-background-secondary)"; }}
          onMouseLeave={(e) => { if (!cur) e.currentTarget.style.background = "transparent"; }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: cur ? "#D85A30" : "var(--color-border-secondary)", flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: cur ? 500 : 400, color: cur ? "#712B13" : "var(--color-text-secondary)", lineHeight: 1.3 }}>{v.label}</span>
          </div>
          {cur && <span style={{ fontSize: 9, color: "#993C1D", marginLeft: 12 }}>当前</span>}
        </div>
        {v.ch.map((cid) => (<Tree key={cid} vid={cid} depth={depth + 1} />))}
      </div>
    );
  };

  const curSec = secs[sel];
  const sd = SLIDES[curSec?.id] || ["", ""];

  /* ── styles ── */
  const S = {
    root: {
      display: "grid", gridTemplateColumns: "200px minmax(0,1fr) 180px",
      height: 580, borderRadius: 12, overflow: "hidden",
      border: "0.5px solid var(--color-border-tertiary)",
      background: "var(--color-background-primary)",
      fontSize: 13, lineHeight: 1.5, color: "var(--color-text-primary)",
    },
    panelHead: {
      padding: "10px 14px", borderBottom: "0.5px solid var(--color-border-tertiary)",
      display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
      fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)",
    },
    col: { display: "flex", flexDirection: "column", overflow: "hidden" },
  };

  return (
    <div style={S.root}>
      {/* ═══ LEFT: STORYLINE ═══ */}
      <div style={{ ...S.col, borderRight: "0.5px solid var(--color-border-tertiary)" }}>
        <div style={S.panelHead}>
          <BookOpen size={14} /> 故事线
          <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--color-text-tertiary)", fontWeight: 400 }}>{secs.reduce((a, s) => a + s.slides, 0)}p</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
          {secs.map((s, i) => (
            <div
              key={s.id}
              draggable
              onDragStart={() => setDragI(i)}
              onDragOver={(e) => { e.preventDefault(); setOverI(i); }}
              onDrop={() => onDrop(i)}
              onDragEnd={() => { setDragI(null); setOverI(null); }}
              onClick={() => setSel(i)}
              style={{
                padding: "8px 10px", marginBottom: 4, borderRadius: 8,
                cursor: dragI !== null ? "grabbing" : "grab",
                background: dragI === i ? "var(--color-background-tertiary)" : i === sel ? s.bg : "transparent",
                border: overI === i && dragI !== null && dragI !== i
                  ? `2px dashed ${s.c}`
                  : i === sel ? `1.5px solid ${s.bd}` : "1.5px solid transparent",
                opacity: dragI === i ? 0.35 : 1,
                transition: "background 0.12s, border 0.12s, opacity 0.12s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <GripVertical size={12} style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }} />
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.c, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 500 }}>{s.title}</span>
              </div>
              <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 2, marginLeft: 25 }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ CENTER: PREVIEW + CHAT ═══ */}
      <div style={S.col}>
        {/* slide preview */}
        <div style={{ padding: "14px 16px", background: "var(--color-background-tertiary)", borderBottom: "0.5px solid var(--color-border-tertiary)", flexShrink: 0 }}>
          <div style={{
            background: "var(--color-background-primary)", borderRadius: 10,
            border: "0.5px solid var(--color-border-secondary)",
            padding: "18px 22px", maxWidth: 300, margin: "0 auto",
            aspectRatio: "16/10", display: "flex", flexDirection: "column", justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{ width: 28, height: 3, borderRadius: 2, background: curSec?.c, marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 5 }}>{sd[0]}</div>
            <div style={{ fontSize: 10, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{sd[1]}</div>
            <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
              {Array.from({ length: curSec?.slides || 0 }).map((_, j) => (
                <div key={j} style={{ flex: 1, height: 4, borderRadius: 2, background: curSec?.bg, border: `0.5px solid ${curSec?.bd}` }} />
              ))}
            </div>
          </div>
          {/* slide indicators */}
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 10 }}>
            {secs.map((s, i) => (
              <div
                key={s.id}
                onClick={() => setSel(i)}
                style={{
                  width: i === sel ? 20 : 6, height: 6, borderRadius: 3,
                  background: i === sel ? s.c : "var(--color-border-secondary)",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              />
            ))}
          </div>
        </div>

        {/* chat area */}
        <div style={{ ...S.col, flex: 1 }}>
          <div style={S.panelHead}>
            <Bot size={14} style={{ color: "#1D9E75" }} /> AI 助手
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", marginBottom: 6 }}>
                <div style={{
                  padding: "7px 11px", borderRadius: 10, maxWidth: "88%",
                  fontSize: 12, lineHeight: 1.65,
                  background: m.from === "user" ? "#EEEDFE" : m.from === "sys" ? "var(--color-background-secondary)" : "#E1F5EE",
                  color: m.from === "user" ? "#3C3489" : m.from === "sys" ? "var(--color-text-tertiary)" : "#085041",
                  fontStyle: m.from === "sys" ? "italic" : "normal",
                  borderBottomRightRadius: m.from === "user" ? 3 : 10,
                  borderBottomLeftRadius: m.from !== "user" ? 3 : 10,
                }}>
                  {m.from === "sys" && <RotateCcw size={10} style={{ marginRight: 4, verticalAlign: -1 }} />}
                  {m.from === "ai" && i > 0 && m.from !== "sys" && <Sparkles size={10} style={{ marginRight: 4, verticalAlign: -1 }} />}
                  {m.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div style={{ display: "flex", marginBottom: 6 }}>
                <div style={{ padding: "7px 11px", borderRadius: 10, borderBottomLeftRadius: 3, background: "#E1F5EE", color: "#085041", fontSize: 12 }}>
                  <span style={{ animation: "none", letterSpacing: 2 }}>思考中...</span>
                </div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>
          <div style={{ padding: "8px 12px", borderTop: "0.5px solid var(--color-border-tertiary)", display: "flex", gap: 6, flexShrink: 0 }}>
            <input
              value={inp}
              onChange={(e) => setInp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && send()}
              placeholder="输入你的想法，如：把结论提前试试…"
              style={{
                flex: 1, fontSize: 12, padding: "7px 10px", borderRadius: 8,
                border: "0.5px solid var(--color-border-tertiary)",
                background: "var(--color-background-secondary)",
                color: "var(--color-text-primary)", outline: "none",
              }}
              onFocus={(e) => { e.target.style.borderColor = "var(--color-border-secondary)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--color-border-tertiary)"; }}
            />
            <button
              onClick={send}
              style={{
                padding: "6px 12px", fontSize: 12, borderRadius: 8, cursor: "pointer",
                background: "#7F77DD", color: "#fff", border: "none",
                display: "flex", alignItems: "center", gap: 4,
                opacity: inp.trim() ? 1 : 0.5, transition: "opacity 0.15s",
              }}
            >
              <Send size={12} /> 发送
            </button>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT: VERSION TREE ═══ */}
      <div style={{ ...S.col, borderLeft: "0.5px solid var(--color-border-tertiary)" }}>
        <div style={S.panelHead}>
          <GitBranch size={14} style={{ color: "#D85A30" }} /> 版本树
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
          {vers.filter((v) => v.par === null).map((v) => (<Tree key={v.id} vid={v.id} />))}
        </div>
        <div style={{ padding: "8px 10px", borderTop: "0.5px solid var(--color-border-tertiary)", flexShrink: 0, fontSize: 10, color: "var(--color-text-tertiary)", textAlign: "center", lineHeight: 1.5 }}>
          点击任意版本可回溯<br />回溯后拖拽即自动分叉
        </div>
      </div>
    </div>
  );
}
