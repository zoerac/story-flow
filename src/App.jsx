import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Image, Minus, Plus, Sparkles } from "lucide-react";
import { ChatPanel } from "./components/ChatPanel";
import { Intro } from "./components/Intro";
import { StorylinePanel } from "./components/StorylinePanel";
import { Toolbar } from "./components/Toolbar";
import { VersionTree } from "./components/VersionTree";
import { useStoryflow } from "./hooks/useStoryflow";

const SHELL_NARROW_BREAKPOINT = 900;
const SLIDE_ASPECT = 10 / 16;
const SLIDE_MAX_W = 720;

function computeSlideSize(availW, availH, maxW = SLIDE_MAX_W) {
  const pad = 32;
  let slideW = Math.min(maxW, Math.max(280, availW - pad));
  let slideH = slideW * SLIDE_ASPECT;
  if (slideH > availH - pad) {
    slideH = Math.max(200, availH - pad);
    slideW = slideH / SLIDE_ASPECT;
  }
  return { slideW, slideH };
}

function App() {
  const story = useStoryflow();
  const [showIntro, setShowIntro] = useState(true);
  const [view, setView] = useState("edit");
  const [layout, setLayout] = useState({
    leftW: 220,
    rightW: 190,
    leftOpen: true,
    rightOpen: true,
  });
  const shellRef = useRef(null);
  const [shellNarrow, setShellNarrow] = useState(false);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => {
      setShellNarrow(entry.contentRect.width < SHELL_NARROW_BREAKPOINT);
    });
    ro.observe(el);
    setShellNarrow(el.getBoundingClientRect().width < SHELL_NARROW_BREAKPOINT);
    return () => ro.disconnect();
  }, []);

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

  const structureGridCols = shellNarrow
    ? undefined
    : `${layout.leftOpen ? layout.leftW : 0}px ${layout.leftOpen ? 4 : 0}px minmax(0,1fr) ${layout.rightOpen ? 4 : 0}px ${layout.rightOpen ? layout.rightW : 0}px`;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "stretch",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div ref={shellRef} style={S.shell}>
        {/* SLOT:toolbar */}
        <Toolbar
          leftOpen={layout.leftOpen}
          rightOpen={layout.rightOpen}
          setLeftOpen={setLeftOpen}
          setRightOpen={setRightOpen}
          activeStage={view === "refine" ? "refine" : "structure"}
          onOpenRefine={() => {
            setShowIntro(false);
            setView("refine");
          }}
        />
        {/* SLOT:intro */}
        {showIntro && view === "edit" && <Intro onDone={() => setShowIntro(false)} />}
        {view === "refine" ? (
          <AIRefinePage
            shellNarrow={shellNarrow}
            secs={story.secs}
            sel={story.sel}
            selPage={story.selPage}
            setSel={story.setSel}
            setSelPage={story.setSelPage}
            vers={story.vers}
            curV={story.curV}
            restore={story.restore}
            commitVersion={story.commitVersion}
            addMsg={story.addMsg}
            onBack={() => setView("edit")}
          />
        ) : shellNarrow ? (
          <div style={{ ...S.root, ...S.rootNarrow }}>
            {layout.leftOpen && (
              <div style={S.stackPanel30}>
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
                  commitVersion={story.commitVersion}
                />
              </div>
            )}
            {layout.rightOpen && (
              <div style={S.stackPanel22}>
                <VersionTree vers={story.vers} curV={story.curV} restore={story.restore} />
              </div>
            )}
            <div style={{ ...S.col, flex: 1, minHeight: 0 }}>
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
          </div>
        ) : (
          <div style={{ ...S.root, gridTemplateColumns: structureGridCols }}>
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
                  commitVersion={story.commitVersion}
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
              {layout.rightOpen && <VersionTree vers={story.vers} curV={story.curV} restore={story.restore} />}
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
    maxHeight: "calc(100vh - 48px)",
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
  rootNarrow: {
    display: "flex",
    flexDirection: "column",
  },
  stackPanel30: {
    maxHeight: "30vh",
    minHeight: 0,
    overflow: "hidden",
    flexShrink: 0,
  },
  stackPanel22: {
    maxHeight: "22vh",
    minHeight: 0,
    overflow: "hidden",
    flexShrink: 0,
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
    width: "min(100%, 300px)",
    maxWidth: "100%",
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
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: "minmax(160px, 22%) minmax(0, 1fr) minmax(220px, 30%)",
    background: "var(--color-background-tertiary)",
  },
  refineRootNarrow: {
    display: "flex",
    flexDirection: "column",
    gridTemplateColumns: undefined,
  },
  refineStackIntent: {
    maxHeight: "32vh",
    minHeight: 0,
    flexShrink: 0,
    overflow: "hidden",
  },
  refineStackAgent: {
    maxHeight: "38vh",
    minHeight: 0,
    flexShrink: 0,
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
    minHeight: 154,
    resize: "vertical",
    borderRadius: 7,
    border: "1px solid var(--color-border-tertiary)",
    background: "var(--color-background-secondary)",
    color: "var(--color-text-primary)",
    padding: "8px 9px",
    fontSize: 11,
    lineHeight: 1.5,
    outline: "none",
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

function AIRefinePage({ shellNarrow, secs, sel, selPage, setSelPage, vers, curV, restore, commitVersion, addMsg, onBack }) {
  const [zoom, setZoom] = useState(1);
  const [dragStart, setDragStart] = useState(null);
  const [selRect, setSelRect] = useState(null);
  const [intent, setIntent] = useState("");
  const [rightTab, setRightTab] = useState("proposals");
  const [visualRevision, setVisualRevision] = useState(0);
  const [slideSize, setSlideSize] = useState({ slideW: SLIDE_MAX_W, slideH: SLIDE_MAX_W * SLIDE_ASPECT });
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const curSec = secs[sel];
  const curPage = curSec?.pages[selPage] || curSec?.pages[0];
  const { slideW, slideH } = slideSize;
  const region = classifyRegion(selRect, slideW, slideH);
  const proposals = buildRefineProposals(intent, region, selPage, curPage, curSec);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setSlideSize(computeSlideSize(width, height));
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, []);

  const setZoomClamped = (next) => setZoom((prev) => Math.min(1.8, Math.max(0.6, typeof next === "function" ? next(prev) : next)));

  const pointFromEvent = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.max(0, Math.min((e.clientX - rect.left) / zoom, slideW)),
      y: Math.max(0, Math.min((e.clientY - rect.top) / zoom, slideH)),
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

  const leftPanel = (
    <div
      style={{
        ...S.refineLeftPanel,
        ...(shellNarrow ? { borderRight: 0, borderBottom: "0.5px solid var(--color-border-tertiary)" } : {}),
      }}
    >
      <div style={S.refineLeftHead}>页面与意图</div>
      <div style={{ padding: 14, display: "grid", gap: 16, overflowY: "auto", flex: 1, minHeight: 0 }}>
          <div style={S.agentBlock}>
            <div style={S.agentLabel}>当前章节</div>
            <div style={{ fontSize: 13, fontWeight: 650, color: "var(--color-text-primary)", lineHeight: 1.35 }}>{curSec?.title}</div>
            <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", lineHeight: 1.45 }}>{curSec?.sub}</div>
          </div>
          <div style={S.agentBlock}>
            <div style={S.agentLabel}>PPT 页</div>
            <div style={S.pageNumGrid}>
              {curSec?.pages.map((page, index) => {
                const active = index === selPage;
                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => {
                      setSelPage(index);
                      setSelRect(null);
                    }}
                    style={{
                      ...S.pageNumBtn,
                      border: active ? `1px solid ${curSec.bd}` : "1px solid var(--color-border-tertiary)",
                      background: active ? curSec.bg : "var(--color-background-primary)",
                      color: active ? curSec.c : "var(--color-text-secondary)",
                    }}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={S.agentBlock}>
            <div style={S.agentLabel}>选区</div>
            <div style={S.chip}>{selRect ? regionLabel(region) : "未框选时按整页生成"}</div>
          </div>
          <div style={S.agentBlock}>
            <div style={S.agentLabel}>修改意图</div>
            <textarea
              value={intent}
              onChange={(e) => {
                setIntent(e.target.value);
                setRightTab("proposals");
              }}
              placeholder="输入你希望 AI 精修的方向，例如：标题更有结论感、正文压缩成汇报口径、把图表做得更像对比数据卡。"
              style={S.intentInput}
            />
          </div>
        </div>
    </div>
  );

  const canvasCol = (
    <div style={{ ...S.refineCanvasCol, ...(shellNarrow ? { flex: 1, minHeight: 0 } : {}) }}>
      <div style={S.refineTopbar}>
        <button type="button" onClick={onBack} style={S.backBtn}>
          <ArrowLeft size={14} /> 返回结构编辑
        </button>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
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
        <div style={{ width: slideW * zoom, height: slideH * zoom, position: "relative", flexShrink: 0 }}>
          <div
            ref={canvasRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            style={{
              ...S.bigSlide,
              width: slideW,
              height: slideH,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              borderColor: curSec?.bd,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ width: 64, height: 6, borderRadius: 3, background: curSec?.c, marginBottom: 18 }} />
                <div style={{ fontSize: slideW < 520 ? 22 : 30, fontWeight: 650, lineHeight: 1.18, maxWidth: "100%" }}>{curPage?.h}</div>
                <div style={{ fontSize: 14, color: "var(--color-text-tertiary)", marginTop: 10 }}>{curSec?.title} · {curSec?.sub}</div>
              </div>
              <div style={{ ...S.visualBadge, background: curSec?.bg, borderColor: curSec?.bd, color: curSec?.c, flexShrink: 0 }}>
                <Sparkles size={18} /> AI Native
              </div>
            </div>
            <div
              style={{
                ...S.slideBodyGrid,
                gridTemplateColumns: slideW < 520 ? "1fr" : "1fr minmax(120px, 33%)",
                marginTop: slideW < 520 ? 24 : 42,
                gap: slideW < 520 ? 16 : 30,
              }}
            >
              <div style={{ fontSize: slideW < 520 ? 14 : 17, lineHeight: 1.8, color: "var(--color-text-secondary)" }}>{curPage?.b}</div>
              <div style={{ ...S.mockVisual, minHeight: slideW < 520 ? 120 : 170, background: visualRevision % 2 ? "#E6F1FB" : curSec?.bg, borderColor: visualRevision % 2 ? "#B5D4F4" : curSec?.bd }}>
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
    </div>
  );

  const agentPanel = (
    <div
      style={{
        ...S.agentPanel,
        ...(shellNarrow ? { borderTop: "0.5px solid var(--color-border-tertiary)" } : { borderLeft: "0.5px solid var(--color-border-tertiary)" }),
      }}
    >
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
                在左侧输入修改意图后，这里会即时生成三张 mock 精修方案图。可先框选标题、正文或图表区域，让方案更聚焦。
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
  );

  if (shellNarrow) {
    return (
      <div style={{ ...S.refineRoot, ...S.refineRootNarrow }}>
        <div style={S.refineStackIntent}>{leftPanel}</div>
        {canvasCol}
        <div style={S.refineStackAgent}>{agentPanel}</div>
      </div>
    );
  }

  return (
    <div style={S.refineRoot}>
      {leftPanel}
      {canvasCol}
      {agentPanel}
    </div>
  );
}

function RefineProposalCard({ proposal, curSec, onApprove }) {
  return (
    <div style={S.proposalCard}>
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

function classifyRegion(rect, slideW, slideH) {
  if (!rect) return "none";
  const midY = rect.y + rect.h / 2;
  if (midY < slideH * 0.33) return "title";
  if (midY > slideH * 0.52 && rect.x > slideW * 0.54) return "visual";
  return "body";
}

function regionLabel(region) {
  if (region === "title") return "标题区域";
  if (region === "body") return "正文区域";
  if (region === "visual") return "图片/图表区域";
  return "未选择";
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
