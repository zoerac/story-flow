# StoryFlow Demo

StoryFlow Demo 是一个以“叙事结构层”为主编辑面的 AI Native 演示文稿编辑器原型。

它把传统幻灯片列表改造成可拖拽的故事线：用户调整章节与子页顺序后，预览、AI 对话和版本树会同步响应。当前项目用于课程/演示场景，重点展示结构驱动编辑、版本回溯分叉、框选提案和对话聚焦等交互。

## 技术栈

- Vite
- React
- lucide-react
- JavaScript
- CSS variables + inline styles

## 快速开始

```bash
npm install
npm run dev
```

默认开发地址：

```text
http://127.0.0.1:5173/
```

常用检查：

```bash
npm run build
npm run lint
```

## 目录结构

```text
src/
  App.jsx                         # 外壳、三栏布局、集成插槽
  main.jsx                        # React 入口
  components/
    StorylinePanel.jsx            # 故事线、章节/子页结构
    SlidePreview.jsx              # 幻灯片预览与框选提案入口
    ChatPanel.jsx                 # AI 对话与拖入聚焦
    VersionTree.jsx               # 版本树
    Toolbar.jsx                   # 顶栏与面板开关
  data/
    mock.js                       # 初始章节、页面与 AI mock 文案
    focus.js                      # 聚焦分析 mock（AI 线合并后）
    proposals.js                  # 框选提案 mock（AI 线合并后）
  hooks/
    useStoryflow.js               # 共享状态与版本提交 API
  styles/
    tokens.css                    # 主题变量
```

## 核心数据模型

章节数据统一使用 `pages[]` 表示页：

```js
{
  id: "s1",
  title: "开场与背景",
  sub: "行业趋势与市场机会",
  c: "#7F77DD",
  bg: "#EEEDFE",
  bd: "#CECBF6",
  pages: [
    { id: "s1p1", h: "页标题", b: "页正文" },
  ],
}
```

章节页数由 `pages.length` 决定，不再使用 `slides` 计数字段。

## 共享状态 API

`useStoryflow()` 是结构线与 AI 交互线共享的契约：

```js
{
  secs, setSecs,
  vers, curV,
  sel, setSel,
  selPage, setSelPage,
  dragI,
  focusedSection, setFocusedSection,
  msgs, addMsg,
  onDrop, restore, send,
  commitVersion,
}
```

`commitVersion(label, nextSecs)` 是写入版本树的统一入口；结构拖拽、子页重排、框选提案批准都应通过它生成快照。

## 已实现功能

- 章节级拖拽重排
- 章节展开/收起与子页列表
- 子页拖拽重排
- 幻灯片预览与页指示
- AI mock 对话
- 拖章节到对话区聚焦分析（AI 线）
- 框选幻灯片区域生成提案并批准入版本树（AI 线）
- 版本树记录、回溯与分叉
- 左右面板收起与拖拽调整宽度

## 协作约定

- AI 文案全部使用 mock 数据，不接真实 API。
- 不提交 `node_modules/`、`dist/`、日志文件等产物。
- 结构与布局文件、AI 交互文件按任务说明分属不同开发线。
- `useStoryflow()` 的公开 API 已冻结，新增能力应先对齐再改。

## 参考文件

- `storyflow-editor.jsx`：原始单文件原型
- `Git开发说明书.md`：分支、提交和合并规范
- `CODEX_任务_结构与布局线.md`：结构线任务说明
- `CLAUDECODE_任务_AI交互线.md`：AI 交互线任务说明
