const page = (id, h, b) => ({ id, h, b });

const VISUAL_IMAGES = [
  "/canva_data/Beige%20Minimalist%20Ad%20Campaign%20Creative%20Brief%20Presentation.png",
  "/canva_data/Beige%20Minimalist%20Ad%20Campaign%20Creative%20Brief%20Presentation%20(1).png",
  "/canva_data/Beige%20Minimalist%20Ad%20Campaign%20Creative%20Brief%20Presentation%20(2).png",
];

export const palettes = [
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

const EXECUTIVE_BRIEFING = [
  {
    id: "exec-s1",
    title: "先给结论",
    sub: "董事会关心的判断与取舍",
    c: "#7F77DD",
    bg: "#EEEDFE",
    bd: "#CECBF6",
    pages: [
      page("exec-s1p1", "结论：结构层决定 AI PPT 的可信度", "先明确业务判断：AI Native 编辑器必须先稳定叙事骨架，再让内容与视觉跟随变化。"),
      page("exec-s1p2", "本次汇报的三项决策", "是否进入 MVP、优先服务哪类高频汇报、以及版本树能力是否作为核心差异化。"),
    ],
  },
  {
    id: "exec-s2",
    title: "机会窗口",
    sub: "高频汇报场景正在重构",
    c: "#D4537E",
    bg: "#FBEAF0",
    bd: "#F4C0D1",
    pages: [
      page("exec-s2p1", "企业汇报进入 AI 协作阶段", "从单页生成转向结构协同，用户更关注能否快速改出一版可讲的故事线。"),
      page("exec-s2p2", "目标用户与切入点", "产品经理、咨询顾问、研究团队都需要把松散材料压缩成可演示的叙事顺序。"),
    ],
  },
  {
    id: "exec-s3",
    title: "核心方案",
    sub: "故事线优先的编辑闭环",
    c: "#1D9E75",
    bg: "#E1F5EE",
    bd: "#9FE1CB",
    pages: [
      page("exec-s3p1", "StoryFlow 工作台", "左侧结构、中央预览、右侧版本树同步变化，拖拽章节即触发 PPT 内容适配。"),
      page("exec-s3p2", "版本树降低试错成本", "每一次结构调整都保留快照，用户能从任意历史节点继续分叉探索。"),
    ],
  },
  {
    id: "exec-s4",
    title: "验证结果",
    sub: "效率、质量与可控性指标",
    c: "#378ADD",
    bg: "#E6F1FB",
    bd: "#B5D4F4",
    pages: [
      page("exec-s4p1", "结构调整效率提升 68%", "测试中用户平均用更少步骤完成章节重排、正文聚焦和汇报口径切换。"),
      page("exec-s4p2", "AI 输出更能解释变更", "系统不仅换顺序，还能说明前后章节为什么需要补充过渡内容。"),
    ],
  },
  {
    id: "exec-s5",
    title: "推进计划",
    sub: "两周 MVP 与风险控制",
    c: "#D85A30",
    bg: "#FAECE7",
    bd: "#F5C4B3",
    pages: [
      page("exec-s5p1", "先做结构影响闭环", "优先打通主视觉选择、结构拖拽、版本恢复三项体验，再扩展对话精修。"),
      page("exec-s5p2", "需要的资源与边界", "保持 mock 演示，不接真实 API；设计资产使用稳定公共路径，便于现场演示。"),
    ],
  },
];

const PRODUCT_ROADSHOW = [
  {
    id: "road-s1",
    title: "产品愿景",
    sub: "把 PPT 变成可协作的叙事画布",
    c: "#D4537E",
    bg: "#FBEAF0",
    bd: "#F4C0D1",
    pages: [
      page("road-s1p1", "StoryFlow：AI Native 演示文稿工作台", "面向频繁汇报的人群，把素材、故事线、版本探索放到同一个编辑体验里。"),
      page("road-s1p2", "不是再生成一份 PPT", "核心价值是让用户能持续调整结构，并看到 PPT 初稿实时跟随。"),
    ],
  },
  {
    id: "road-s2",
    title: "用户痛点",
    sub: "从灵感到可讲稿之间断裂",
    c: "#7F77DD",
    bg: "#EEEDFE",
    bd: "#CECBF6",
    pages: [
      page("road-s2p1", "三类断裂", "材料堆积、结构难改、AI 生成结果无法承接用户后续意图。"),
      page("road-s2p2", "现有工具的空白", "多数工具擅长单页美化，却缺少结构级编辑和变更后的内容适配。"),
    ],
  },
  {
    id: "road-s3",
    title: "核心能力",
    sub: "主视觉、故事线与精修代理",
    c: "#1D9E75",
    bg: "#E1F5EE",
    bd: "#9FE1CB",
    pages: [
      page("road-s3p1", "先选视觉方向，再生成故事线", "Canva 候选与 AI 生成候选共同决定初稿的色板、口径和页面内容。"),
      page("road-s3p2", "拖拽结构即改变内容", "章节重排后，相邻页会补齐承接与引出语，模拟真实 AI 对结构的理解。"),
      page("road-s3p3", "框选后进入 AI 精修", "用户可围绕标题、正文或素材区提出局部修改意图，并把结果写入版本树。"),
    ],
  },
  {
    id: "road-s4",
    title: "差异化",
    sub: "从页面工具升级为叙事系统",
    c: "#378ADD",
    bg: "#E6F1FB",
    bd: "#B5D4F4",
    pages: [
      page("road-s4p1", "结构层是产品护城河", "把章节、页面、版本、AI 对话都绑定在同一条故事线上，形成持续上下文。"),
      page("road-s4p2", "适配多类汇报场景", "高管简报强调先结论，产品路演强调价值闭环，课程汇报强调概念递进。"),
    ],
  },
  {
    id: "road-s5",
    title: "发布节奏",
    sub: "从 demo 到可试用版本",
    c: "#D85A30",
    bg: "#FAECE7",
    bd: "#F5C4B3",
    pages: [
      page("road-s5p1", "四步体验闭环", "意图对齐、主视觉选择、结构编辑、AI 精修构成首个可演示版本。"),
      page("road-s5p2", "下一步路线", "增加更多视觉 mock、结构影响模板和演示前的自动结构体检。"),
    ],
  },
];

const ACADEMIC_REPORT = [
  {
    id: "acad-s1",
    title: "研究问题",
    sub: "为什么需要结构驱动的 PPT 编辑",
    c: "#378ADD",
    bg: "#E6F1FB",
    bd: "#B5D4F4",
    pages: [
      page("acad-s1p1", "研究背景：生成式 AI 与演示文稿生产", "现有研究多关注内容生成质量，较少讨论用户如何在结构层持续控制 AI 输出。"),
      page("acad-s1p2", "核心问题", "当用户移动章节或调整叙事顺序时，系统如何保持页面内容、过渡关系与版本历史的一致性。"),
    ],
  },
  {
    id: "acad-s2",
    title: "相关工作",
    sub: "文档生成、人机协作与版本管理",
    c: "#7F77DD",
    bg: "#EEEDFE",
    bd: "#CECBF6",
    pages: [
      page("acad-s2p1", "三条研究脉络", "自动化内容生成、交互式编辑系统、以及面向创作任务的版本回溯机制。"),
      page("acad-s2p2", "研究空白", "多数系统没有把结构调整视为会影响页面语义的编辑行为。"),
    ],
  },
  {
    id: "acad-s3",
    title: "系统设计",
    sub: "StoryFlow 的结构层模型",
    c: "#1D9E75",
    bg: "#E1F5EE",
    bd: "#9FE1CB",
    pages: [
      page("acad-s3p1", "章节到页面的冻结模型", "section 包含标题、副标题、色板和 pages，所有 mock 变化都保持同一数据契约。"),
      page("acad-s3p2", "结构影响模拟", "拖拽后不仅重排数组，还修改章节定位与相邻页面正文，展示语义联动。"),
      page("acad-s3p3", "快照式版本树", "restore 使用深拷贝快照，确保历史版本包含用户编辑后的真实页面内容。"),
    ],
  },
  {
    id: "acad-s4",
    title: "实验与观察",
    sub: "原型测试中的行为变化",
    c: "#D4537E",
    bg: "#FBEAF0",
    bd: "#F4C0D1",
    pages: [
      page("acad-s4p1", "任务设置", "参与者需要完成主视觉选择、章节重排、版本恢复和局部精修四类操作。"),
      page("acad-s4p2", "关键观察", "当正文能体现结构变化时，用户更容易相信 AI 理解了自己的编辑意图。"),
    ],
  },
  {
    id: "acad-s5",
    title: "结论",
    sub: "结构层作为 AI Native 编辑的基础",
    c: "#D85A30",
    bg: "#FAECE7",
    bd: "#F5C4B3",
    pages: [
      page("acad-s5p1", "主要结论", "结构层让 AI 生成从一次性输出转向可解释、可回溯、可继续编辑的协作过程。"),
      page("acad-s5p2", "后续工作", "进一步扩展结构影响模板，并引入更真实的素材与页面布局 mock。"),
    ],
  },
];

export const MOCK_STORYLINE_DRAFTS = [
  { id: "executive", label: "高管汇报", keywords: ["高管", "简报", "结论", "决策", "咨询", "指标", "董事会"], sections: EXECUTIVE_BRIEFING },
  { id: "roadshow", label: "产品路演", keywords: ["产品", "路演", "发布", "品牌", "路线", "规划", "SaaS", "亮点"], sections: PRODUCT_ROADSHOW },
  { id: "academic", label: "学术课程", keywords: ["学术", "课程", "课堂", "研究", "论文", "答辩", "实验", "方法论"], sections: ACADEMIC_REPORT },
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

export const REFINE_IMAGE_CANDIDATES = [
  {
    id: "workflow-cards",
    title: "多模态卡片墙",
    image: VISUAL_IMAGES[0],
    tint: "#EEEDFE",
    accent: "#7F77DD",
  },
  {
    id: "data-dashboard",
    title: "数据洞察看板",
    image: VISUAL_IMAGES[1],
    tint: "#E6F1FB",
    accent: "#378ADD",
  },
  {
    id: "structure-map",
    title: "故事线结构图",
    image: VISUAL_IMAGES[2],
    tint: "#E1F5EE",
    accent: "#1D9E75",
  },
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

export function applyVisualToSections(visual, sections = INIT) {
  // 始终沿用意图对齐阶段确定的故事线，只在其上叠加所选主视觉的配色与标注，
  // 不再按模板标签重新匹配草稿，避免覆盖用户已对齐的结构。
  const next = cloneSections(sections);
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

const cleanStructuralNote = (text) => String(text || "").replace(/｜结构调整：[^｜]+/gu, "");

const roleForIndex = (index, total) => {
  if (index === 0) return "先给判断的开场定位";
  if (index === total - 1) return "收束前文并给出行动方向";
  return `承接第 ${index} 章并引出第 ${index + 2} 章`;
};

export function applyStorylineStructuralImpact(sections, moveMeta = {}) {
  const next = cloneSections(sections);
  const movedIndex = typeof moveMeta.to === "number" ? moveMeta.to : next.findIndex((s) => s.id === moveMeta.movedId);
  if (movedIndex < 0 || !next[movedIndex]) return next;

  const moved = next[movedIndex];
  const prev = next[movedIndex - 1];
  const following = next[movedIndex + 1];
  const dirText = moveMeta.direction || (moveMeta.to < moveMeta.from ? "前移" : "后移");

  moved.sub = `${roleForIndex(movedIndex, next.length)} · ${dirText}后的新叙事定位`;
  if (moved.pages?.[0]) {
    const prevText = prev ? `承接「${prev.title}」` : "作为开场先建立判断";
    const nextText = following ? `引出「${following.title}」` : "收束为下一步行动";
    moved.pages[0].b = `${cleanStructuralNote(moved.pages[0].b)}｜结构调整：${prevText}，并${nextText}。`;
  }

  if (prev?.pages?.[0]) {
    prev.pages[0].b = `${cleanStructuralNote(prev.pages[0].b)}｜结构调整：下一章改为「${moved.title}」，因此本页结尾强化过渡钩子。`;
  }

  if (following?.pages?.[0]) {
    following.pages[0].b = `${cleanStructuralNote(following.pages[0].b)}｜结构调整：现在从「${moved.title}」进入本章，开头补充新的论证承接。`;
  }

  return next;
}

export const cloneSections = (sections) => structuredClone(sections);

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
