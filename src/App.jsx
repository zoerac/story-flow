import { useRef, useState } from "react";
import { ArrowLeft, Check, Image, Minus, MousePointer2, Plus, Sparkles, Type, Wand2 } from "lucide-react";
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
  buildRefineLayoutProposal,
  polishRefineText,
  rankVisualCandidates,
  REFINE_IMAGE_CANDIDATES,
} from "./data/mock";
import { useStoryflow } from "./hooks/useStoryflow";

const STAGE_LABELS = {
  intent: "意图对齐",
  visual: "主视觉",
  structure: "结构编辑",
  refine: "AI精修",
};

function stageLabel(stage) {
  return STAGE_LABELS[stage] || "结构编辑";
}

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

    story.commitVersion(`跳转：${stageLabel(currentStage)} → ${stageLabel(targetStage)}`, story.secs, {
      stage: targetStage,
      kind: "jump",
      fromStage: currentStage,
      toStage: targetStage,
    });
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
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
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
          <div key="refine" className="anim-fade-up">
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
          <div key="visual" className="anim-fade-up">
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
    height: 580,
    background: "var(--color-background-primary)",
  },
  visualRoot: {
    height: 640,
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
    height: 640,
    display: "grid",
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

function AIRefinePage({ secs, sel, selPage, rightOpen, vers, curV, restore, addMsg, onBack }) {
  const [zoom, setZoom] = useState(1);
  const [activeId, setActiveId] = useState("title");
  const [rightTab, setRightTab] = useState("edit");
  const [selection, setSelection] = useState(null);
  const [selectionDraft, setSelectionDraft] = useState("");
  const [layoutProposal, setLayoutProposal] = useState(null);
  const [gesture, setGesture] = useState(null);
  const [imageChoice, setImageChoice] = useState(REFINE_IMAGE_CANDIDATES[0]);
  const [textEdits, setTextEdits] = useState({});
  const [layouts, setLayouts] = useState(() => cloneRefineLayouts());
  const canvasRef = useRef(null);
  const curSec = secs[sel];
  const curPage = curSec?.pages[selPage] || curSec?.pages[0];
  const pageKey = curPage?.id || "page";
  const pageText = textEdits[pageKey] || {};
  const displayTitle = pageText.title ?? curPage?.h ?? "当前页标题";
  const displayBody = pageText.body ?? curPage?.b ?? "当前页正文";
  const activeMaterial = REFINE_MATERIAL_DEFS.find((item) => item.id === activeId);
  const selectedMaterials = selection ? REFINE_MATERIAL_DEFS.filter((item) => rectsIntersect(selection, layouts[item.id])) : [];
  const selectedRegion = selectedMaterials.length ? selectedMaterials.map((item) => item.label).join("、") : "圈选区域";

  const setZoomClamped = (next) => setZoom((prev) => Math.min(1.8, Math.max(0.6, typeof next === "function" ? next(prev) : next)));
  const updateText = (kind, value) => setTextEdits((prev) => ({ ...prev, [pageKey]: { ...prev[pageKey], [kind]: value } }));
  const updateLayout = (id, patch) => setLayouts((prev) => ({ ...prev, [id]: clampLayout({ ...prev[id], ...patch }) }));
  const setPanel = (tab) => setRightTab(tab);

  const pointFromEvent = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.max(0, Math.min((e.clientX - rect.left) / zoom, 720)),
      y: Math.max(0, Math.min((e.clientY - rect.top) / zoom, 450)),
    };
  };

  const startSelection = (e) => {
    if (e.target.closest("[data-material-id]")) return;
    const point = pointFromEvent(e);
    if (!point) return;
    setActiveId(null);
    setPanel("edit");
    setSelectionDraft("");
    setLayoutProposal(null);
    setGesture({ type: "select", start: point });
    setSelection({ x: point.x, y: point.y, w: 0, h: 0 });
  };

  const startMaterialMove = (e, id) => {
    e.stopPropagation();
    const material = REFINE_MATERIAL_DEFS.find((item) => item.id === id);
    setActiveId(id);
    setSelection(null);
    setLayoutProposal(null);
    setPanel("edit");
    if (material?.kind !== "image" && material?.kind !== "decor") return;
    const point = pointFromEvent(e);
    if (!point) return;
    setGesture({ type: "move", id, start: point, origin: layouts[id] });
  };

  const startResize = (e, id) => {
    e.stopPropagation();
    const point = pointFromEvent(e);
    if (!point) return;
    setActiveId(id);
    setGesture({ type: "resize", id, start: point, origin: layouts[id] });
  };

  const onMouseMove = (e) => {
    if (!gesture) return;
    const point = pointFromEvent(e);
    if (!point) return;
    if (gesture.type === "select") {
      setSelection({
        x: Math.min(gesture.start.x, point.x),
        y: Math.min(gesture.start.y, point.y),
        w: Math.abs(point.x - gesture.start.x),
        h: Math.abs(point.y - gesture.start.y),
      });
      return;
    }
    const dx = point.x - gesture.start.x;
    const dy = point.y - gesture.start.y;
    if (gesture.type === "move") {
      updateLayout(gesture.id, { x: gesture.origin.x + dx, y: gesture.origin.y + dy });
    } else if (gesture.type === "resize") {
      updateLayout(gesture.id, { w: gesture.origin.w + dx, h: gesture.origin.h + dy });
    }
  };

  const onMouseUp = () => {
    if (gesture?.type === "select") {
      setSelection((rect) => {
        if (!rect || rect.w * rect.h < 500) return null;
        setPanel("edit");
        return rect;
      });
    }
    setGesture(null);
  };

  const polishText = (kind) => {
    const current = kind === "title" ? displayTitle : displayBody;
    const polished = polishRefineText(kind, current, selectionDraft);
    updateText(kind, polished);
    addMsg("sys", `已对${kind === "title" ? "标题" : "正文"}生成 mock AI 润色结果，当前仅更新精修页展示。`);
  };

  const generateLayout = () => {
    if (!selection) return;
    setLayoutProposal(buildRefineLayoutProposal(selectionDraft, selectedRegion));
    setPanel("edit");
  };

  const applyLayoutProposal = () => {
    if (!layoutProposal) return;
    setLayouts((prev) => {
      const next = { ...prev };
      Object.entries(layoutProposal.patch).forEach(([id, rect]) => {
        next[id] = clampLayout({ ...next[id], ...rect });
      });
      return next;
    });
    setSelection(null);
    setLayoutProposal(null);
    addMsg("sys", `已采纳「${layoutProposal.title}」mock 重构方案，仅调整当前精修画布布局。`);
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
                onMouseDown={startSelection}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                style={{
                  ...S.bigSlide,
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  borderColor: curSec?.bd,
                  cursor: gesture?.type ? "crosshair" : "default",
                  padding: 0,
                }}
              >
                <span style={{ position: "absolute", left: 44, top: 42, width: 64, height: 6, borderRadius: 3, background: curSec?.c }} />
                <RefineMaterialBox id="title" active={activeId === "title"} layout={layouts.title} onMouseDown={startMaterialMove}>
                  <div style={{ fontSize: 30, fontWeight: 650, lineHeight: 1.18, color: "var(--color-text-primary)" }}>{displayTitle}</div>
                </RefineMaterialBox>
                <RefineMaterialBox id="section" active={activeId === "section"} layout={layouts.section} onMouseDown={startMaterialMove}>
                  <div style={{ fontSize: 14, color: "var(--color-text-tertiary)" }}>{curSec?.title} · {curSec?.sub}</div>
                </RefineMaterialBox>
                <RefineMaterialBox id="badge" active={activeId === "badge"} layout={layouts.badge} onMouseDown={startMaterialMove}>
                  <div style={{ ...S.visualBadge, height: "100%", background: curSec?.bg, borderColor: curSec?.bd, color: curSec?.c }}>
                    <Sparkles size={18} /> AI Native
                  </div>
                </RefineMaterialBox>
                <RefineMaterialBox id="body" active={activeId === "body"} layout={layouts.body} onMouseDown={startMaterialMove}>
                  <div style={{ fontSize: 17, lineHeight: 1.8, color: "var(--color-text-secondary)" }}>{displayBody}</div>
                </RefineMaterialBox>
                <RefineMaterialBox id="visual" active={activeId === "visual"} layout={layouts.visual} onMouseDown={startMaterialMove}>
                  <div style={{ ...S.mockVisual, height: "100%", minHeight: 0, background: imageChoice.tint || curSec?.bg, borderColor: curSec?.bd }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Image size={24} style={{ color: imageChoice.accent || curSec?.c }} />
                      <div style={{ fontSize: 15, fontWeight: 650, color: "var(--color-text-primary)" }}>{imageChoice.title}</div>
                    </div>
                    <img src={imageChoice.image} alt="" style={{ width: "100%", minHeight: 74, objectFit: "cover", borderRadius: 6, border: "1px solid var(--color-border-tertiary)" }} />
                    <div style={S.barRow}><span style={{ ...S.bar, width: "76%", background: curSec?.c }} /><span style={{ ...S.bar, width: "48%", background: "#D4537E" }} /></div>
                    <div style={S.barRow}><span style={{ ...S.bar, width: "58%", background: "#1D9E75" }} /><span style={{ ...S.bar, width: "84%", background: "#378ADD" }} /></div>
                  </div>
                  {activeId === "visual" && <button type="button" aria-label="缩放图片素材" onMouseDown={(e) => startResize(e, "visual")} style={resizeHandleStyle} />}
                </RefineMaterialBox>
                {selection && (
                  <div
                    style={{
                      position: "absolute",
                      left: selection.x,
                      top: selection.y,
                      width: selection.w,
                      height: selection.h,
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
          <div style={{ padding: 12, display: "grid", gridTemplateColumns: "auto minmax(0,1fr) auto", gap: 10, alignItems: "center" }}>
            <span style={{ ...S.selectedMaterialBadge, borderColor: curSec?.bd, background: curSec?.bg, color: curSec?.c }}>
              {selection ? `已圈出 ${selectedMaterials.length || 1} 个问题区域` : activeMaterial ? `当前素材：${activeMaterial.label}` : "点击素材或圈出区域"}
            </span>
            <span style={S.intentSuggestion}>
              {selection ? "输入要求后生成布局重构方案" : activeMaterial?.kind === "image" ? "图片素材可替换、拖动和缩放" : activeMaterial?.kind === "decor" ? "装饰素材可拖动调整位置" : "文本素材可直接编辑或 AI 润色"}
            </span>
            {selection && (
              <button type="button" onClick={generateLayout} style={{ ...S.approveBtn, width: 128 }}>
                <Wand2 size={13} /> 生成方案
              </button>
            )}
          </div>
        </section>
      </div>

      {rightOpen && (
        <div style={S.agentPanel}>
          <div style={S.agentHead}>
            <div style={S.segmented}>
              {[
                ["edit", "素材操作"],
                ["versions", "版本树"],
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
              <div style={{ height: "100%", padding: 12, display: "grid", gap: 12, alignContent: "start", overflowY: "auto" }}>
                {selection ? (
                  <SelectionRefinePanel
                    value={selectionDraft}
                    onChange={setSelectionDraft}
                    proposal={layoutProposal}
                    selectedRegion={selectedRegion}
                    onGenerate={generateLayout}
                    onApply={applyLayoutProposal}
                  />
                ) : activeMaterial?.kind === "image" ? (
                  <ImageRefinePanel
                    choice={imageChoice}
                    onChoice={setImageChoice}
                    layout={layouts.visual}
                    onResize={(delta) => updateLayout("visual", { w: layouts.visual.w + delta, h: layouts.visual.h + delta * 0.65 })}
                  />
                ) : activeMaterial?.kind === "decor" ? (
                  <DecorRefinePanel layout={layouts.badge} onResize={(delta) => updateLayout("badge", { w: layouts.badge.w + delta })} />
                ) : (
                  <TextRefinePanel
                    activeId={activeId}
                    title={displayTitle}
                    body={displayBody}
                    onTitle={(value) => updateText("title", value)}
                    onBody={(value) => updateText("body", value)}
                    onPolish={polishText}
                    intent={selectionDraft}
                    onIntent={setSelectionDraft}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RefineMaterialBox({ id, active, layout, onMouseDown, children }) {
  return (
    <div
      data-material-id={id}
      onMouseDown={(e) => onMouseDown(e, id)}
      style={{
        position: "absolute",
        left: layout.x,
        top: layout.y,
        width: layout.w,
        height: layout.h,
        border: active ? "1.5px solid #7F77DD" : "1px solid transparent",
        boxShadow: active ? "0 0 0 3px rgba(127,119,221,0.12)" : "none",
        borderRadius: 8,
        padding: active ? 4 : 0,
        cursor: id === "visual" ? "move" : "pointer",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function TextRefinePanel({ activeId, title, body, onTitle, onBody, onPolish, intent, onIntent }) {
  const editingBody = activeId === "body";
  return (
    <>
      <PanelTitle icon={<Type size={14} />} title="文本编辑" />
      <label style={S.agentBlock}>
        <span style={S.agentLabel}>标题</span>
        <textarea value={title} onChange={(e) => onTitle(e.target.value)} style={{ ...S.intentInput, minHeight: 82 }} />
      </label>
      <label style={S.agentBlock}>
        <span style={S.agentLabel}>正文</span>
        <textarea value={body} onChange={(e) => onBody(e.target.value)} style={{ ...S.intentInput, minHeight: 110 }} />
      </label>
      <label style={S.agentBlock}>
        <span style={S.agentLabel}>AI 润色要求</span>
        <textarea value={intent} onChange={(e) => onIntent(e.target.value)} placeholder="例如：更像高管汇报、减少铺垫、突出结构层价值。" style={{ ...S.intentInput, minHeight: 70 }} />
      </label>
      <button type="button" onClick={() => onPolish(editingBody ? "body" : "title")} style={S.approveBtn}>
        <Sparkles size={13} /> AI 润色{editingBody ? "正文" : "标题"}
      </button>
    </>
  );
}

function ImageRefinePanel({ choice, onChoice, layout, onResize }) {
  return (
    <>
      <PanelTitle icon={<Image size={14} />} title="图片素材" />
      <div style={{ display: "grid", gap: 8 }}>
        {REFINE_IMAGE_CANDIDATES.map((item) => {
          const active = item.id === choice.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChoice(item)}
              style={{
                ...S.visualCard,
                gridTemplateColumns: "54px minmax(0,1fr)",
                alignItems: "center",
                borderColor: active ? item.accent : "var(--color-border-tertiary)",
                background: active ? item.tint : "var(--color-background-primary)",
              }}
            >
              <img src={item.image} alt="" style={{ width: 54, height: 34, objectFit: "cover", borderRadius: 5 }} />
              <span style={{ fontSize: 11, fontWeight: 650, color: active ? item.accent : "var(--color-text-primary)" }}>{item.title}</span>
            </button>
          );
        })}
      </div>
      <div style={{ ...S.agentBlock, marginTop: 2 }}>
        <span style={S.agentLabel}>尺寸</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button type="button" onClick={() => onResize(-18)} style={S.rejectBtn}>缩小</button>
          <button type="button" onClick={() => onResize(18)} style={S.approveBtn}>放大</button>
        </div>
        <span style={S.intentSuggestion}>当前 {Math.round(layout.w)} x {Math.round(layout.h)}，可在画布拖动，右下角可缩放。</span>
      </div>
    </>
  );
}

function DecorRefinePanel({ layout, onResize }) {
  return (
    <>
      <PanelTitle icon={<Sparkles size={14} />} title="角标装饰" />
      <span style={S.chip}>AI Native 角标</span>
      <div style={{ ...S.agentBlock, marginTop: 2 }}>
        <span style={S.agentLabel}>尺寸</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button type="button" onClick={() => onResize(-12)} style={S.rejectBtn}>收窄</button>
          <button type="button" onClick={() => onResize(12)} style={S.approveBtn}>加宽</button>
        </div>
        <span style={S.intentSuggestion}>当前宽度 {Math.round(layout.w)}，可在画布直接拖动位置。</span>
      </div>
    </>
  );
}

function SelectionRefinePanel({ value, onChange, proposal, selectedRegion, onGenerate, onApply }) {
  return (
    <>
      <PanelTitle icon={<MousePointer2 size={14} />} title="框选精修" />
      <span style={S.chip}>问题区域：{selectedRegion}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="描述不满意的地方，例如：右侧图太抢、正文太散、标题和素材缺少呼应。"
        style={{ ...S.intentInput, minHeight: 102 }}
      />
      <button type="button" onClick={onGenerate} style={S.approveBtn}>
        <Wand2 size={13} /> AI 生成布局重构方案
      </button>
      {proposal && (
        <div className="anim-fade-up" style={S.proposalCard}>
          <div style={{ fontSize: 12, fontWeight: 650 }}>{proposal.title}</div>
          <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>{proposal.summary}</div>
          <div style={S.proposalImage}>
            <div style={{ width: "58%", height: 10, borderRadius: 5, background: "#7F77DD" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <span style={{ height: 58, borderRadius: 7, background: "#EEEDFE", border: "1px solid #CECBF6" }} />
              <span style={{ height: 58, borderRadius: 7, background: "#E6F1FB", border: "1px solid #B5D4F4" }} />
            </div>
          </div>
          <button type="button" onClick={onApply} style={S.approveBtn}>
            <Check size={13} /> 采纳重构
          </button>
        </div>
      )}
    </>
  );
}

function PanelTitle({ icon, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 650 }}>
      {icon}
      {title}
    </div>
  );
}

const REFINE_MATERIAL_DEFS = [
  { id: "title", label: "标题文本", kind: "text" },
  { id: "section", label: "章节说明", kind: "text" },
  { id: "badge", label: "角标装饰", kind: "decor" },
  { id: "body", label: "正文文本", kind: "text" },
  { id: "visual", label: "图片/图表素材", kind: "image" },
];

const REFINE_BASE_LAYOUTS = {
  title: { x: 44, y: 66, w: 430, h: 76 },
  section: { x: 44, y: 145, w: 430, h: 28 },
  badge: { x: 535, y: 44, w: 141, h: 38 },
  body: { x: 44, y: 184, w: 362, h: 170 },
  visual: { x: 436, y: 184, w: 240, h: 190 },
};

const resizeHandleStyle = {
  position: "absolute",
  right: 2,
  bottom: 2,
  width: 16,
  height: 16,
  padding: 0,
  border: "1px solid #7F77DD",
  borderRadius: 5,
  background: "#fff",
  cursor: "nwse-resize",
};

function cloneRefineLayouts() {
  return structuredClone(REFINE_BASE_LAYOUTS);
}

function clampLayout(rect) {
  const w = Math.min(360, Math.max(80, rect.w));
  const h = Math.min(260, Math.max(34, rect.h));
  return {
    x: Math.min(720 - w - 24, Math.max(24, rect.x)),
    y: Math.min(450 - h - 24, Math.max(24, rect.y)),
    w,
    h,
  };
}

function rectsIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
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
