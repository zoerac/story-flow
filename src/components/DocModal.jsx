import { FileText, X } from "lucide-react";
import { DOC } from "../data/doc";

export function DocModal({ onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(26,25,21,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(100%, 600px)",
          maxHeight: "85vh",
          background: "var(--color-background-primary)",
          borderRadius: 12,
          border: "0.5px solid var(--color-border-tertiary)",
          boxShadow: "0 20px 60px rgba(26,25,21,0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            height: 46,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 16px",
            borderBottom: "0.5px solid var(--color-border-tertiary)",
            flexShrink: 0,
          }}
        >
          <FileText size={14} style={{ color: "#7F77DD" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", flex: 1 }}>
            {DOC.title}
          </span>
          <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginRight: 8 }}>
            {DOC.subtitle}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 24, height: 24, padding: 0, border: "none", background: "none",
              cursor: "pointer", display: "grid", placeItems: "center",
              color: "var(--color-text-tertiary)", borderRadius: 6,
            }}
            aria-label="关闭文档"
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 28px" }}>
          {DOC.sections.map((sec) => (
            <div key={sec.heading} style={{ marginBottom: 32 }}>
              <div
                style={{
                  fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)",
                  paddingBottom: 8, marginBottom: 14,
                  borderBottom: "1px solid var(--color-border-tertiary)",
                }}
              >
                {sec.heading}
              </div>
              {sec.blocks.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Block({ block }) {
  switch (block.type) {
    case "h3":
      return (
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)", margin: "14px 0 5px" }}>
          {block.text}
        </div>
      );
    case "p":
      return (
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.75, margin: "0 0 8px" }}>
          {block.text}
        </p>
      );
    case "quote":
      return (
        <div
          style={{
            fontSize: 11, color: "var(--color-text-secondary)", lineHeight: 1.7,
            borderLeft: "2.5px solid #CECBF6", paddingLeft: 10, margin: "8px 0",
            fontStyle: "italic",
          }}
        >
          {block.text}
        </div>
      );
    case "list":
      return (
        <ul style={{ margin: "4px 0 10px", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
          {block.items.map((item, i) => (
            <li key={i} style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              {item}
            </li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div style={{ overflowX: "auto", margin: "8px 0 12px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr>
                {block.rows[0].map((cell, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "6px 10px", textAlign: "left", fontWeight: 600,
                      color: "var(--color-text-primary)",
                      borderBottom: "1.5px solid var(--color-border-secondary)",
                    }}
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.slice(1).map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      style={{
                        padding: "6px 10px", color: "var(--color-text-secondary)",
                        borderBottom: i === block.rows.length - 2
                          ? "1px solid var(--color-border-secondary)"
                          : "0.5px solid var(--color-border-tertiary)",
                        lineHeight: 1.5,
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}
