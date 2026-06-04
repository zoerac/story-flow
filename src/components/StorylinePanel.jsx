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
    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "0.5px solid var(--color-border-tertiary)" }}>
      <div style={panelHead}>
        <BookOpen size={14} /> 故事线
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--color-text-tertiary)", fontWeight: 400 }}>
          {pageCount}p
        </span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
        {secs.map((s, i) => (
          <div
            key={s.id}
            className="anim-fade-up"
            draggable
            onDragStart={() => setDragI(i)}
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
            }}
            style={{
              animationDelay: `${Math.min(i * 40, 240)}ms`,
              padding: "8px 10px",
              marginBottom: 4,
              borderRadius: 8,
              cursor: dragI !== null ? "grabbing" : "grab",
              background:
                dragI === i
                  ? "var(--color-background-tertiary)"
                  : mergeOverI === i && dragI !== null && dragI !== i
                    ? s.bg
                    : i === sel
                      ? s.bg
                      : "transparent",
              border:
                mergeOverI === i && dragI !== null && dragI !== i
                  ? `2px solid ${s.c}`
                  : overI === i && dragI !== null && dragI !== i
                    ? `2px dashed ${s.c}`
                    : i === sel
                      ? `1.5px solid ${s.bd}`
                      : "1.5px solid transparent",
              opacity: dragI === i ? 0.35 : 1,
              transition: "background 0.12s, border 0.12s, opacity 0.12s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOpen(s.id);
                }}
                aria-label={openIds.has(s.id) ? "收起子页" : "展开子页"}
                style={{
                  width: 14,
                  height: 14,
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
                {openIds.has(s.id) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
              <GripVertical size={12} style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }} />
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.c, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500 }}>{s.title}</span>
              {mergeOverI === i && dragI !== null && dragI !== i && (
                <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 600, color: s.c, flexShrink: 0 }}>
                  并入此章 ↵
                </span>
              )}
            </div>
            <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 2, marginLeft: 25 }}>
              {s.sub}
            </div>
            {openIds.has(s.id) && (
              <div style={{ marginTop: 7, marginLeft: 25, display: "grid", gap: 3 }}>
                {s.pages.map((page, pageIndex) => {
                  const active = i === sel && pageIndex === selPage;
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
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 7px",
                        borderRadius: 6,
                        background: active ? "rgba(255,255,255,0.6)" : "transparent",
                        border: over ? `1px dashed ${s.c}` : active ? `1px solid ${s.bd}` : "1px solid transparent",
                        cursor: "grab",
                        color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                        opacity: pageDrag?.sectionIndex === i && pageDrag?.pageIndex === pageIndex ? 0.45 : 1,
                      }}
                    >
                      <GripVertical size={10} style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: active ? 500 : 400, lineHeight: 1.35 }}>
                        {pageIndex + 1}. {page.h}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
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
  fontWeight: 500,
  color: "var(--color-text-secondary)",
};
