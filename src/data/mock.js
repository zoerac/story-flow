const page = (id, h, b) => ({ id, h, b });

const VISUAL_IMAGES = [
  "/canva_data/Beige%20Minimalist%20Ad%20Campaign%20Creative%20Brief%20Presentation.png",
  "/canva_data/Beige%20Minimalist%20Ad%20Campaign%20Creative%20Brief%20Presentation%20(1).png",
  "/canva_data/Beige%20Minimalist%20Ad%20Campaign%20Creative%20Brief%20Presentation%20(2).png",
];

const palettes = [
  { c: "#7F77DD", bg: "#EEEDFE", bd: "#CECBF6", accent: "#D4537E" },
  { c: "#D4537E", bg: "#FBEAF0", bd: "#F4C0D1", accent: "#1D9E75" },
  { c: "#1D9E75", bg: "#E1F5EE", bd: "#9FE1CB", accent: "#378ADD" },
  { c: "#378ADD", bg: "#E6F1FB", bd: "#B5D4F4", accent: "#D85A30" },
  { c: "#D85A30", bg: "#FAECE7", bd: "#F5C4B3", accent: "#7F77DD" },
  { c: "#888780", bg: "#F1EFE8", bd: "#D3D1C7", accent: "#378ADD" },
];

const visualItem = (source, index, title, style, tags) => {
  const palette = palettes[index % palettes.length];
  return {
    id: `${source}-${String(index + 1).padStart(2, "0")}`,
    source,
    title,
    style,
    tags,
    c: palette.c,
    bg: palette.bg,
    bd: palette.bd,
    accent: palette.accent,
    image: VISUAL_IMAGES[index % VISUAL_IMAGES.length],
  };
};

export const INIT = [
  {
    id: "s1",
    title: "开场与背景",
    sub: "行业趋势与市场机会",
    c: "#7F77DD",
    bg: "#EEEDFE",
    bd: "#CECBF6",
    pages: [
      page("s1p1", "AI 重塑演示文稿工作流", "从手动逐页制作到人机协作的全新范式"),
      page("s1p2", "行业变化正在加速", "生成式 AI 将内容生产、结构规划与现场迭代压缩到同一工作流。"),
    ],
  },
  {
    id: "s2",
    title: "核心问题",
    sub: "用户痛点深度剖析",
    c: "#D4537E",
    bg: "#FBEAF0",
    bd: "#F4C0D1",
    pages: [
      page("s2p1", "三大核心痛点", "结构僵化 · 意图丢失 · 生成与编辑割裂"),
    ],
  },
  {
    id: "s3",
    title: "方法论",
    sub: "技术方案与架构设计",
    c: "#1D9E75",
    bg: "#E1F5EE",
    bd: "#9FE1CB",
    pages: [
      page("s3p1", "StoryFlow 设计理念", "故事线驱动 · 意图版本管理 · AI 持续响应"),
      page("s3p2", "结构层优先编辑", "用户先调整叙事骨架，页面内容再跟随结构变化自动适配。"),
      page("s3p3", "版本树记录意图", "每次结构操作都形成可回溯节点，允许从任意历史继续分叉探索。"),
    ],
  },
  {
    id: "s4",
    title: "实验结果",
    sub: "关键数据与对比分析",
    c: "#378ADD",
    bg: "#E6F1FB",
    bd: "#B5D4F4",
    pages: [
      page("s4p1", "用户测试核心指标", "结构调整效率 ↑68% 满意度 4.6 / 5"),
      page("s4p2", "编辑路径更短", "参与者平均用更少步骤完成章节重排、内容聚焦与汇报版本切换。"),
      page("s4p3", "AI 响应更贴合上下文", "结构层上下文让系统能解释变更原因，并提示相邻章节的衔接风险。"),
    ],
  },
  {
    id: "s5",
    title: "结论与展望",
    sub: "核心发现与下一步",
    c: "#D85A30",
    bg: "#FAECE7",
    bd: "#F5C4B3",
    pages: [
      page("s5p1", "结论：叙事结构层是关键", "AI Native 编辑器最核心的缺失与机会"),
      page("s5p2", "下一步产品方向", "继续扩展框选提案、对话聚焦和演示前的自动结构体检。"),
    ],
  },
  {
    id: "s6",
    title: "致谢",
    sub: "团队与参考",
    c: "#888780",
    bg: "#F1EFE8",
    bd: "#D3D1C7",
    pages: [
      page("s6p1", "感谢聆听", "团队成员与参考文献"),
    ],
  },
];

export const AI_DRAG = [
  (t, d, p) => `已将「${t}」${d}至第 ${p} 位。前后过渡逻辑已自动调整，衔接文案已更新。`,
  (t, d, p) => `结构变更：「${t}」${d}至第 ${p} 位。我重新组织了相关页面论证顺序，确保叙事连贯。`,
  (t, d) => `「${t}」${d}完成。检测到论证链条变化，已自动补充过渡段落并微调视觉节奏。`,
];

export const AI_CHAT = [
  "建议将「结论」提前到「实验结果」之前——'倒金字塔'结构更适合高管汇报，先亮结论再展开论证。你可以直接在左侧拖拽试试。",
  "当前叙事节奏：前半部分 3 页 vs 后半部分 5 页，比例合理。如果觉得开头太长，可以合并「开场」与「核心问题」为一个章节。",
  "「方法论」有 3 页内容偏密。建议拆成 '技术选型' 和 '实现路径' 两个子章节，听众更容易跟上。",
  "从听众视角看，先展示结果再解释方法可能更吸引注意力——试试拖动「实验结果」到「方法论」前面？",
  "当前版本的故事线逻辑清晰。如果想进一步打磨，可以考虑在「核心问题」后加一页 '解决方案概览' 作为过渡。",
];

export const VISUAL_INTENT_SUMMARY = "面向 AI Native 演示文稿编辑器的产品汇报，视觉要克制、专业、强调结构层与多模态素材的协作关系。";

export const VISUAL_CANVA_TEMPLATES = [
  visualItem("canva", 0, "淡雅产品汇报", "留白充足、标题稳重，适合产品方案开场。", ["产品", "克制", "留白"]),
  visualItem("canva", 1, "高管简报版式", "高密度信息区与大标题并重，适合决策层汇报。", ["高管", "简报", "结论"]),
  visualItem("canva", 2, "研究报告风格", "分栏清晰，适合承载方法论与实验说明。", ["研究", "方法论", "分栏"]),
  visualItem("canva", 3, "数据叙事模板", "图表区域突出，适合结果对比与指标展示。", ["数据", "对比", "指标"]),
  visualItem("canva", 4, "品牌提案样式", "强调视觉统一和章节节奏，适合方案路演。", ["品牌", "路演", "节奏"]),
  visualItem("canva", 5, "课堂展示结构", "字号清晰，页面层级适合教学演示。", ["课堂", "清晰", "结构"]),
  visualItem("canva", 6, "咨询报告网格", "模块化网格承载痛点、方法与建议。", ["咨询", "网格", "建议"]),
  visualItem("canva", 7, "案例复盘版式", "前后对比明显，适合展示流程变化。", ["案例", "复盘", "流程"]),
  visualItem("canva", 8, "轻量技术方案", "保留技术感但不过度装饰，适合架构解释。", ["技术", "架构", "轻量"]),
  visualItem("canva", 9, "发布会叙事页", "视觉节奏更强，适合产品亮点串联。", ["发布", "亮点", "叙事"]),
  visualItem("canva", 10, "团队项目汇报", "多段信息组织均衡，适合协作成果展示。", ["团队", "项目", "成果"]),
  visualItem("canva", 11, "里程碑路线图", "时间线感强，适合下一步计划和演进。", ["路线图", "计划", "演进"]),
  visualItem("canva", 12, "问题拆解模板", "适合把复杂问题拆成可扫描的层级。", ["痛点", "拆解", "层级"]),
  visualItem("canva", 13, "实验结论模板", "结论卡片突出，适合用户测试汇报。", ["实验", "结论", "卡片"]),
  visualItem("canva", 14, "市场机会画布", "适合趋势、机会和目标用户三段展开。", ["市场", "机会", "趋势"]),
  visualItem("canva", 15, "论文答辩简洁版", "结构稳、干扰少，适合学术型说明。", ["学术", "答辩", "稳重"]),
  visualItem("canva", 16, "竞品分析模板", "并列比较清楚，适合展示差异化。", ["竞品", "比较", "差异"]),
  visualItem("canva", 17, "闭环总结模板", "首尾呼应，适合结论与展望收束。", ["总结", "闭环", "展望"]),
];

export const VISUAL_AI_GENERATIONS = [
  visualItem("ai", 0, "智能工作流光栅", "模拟 AI 协作路径与素材流转，偏产品概念视觉。", ["AI", "工作流", "概念"]),
  visualItem("ai", 1, "结构树主视觉", "把故事线结构转成核心视觉符号，强调编辑骨架。", ["结构树", "故事线", "骨架"]),
  visualItem("ai", 2, "多模态素材墙", "适合展示文本、图片、图表在同一画布协作。", ["多模态", "素材", "画布"]),
  visualItem("ai", 3, "版本分叉地图", "用分支路径表达版本树和可回溯探索。", ["版本树", "分叉", "探索"]),
  visualItem("ai", 4, "演示编辑驾驶舱", "偏 SaaS 工具界面感，适合产品能力页。", ["SaaS", "界面", "工具"]),
  visualItem("ai", 5, "数据洞察卡组", "把指标、趋势和结论融合成一组视觉卡。", ["数据", "洞察", "卡组"]),
  visualItem("ai", 6, "意图识别热区", "突出用户意图输入与系统响应之间的映射。", ["意图", "响应", "热区"]),
  visualItem("ai", 7, "页面自适应网格", "强调布局重排与内容自动适配。", ["布局", "自适应", "网格"]),
  visualItem("ai", 8, "协作代理面板", "呈现 AI 精修代理与用户选择协同。", ["代理", "协作", "精修"]),
  visualItem("ai", 9, "叙事节奏波形", "以节奏曲线展示章节强弱和转场。", ["叙事", "节奏", "转场"]),
  visualItem("ai", 10, "实验结果仪表盘", "强调效率提升、满意度和对比数据。", ["实验", "仪表盘", "指标"]),
  visualItem("ai", 11, "产品路线星图", "适合下一步规划与能力演进展示。", ["路线", "规划", "演进"]),
  visualItem("ai", 12, "上下文理解网络", "突出章节上下文如何影响 AI 输出。", ["上下文", "网络", "理解"]),
  visualItem("ai", 13, "汇报结论聚焦", "大结论视觉压强更强，适合高管汇报。", ["结论", "高管", "聚焦"]),
  visualItem("ai", 14, "流程重构蓝图", "适合解释从传统 PPT 到 AI Native 的迁移。", ["流程", "蓝图", "迁移"]),
  visualItem("ai", 15, "内容生产流水线", "强调生成、编辑、精修一体化链路。", ["生产", "链路", "一体化"]),
  visualItem("ai", 16, "选择提案矩阵", "适合展示候选方案和采纳反馈。", ["提案", "选择", "反馈"]),
  visualItem("ai", 17, "演示前体检雷达", "适合表达结构风险检测与自动建议。", ["体检", "风险", "建议"]),
];

export const MOCK_STORYLINE_DRAFTS = [
  {
    id: "product-workflow",
    match: ["产品", "AI", "工作流", "SaaS", "界面", "协作", "多模态", "结构"],
    sections: [
      {
        id: "s1",
        title: "产品定位",
        sub: "AI Native 演示文稿编辑器",
        pages: [
          page("prod-s1p1", "StoryFlow：从结构开始生成 PPT", "面向产品汇报场景，先确定叙事骨架，再让 AI 补齐页面表达。"),
          page("prod-s1p2", "用户真正缺的是结构协作", "传统工具偏逐页编辑，AI 工具偏一次性生成，二者都难以持续响应用户意图。"),
        ],
      },
      {
        id: "s2",
        title: "核心能力",
        sub: "故事线、素材与 AI 精修联动",
        pages: [
          page("prod-s2p1", "三层协作模型", "故事线负责方向，页面负责呈现，AI 精修负责把局部意图落到可用稿。"),
          page("prod-s2p2", "多模态素材进入同一画布", "文本、图片、图表与版本记录共同构成可追踪的演示资产。"),
        ],
      },
      {
        id: "s3",
        title: "工作流闭环",
        sub: "从主视觉到结构编辑",
        pages: [
          page("prod-s3p1", "先选主视觉，再生成初稿", "视觉意图决定初始色板、页面密度和叙事口径，避免后续反复返工。"),
          page("prod-s3p2", "结构调整实时影响 PPT", "拖拽章节、切换页面、恢复版本时，预览内容保持和故事线同步。"),
        ],
      },
      {
        id: "s4",
        title: "落地价值",
        sub: "更短路径与更稳定质量",
        pages: [
          page("prod-s4p1", "把汇报制作变成可迭代系统", "用户不再从空白页开始，而是在明确意图和版本树中持续推进。"),
          page("prod-s4p2", "下一步：布局自适应", "让页面内容随结构变化自动重排，降低从初稿到可讲版本的成本。"),
        ],
      },
    ],
  },
  {
    id: "executive-data",
    match: ["高管", "简报", "结论", "数据", "指标", "洞察", "仪表盘", "对比"],
    sections: [
      {
        id: "s1",
        title: "一句话结论",
        sub: "先给决策层判断",
        pages: [
          page("exec-s1p1", "AI Native PPT 已具备产品化窗口", "结构编辑、版本回溯与局部精修形成完整闭环，适合进入场景验证。"),
          page("exec-s1p2", "关键机会来自工作流重构", "价值不在单页生成，而在把汇报制作变成可控、可追踪、可复用的流程。"),
        ],
      },
      {
        id: "s2",
        title: "业务痛点",
        sub: "效率与质量同时受限",
        pages: [
          page("exec-s2p1", "当前制作链路存在三类损耗", "需求转译、页面返工、版本分叉让团队难以稳定复用高质量表达。"),
        ],
      },
      {
        id: "s3",
        title: "验证指标",
        sub: "用数据说明改进空间",
        pages: [
          page("exec-s3p1", "结构调整效率提升 68%", "用户在章节重排、口径收敛和页面检查上花费的时间显著下降。"),
          page("exec-s3p2", "满意度稳定在 4.6 / 5", "参与者认为故事线优先的交互比直接生成整套 PPT 更容易掌控。"),
        ],
      },
      {
        id: "s4",
        title: "推进建议",
        sub: "小范围试点到能力扩展",
        pages: [
          page("exec-s4p1", "先锁定产品汇报与课程展示", "这两类场景结构明确、反馈周期短，适合验证主视觉和布局自适应能力。"),
          page("exec-s4p2", "用版本树沉淀组织表达资产", "把每次结构修改记录为可回溯节点，逐步形成团队级汇报模板库。"),
        ],
      },
    ],
  },
  {
    id: "research-method",
    match: ["研究", "方法论", "实验", "学术", "答辩", "分栏", "结论"],
    sections: [
      {
        id: "s1",
        title: "研究背景",
        sub: "生成式 AI 与演示文稿创作",
        pages: [
          page("res-s1p1", "从页面生成到结构协同", "研究关注 AI 如何在演示文稿制作中保持用户意图和叙事连贯。"),
          page("res-s1p2", "现有工具缺少中间层", "直接生成整套 PPT 难以解释和调整，逐页编辑又无法发挥 AI 的规划能力。"),
        ],
      },
      {
        id: "s2",
        title: "方法设计",
        sub: "故事线驱动的交互框架",
        pages: [
          page("res-s2p1", "结构层作为核心操作对象", "用户先编辑章节、顺序和页面数量，再让系统同步生成页面草稿。"),
          page("res-s2p2", "版本树记录意图演化", "每次结构变化都保留快照，支持回退、分叉和对比不同叙事路径。"),
        ],
      },
      {
        id: "s3",
        title: "实验观察",
        sub: "可控性与效率评估",
        pages: [
          page("res-s3p1", "参与者更愿意先改结构", "相比直接修改单页，结构层操作更容易表达“想讲什么”和“先后顺序”。"),
          page("res-s3p2", "AI 精修适合局部闭环", "在用户框选区域后，系统能更准确地给出标题、正文或视觉建议。"),
        ],
      },
      {
        id: "s4",
        title: "结论与展望",
        sub: "向自适应布局扩展",
        pages: [
          page("res-s4p1", "故事线是 AI Native PPT 的稳定入口", "它让生成、编辑与版本管理围绕同一个结构对象运行。"),
          page("res-s4p2", "后续关注布局自动重排", "当章节和页面内容变化时，版式需要自动保持视觉秩序与阅读节奏。"),
        ],
      },
    ],
  },
];

const normalize = (text) => String(text || "").toLowerCase();
const tokenize = (text) => normalize(text).split(/[\s,，。；;、：:·/|]+/u).filter(Boolean);
const visualTerms = (item) => [...item.tags, ...tokenize(`${item.title} ${item.style}`)].filter((term) => term.length > 1);

function visualScore(item, intent) {
  const text = normalize(intent);
  const tokens = tokenize(intent);
  if (!text && !tokens.length) return 0;

  return visualTerms(item).reduce((sum, term) => {
    const key = normalize(term);
    if (!key) return sum;
    const direct = text.includes(key) ? 4 : 0;
    const partial = tokens.some((token) => key.includes(token) || token.includes(key)) ? 2 : 0;
    return sum + direct + partial;
  }, 0);
}

export function rankVisualCandidates(candidates, intent) {
  return candidates
    .map((item, index) => ({ item, index, score: visualScore(item, intent) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item }) => item);
}

export function visualRecommendationReason(visual, intent) {
  if (!visual) return "选择一个模板后查看推荐理由。";
  const text = normalize(intent);
  const matched = visual.tags.filter((tag) => text.includes(normalize(tag))).slice(0, 3);
  const terms = matched.length ? matched : visual.tags.slice(0, 3);
  return `匹配：${terms.join("、")}。适合把「${visual.title}」作为初稿的视觉基调。`;
}

export function selectMockDraftForVisual(visual) {
  if (!visual) return cloneSections(INIT);
  const haystack = normalize(`${visual.title} ${visual.style} ${(visual.tags || []).join(" ")}`);
  const ranked = MOCK_STORYLINE_DRAFTS
    .map((draft, index) => ({
      draft,
      index,
      score: draft.match.reduce((sum, term) => sum + (haystack.includes(normalize(term)) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  return cloneSections(ranked[0]?.draft.sections || INIT);
}

export function applyVisualToSections(visual, sections = INIT) {
  const next = visual ? selectMockDraftForVisual(visual) : cloneSections(sections);
  const base = palettes.find((p) => p.c === visual?.c) || palettes[0];
  const allPalettes = [
    { c: visual?.c || base.c, bg: visual?.bg || base.bg, bd: visual?.bd || base.bd },
    { c: visual?.accent || base.accent, bg: "#FBEAF0", bd: "#F4C0D1" },
    ...palettes.filter((p) => p.c !== visual?.c),
  ];

  return next.map((section, index) => {
    const palette = allPalettes[index % allPalettes.length];
    return {
      ...section,
      c: palette.c,
      bg: palette.bg,
      bd: palette.bd,
      pages: section.pages.map((p, pageIndex) => ({
        ...p,
        b: pageIndex === 0 ? `${p.b}｜主视觉：${visual?.title || "淡雅产品汇报"}` : p.b,
      })),
    };
  });
}

export const cloneSections = (sections) => structuredClone(sections);

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
