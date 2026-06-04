import { useRef, useState } from "react";
import { AI_CHAT, AI_DRAG, INIT, applyStorylineStructuralImpact, cloneSections, pick } from "../data/mock";

export function useStoryflow() {
  const [secs, setSecs] = useState(() => cloneSections(INIT));
  const [vers, setVers] = useState(() => [
    {
      id: "v0",
      label: "初始生成",
      snap: cloneSections(INIT),
      par: null,
      ch: [],
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

  const commitVersion = (label, nextSecs) => {
    const vid = `v${vc.current++}`;
    const snap = cloneSections(nextSecs);
    setVers((prev) => {
      const withChild = prev.map((v) =>
        v.id === curV ? { ...v, ch: [...v.ch, vid] } : v,
      );
      return [...withChild, { id: vid, label, snap, par: curV, ch: [] }];
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
    const impacted = applyStorylineStructuralImpact(next, {
      from: dragI,
      to,
      movedId: mv.id,
      direction: dir,
    });

    commitVersion(`${mv.title}${dir}`, impacted);
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
    send,
    commitVersion,
    setDragI,
    overI,
    setOverI,
    thinking,
    chatEnd,
  };
}
