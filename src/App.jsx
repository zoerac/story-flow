import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Image, Minus, Plus, Sparkles, Type } from "lucide-react";
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
  REFINE_IMAGE_CANDIDATES,
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
              saveVersion={story.saveVersion}
              toggleSaved={story.toggleSaved}
              deleteVersion={story.deleteVersion}
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
                  onMergeSection={story.mergeSection}
                  onSplitPage={story.splitPageOut}
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
                restore={handleRestore}
                dragI={story.dragI}
                focusedSection={story.focusedSection}
                setFocusedSection={story.setFocusedSection}
                addMsg={story.addMsg}
                secs={story.secs}
              />
            </div>
            <ResizeBar hidden={!layout.rightOpen} onMouseDown={startResize("right")} />
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              {layout.rightOpen && (
                <VersionTree
                  vers={story.vers}
                  curV={story.curV}
                  secs={story.secs}
                  restore={handleRestore}
                  saveVersion={() => story.saveVersion("手动保存", { stage: "structure", kind: "edit" })}
                  toggleSaved={story.toggleSaved}
                  deleteVersion={story.deleteVersion}
                />
              )}
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
    gridTemplateRows: "minmax(0,1fr) minmax(92px, auto)",
    gap: 8,
    padding: 10,
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
    padding: 14,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
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

function AIRefinePage({ secs, sel, selPage, rightOpen, vers, curV, restore, saveVersion, toggleSaved, deleteVersion, onBack }) {
  const [zoom, setZoom] = useState(1);
  const [activeId, setActiveId] = useState("title");
  const [rightTab, setRightTab] = useState("materials");
  const [panelW, setPanelW] = useState(240);
  const [editNote, setEditNote] = useState("");
  const [selRect, setSelRect] = useState(null);
  const [gesture, setGesture] = useState(null);
  const [imageChoice, setImageChoice] = useState(REFINE_IMAGE_CANDIDATES[0]);
  const [textEdits, setTextEdits] = useState({});
  const [layouts, setLayouts] = useState(() => cloneRefineLayouts());
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const curSec = secs[sel];
  const curPage = curSec?.pages[selPage] || curSec?.pages[0];
  const pageKey = curPage?.id || "page";
  const pageText = textEdits[pageKey] || {};
  const displayTitle = pageText.title ?? curPage?.h ?? "当前页标题";
  const displayBody = pageText.body ?? curPage?.b ?? "当前页正文";
  const activeMaterial = REFINE_MATERIAL_DEFS.find((item) => item.id === activeId);
  const selectedMaterialCount = countSelectedMaterials(selRect, layouts);
  const proposalRegion = selRect ? classifyRegion(selRect) : materialRegion(activeId);
  const proposals = buildRefineProposals(editNote, proposalRegion, selPage, { ...curPage, h: displayTitle, b: displayBody }, curSec);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const fitToViewport = () => {
      const rect = viewport.getBoundingClientRect();
      const nextZoom = Math.min((rect.width - 8) / SLIDE_W, (rect.height - 8) / SLIDE_H);
      if (Number.isFinite(nextZoom) && nextZoom > 0) {
        setZoom(Math.min(1.8, Math.max(0.35, nextZoom)));
      }
    };

    fitToViewport();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", fitToViewport);
      return () => window.removeEventListener("resize", fitToViewport);
    }

    const observer = new ResizeObserver(fitToViewport);
    observer.observe(viewport);
    window.addEventListener("resize", fitToViewport);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fitToViewport);
    };
  }, [panelW, rightOpen]);

  const setZoomClamped = (next) => setZoom((prev) => Math.min(1.8, Math.max(0.35, typeof next === "function" ? next(prev) : next)));
  const updateText = (kind, value) => setTextEdits((prev) => ({ ...prev, [pageKey]: { ...prev[pageKey], [kind]: value } }));
  const updateLayout = (id, patch) => setLayouts((prev) => ({ ...prev, [id]: clampLayout({ ...prev[id], ...patch }) }));

  const pointFromEvent = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.max(0, Math.min((e.clientX - rect.left) / zoom, SLIDE_W)),
      y: Math.max(0, Math.min((e.clientY - rect.top) / zoom, SLIDE_H)),
    };
  };

  const startMaterialMove = (e, id) => {
    e.stopPropagation();
    const material = REFINE_MATERIAL_DEFS.find((item) => item.id === id);
    setActiveId(id);
    setSelRect(null);
    setRightTab("materials");
    if (!material) return;
    const point = pointFromEvent(e);
    if (!point) return;
    setGesture({ type: "move", id, start: point, origin: layouts[id] });
  };

  const startSelection = (e) => {
    if (e.target.closest("[data-material-id]")) return;
    const point = pointFromEvent(e);
    if (!point) return;
    setActiveId(null);
    setRightTab("proposals");
    setGesture({ type: "select", start: point });
    setSelRect({ x: point.x, y: point.y, w: 0, h: 0 });
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
      setSelRect({
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
      const nextPatch = { w: gesture.origin.w + dx, h: gesture.origin.h + dy };
      if (isTextMaterial(gesture.id)) {
        const scale = Math.max(0.7, Math.min(1.8, nextPatch.h / Math.max(1, gesture.origin.h)));
        nextPatch.fontSize = Math.round((gesture.origin.fontSize || defaultFontSize(gesture.id)) * scale);
      }
      updateLayout(gesture.id, nextPatch);
    }
  };

  const onMouseUp = () => {
    if (gesture?.type === "select") {
      setSelRect((rect) => (!rect || rect.w * rect.h < 500 ? null : rect));
    }
    setGesture(null);
  };

  const materialCanResize = activeId && layouts[activeId];
  const resizeTextMaterial = (delta) => {
    if (!materialCanResize) return;
    const current = layouts[activeId];
    const nextH = current.h + delta.h;
    const scale = Math.max(0.7, Math.min(1.8, nextH / Math.max(1, current.h)));
    updateLayout(activeId, {
      w: current.w + delta.w,
      h: nextH,
      fontSize: Math.round((current.fontSize || defaultFontSize(activeId)) * scale),
    });
  };
  const startPanelResize = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = panelW;
    const onMove = (moveEvent) => {
      setPanelW(Math.min(360, Math.max(200, startW - (moveEvent.clientX - startX))));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      style={{
        ...S.refineRoot,
        gridTemplateColumns: `minmax(0,1fr) ${rightOpen ? `4px ${panelW}px` : "0px 0px"}`,
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
          <div ref={viewportRef} style={S.canvasViewport}>
            <div style={{ width: SLIDE_W * zoom, height: SLIDE_H * zoom, position: "relative", flexShrink: 0 }}>
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
                  cursor: gesture?.type === "select" ? "crosshair" : "default",
                  padding: 0,
                }}
              >
                <span style={{ position: "absolute", left: 44, top: 42, width: 64, height: 6, borderRadius: 3, background: curSec?.c }} />
                <RefineMaterialBox id="title" active={activeId === "title"} layout={layouts.title} onMouseDown={startMaterialMove}>
                  <div style={textMaterialStyle(layouts.title, { fontWeight: 650, lineHeight: 1.18, color: "var(--color-text-primary)" })}>{displayTitle}</div>
                  {activeId === "title" && <button type="button" aria-label="缩放标题文本框" onMouseDown={(e) => startResize(e, "title")} style={resizeHandleStyle} />}
                </RefineMaterialBox>
                <RefineMaterialBox id="section" active={activeId === "section"} layout={layouts.section} onMouseDown={startMaterialMove}>
                  <div style={textMaterialStyle(layouts.section, { color: "var(--color-text-tertiary)" })}>{curSec?.title} · {curSec?.sub}</div>
                  {activeId === "section" && <button type="button" aria-label="缩放章节说明文本框" onMouseDown={(e) => startResize(e, "section")} style={resizeHandleStyle} />}
                </RefineMaterialBox>
                <RefineMaterialBox id="badge" active={activeId === "badge"} layout={layouts.badge} onMouseDown={startMaterialMove}>
                  <div style={{ ...S.visualBadge, height: "100%", background: curSec?.bg, borderColor: curSec?.bd, color: curSec?.c }}>
                    <Sparkles size={18} /> AI Native
                  </div>
                </RefineMaterialBox>
                <RefineMaterialBox id="body" active={activeId === "body"} layout={layouts.body} onMouseDown={startMaterialMove}>
                  <div style={textMaterialStyle(layouts.body, { lineHeight: 1.8, color: "var(--color-text-secondary)" })}>{displayBody}</div>
                  {activeId === "body" && <button type="button" aria-label="缩放正文文本框" onMouseDown={(e) => startResize(e, "body")} style={resizeHandleStyle} />}
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
          <div style={{ padding: 8, display: "grid", gap: 6 }}>
            <span style={{ ...S.selectedMaterialBadge, borderColor: curSec?.bd, background: curSec?.bg, color: curSec?.c }}>
              {selRect ? `已框选 ${selectedMaterialCount || 1} 个问题区域` : activeMaterial ? `当前素材：${activeMaterial.label}` : "点击画布素材进行编辑"}
            </span>
            <textarea
              value={editNote}
              onChange={(e) => {
                setEditNote(e.target.value);
                setRightTab("proposals");
              }}
              placeholder="记录本页精修要求。当前版本只演示素材直接操作：拖动素材、编辑文字、替换图片、缩放文本框或图片。"
              style={{ ...S.intentInput, minHeight: 48 }}
            />
          </div>
        </section>
      </div>

      {rightOpen && (
        <ResizeBar onMouseDown={startPanelResize} />
      )}
      {rightOpen && (
        <div style={S.agentPanel}>
          <div style={S.agentHead}>
            <div style={{ ...S.segmented, gridTemplateColumns: "1fr 1fr 1fr" }}>
              {[
                ["versions", "版本树"],
                ["materials", "素材操作"],
                ["proposals", "AI方案"],
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
              <VersionTree
                vers={vers}
                curV={curV}
                secs={secs}
                restore={restore}
                saveVersion={() => saveVersion("AI精修·手动保存", { stage: "refine", kind: "refine" })}
                toggleSaved={toggleSaved}
                deleteVersion={deleteVersion}
              />
            ) : rightTab === "proposals" ? (
              <ProposalPreviewPanel
                intent={editNote}
                proposals={proposals}
                curSec={curSec}
                activeMaterial={activeMaterial}
                selectedMaterialCount={selectedMaterialCount}
              />
            ) : (
              <div style={{ height: "100%", padding: 12, display: "grid", gap: 12, alignContent: "start", overflowY: "auto" }}>
                {activeMaterial?.kind === "image" ? (
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
                    layout={layouts[activeId] || layouts.title}
                    onResize={resizeTextMaterial}
                    onStyle={(patch) => materialCanResize && updateLayout(activeId, patch)}
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
        cursor: "move",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function TextRefinePanel({ activeId, title, body, onTitle, onBody, layout, onResize, onStyle }) {
  const activeTextLabel = materialLabel(activeId);
  const showTitleEditor = activeId === "title";
  const showBodyEditor = activeId === "body";
  return (
    <>
      <PanelTitle icon={<Type size={14} />} title="文本编辑" />
      <div style={{ ...S.agentBlock, gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <label style={S.agentBlock}>
          <span style={S.agentLabel}>{activeTextLabel}字号</span>
          <input
            type="number"
            min="8"
            max="72"
            value={layout.fontSize || defaultFontSize(activeId)}
            onChange={(e) => onStyle({ fontSize: Number(e.target.value) || defaultFontSize(activeId) })}
            style={S.select}
          />
        </label>
        <label style={S.agentBlock}>
          <span style={S.agentLabel}>字体</span>
          <select
            value={layout.fontFamily || REFINE_FONT_OPTIONS[0].value}
            onChange={(e) => onStyle({ fontFamily: e.target.value })}
            style={S.select}
          >
            {REFINE_FONT_OPTIONS.map((font) => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </select>
        </label>
      </div>
      {showTitleEditor && (
        <label style={S.agentBlock}>
          <span style={S.agentLabel}>标题文字</span>
          <textarea value={title} onChange={(e) => onTitle(e.target.value)} style={{ ...S.intentInput, minHeight: 108 }} />
        </label>
      )}
      {showBodyEditor && (
        <label style={S.agentBlock}>
          <span style={S.agentLabel}>正文文字</span>
          <textarea value={body} onChange={(e) => onBody(e.target.value)} style={{ ...S.intentInput, minHeight: 132 }} />
        </label>
      )}
      {!showTitleEditor && !showBodyEditor && (
        <span style={S.intentSuggestion}>这个文字素材暂时只支持拖动、缩放、字号和字体调整。</span>
      )}
      <div style={{ ...S.agentBlock, marginTop: 2 }}>
        <span style={S.agentLabel}>文本框尺寸</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button type="button" onClick={() => onResize({ w: -24, h: -12 })} style={S.rejectBtn}>缩小</button>
          <button type="button" onClick={() => onResize({ w: 24, h: 12 })} style={S.approveBtn}>放大</button>
        </div>
        <span style={S.intentSuggestion}>当前 {Math.round(layout.w)} x {Math.round(layout.h)}，拉伸会同步改变字号。</span>
      </div>
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

function ProposalPreviewPanel({ intent, proposals, curSec, activeMaterial, selectedMaterialCount }) {
  return (
    <div style={{ height: "100%", padding: 12, display: "grid", gap: 10, overflowY: "auto" }}>
      {!intent.trim() ? (
        <div style={{ border: "1px dashed var(--color-border-tertiary)", borderRadius: 8, padding: 14, color: "var(--color-text-tertiary)", fontSize: 11, lineHeight: 1.7, background: "var(--color-background-secondary)" }}>
          在底部输入精修要求后，这里会像 main 分支一样实时展示 3 张 mock AI 方案图。当前焦点：{selectedMaterialCount ? `框选区域（${selectedMaterialCount} 个素材）` : activeMaterial?.label || "当前页"}。
        </div>
      ) : (
        proposals.map((proposal) => (
          <RefineProposalPreviewCard
            key={proposal.index}
            proposal={proposal}
            curSec={curSec}
          />
        ))
      )}
    </div>
  );
}

function RefineProposalPreviewCard({ proposal, curSec }) {
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
    </div>
  );
}

function materialLabel(id) {
  return REFINE_MATERIAL_DEFS.find((item) => item.id === id)?.label || id;
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

const REFINE_FONT_OPTIONS = [
  { label: "系统无衬线", value: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { label: "汇报黑体", value: "'Microsoft YaHei', 'PingFang SC', sans-serif" },
  { label: "标题宋体", value: "Georgia, 'Times New Roman', 'SimSun', serif" },
  { label: "等宽技术", value: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace" },
];

const SLIDE_W = 720;
const SLIDE_H = 450;

const REFINE_BASE_LAYOUTS = {
  title: { x: 44, y: 66, w: 430, h: 76, fontSize: 30, fontFamily: REFINE_FONT_OPTIONS[0].value },
  section: { x: 44, y: 145, w: 430, h: 28, fontSize: 14, fontFamily: REFINE_FONT_OPTIONS[0].value },
  badge: { x: 535, y: 44, w: 141, h: 38 },
  body: { x: 44, y: 184, w: 362, h: 170, fontSize: 17, fontFamily: REFINE_FONT_OPTIONS[0].value },
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
  const w = Math.min(640, Math.max(80, rect.w));
  const h = Math.min(320, Math.max(34, rect.h));
  const fontSize = rect.fontSize ? Math.min(72, Math.max(8, rect.fontSize)) : rect.fontSize;
  return {
    x: Math.min(SLIDE_W - w - 24, Math.max(24, rect.x)),
    y: Math.min(SLIDE_H - h - 24, Math.max(24, rect.y)),
    w,
    h,
    ...(fontSize ? { fontSize } : {}),
    ...(rect.fontFamily ? { fontFamily: rect.fontFamily } : {}),
  };
}

function countSelectedMaterials(rect, layouts) {
  if (!rect) return 0;
  return REFINE_MATERIAL_DEFS.filter((material) => rectsIntersect(rect, layouts[material.id])).length;
}

function rectsIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function isTextMaterial(id) {
  return REFINE_MATERIAL_DEFS.find((item) => item.id === id)?.kind === "text";
}

function defaultFontSize(id) {
  return REFINE_BASE_LAYOUTS[id]?.fontSize || 14;
}

function textMaterialStyle(layout, extra = {}) {
  return {
    fontSize: layout.fontSize || 14,
    fontFamily: layout.fontFamily || REFINE_FONT_OPTIONS[0].value,
    overflowWrap: "anywhere",
    ...extra,
  };
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

function materialRegion(id) {
  if (id === "title" || id === "section") return "title";
  if (id === "visual" || id === "badge") return "visual";
  return "body";
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
  return "当前页";
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
