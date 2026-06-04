import { useRef, useState } from "react";
import { AI_CHAT, AI_DRAG, INIT, cloneSections, pick } from "../data/mock";

export function useStoryflow() {
  const [secs, setSecs] = useState(() => cloneSections(INIT));
  const [vers, setVers] = useState(() => [
    {
      id: "v0",
      label: "初始生成",
      snap: cloneSections(INIT),
      par: null,
      ch: [],
      stage: "intent",
      kind: "init",
    },
  ]);
  const [curV, setCurV] = useState("v0");
  const [sel, setSel] = useState(0);
  const [selPage, setSelPage] = useState(0);
  const [dragI, setDragI] = useState(null);
  const [overI, setOverI] = useState(null);
  const [focusedSection, setFocusedSection] = useState(null);
  const [msgs, setMsgs] = useState([
    {
      from: "ai",
      text: "你好！我已根据你的需求生成了 12 页演示文稿。左侧是自动提取的故事线结构——直接拖拽节点即可调整叙事顺序，我会实时适配所有内容。",
    },
  ]);
  const [thinking, setThinking] = useState(false);
  const vc = useRef(1);
  const chatEnd = useRef(null);

  const scroll = () => {
    setTimeout(() => chatEnd.current?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  const addMsg = (from, text) => {
    setMsgs((prev) => [...prev, { from, text }]);
    scroll();
  };

  const commitVersion = (label, nextSecs, meta = {}) => {
    // 去重护栏：内容与当前版本完全相同则不新建节点，避免冗余节点
    const cur = vers.find((v) => v.id === curV);
    if (cur && JSON.stringify(cur.snap) === JSON.stringify(nextSecs)) {
      setSecs(cloneSections(nextSecs));
      return;
    }

    const vid = `v${vc.current++}`;
    const snap = cloneSections(nextSecs);
    setVers((prev) => {
      const withChild = prev.map((v) =>
        v.id === curV ? { ...v, ch: [...v.ch, vid] } : v,
      );
      return [...withChild, { id: vid, label, snap, par: curV, ch: [], stage: meta.stage || "structure", kind: meta.kind || "edit", ...meta }];
    });
    setCurV(vid);
    setSecs(cloneSections(nextSecs));
  };

  const onDrop = (to) => {
    if (dragI === null || dragI === to) {
      setDragI(null);
      setOverI(null);
      return;
    }

    const next = cloneSections(secs);
    const [mv] = next.splice(dragI, 1);
    next.splice(to, 0, mv);
    const dir = to < dragI ? "前移" : "后移";

    commitVersion(`${mv.title}${dir}`, next);
    setSel(to);
    setSelPage(0);
    setDragI(null);
    setOverI(null);
    addMsg("ai", pick(AI_DRAG)(mv.title, dir, to + 1));
  };

  const restore = (vid) => {
    const v = vers.find((x) => x.id === vid);
    if (!v) return;

    setSecs(cloneSections(v.snap));
    setCurV(vid);
    setSel(0);
    setSelPage(0);
    addMsg("sys", `已回溯至版本「${v.label}」，可从此处继续编辑或分叉探索新方向。`);
  };

  // 手动保存当前工作态为版本节点（用于 AI 单页精修等不自动入树的改动）
  const saveVersion = (label = "手动保存", meta = {}) =>
    commitVersion(label, secs, { stage: "refine", kind: "refine", ...meta });

  // 切换节点星标（标记重要里程碑，星标节点受保护不可删除）
  const toggleSaved = (vid) => {
    setVers((prev) => prev.map((v) => (v.id === vid ? { ...v, saved: !v.saved } : v)));
  };

  // 删除节点：mode="reparent" 子节点上接父级；mode="subtree" 删除整棵子树
  const deleteVersion = (vid, mode = "reparent") => {
    const byId = Object.fromEntries(vers.map((v) => [v.id, v]));
    const target = byId[vid];
    if (!target || target.par === null || target.saved) return false;

    const parentId = target.par;
    const descendants = [];
    const collect = (id) => byId[id]?.ch.forEach((c) => { descendants.push(c); collect(c); });
    collect(vid);

    if (mode === "subtree" && descendants.some((id) => byId[id]?.saved)) {
      addMsg("sys", "子树中包含星标节点，已取消删除以保护它们。");
      return false;
    }

    const removed = new Set(mode === "subtree" ? [vid, ...descendants] : [vid]);

    setVers((prev) => {
      const next = prev.filter((v) => !removed.has(v.id));
      if (mode === "subtree") {
        return next.map((v) => (v.id === parentId ? { ...v, ch: v.ch.filter((c) => c !== vid) } : v));
      }
      const childIds = target.ch;
      return next.map((v) => {
        if (v.id === parentId) return { ...v, ch: v.ch.flatMap((c) => (c === vid ? childIds : [c])) };
        if (childIds.includes(v.id)) return { ...v, par: parentId };
        return v;
      });
    });

    // 当前版本若被删除，回退到父节点
    if (removed.has(curV)) {
      setCurV(parentId);
      setSecs(cloneSections(byId[parentId].snap));
    }
    addMsg("sys", `已删除版本「${target.label}」${mode === "subtree" ? "及其子树" : "（子节点已上接父级）"}。`);
    return true;
  };

  const send = (text) => {
    const val = text?.trim();
    if (!val) return;

    addMsg("user", val);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      addMsg("ai", pick(AI_CHAT));
    }, 600 + Math.random() * 500);
  };

  return {
    secs,
    setSecs,
    vers,
    curV,
    sel,
    setSel,
    selPage,
    setSelPage,
    dragI,
    focusedSection,
    setFocusedSection,
    msgs,
    addMsg,
    onDrop,
    restore,
    saveVersion,
    toggleSaved,
    deleteVersion,
    send,
    commitVersion,
    setDragI,
    overI,
    setOverI,
    thinking,
    chatEnd,
  };
}
