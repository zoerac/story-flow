import { useRef, useState } from "react";
import { AI_CHAT, INIT, applyStorylineStructuralImpact, cloneSections, palettes, pick } from "../data/mock";
import { applyIntent, parseIntent, polishOnMerge, polishOnReorder, polishOnSplit } from "../lib/refineEngine";

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

  const addMsg = (from, text, action) => {
    setMsgs((prev) => [...prev, { from, text, ...(action ? { action } : {}) }]);
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

    const reordered = cloneSections(secs);
    const [mv] = reordered.splice(dragI, 1);
    reordered.splice(to, 0, mv);
    const dir = to < dragI ? "前移" : "后移";
    const impacted = applyStorylineStructuralImpact(reordered, {
      from: dragI,
      to,
      movedId: mv.id,
      direction: dir,
    });

    // 重排序后实时润色：根据新的上下文重写衔接文案
    const { sections: polished, summary } = polishOnReorder(impacted, dragI, to);
    const undoTo = curV;
    commitVersion(`${mv.title}${dir}`, polished);
    setSel(to);
    setSelPage(0);
    setDragI(null);
    setOverI(null);
    addMsg("ai", summary, { label: "撤销本次调整", undoTo });
  };

  // 章并入章为子页：被拖章的页追加为目标章的子页，源章移除
  const mergeSection = (fromI, toI) => {
    if (fromI === null || toI === null || fromI === toI) {
      setDragI(null);
      setOverI(null);
      return;
    }
    const from = secs[fromI];
    const to = secs[toI];
    if (!from || !to) {
      setDragI(null);
      setOverI(null);
      return;
    }

    const next = cloneSections(secs);
    const insertAt = next[toI].pages.length;
    const existingIds = new Set(next[toI].pages.map((p) => p.id));
    const moved = next[fromI].pages.map((p) =>
      existingIds.has(p.id) ? { ...p, id: `${p.id}-m` } : p,
    );
    next[toI].pages = [...next[toI].pages, ...moved];
    next.splice(fromI, 1);
    const newToI = fromI < toI ? toI - 1 : toI;

    const { sections: polished, summary } = polishOnMerge(next, newToI, insertAt, from.title);
    const undoTo = curV;
    commitVersion(`${from.title} 并入 ${to.title}`, polished);
    setSel(newToI);
    setSelPage(0);
    setDragI(null);
    setOverI(null);
    addMsg("ai", summary, { label: "撤销合并", undoTo });
  };

  // 子页拆出为独立章：被拖的页脱离原章，提升为新的一级章节，插入原章之后
  const splitPageOut = (fromI, pageI) => {
    const from = secs[fromI];
    // 单页章拆出会留下空章，视为 no-op；越界同理
    if (!from || from.pages.length <= 1 || !from.pages[pageI]) {
      setDragI(null);
      setOverI(null);
      return;
    }

    const next = cloneSections(secs);
    const [page] = next[fromI].pages.splice(pageI, 1);

    const insertAt = fromI + 1;
    // 按插入后的章数循环取配色，保证与既有章视觉区分
    const palette = palettes[next.length % palettes.length];
    const existingIds = new Set(next.flatMap((s) => s.pages.map((p) => p.id)));
    const pageId = existingIds.has(page.id) ? `${page.id}-out` : page.id;
    const newSec = {
      id: `sec-${pageId}`,
      title: page.h,
      sub: `自「${from.title}」拆出`,
      c: palette.c,
      bg: palette.bg,
      bd: palette.bd,
      pages: [{ ...page, id: pageId }],
    };
    next.splice(insertAt, 0, newSec);

    const { sections: polished, summary } = polishOnSplit(next, insertAt, from.title);
    const undoTo = curV;
    commitVersion(`${page.h} 拆为独立章`, polished);
    setSel(insertAt);
    setSelPage(0);
    setDragI(null);
    setOverI(null);
    addMsg("ai", summary, { label: "撤销拆分", undoTo });
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

    const { type, label } = parseIntent(val);
    setTimeout(() => {
      setThinking(false);
      // 非指令型对话回退到闲聊
      if (type === "chat") {
        addMsg("ai", pick(AI_CHAT));
        return;
      }
      // 指令型：应用变换并自动入版本树，附撤销入口
      const { sections: polished, summary } = applyIntent(secs, type, { text: val });
      if (!summary) {
        addMsg("ai", pick(AI_CHAT));
        return;
      }
      // 实际未改动（如未找到可前移的结论章）则只反馈、不入树、不给撤销
      const changed = JSON.stringify(polished) !== JSON.stringify(secs);
      if (!changed) {
        addMsg("ai", summary);
        return;
      }
      const undoTo = curV;
      commitVersion(`AI·${label}`, polished, { stage: "refine", kind: "refine" });
      addMsg("ai", summary, { label: "撤销本次改写", undoTo });
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
    mergeSection,
    splitPageOut,
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
