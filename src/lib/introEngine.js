// 意图对齐阶段的纯 mock 推理引擎：依据用户选择/澄清，给出初版故事线并逐轮精修。
// 输入 sections、输出 sections，是一组纯函数，将来可整体替换为真实 API。
import { INIT, MOCK_STORYLINE_DRAFTS, cloneSections, pick } from "../data/mock";
import { INTRO_REFINE_SUGGESTIONS } from "../data/intro";

// 按关键词为 3 套草案打分，返回最匹配的草案元信息（无命中返回 null → 用通用 INIT）
function selectDraftMeta(text) {
  const hay = String(text || "").toLowerCase();
  const ranked = MOCK_STORYLINE_DRAFTS
    .map((d) => ({ d, score: d.keywords.reduce((s, k) => s + (hay.includes(k.toLowerCase()) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score > 0 ? ranked[0].d : null;
}

// 每轮给出新的澄清建议（避免与上一轮重复）
function nextChips(lastChips) {
  const candidates = INTRO_REFINE_SUGGESTIONS.filter((g) => g !== lastChips);
  return pick(candidates.length ? candidates : INTRO_REFINE_SUGGESTIONS);
}

// 在指定章末尾追加一页，保证页面 id 全局唯一
function addPageAt(sections, targetIdx, h, b) {
  const next = cloneSections(sections);
  const idx = Math.max(0, Math.min(targetIdx, next.length - 1));
  const ids = new Set(next.flatMap((s) => s.pages.map((p) => p.id)));
  let n = 1;
  let id = `add-${idx}-${n}`;
  while (ids.has(id)) id = `add-${idx}-${++n}`;
  next[idx] = { ...next[idx], pages: [...next[idx].pages, { id, h, b }] };
  return next;
}

// —— 结构变换规则（首条命中即应用，单轮一次可见变化）——

// 结论前移：倒金字塔结构，适合高管/投资人
function tryConclusionFront(sections, text) {
  if (!/结论(放|提|最前|前)|倒金字塔|先讲结论|开门见山|投资人|高管|决策/.test(text)) return null;
  const i = sections.findIndex((s) => /结论|展望|总结/.test(s.title));
  if (i < 0) return null;
  if (i === 0) return { sections, note: "结论已在开头，维持倒金字塔结构" };
  const next = cloneSections(sections);
  const [c] = next.splice(i, 1);
  next.unshift(c);
  return { sections: next, note: `把「${c.title}」前移到开头（倒金字塔结构）` };
}

// 合并前两章：开头更紧凑
function tryMerge(sections, text) {
  if (!/开头(更短|太长|短)|更短|精简|压缩|合并|太长/.test(text)) return null;
  if (sections.length < 2) return null;
  const next = cloneSections(sections);
  const a = next[0];
  const b = next[1];
  const ids = new Set(a.pages.map((p) => p.id));
  const moved = b.pages.map((p) => (ids.has(p.id) ? { ...p, id: `${p.id}-m` } : p));
  a.pages = [...a.pages, ...moved];
  next.splice(1, 1);
  return { sections: next, note: `合并了「${a.title}」与「${b.title}」，开头更紧凑` };
}

// 新增一页：按关键词决定加在哪一章、加什么内容
function tryAddPage(sections, text) {
  const specs = [
    { re: /市场|规模|机会/, h: "市场规模与机会", b: "量化目标市场规模与增长空间，支撑商业判断。", find: /开场|背景|研究|问题|机会/ },
    { re: /竞品|差异/, h: "竞品对比", b: "对比关键竞品的定位与差异，凸显本方案优势。", find: /实验|结果|数据|方法|系统/ },
    { re: /数据|指标|对比|结果/, h: "关键数据对比", b: "用核心指标和前后对比量化方案效果。", find: /实验|结果|观察|数据/ },
    { re: /案例|实践|落地/, h: "案例佐证", b: "用一个真实案例说明方案如何落地见效。", find: /方法|系统|结果/ },
    { re: /技术|架构|实现/, h: "技术架构与实现", b: "拆解核心技术架构与关键实现路径。", find: /方法|系统|设计/ },
    { re: /团队|执行|协作/, h: "团队与执行路径", b: "说明团队构成与分阶段的执行计划。", find: /结论|展望|路线|下一步/ },
  ];
  for (const s of specs) {
    if (!s.re.test(text)) continue;
    let idx = sections.findIndex((sec) => s.find.test(sec.title) || s.find.test(sec.sub || ""));
    if (idx < 0) idx = Math.max(0, sections.length - 2);
    const next = addPageAt(sections, idx, s.h, s.b);
    return { sections: next, note: `在「${next[idx].title}」新增一页「${s.h}」` };
  }
  return null;
}

// 调性改写：只改副标题，不动结构
function tryRetone(sections, text) {
  let kind = null;
  if (/热情|感染|生动/.test(text)) kind = "热情";
  else if (/简洁|高效|精炼/.test(text)) kind = "简洁";
  else if (/专业|严谨/.test(text)) kind = "专业";
  else if (/商业|价值|收益|roi/i.test(text)) kind = "商业";
  if (!kind) return null;

  const transform = {
    热情: (s) => `${s}，点燃共鸣`,
    简洁: (s) => s.split(/[，、,]/)[0],
    专业: (s) => `${s}，以数据支撑`,
    商业: (s) => `${s}，突出商业价值`,
  }[kind];
  const next = cloneSections(sections);
  next.forEach((sec) => { sec.sub = transform(sec.sub || ""); });

  const noteMap = { 热情: "把各章副标题调得更有感染力", 简洁: "把副标题改得更简洁", 专业: "强化了专业严谨的表达", 商业: "在副标题中突出了商业价值" };
  return { sections: next, note: noteMap[kind] };
}

const RULES = [tryConclusionFront, tryMerge, tryAddPage, tryRetone];

// 依据 need/audience/tone 给出初版故事线方案
export function buildInitialDraft({ need, audience, tone }) {
  const text = [need, audience, tone].filter(Boolean).join(" ");
  const meta = selectDraftMeta(text);
  const sections = cloneSections(meta ? meta.sections : INIT);
  const label = meta ? meta.label : "通用叙事";
  const summary = `我按「${label}」帮你起了一版故事线，共 ${sections.length} 章——右侧就是初版结构。你可以点下面的建议，或直接说想怎么调，我会实时改写。`;
  return { sections, draftId: meta?.id ?? "default", label, summary, chips: nextChips(null) };
}

// 单轮精修：重新选型 + 一次结构变换，返回新的 sections / 反馈 / 下一轮建议
export function refineDraft(currentSections, userText, ctx = {}) {
  const { accumulatedText = "", draftId = "default", lastChips = null } = ctx;
  const text = String(userText || "");
  let sections = cloneSections(currentSections);
  let newDraftId = draftId;
  const parts = [];

  // 1. 重新选型：若累计语义更贴合另一套草案则整体切换
  const meta = selectDraftMeta(`${accumulatedText} ${text}`);
  if (meta && meta.id !== draftId) {
    sections = cloneSections(meta.sections);
    newDraftId = meta.id;
    parts.push(`已切换到更贴合的「${meta.label}」结构（${sections.length} 章）`);
  }

  // 2. 一次结构变换（首条命中规则）
  for (const rule of RULES) {
    const r = rule(sections, text);
    if (r) {
      sections = r.sections;
      if (r.note) parts.push(r.note);
      break;
    }
  }

  // 3. 组织反馈
  const summary = parts.length
    ? `${parts.join("，并")}。右侧已实时更新，看看是否符合预期？`
    : "我记下了这点。当前结构先保持——如果想加章节、调顺序或合并，直接说，我会立刻改写右侧故事线。";

  return { sections, draftId: newDraftId, summary, chips: nextChips(lastChips) };
}
