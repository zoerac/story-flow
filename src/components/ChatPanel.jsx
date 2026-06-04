import { useState } from "react";
import { Bot, RotateCcw, Send, Sparkles } from "lucide-react";

export function ChatPanel({ msgs, send, thinking, chatEnd }) {
  const [inp, setInp] = useState("");

  const submit = () => {
    if (!inp.trim()) return;
    send(inp);
    setInp("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
      <div style={panelHead}>
        <Bot size={14} style={{ color: "#1D9E75" }} /> AI 助手
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
        {msgs.map((m, i) => (
          <div key={`${m.from}-${i}`} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", marginBottom: 6 }}>
            <div
              style={{
                padding: "7px 11px",
                borderRadius: 10,
                maxWidth: "88%",
                fontSize: 12,
                lineHeight: 1.65,
                background: m.from === "user" ? "#EEEDFE" : m.from === "sys" ? "var(--color-background-secondary)" : "#E1F5EE",
                color: m.from === "user" ? "#3C3489" : m.from === "sys" ? "var(--color-text-tertiary)" : "#085041",
                fontStyle: m.from === "sys" ? "italic" : "normal",
                borderBottomRightRadius: m.from === "user" ? 3 : 10,
                borderBottomLeftRadius: m.from !== "user" ? 3 : 10,
              }}
            >
              {m.from === "sys" && <RotateCcw size={10} style={{ marginRight: 4, verticalAlign: -1 }} />}
              {m.from === "ai" && i > 0 && <Sparkles size={10} style={{ marginRight: 4, verticalAlign: -1 }} />}
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div style={{ display: "flex", marginBottom: 6 }}>
            <div style={{ padding: "7px 11px", borderRadius: 10, borderBottomLeftRadius: 3, background: "#E1F5EE", color: "#085041", fontSize: 12 }}>
              思考中...
            </div>
          </div>
        )}
        <div ref={chatEnd} />
      </div>
      <div style={{ padding: "8px 12px", borderTop: "0.5px solid var(--color-border-tertiary)", display: "flex", gap: 6, flexShrink: 0 }}>
        <input
          value={inp}
          onChange={(e) => setInp(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && submit()}
          placeholder="输入你的想法，如：把结论提前试试..."
          style={{
            flex: 1,
            fontSize: 12,
            padding: "7px 10px",
            borderRadius: 8,
            border: "0.5px solid var(--color-border-tertiary)",
            background: "var(--color-background-secondary)",
            color: "var(--color-text-primary)",
            outline: "none",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--color-border-secondary)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--color-border-tertiary)";
          }}
        />
        <button
          type="button"
          onClick={submit}
          style={{
            padding: "6px 12px",
            fontSize: 12,
            borderRadius: 8,
            cursor: "pointer",
            background: "#7F77DD",
            color: "#fff",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: 4,
            opacity: inp.trim() ? 1 : 0.5,
            transition: "opacity 0.15s",
          }}
        >
          <Send size={12} /> 发送
        </button>
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
