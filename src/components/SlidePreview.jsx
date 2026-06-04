import { useEffect, useRef, useState } from "react";
import { Crosshair } from "lucide-react";
import { PROPOSALS } from "../data/proposals";
import { SelectionProposal } from "./SelectionProposal";

// NOTE for Codex: App.jsx needs to pass commitVersion={story.commitVersion} addMsg={story.addMsg}
// to <SlidePreview> for the approve action to write to the version tree.
export function SlidePreview({ secs, sel, setSel, selPage, setSelPage, commitVersion, addMsg }) {
  const curSec = secs[sel];
  const curPage = curSec?.pages[selPage] || curSec?.pages[0];

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [selRect, setSelRect] = useState(null);
  const [showIntent, setShowIntent] = useState(false);
  const [intentText, setIntentText] = useState("");
  const [activeProposal, setActiveProposal] = useState(null);

  const overlayRef = useRef(null);
  const selRectRef = useRef(null);
  const intentInputRef = useRef(null);

  useEffect(() => {
    selRectRef.current = selRect;
  }, [selRect]);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e) => {
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect || !dragStart) return;
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      const r = {
        x: Math.min(dragStart.x, x),
        y: Math.min(dragStart.y, y),
        w: Math.abs(x - dragStart.x),
        h: Math.abs(y - dragStart.y),
      };
      selRectRef.current = r;
      setSelRect(r);
    };

    const onUp = () => {
      setIsDragging(false);
      const r = selRectRef.current;
      if (r && r.w * r.h > 400) {
        setShowIntent(true);
        setTimeout(() => intentInputRef.current?.focus(), 50);
      } else {
        setSelRect(null);
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, dragStart]);

  const handleOverlayMouseDown = (e) => {
    e.preventDefault();
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDragging(true);
    setSelRect(null);
    setShowIntent(false);
    setIntentText("");
  };

  const submitIntent = () => {
    const text = intentText.trim();
    if (!text) return;
    setShowIntent(false);
    setSelRect(null);
    setActiveProposal({ intent: text, originalText: curPage?.b ?? "" });
  };

  const handleApprove = (newText) => {
    if (commitVersion) {
      const nextSecs = structuredClone(secs);
      nextSecs[sel].pages[selPage].b = newText;
      commitVersion(`框选提案·${activeProposal.intent.slice(0, 8)}`, nextSecs);
    }
    addMsg?.("sys", "方案已合并进版本树");
    setActiveProposal(null);
    setIntentText("");
  };

  const handleReject = () => {
    setActiveProposal(null);
    setIntentText("");
  };

  return (
    <div
      style={{
        padding: "14px 16px",
        background: "var(--color-background-tertiary)",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Hint */}
      {!activeProposal && !showIntent && (
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 10,
            fontSize: 9,
            color: "var(--color-text-tertiary)",
            display: "flex",
            alignItems: "center",
            gap: 3,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <Crosshair size={9} /> 框选生成提案
        </div>
      )}

      {/* SelectionProposal overlay */}
      {activeProposal && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            background: "rgba(250,249,245,0.97)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "14px 16px",
          }}
        >
          <SelectionProposal
            originalText={activeProposal.originalText}
            intent={activeProposal.intent}
            proposals={PROPOSALS}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>
      )}

      {/* Slide card */}
      <div
        style={{
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
        }}
      >
        {/* Selectable text content area */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ width: 28, height: 3, borderRadius: 2, background: curSec?.c, marginBottom: 10 }} />
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 5 }}>{curPage?.h}</div>
          <div style={{ fontSize: 10, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            {curPage?.b}
          </div>

          {/* Transparent drag-to-select overlay */}
          {!activeProposal && (
            <div
              ref={overlayRef}
              style={{
                position: "absolute",
                inset: 0,
                cursor: isDragging ? "crosshair" : "cell",
                zIndex: 2,
              }}
              onMouseDown={handleOverlayMouseDown}
            />
          )}

          {/* Selection rectangle */}
          {selRect && !showIntent && (
            <div
              style={{
                position: "absolute",
                left: selRect.x,
                top: selRect.y,
                width: selRect.w,
                height: selRect.h,
                border: "1.5px dashed #7F77DD",
                background: "rgba(127, 119, 221, 0.1)",
                borderRadius: 2,
                pointerEvents: "none",
                zIndex: 3,
              }}
            />
          )}
        </div>

        {/* Page dots — above overlay stack */}
        <div style={{ display: "flex", gap: 4, marginTop: 12, position: "relative", zIndex: 4 }}>
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

      {/* Intent input popup */}
      {showIntent && (
        <div
          style={{
            position: "absolute",
            bottom: 58,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            background: "var(--color-background-primary)",
            border: "0.5px solid #CECBF6",
            borderRadius: 8,
            padding: "7px 8px",
            display: "flex",
            gap: 6,
            boxShadow: "0 4px 16px rgba(127, 119, 221, 0.18)",
            minWidth: 240,
          }}
        >
          <input
            ref={intentInputRef}
            value={intentText}
            onChange={(e) => setIntentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setShowIntent(false); setSelRect(null); }
              if (e.key === "Enter" && !e.nativeEvent.isComposing) submitIntent();
            }}
            placeholder="描述修改意图，如：换成数据驱动表述"
            style={{
              flex: 1,
              fontSize: 11,
              padding: "5px 8px",
              borderRadius: 6,
              border: "0.5px solid var(--color-border-tertiary)",
              background: "var(--color-background-secondary)",
              color: "var(--color-text-primary)",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={submitIntent}
            style={{
              padding: "5px 10px",
              fontSize: 11,
              borderRadius: 6,
              border: "none",
              background: "#7F77DD",
              color: "#fff",
              cursor: intentText.trim() ? "pointer" : "default",
              opacity: intentText.trim() ? 1 : 0.5,
              whiteSpace: "nowrap",
            }}
          >
            生成
          </button>
        </div>
      )}

      {/* Section dots */}
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
