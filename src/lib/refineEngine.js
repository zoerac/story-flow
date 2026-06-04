// 本地智能润色引擎（规则化 mock，零依赖、零联网）。
// 所有"看似 AI"的内容改写集中在此，预留清晰函数边界，将来可整体替换为真实 API。
import { cloneSections } from "../data/mock";

// ---- 导语标记工具 ----------------------------------------------------------
// 过渡导语统一包在 〈…〉 中，既可被识别剥离、避免重复堆叠，又能自然显示。
const LEAD_RE = /^〈([^〉]*)〉/u;

const splitLead = (b) => {
  const text = String(b || "");
  const m = text.match(LEAD_RE);
  return m ? { lead: m[1], body: text.slice(m[0].length) } : { lead: "", body: text };
};

const joinLead = (lead, body) => (lead ? `〈${lead}〉${body}` : body);

// ---- 意图解析 --------------------------------------------------------------
const INTENT_RULES = [
  { type: "tighten", label: "精简紧凑", kw: ["紧密", "紧凑", "精简", "压缩", "简洁", "精炼", "简练", "删减", "太长", "啰嗦", "冗长", "繁琐"] },
  { type: "expand", label: "丰富展开", kw: ["展开", "丰富", "详细", "补充", "扩写", "充实", "太简", "太短", "深入", "细化", "铺垫"] },
  { type: "frontload", label: "结论前移", kw: ["结论前移", "先讲结论", "先说结论", "结论提前", "结论放前", "倒金字塔", "开门见山"] },
  { type: "tone", label: "语气调整", kw: ["语气", "正式", "专业", "严谨", "书面", "口语", "亲切", "活泼", "轻松"] },
];

export function parseIntent(text) {
  const t = String(text || "");
  for (const rule of INTENT_RULES) {
    if (rule.kw.some((k) => t.includes(k))) return { type: rule.type, label: rule.label };
  }
  return { type: "chat", label: "对话" };
}

// ---- 拖动重排序后的衔接润色 ------------------------------------------------
// 移动后的章节现在位于 toI，根据其新的前后邻章重写开篇导语。
export function polishOnReorder(sections, fromI, toI) {
  const next = cloneSections(sections);
  const sec = next[toI];
  if (!sec || !sec.pages?.length) return { sections: next, summary: "" };

  const prev = next[toI - 1];
  const after = next[toI + 1];
  let lead;
  if (prev && after) lead = `承接「${prev.title}」，引出「${after.title}」`;
  else if (prev) lead = `承接「${prev.title}」，收束全篇`;
  else if (after) lead = `作为开篇，引出「${after.title}」`;
  else lead = "独立章节";

  const head = sec.pages[0];
  const { body } = splitLead(head.b);
  head.b = joinLead(lead, body);

  const dir = toI < fromI ? "前移" : "后移";
  const summary = `已将「${sec.title}」${dir}至第 ${toI + 1} 位，并据新的上下文重写了开篇衔接（${lead}）。`;
  return { sections: next, summary };
}

// ---- 章并入章为子页后的承接润色 --------------------------------------------
// 被并入的页从 insertAt 开始，给首段补承接说明，并在目标章 sub 标注来源。
export function polishOnMerge(sections, toI, insertAt, fromTitle) {
  const next = cloneSections(sections);
  const sec = next[toI];
  if (!sec) return { sections: next, summary: "" };

  const bridge = sec.pages[insertAt];
  if (bridge) {
    const { body } = splitLead(bridge.b);
    bridge.b = joinLead(`并入自「${fromTitle}」`, body);
  }
  if (!sec.sub.includes(fromTitle)) sec.sub = `${sec.sub} · 含「${fromTitle}」`;

  const mergedCount = sec.pages.length - insertAt;
  const summary = `已将「${fromTitle}」的 ${mergedCount} 页并入「${sec.title}」作为子页，并补写了承接说明。`;
  return { sections: next, summary };
}

// ---- 子页拆分为独立章后的润色 ----------------------------------------------
// 被提升的页成为新章首页：补一句"独立成章"的开篇导语，说明其原始归属。
export function polishOnSplit(sections, newI, fromTitle) {
  const next = cloneSections(sections);
  const sec = next[newI];
  if (!sec || !sec.pages?.length) return { sections: next, summary: "" };

  const head = sec.pages[0];
  const { body } = splitLead(head.b);
  head.b = joinLead(`独立成章，原属「${fromTitle}」`, body);

  const summary = `已将该页从「${fromTitle}」拆出，提升为独立章节「${sec.title}」，并补写了开篇导语。`;
  return { sections: next, summary };
}

// ---- general 指令变换 ------------------------------------------------------
const FILLER = ["的全新范式", "全新", "持续", "深度", "进一步", "非常", "十分", "可以说", "在某种程度上", "其实", "通过"];

// 精简正文：去填充词、折叠空白，结果过短则保留原文，避免改空。
const compactText = (s) => {
  const original = String(s || "");
  let t = original;
  FILLER.forEach((w) => { t = t.split(w).join(""); });
  t = t.replace(/\s+/g, " ").trim();
  return t.length >= 4 ? t : original;
};

// 缩短副标题到第一个分隔符前，保留最核心的一段。
const compactSub = (s) => {
  const t = String(s || "");
  const head = t.split(/[·｜，、,]/u)[0].trim();
  return head.length >= 2 ? head : t;
};

function tighten(sections) {
  const next = cloneSections(sections);
  let touched = 0;
  next.forEach((sec) => {
    sec.pages.forEach((p) => {
      const { lead, body } = splitLead(p.b);
      const compact = compactText(body);
      if (compact !== body) touched += 1;
      p.b = joinLead(lead, compact);
    });
    sec.sub = compactSub(sec.sub);
  });
  return { sections: next, summary: `已精简 ${touched} 处正文表述、收紧各章副标题，故事线整体更紧凑。` };
}

function expand(sections) {
  const next = cloneSections(sections);
  let added = 0;
  next.forEach((sec) => {
    if (sec.pages.length <= 1) {
      const base = sec.pages[0];
      sec.pages.push({
        id: `${sec.id}-ext`,
        h: `${sec.title}·延展`,
        b: `围绕「${base?.h || sec.title}」进一步展开：补充背景、论据与示例，帮助听众建立完整认知。`,
      });
      added += 1;
    }
    const head = sec.pages[0];
    const { lead, body } = splitLead(head.b);
    head.b = joinLead(lead, `${body}（已补充上下文铺垫）`);
  });
  return { sections: next, summary: `已为 ${added} 个单页章节补充延展页，并丰富了各章开篇的铺垫。` };
}

function frontload(sections) {
  const next = cloneSections(sections);
  const idx = next.findIndex((s) => /结论|总结|展望/u.test(s.title));
  if (idx <= 0) {
    return { sections: next, summary: "未发现可前移的结论章节，故事线维持原结构。" };
  }
  const [concl] = next.splice(idx, 1);
  const insertAt = 1;
  next.splice(insertAt, 0, concl);
  const head = concl.pages[0];
  if (head) {
    const { body } = splitLead(head.b);
    head.b = joinLead("开门见山先亮结论", body);
  }
  return { sections: next, summary: `已将「${concl.title}」前移至第 ${insertAt + 1} 位，采用倒金字塔结构先亮结论、再展开论证。` };
}

function tone(sections, ctx) {
  const formal = /正式|专业|严谨|书面/u.test(ctx?.text || "");
  const next = cloneSections(sections);
  next.forEach((sec) => sec.pages.forEach((p) => {
    const { lead, body } = splitLead(p.b);
    const adjusted = formal ? body.replace(/试试|搞|弄/gu, "调整") : body.replace(/。$/u, "～");
    p.b = joinLead(lead, adjusted);
  }));
  return {
    sections: next,
    summary: formal ? "已将表述统一为更正式、专业的书面语气。" : "已将语气调整得更自然、贴近听众。",
  };
}

export function applyIntent(sections, type, ctx = {}) {
  switch (type) {
    case "tighten": return tighten(sections);
    case "expand": return expand(sections);
    case "frontload": return frontload(sections);
    case "tone": return tone(sections, ctx);
    default: return { sections: cloneSections(sections), summary: "" };
  }
}
