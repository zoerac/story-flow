import { BookOpen, GripVertical } from "lucide-react";

export function StorylinePanel({
  secs,
  sel,
  setSel,
  setSelPage,
  dragI,
  setDragI,
  overI,
  setOverI,
  onDrop,
}) {
  const pageCount = secs.reduce((sum, s) => sum + s.pages.length, 0);

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
            draggable
            onDragStart={() => setDragI(i)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverI(i);
            }}
            onDrop={() => onDrop(i)}
            onDragEnd={() => {
              setDragI(null);
              setOverI(null);
            }}
            onClick={() => {
              setSel(i);
              setSelPage(0);
            }}
            style={{
              padding: "8px 10px",
              marginBottom: 4,
              borderRadius: 8,
              cursor: dragI !== null ? "grabbing" : "grab",
              background: dragI === i ? "var(--color-background-tertiary)" : i === sel ? s.bg : "transparent",
              border:
                overI === i && dragI !== null && dragI !== i
                  ? `2px dashed ${s.c}`
                  : i === sel
                    ? `1.5px solid ${s.bd}`
                    : "1.5px solid transparent",
              opacity: dragI === i ? 0.35 : 1,
              transition: "background 0.12s, border 0.12s, opacity 0.12s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <GripVertical size={12} style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }} />
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.c, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500 }}>{s.title}</span>
            </div>
            <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 2, marginLeft: 25 }}>
              {s.sub}
            </div>
          </div>
        ))}
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
