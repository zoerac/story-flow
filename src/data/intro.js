export const INTRO_EXAMPLE = "下周向投资人介绍产品价值，15 分钟";

export const GALLERY_TILES = [
  { id: "t1", title: "开场与背景", sub: "行业趋势与机会",   c: "#7F77DD", bg: "#EEEDFE", x: 6,  y: 8,  depth: 22, dur: 7.2 },
  { id: "t2", title: "核心问题",   sub: "用户痛点剖析",     c: "#D4537E", bg: "#FBEAF0", x: 76, y: 5,  depth: 14, dur: 9.5 },
  { id: "t3", title: "方法论",     sub: "技术方案与架构",   c: "#1D9E75", bg: "#E1F5EE", x: 18, y: 72, depth: 18, dur: 8.1 },
  { id: "t4", title: "实验结果",   sub: "关键数据对比",     c: "#378ADD", bg: "#E6F1FB", x: 68, y: 68, depth: 10, dur: 11.3 },
  { id: "t5", title: "结论展望",   sub: "核心发现",         c: "#D85A30", bg: "#FAECE7", x: 3,  y: 42, depth: 20, dur: 6.8 },
  { id: "t6", title: "致谢",       sub: "团队与参考",       c: "#888780", bg: "#F1EFE8", x: 80, y: 38, depth: 12, dur: 10.4 },
  { id: "t7", title: "意图对齐",   sub: "AI 主导阶段",      c: "#7F77DD", bg: "#EEEDFE", x: 44, y: 4,  depth: 8,  dur: 13.1 },
  { id: "t8", title: "版本树",     sub: "结构决策记录",     c: "#1D9E75", bg: "#E1F5EE", x: 38, y: 80, depth: 16, dur: 7.9 },
  { id: "t9", title: "框选提案",   sub: "局部精修",         c: "#378ADD", bg: "#E6F1FB", x: 88, y: 18, depth: 24, dur: 8.7 },
];

export const INTRO_STEPS = [
  {
    id: "audience",
    question: "先确认听众——这份演示主要讲给谁听？",
    chips: ["投资人 / 决策者", "潜在客户", "团队 / 同事"],
  },
  {
    id: "tone",
    question: "期望的调性与节奏偏向哪种？",
    chips: ["专业严谨", "热情有感染力", "简洁高效"],
  },
];

export function buildSummary({ need, audience, tone }) {
  const audienceMap = {
    "投资人 / 决策者": "投资人与决策者，关注商业价值与差异化",
    "潜在客户": "潜在客户，关注解决方案与实际收益",
    "团队 / 同事": "内部团队，关注执行路径与协作细节",
  };
  const toneMap = {
    "专业严谨": "专业严谨，逻辑清晰，数据支撑论点",
    "热情有感染力": "热情饱满，叙事生动，强调愿景与可能性",
    "简洁高效": "简洁直接，一句话一个要点，节奏紧凑",
  };

  return {
    goal: need,
    audience: audienceMap[audience] ?? audience,
    thesis: "StoryFlow 以叙事结构层为核心重塑演示文稿工作流，让 AI 持续理解意图、每次编辑可追溯可回溯。",
    tone: toneMap[tone] ?? tone,
  };
}
