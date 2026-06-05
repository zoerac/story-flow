import { useState } from "react";
import { ArrowUpFromLine, BookOpen, ChevronDown, ChevronRight, GripVertical } from "lucide-react";

export function StorylinePanel({
  secs,
  sel,
  setSel,
  selPage,
  setSelPage,
  dragI,
  setDragI,
  overI,
  setOverI,
  onDrop,
  onMergeSection,
  onSplitPage,
  commitVersion,
  dragHint = false,
  onInteract,
}) {
  const [openIds, setOpenIds] = useState(() => new Set([secs[0]?.id].filter(Boolean)));
  const [pageDrag, setPageDrag] = useState(null);
  const [pageOver, setPageOver] = useState(null);
  const [mergeOverI, setMergeOverI] = useState(null);
  const [splitOver, setSplitOver] = useState(false);
  // 拖动的页所属章是否多于一页：单页章拆出会留下空章，故不提供拆分入口
  const canSplit = pageDrag != null && (secs[pageDrag.sectionIndex]?.pages.length || 0) > 1;
  const pageCount = secs.reduce((sum, s) => sum + s.pages.length, 0);

  const toggleOpen = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onPageDrop = (sectionIndex, toPageIndex) => {
    if (!pageDrag || pageDrag.sectionIndex !== sectionIndex || pageDrag.pageIndex === toPageIndex) {
      setPageDrag(null);
      setPageOver(null);
      return;
    }

    const nextSecs = structuredClone(secs);
    const pages = nextSecs[sectionIndex].pages;
    const [moved] = pages.splice(pageDrag.pageIndex, 1);
    pages.splice(toPageIndex, 0, moved);

    commitVersion(`${nextSecs[sectionIndex].title}·页序调整`, nextSecs);
    setSel(sectionIndex);
    setSelPage(toPageIndex);
    setPageDrag(null);
    setPageOver(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "0.5px solid var(--color-border-tertiary)", height: "100%" }}>
      <div style={panelHead}>
        <BookOpen size={14} style={{ color: "#7F77DD" }} /> 故事线
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--color-text-tertiary)", fontWeight: 400 }}>
          {secs.length} 章 · {pageCount} 页
        </span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 10px 6px" }}>
        {secs.map((s, i) => {
          const active = i === sel;
          const isMergeTarget = mergeOverI === i && dragI !== null && dragI !== i;
          const isReorderTarget = overI === i && dragI !== null && dragI !== i;
          const open = openIds.has(s.id);
          const isLast = i === secs.length - 1;

          return (
            <div
              key={s.id}
              className="anim-fade-up"
              draggable
              onDragStart={() => {
                setDragI(i);
                onInteract?.();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                // 指针落在卡片中间 ~40% → 合并为子页；上下边缘 → 重排序
                if (dragI === null || dragI === i) {
                  setOverI(i);
                  setMergeOverI(null);
                  return;
                }
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientY - rect.top) / rect.height;
                if (ratio > 0.3 && ratio < 0.7) {
                  setMergeOverI(i);
                  setOverI(null);
                } else {
                  setOverI(i);
                  setMergeOverI(null);
                }
              }}
              onDrop={() => {
                if (mergeOverI === i && dragI !== null && dragI !== i) {
                  onMergeSection?.(dragI, i);
                } else {
                  onDrop(i);
                }
                setMergeOverI(null);
              }}
              onDragEnd={() => {
                setDragI(null);
                setOverI(null);
                setMergeOverI(null);
              }}
              onClick={() => {
                setSel(i);
                setSelPage(0);
                onInteract?.();
              }}
              style={{
                display: "flex",
                alignItems: "stretch",
                gap: 0,
                cursor: dragI !== null ? "grabbing" : "grab",
                opacity: dragI === i ? 0.35 : 1,
                transition: "opacity 0.12s",
              }}
            >
              {/* 时间轴脊线 + 编号节点 */}
              <div style={{ width: 30, position: "relative", flexShrink: 0 }}>
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    // 非末章：贯穿整行连到下一节点；末章：仅画到节点附近，避免拖尾
                    top: 0,
                    bottom: isLast ? "auto" : 0,
                    height: isLast ? 33 : "auto",
                    width: 2,
                    background: active ? s.c : "var(--color-border-secondary)",
                    opacity: active ? 0.55 : 1,
                  }}
                />
                <span
                  className={dragHint && i === 0 ? "anim-coach-pulse" : undefined}
                  style={{
                    position: "absolute",
                    left: 3,
                    top: 9,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: active ? s.c : "var(--color-background-primary)",
                    border: `2px solid ${active ? s.c : s.bd}`,
                    color: active ? "#fff" : s.c,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    boxShadow: active ? `0 2px 8px ${s.bg}` : "none",
                    transition: "background 0.15s, border 0.15s, color 0.15s",
                  }}
                >
                  {i + 1}
                </span>
              </div>

              {/* 章节主体卡片 */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  marginBottom: 6,
                  padding: "8px 10px",
                  borderRadius: 9,
                  background: isMergeTarget ? s.bg : active ? s.bg : "transparent",
                  border: isMergeTarget
                    ? `2px solid ${s.c}`
                    : isReorderTarget
                      ? `2px dashed ${s.c}`
                      : active
                        ? `1.5px solid ${s.bd}`
                        : "1.5px solid transparent",
                  boxShadow: active ? `0 2px 10px rgba(26,25,21,0.05)` : "none",
                  transition: "background 0.12s, border 0.12s, box-shadow 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <GripVertical
                    size={13}
                    className={dragHint && i === 0 ? "anim-drag-hint" : undefined}
                    style={{ color: dragHint && i === 0 ? "#7F77DD" : "var(--color-text-tertiary)", flexShrink: 0, cursor: "grab" }}
                  />
                  <span
                    title={s.title}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                      flex: 1,
                      minWidth: 0,
                      lineHeight: 1.35,
                      // 选中章节标题完整换行展示，未选中保持单行省略，避免点击后被截断看不全
                      whiteSpace: active ? "normal" : "nowrap",
                      overflow: active ? "visible" : "hidden",
                      textOverflow: active ? "clip" : "ellipsis",
                      wordBreak: "break-word",
                    }}
                  >
                    {s.title}
                  </span>
                  {isMergeTarget && (
                    <span style={{ fontSize: 9, fontWeight: 600, color: s.c, flexShrink: 0 }}>并入此章 ↵</span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOpen(s.id);
                    }}
                    aria-label={open ? "收起子页" : "展开子页"}
                    style={{
                      width: 16,
                      height: 16,
                      padding: 0,
                      border: 0,
                      background: "transparent",
                      color: "var(--color-text-tertiary)",
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, marginLeft: 19 }}>
                  <span title={s.sub} style={{ fontSize: 10, color: "var(--color-text-tertiary)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.sub}
                  </span>
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 9,
                      fontWeight: 600,
                      color: s.c,
                      background: s.bg,
                      border: `0.5px solid ${s.bd}`,
                      borderRadius: 5,
                      padding: "1px 6px",
                    }}
                  >
                    {s.pages.length} 页
                  </span>
                </div>

                {open && (
                  <div style={{ marginTop: 8, marginLeft: 19, display: "grid", gap: 3 }}>
                    {s.pages.map((page, pageIndex) => {
                      const pageActive = i === sel && pageIndex === selPage;
                      const over =
                        pageOver?.sectionIndex === i &&
                        pageOver?.pageIndex === pageIndex &&
                        pageDrag?.pageIndex !== pageIndex;

                      return (
                        <div
                          key={page.id}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            setPageDrag({ sectionIndex: i, pageIndex });
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPageOver({ sectionIndex: i, pageIndex });
                          }}
                          onDrop={(e) => {
                            e.stopPropagation();
                            onPageDrop(i, pageIndex);
                          }}
                          onDragEnd={(e) => {
                            e.stopPropagation();
                            setPageDrag(null);
                            setPageOver(null);
                            setSplitOver(false);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSel(i);
                            setSelPage(pageIndex);
                            onInteract?.();
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "5px 8px",
                            borderRadius: 6,
                            background: pageActive ? "var(--color-background-primary)" : "transparent",
                            border: over ? `1px dashed ${s.c}` : pageActive ? `1px solid ${s.bd}` : "1px solid transparent",
                            cursor: "grab",
                            color: pageActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                            opacity: pageDrag?.sectionIndex === i && pageDrag?.pageIndex === pageIndex ? 0.45 : 1,
                          }}
                        >
                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: pageActive ? s.c : "var(--color-border-secondary)", flexShrink: 0 }} />
                          <GripVertical size={10} style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }} />
                          <span
                            title={page.h}
                            style={{
                              fontSize: 10,
                              fontWeight: pageActive ? 600 : 400,
                              lineHeight: 1.35,
                              flex: 1,
                              minWidth: 0,
                              // 选中页标题完整换行展示，避免点击加粗后被省略号截断看不全
                              whiteSpace: pageActive ? "normal" : "nowrap",
                              overflow: pageActive ? "visible" : "hidden",
                              textOverflow: pageActive ? "clip" : "ellipsis",
                              wordBreak: "break-word",
                            }}
                          >
                            {pageIndex + 1}. {page.h}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {canSplit && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSplitOver(true);
            }}
            onDragLeave={() => setSplitOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSplitPage?.(pageDrag.sectionIndex, pageDrag.pageIndex);
              setPageDrag(null);
              setPageOver(null);
              setSplitOver(false);
            }}
            style={{
              marginTop: 8,
              marginLeft: 30,
              padding: "12px 10px",
              borderRadius: 8,
              border: `1.5px dashed ${splitOver ? "var(--color-text-secondary)" : "var(--color-border-secondary)"}`,
              background: splitOver ? "var(--color-background-tertiary)" : "var(--color-background-secondary)",
              color: splitOver ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
              fontSize: 11,
              textAlign: "center",
              transition: "background 0.12s, border 0.12s, color 0.12s",
            }}
          >
            <ArrowUpFromLine size={13} style={{ verticalAlign: -2, marginRight: 5 }} />
            拖到此处 → 提升为独立章节
          </div>
        )}
      </div>
    </div>
  );
}

const panelHead = {
  padding: "10px 14px",
  borderBottom: "0.5px solid var(--color-border-tertiary)",
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexShrink: 0,
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-text-secondary)",
};
