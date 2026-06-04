export const INTRO_EXAMPLE = "下周向投资人介绍产品价值，15 分钟";

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
