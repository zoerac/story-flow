import { useRef, useState } from "react";
import { ArrowLeft, Check, Image, Minus, Plus, Sparkles } from "lucide-react";
import { ChatPanel } from "./components/ChatPanel";
import { Intro } from "./components/Intro";
import { StorylinePanel } from "./components/StorylinePanel";
import { Toolbar } from "./components/Toolbar";
import { VersionTree } from "./components/VersionTree";
import {
  VISUAL_AI_GENERATIONS,
  VISUAL_CANVA_TEMPLATES,
  VISUAL_INTENT_SUMMARY,
  applyVisualToSections,
  rankVisualCandidates,
} from "./data/mock";
import { useStoryflow } from "./hooks/useStoryflow";

function App() {
  const story = useStoryflow();
  const [showIntro, setShowIntro] = useState(true);
  const [view, setView] = useState("intent");
  const [transitioning, setTransitioning] = useState(false);
  const [layout, setLayout] = useState({
    leftW: 220,
    rightW: 190,
    leftOpen: true,
    rightOpen: true,
  });
  const shellRef = useRef(null);
  const currentStage = showIntro ? "intent" : view === "visual" ? "visual" : view === "refine" ? "refine" : "structure";

  const setStageView = (stage) => {
    setTransitioning(true);
    setTimeout(() => setTransitioning(false), 700);
    setShowIntro(stage === "intent");
    setView(stage === "intent" ? "intent" : stage === "structure" ? "edit" : stage);
  };

  const handleStageJump = (targetStage) => {
    if (!targetStage || targetStage === currentStage) return;

    // 纯步骤切换只切换视图，不写入版本树（仅内容改动才生成版本节点）
    setStageView(targetStage);
  };

  const handleRestore = (vid) => {
    const version = story.vers.find((v) => v.id === vid);
    story.restore(vid);
    setStageView(version?.stage || "structure");
  };

  const commitStructureVersion = (label, nextSecs) => {
    story.commitVersion(label, nextSecs, { stage: "structure", kind: "edit" });
  };

  const commitRefineVersion = (label, nextSecs) => {
    story.commitVersion(label, nextSecs, { stage: "refine", kind: "refine" });
  };

  const setLeftOpen = (next) => {
    setLayout((prev) => ({ ...prev, leftOpen: typeof next === "function" ? next(prev.leftOpen) : next }));
  };

  const setRightOpen = (next) => {
    setLayout((prev) => ({ ...prev, rightOpen: typeof next === "function" ? next(prev.rightOpen) : next }));
  };

  const startResize = (side) => (e) => {
    e.preventDefault();
    const rect = shellRef.current?.getBoundingClientRect();
    if (!rect) return;

    const onMove = (moveEvent) => {
      setLayout((prev) => {
        const raw = side === "left" ? moveEvent.clientX - rect.left : rect.right - moveEvent.clientX;
        const nextW = Math.min(320, Math.max(160, raw));
        return side === "left" ? { ...prev, leftW: nextW } : { ...prev, rightW: nextW };
      });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, boxSizing: "border-box" }}>
      <div ref={shellRef} style={S.shell}>
        {/* SLOT:toolbar */}
        <Toolbar
          leftOpen={layout.leftOpen}
          rightOpen={layout.rightOpen}
          setLeftOpen={setLeftOpen}
          setRightOpen={setRightOpen}
          activeStage={currentStage}
          onStageJump={handleStageJump}
          onOpenRefine={() => handleStageJump("refine")}
        />
        <ThinkingBar visible={transitioning} />
        {/* SLOT:intro */}
        {showIntro && view === "intent" && (
          <Intro
            onDone={() => handleStageJump("visual")}
          />
        )}
        {view === "refine" ? (
          <div key="refine" className="anim-fade-up" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <AIRefinePage
              secs={story.secs}
              sel={story.sel}
              selPage={story.selPage}
              rightOpen={layout.rightOpen}
              vers={story.vers}
              curV={story.curV}
              restore={handleRestore}
              commitVersion={commitRefineVersion}
              addMsg={story.addMsg}
              onBack={() => handleStageJump("structure")}
            />
          </div>
        ) : view === "visual" ? (
          <div key="visual" className="anim-fade-up" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <VisualSelectionPage
              onGenerate={(visual) => {
                const nextSecs = applyVisualToSections(visual, story.secs);
                story.commitVersion(`主视觉：${visual.title}`, nextSecs, {
                  stage: "structure",
                  kind: "edit",
                  fromStage: "visual",
                  toStage: "structure",
                });
                story.setSel(0);
                story.setSelPage(0);
                story.addMsg("sys", `已选择主视觉「${visual.title}」，并生成结构编辑初稿。`);
                setStageView("structure");
              }}
            />
          </div>
        ) : (
          <div
            key="structure"
            className="anim-fade-up"
            style={{
              ...S.root,
              gridTemplateColumns: `${layout.leftOpen ? layout.leftW : 0}px ${layout.leftOpen ? 4 : 0}px minmax(0,1fr) ${layout.rightOpen ? 4 : 0}px ${layout.rightOpen ? layout.rightW : 0}px`,
            }}
          >
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              {layout.leftOpen && (
                <StorylinePanel
                  secs={story.secs}
                  sel={story.sel}
                  setSel={story.setSel}
                  selPage={story.selPage}
                  setSelPage={story.setSelPage}
                  dragI={story.dragI}
                  setDragI={story.setDragI}
                  overI={story.overI}
                  setOverI={story.setOverI}
                  onDrop={story.onDrop}
                  commitVersion={commitStructureVersion}
                />
              )}
            </div>
            <ResizeBar hidden={!layout.leftOpen} onMouseDown={startResize("left")} />
            <div style={S.col}>
              <StructureSlidePreview
                secs={story.secs}
                sel={story.sel}
                setSel={story.setSel}
                selPage={story.selPage}
                setSelPage={story.setSelPage}
              />
              <ChatPanel
                msgs={story.msgs}
                send={story.send}
                thinking={story.thinking}
                chatEnd={story.chatEnd}
              />
            </div>
            <ResizeBar hidden={!layout.rightOpen} onMouseDown={startResize("right")} />
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              {layout.rightOpen && <VersionTree vers={story.vers} curV={story.curV} restore={handleRestore} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  shell: {
    width: "min(100%, 980px)",
    height: "calc(100vh - 48px)",
    minHeight: 480,
    display: "flex",
    flexDirection: "column",
    borderRadius: 12,
    overflow: "hidden",
    border: "0.5px solid var(--color-border-tertiary)",
    background: "var(--color-background-primary)",
    boxShadow: "0 14px 40px rgba(26, 25, 21, 0.08)",
    fontSize: 13,
    lineHeight: 1.5,
    color: "var(--color-text-primary)",
  },
  root: {
    display: "grid",
    flex: 1,
    minHeight: 0,
    background: "var(--color-background-primary)",
  },
  visualRoot: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    background: "var(--color-background-tertiary)",
  },
  visualHeader: {
    padding: "14px 16px",
    background: "var(--color-background-primary)",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) 260px",
    gap: 12,
    alignItems: "stretch",
    flexShrink: 0,
  },
  visualInput: {
    width: "100%",
    minHeight: 78,
    resize: "none",
    borderRadius: 8,
    border: "1px solid var(--color-border-tertiary)",
    background: "var(--color-background-secondary)",
    color: "var(--color-text-primary)",
    padding: "9px 10px",
    fontSize: 12,
    lineHeight: 1.55,
    outline: "none",
  },
  visualControls: {
    display: "grid",
    gap: 10,
    alignContent: "space-between",
  },
  visualMode: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 4,
    padding: 4,
    borderRadius: 8,
    border: "1px solid var(--color-border-tertiary)",
    background: "var(--color-background-secondary)",
  },
  visualModeBtn: {
    height: 30,
    border: 0,
    borderRadius: 6,
    fontSize: 11,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  generateBtn: {
    height: 34,
    border: 0,
    borderRadius: 7,
    background: "#7F77DD",
    color: "#fff",
    fontSize: 12,
    fontWeight: 650,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    cursor: "pointer",
  },
  galleryScroll: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: 14,
  },
  sourceColumns: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
    gap: 14,
    minWidth: 0,
  },
  sourceHead: {
    height: 26,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 12,
    fontWeight: 650,
    color: "var(--color-text-primary)",
  },
  visualGridTwo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
  },
  visualGridFour: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
  },
  visualCard: {
    borderRadius: 8,
    border: "1px solid var(--color-border-tertiary)",
    background: "var(--color-background-primary)",
    padding: 8,
    display: "grid",
    gap: 7,
    textAlign: "left",
    cursor: "pointer",
  },
  visualThumb: {
    aspectRatio: "16/10",
    borderRadius: 6,
    overflow: "hidden",
    border: "1px solid var(--color-border-tertiary)",
    background: "var(--color-background-secondary)",
  },
  visualTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
  },
  visualTag: {
    minHeight: 18,
    borderRadius: 5,
    padding: "0 6px",
    display: "flex",
    alignItems: "center",
    fontSize: 9,
    color: "var(--color-text-tertiary)",
    background: "var(--color-background-secondary)",
  },
  col: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  previewWrap: {
    padding: "14px 16px",
    background: "var(--color-background-tertiary)",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
    flexShrink: 0,
    position: "relative",
  },
  slideCard: {
    background: "var(--color-background-primary)",
    borderRadius: 10,
    border: "0.5px solid var(--color-border-secondary)",
    padding: "18px 22px",
    maxWidth: 300,
    margin: "0 auto",
    aspectRatio: "16/10",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    overflow: "hidden",
  },
  refineRoot: {
    flex: 1,
    display: "grid",
    minHeight: 0,
    background: "var(--color-background-tertiary)",
  },
  refineWorkspace: {
    minWidth: 0,
    minHeight: 0,
    display: "grid",
    gridTemplateRows: "minmax(0,1fr) auto",
    gap: 10,
    padding: 12,
    overflow: "hidden",
  },
  refineSection: {
    minWidth: 0,
    borderRadius: 8,
    border: "1px solid var(--color-border-tertiary)",
    background: "var(--color-background-primary)",
    overflow: "hidden",
  },
  refineSectionHead: {
    minHeight: 36,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 12px",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
    fontSize: 12,
    fontWeight: 650,
  },
  refineOverviewGrid: {
    padding: "10px 12px",
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) auto",
    gap: 12,
    alignItems: "center",
  },
  pageStrip: {
    padding: 10,
    display: "flex",
    gap: 8,
    overflowX: "auto",
  },
  pageThumbBtn: {
    width: 116,
    minWidth: 116,
    padding: 8,
    borderRadius: 8,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
  },
  pageThumbSlide: {
    aspectRatio: "16/10",
    borderRadius: 5,
    border: "1px solid",
    padding: 8,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  refinePptSection: {
    minWidth: 0,
    minHeight: 0,
    borderRadius: 8,
    border: "1px solid var(--color-border-tertiary)",
    background: "var(--color-background-primary)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  refineLeftPanel: {
    minWidth: 0,
    background: "var(--color-background-primary)",
    borderRight: "0.5px solid var(--color-border-tertiary)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  refineLeftHead: {
    height: 44,
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
    fontSize: 12,
    fontWeight: 650,
    flexShrink: 0,
  },
  pageNumGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 7,
  },
  pageNumBtn: {
    width: 30,
    height: 30,
    padding: 0,
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 650,
    cursor: "pointer",
  },
  refineCanvasCol: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },
  refineTopbar: {
    height: 44,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 14px",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
    background: "var(--color-background-primary)",
    flexShrink: 0,
  },
  backBtn: {
    height: 28,
    borderRadius: 6,
    border: "1px solid var(--color-border-tertiary)",
    background: "var(--color-background-primary)",
    color: "var(--color-text-secondary)",
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "0 10px",
    fontSize: 11,
    cursor: "pointer",
  },
  zoomBtn: {
    width: 26,
    height: 26,
    padding: 0,
    borderRadius: 6,
    border: "1px solid var(--color-border-tertiary)",
    background: "var(--color-background-primary)",
    color: "var(--color-text-secondary)",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  },
  canvasViewport: {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    padding: 26,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  bigSlide: {
    width: 720,
    height: 450,
    position: "absolute",
    inset: 0,
    background: "var(--color-background-primary)",
    border: "1px solid var(--color-border-secondary)",
    boxShadow: "0 10px 28px rgba(26, 25, 21, 0.1)",
    padding: 44,
    cursor: "crosshair",
    overflow: "hidden",
    userSelect: "none",
  },
  visualBadge: {
    border: "1px solid",
    borderRadius: 8,
    padding: "8px 10px",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 650,
    whiteSpace: "nowrap",
  },
  slideBodyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 240px",
    gap: 30,
    alignItems: "stretch",
    marginTop: 42,
  },
  mockVisual: {
    minHeight: 170,
    border: "1px solid",
    borderRadius: 8,
    padding: 18,
    display: "grid",
    alignContent: "center",
    gap: 12,
  },
  barRow: {
    height: 14,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  bar: {
    display: "block",
    height: 9,
    borderRadius: 5,
  },
  agentPanel: {
    minWidth: 0,
    background: "var(--color-background-primary)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  agentHead: {
    height: 44,
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "0 14px",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
    fontSize: 12,
    fontWeight: 650,
  },
  segmented: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 4,
    padding: 4,
    borderRadius: 8,
    border: "1px solid var(--color-border-tertiary)",
    background: "var(--color-background-secondary)",
    flex: 1,
  },
  segmentBtn: {
    height: 28,
    border: 0,
    borderRadius: 6,
    fontSize: 11,
    cursor: "pointer",
  },
  agentBlock: {
    display: "grid",
    gap: 7,
  },
  agentLabel: {
    fontSize: 10,
    color: "var(--color-text-tertiary)",
  },
  chip: {
    minHeight: 28,
    borderRadius: 7,
    border: "1px solid #CECBF6",
    background: "#EEEDFE",
    color: "#3C3489",
    display: "flex",
    alignItems: "center",
    padding: "0 9px",
    fontSize: 11,
  },
  select: {
    width: "100%",
    minWidth: 0,
    borderRadius: 7,
    border: "1px solid var(--color-border-tertiary)",
    background: "var(--color-background-secondary)",
    color: "var(--color-text-primary)",
    padding: "7px 8px",
    fontSize: 11,
    outline: "none",
  },
  intentInput: {
    width: "100%",
    minHeight: 100,
    resize: "none",
    borderRadius: 7,
    border: "1px solid var(--color-border-tertiary)",
    background: "var(--color-background-secondary)",
    color: "var(--color-text-primary)",
    padding: "8px 9px",
    fontSize: 11,
    lineHeight: 1.5,
    outline: "none",
  },
  selectedMaterialBadge: {
    minHeight: 24,
    borderRadius: 7,
    border: "1px solid var(--color-border-tertiary)",
    padding: "0 9px",
    display: "flex",
    alignItems: "center",
    fontSize: 11,
    fontWeight: 650,
    whiteSpace: "nowrap",
  },
  intentSuggestion: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "var(--color-text-tertiary)",
    background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)",
    borderRadius: 7,
    padding: "3px 8px",
    fontSize: 11,
  },
  proposalCard: {
    borderRadius: 8,
    border: "1px solid #CECBF6",
    background: "#FAFAFF",
    padding: 10,
    display: "grid",
    gap: 8,
  },
  proposalImage: {
    aspectRatio: "16/10",
    borderRadius: 7,
    border: "1px solid var(--color-border-tertiary)",
    background: "var(--color-background-primary)",
    overflow: "hidden",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  approveBtn: {
    height: 28,
    border: 0,
    borderRadius: 7,
    background: "#7F77DD",
    color: "#fff",
    fontSize: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    cursor: "pointer",
  },
  rejectBtn: {
    flex: 1,
    height: 28,
    borderRadius: 7,
    border: "1px solid var(--color-border-tertiary)",
    background: "var(--color-background-primary)",
    color: "var(--color-text-secondary)",
    fontSize: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    cursor: "pointer",
  },
};

function VisualSelectionPage({ onGenerate }) {
  const [intent, setIntent] = useState(VISUAL_INTENT_SUMMARY);
  const [mode, setMode] = useState("all");
  const rankedCanva = rankVisualCandidates(VISUAL_CANVA_TEMPLATES, intent);
  const rankedAi = rankVisualCandidates(VISUAL_AI_GENERATIONS, intent);
  const [selectedId, setSelectedId] = useState(rankedCanva[0]?.id);
  const selected = [...rankedCanva, ...rankedAi].find((item) => item.id === selectedId) || rankedCanva[0] || rankedAi[0];

  return (
    <div style={S.visualRoot}>
      <div style={S.visualHeader}>
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          style={S.visualInput}
          placeholder="输入主视觉偏好，例如：更像高管汇报、强调数据对比、保留 AI 工作流概念感。"
        />
        <div style={S.visualControls}>
          <div style={S.visualMode}>
            {[
              ["all", "都看"],
              ["canva", "Canva"],
              ["ai", "AI生成"],
            ].map(([id, label]) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  style={{
                    ...S.visualModeBtn,
                    background: active ? "#EEEDFE" : "transparent",
                    color: active ? "#3C3489" : "var(--color-text-secondary)",
                    fontWeight: active ? 650 : 500,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => selected && onGenerate(selected)} style={S.generateBtn}>
            <Sparkles size={14} /> 生成故事线与 PPT
          </button>
        </div>
      </div>
      <div style={S.galleryScroll}>
        {mode === "all" ? (
          <div style={S.sourceColumns}>
            <VisualSourceColumn title="Canva 模板" items={rankedCanva} selectedId={selectedId} onSelect={setSelectedId} />
            <VisualSourceColumn title="AI 生成" items={rankedAi} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
        ) : (
          <div>
            <div style={S.sourceHead}>{mode === "canva" ? "Canva 模板" : "AI 生成"}</div>
            <div style={S.visualGridFour}>
              {(mode === "canva" ? rankedCanva : rankedAi).map((item, i) => (
                <VisualCandidateCard key={item.id} item={item} active={item.id === selectedId} onSelect={() => setSelectedId(item.id)} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VisualSourceColumn({ title, items, selectedId, onSelect }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={S.sourceHead}>
        <span>{title}</span>
        <span style={{ fontSize: 10, fontWeight: 500, color: "var(--color-text-tertiary)" }}>{items.length} 个候选</span>
      </div>
      <div style={S.visualGridTwo}>
        {items.map((item, i) => (
          <VisualCandidateCard key={item.id} item={item} active={item.id === selectedId} onSelect={() => onSelect(item.id)} index={i} />
        ))}
      </div>
    </div>
  );
}

function VisualCandidateCard({ item, active, onSelect, index = 0 }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="anim-fade-up"
      style={{
        animationDelay: `${Math.min(index * 40, 240)}ms`,
        ...S.visualCard,
        borderColor: active ? item.bd : "var(--color-border-tertiary)",
        background: active ? item.bg : "var(--color-background-primary)",
        boxShadow: active ? `0 0 0 1px ${item.bd}` : "none",
      }}
    >
      <div style={S.visualThumb}>
        <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 650, color: active ? item.c : "var(--color-text-primary)", lineHeight: 1.3 }}>{item.title}</div>
        <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", lineHeight: 1.45, marginTop: 2 }}>{item.style}</div>
      </div>
      <div style={S.visualTags}>
        {item.tags.slice(0, 3).map((tag) => (
          <span key={tag} style={S.visualTag}>{tag}</span>
        ))}
      </div>
    </button>
  );
}

function StructureSlidePreview({ secs, sel, setSel, selPage, setSelPage }) {
  const curSec = secs[sel];
  const curPage = curSec?.pages[selPage] || curSec?.pages[0];

  return (
    <div style={S.previewWrap}>
      <div style={S.slideCard}>
        <div style={{ width: 28, height: 3, borderRadius: 2, background: curSec?.c, marginBottom: 10 }} />
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 5 }}>{curPage?.h}</div>
        <div style={{ fontSize: 10, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{curPage?.b}</div>
        <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
          {curSec?.pages.map((page, j) => (
            <button
              key={page.id}
              type="button"
              onClick={() => setSelPage(j)}
              aria-label={`选择第 ${j + 1} 页`}
              style={{
                flex: 1,
                height: 4,
                minWidth: 0,
                padding: 0,
                borderRadius: 2,
                background: j === selPage ? curSec.c : curSec.bg,
                border: `0.5px solid ${curSec.bd}`,
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 10 }}>
        {secs.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setSel(i);
              setSelPage(0);
            }}
            aria-label={`选择章节 ${s.title}`}
            style={{
              width: i === sel ? 20 : 6,
              height: 6,
              padding: 0,
              borderRadius: 3,
              border: 0,
              background: i === sel ? s.c : "var(--color-border-secondary)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function AIRefinePage({ secs, sel, selPage, rightOpen, vers, curV, restore, commitVersion, addMsg, onBack }) {
  const [zoom, setZoom] = useState(1);
  const [dragStart, setDragStart] = useState(null);
  const [selRect, setSelRect] = useState(null);
  const [intent, setIntent] = useState("");
  const [rightTab, setRightTab] = useState("proposals");
  const [visualRevision, setVisualRevision] = useState(0);
  const canvasRef = useRef(null);
  const curSec = secs[sel];
  const curPage = curSec?.pages[selPage] || curSec?.pages[0];
  const region = classifyRegion(selRect);
  const selectedMaterialCount = countSelectedMaterials(selRect);
  const suggestedIntent = buildSuggestedIntent(region, selectedMaterialCount);
  const proposals = buildRefineProposals(intent, region, selPage, curPage, curSec);

  const setZoomClamped = (next) => setZoom((prev) => Math.min(1.8, Math.max(0.6, typeof next === "function" ? next(prev) : next)));

  const pointFromEvent = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.max(0, Math.min((e.clientX - rect.left) / zoom, 720)),
      y: Math.max(0, Math.min((e.clientY - rect.top) / zoom, 450)),
    };
  };

  const onMouseDown = (e) => {
    const point = pointFromEvent(e);
    if (!point) return;
    setDragStart(point);
    setSelRect({ x: point.x, y: point.y, w: 0, h: 0 });
  };

  const onMouseMove = (e) => {
    if (!dragStart) return;
    const point = pointFromEvent(e);
    if (!point) return;
    setSelRect({
      x: Math.min(dragStart.x, point.x),
      y: Math.min(dragStart.y, point.y),
      w: Math.abs(point.x - dragStart.x),
      h: Math.abs(point.y - dragStart.y),
    });
  };

  const onMouseUp = () => {
    if (selRect && selRect.w * selRect.h < 500) setSelRect(null);
    setDragStart(null);
  };

  const approveProposal = (proposal) => {
    if (!proposal || !curSec || !curPage) return;
    const nextSecs = structuredClone(secs);
    const nextPage = nextSecs[sel].pages[selPage];

    if (proposal.kind === "title") {
      nextPage.h = proposal.nextTitle;
    } else if (proposal.kind === "body") {
      nextPage.b = proposal.nextBody;
    } else {
      nextPage.b = `${curPage.b}｜${proposal.note}`;
      setVisualRevision((v) => v + 1);
    }

    commitVersion(`AI精修·方案${proposal.index}`, nextSecs);
    addMsg("sys", `AI精修方案${proposal.index}已应用到「${curPage.h}」，并纳入版本树。`);
    setSelRect(null);
    setRightTab("versions");
  };

  return (
    <div
      style={{
        ...S.refineRoot,
        gridTemplateColumns: `minmax(0,1fr) ${rightOpen ? "276px" : "0px"}`,
      }}
    >
      <div style={S.refineWorkspace}>
        <section style={S.refinePptSection}>
          <div style={S.refineSectionHead}>
            <span>PPT</span>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <button type="button" onClick={onBack} style={S.backBtn}>
                <ArrowLeft size={14} /> 返回结构编辑
              </button>
              <button type="button" onClick={() => setZoomClamped((v) => v - 0.1)} style={S.zoomBtn} aria-label="缩小">
                <Minus size={14} />
              </button>
              <span style={{ width: 42, textAlign: "center", fontSize: 11, color: "var(--color-text-secondary)" }}>{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoomClamped((v) => v + 0.1)} style={S.zoomBtn} aria-label="放大">
                <Plus size={14} />
              </button>
            </div>
          </div>
          <div style={S.canvasViewport}>
            <div style={{ width: 720 * zoom, height: 450 * zoom, position: "relative", flexShrink: 0 }}>
              <div
                ref={canvasRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                style={{
                  ...S.bigSlide,
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  borderColor: curSec?.bd,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24 }}>
                  <div>
                    <div style={{ width: 64, height: 6, borderRadius: 3, background: curSec?.c, marginBottom: 18 }} />
                    <div style={{ fontSize: 30, fontWeight: 650, lineHeight: 1.18, maxWidth: 430 }}>{curPage?.h}</div>
                    <div style={{ fontSize: 14, color: "var(--color-text-tertiary)", marginTop: 10 }}>{curSec?.title} · {curSec?.sub}</div>
                  </div>
                  <div style={{ ...S.visualBadge, background: curSec?.bg, borderColor: curSec?.bd, color: curSec?.c }}>
                    <Sparkles size={18} /> AI Native
                  </div>
                </div>
                <div style={S.slideBodyGrid}>
                  <div style={{ fontSize: 17, lineHeight: 1.8, color: "var(--color-text-secondary)" }}>{curPage?.b}</div>
                  <div style={{ ...S.mockVisual, background: visualRevision % 2 ? "#E6F1FB" : curSec?.bg, borderColor: visualRevision % 2 ? "#B5D4F4" : curSec?.bd }}>
                    <Image size={28} style={{ color: visualRevision % 2 ? "#378ADD" : curSec?.c }} />
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)" }}>
                      {visualRevision % 2 ? "重绘数据视觉" : "多模态素材区"}
                    </div>
                    <div style={S.barRow}><span style={{ ...S.bar, width: "76%", background: curSec?.c }} /><span style={{ ...S.bar, width: "48%", background: "#D4537E" }} /></div>
                    <div style={S.barRow}><span style={{ ...S.bar, width: "58%", background: "#1D9E75" }} /><span style={{ ...S.bar, width: "84%", background: "#378ADD" }} /></div>
                  </div>
                </div>
                {selRect && (
                  <div
                    style={{
                      position: "absolute",
                      left: selRect.x,
                      top: selRect.y,
                      width: selRect.w,
                      height: selRect.h,
                      border: "2px dashed #7F77DD",
                      background: "rgba(127,119,221,0.12)",
                      borderRadius: 4,
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <section style={S.refineSection}>
          <div style={{ padding: 12, display: "grid", gap: 8 }}>
            {selectedMaterialCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{ ...S.selectedMaterialBadge, borderColor: curSec?.bd, background: curSec?.bg, color: curSec?.c }}>
                  已勾选 {selectedMaterialCount} 个素材
                </span>
                {!intent.trim() && (
                  <span style={S.intentSuggestion}>
                    {suggestedIntent}
                  </span>
                )}
              </div>
            )}
            <textarea
              value={intent}
              onChange={(e) => {
                setIntent(e.target.value);
                setRightTab("proposals");
              }}
              placeholder={selectedMaterialCount > 0 ? suggestedIntent : "输入你希望 AI 精修的方向，例如：标题更有结论感、正文压缩成汇报口径、把图表做得更像对比数据卡。"}
              style={{ ...S.intentInput, minHeight: 76 }}
            />
          </div>
        </section>
      </div>

      {rightOpen && (
        <div style={S.agentPanel}>
          <div style={S.agentHead}>
            <div style={S.segmented}>
              {[
                ["versions", "版本树"],
                ["proposals", "精修方案"],
              ].map(([id, label]) => {
                const active = rightTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRightTab(id)}
                    style={{
                      ...S.segmentBtn,
                      background: active ? "#EEEDFE" : "transparent",
                      color: active ? "#3C3489" : "var(--color-text-secondary)",
                      fontWeight: active ? 650 : 500,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            {rightTab === "versions" ? (
              <VersionTree vers={vers} curV={curV} restore={restore} />
            ) : (
              <div style={{ height: "100%", padding: 12, display: "grid", gap: 10, overflowY: "auto" }}>
                {!intent.trim() ? (
                  <div style={{ border: "1px dashed var(--color-border-tertiary)", borderRadius: 8, padding: 14, color: "var(--color-text-tertiary)", fontSize: 11, lineHeight: 1.7, background: "var(--color-background-secondary)" }}>
                    在底部输入修改意图后，这里会即时生成三张 mock 精修方案图。可先框选标题、正文或图表区域，让方案更聚焦。
                  </div>
                ) : (
                  proposals.map((proposal) => (
                    <RefineProposalCard
                      key={proposal.index}
                      proposal={proposal}
                      curSec={curSec}
                      onApprove={() => approveProposal(proposal)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RefineProposalCard({ proposal, curSec, onApprove }) {
  return (
    <div className="anim-fade-up" style={{ animationDelay: `${(proposal.index - 1) * 80}ms`, ...S.proposalCard }}>
      <div style={{ ...S.proposalImage, borderColor: proposal.border, background: proposal.bg }}>
        <div>
          <div style={{ width: 34, height: 4, borderRadius: 2, background: proposal.accent, marginBottom: 8 }} />
          <div style={{ fontSize: 13, fontWeight: 650, color: "var(--color-text-primary)", lineHeight: 1.25 }}>{proposal.previewTitle}</div>
          <div style={{ fontSize: 9, color: "var(--color-text-tertiary)", marginTop: 4 }}>{curSec?.title} · 第 {proposal.pageNo} 页</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: proposal.kind === "visual" ? "1fr 1fr" : "1fr", gap: 8, alignItems: "end" }}>
          <div style={{ fontSize: 10, lineHeight: 1.5, color: "var(--color-text-secondary)" }}>{proposal.previewBody}</div>
          {proposal.kind === "visual" && (
            <div style={{ display: "grid", gap: 5 }}>
              {[76, 52, 88].map((width, i) => (
                <span key={width} style={{ height: 7, width: `${width}%`, borderRadius: 4, background: [curSec?.c, "#D4537E", "#378ADD"][i] }} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 650 }}>方案 {proposal.index} · {proposal.name}</div>
        <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>{proposal.summary}</div>
      </div>
      <button type="button" onClick={onApprove} style={S.approveBtn}>
        <Check size={13} /> 采纳
      </button>
    </div>
  );
}

function buildRefineProposals(intent, region, selPage, curPage, curSec) {
  const text = intent.trim();
  if (!text || !curPage) return [];

  const target = regionLabel(region);
  const baseTitle = curPage.h || "当前页";
  const baseBody = curPage.b || "";
  const accent = curSec?.c || "#7F77DD";
  const bg = curSec?.bg || "#EEEDFE";
  const border = curSec?.bd || "#CECBF6";
  const shortIntent = text.length > 20 ? `${text.slice(0, 20)}...` : text;

  return [
    {
      index: 1,
      kind: "title",
      name: "结论强化",
      pageNo: selPage + 1,
      accent,
      bg: "#FAFAFF",
      border,
      nextTitle: refineTitle(baseTitle, text),
      previewTitle: refineTitle(baseTitle, text),
      previewBody: baseBody,
      summary: `围绕「${shortIntent}」强化${target}，让标题更像可直接汇报的判断。`,
    },
    {
      index: 2,
      kind: "body",
      name: "正文压缩",
      pageNo: selPage + 1,
      accent: "#1D9E75",
      bg: "var(--color-background-primary)",
      border: "#9FE1CB",
      nextBody: `${baseBody}｜已按「${text}」压缩为三句高密度汇报表达。`,
      previewTitle: baseTitle,
      previewBody: `按「${shortIntent}」重写：先给结论，再保留关键因果与数据锚点。`,
      summary: `保留原页信息骨架，压缩${target}文字并突出汇报口径。`,
    },
    {
      index: 3,
      kind: "visual",
      name: "视觉重绘",
      pageNo: selPage + 1,
      accent: "#378ADD",
      bg,
      border: "#B5D4F4",
      note: `视觉素材已按「${text}」重绘为对比数据卡片。`,
      previewTitle: baseTitle,
      previewBody: "将局部素材组织成对比卡片，强化差异、趋势与结论标注。",
      summary: `把${target}转成图片式数据视觉，适合右侧素材区或整页强调。`,
    },
  ];
}

function refineTitle(title, intent) {
  const cleanIntent = intent.replace(/[。！？.!?]+$/u, "");
  if (title.includes("：")) return `${title} · ${cleanIntent}`;
  return `${title}：${cleanIntent}`;
}

const REFINE_MATERIALS = [
  { id: "title", x: 44, y: 66, w: 430, h: 76 },
  { id: "section", x: 44, y: 145, w: 430, h: 26 },
  { id: "badge", x: 535, y: 44, w: 141, h: 38 },
  { id: "body", x: 44, y: 184, w: 362, h: 170 },
  { id: "visual-card", x: 436, y: 184, w: 240, h: 170 },
  { id: "visual-bars-a", x: 454, y: 286, w: 204, h: 14 },
  { id: "visual-bars-b", x: 454, y: 308, w: 204, h: 14 },
];

function countSelectedMaterials(rect) {
  if (!rect) return 0;
  return REFINE_MATERIALS.filter((material) => rectsIntersect(rect, material)).length;
}

function rectsIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function buildSuggestedIntent(region, count) {
  if (!count) return "";
  if (region === "title") return "建议：强化标题结论，把选中素材改成更适合汇报的判断句。";
  if (region === "visual") return "建议：重绘选中素材，突出数据对比、趋势和关键结论标注。";
  if (region === "body") return "建议：压缩选中素材文字，保留关键因果和可汇报的数据锚点。";
  return "建议：统一优化选中素材的表达层级、留白和视觉重点。";
}

function classifyRegion(rect) {
  if (!rect) return "none";
  const midY = rect.y + rect.h / 2;
  if (midY < 150) return "title";
  if (midY > 235 && rect.x > 390) return "visual";
  return "body";
}

function regionLabel(region) {
  if (region === "title") return "标题区域";
  if (region === "body") return "正文区域";
  if (region === "visual") return "图片/图表区域";
  return "未选择";
}

function ThinkingBar({ visible }) {
  if (!visible) return null;
  return (
    <div style={{ position: "relative", height: 2, overflow: "hidden", background: "var(--color-border-tertiary)", flexShrink: 0 }}>
      <div className="anim-progress-bar" />
    </div>
  );
}

function ResizeBar({ hidden, onMouseDown }) {
  return (
    <div
      onMouseDown={hidden ? undefined : onMouseDown}
      style={{
        width: hidden ? 0 : 4,
        cursor: hidden ? "default" : "col-resize",
        background: "var(--color-background-secondary)",
        borderLeft: hidden ? 0 : "0.5px solid var(--color-border-tertiary)",
        borderRight: hidden ? 0 : "0.5px solid var(--color-border-tertiary)",
      }}
    />
  );
}

export default App;
