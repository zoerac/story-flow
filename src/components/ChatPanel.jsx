import { useState } from "react";
import { Bot, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { AI_FOCUS } from "../data/focus";

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// NOTE for Codex: App.jsx needs to pass these props to <ChatPanel>:
//   dragI={story.dragI}  focusedSection={story.focusedSection}
//   setFocusedSection={story.setFocusedSection}  addMsg={story.addMsg}  secs={story.secs}
export function ChatPanel({ msgs, send, thinking, chatEnd, restore, dragI, focusedSection, setFocusedSection, addMsg, secs }) {
  const [inp, setInp] = useState("");
  const [localThinking, setLocalThinking] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    if (dragI == null || !secs || !setFocusedSection || !addMsg) return;
    const sec = secs[dragI];
    if (!sec) return;
    setFocusedSection(sec);
    addMsg("ai", pick(AI_FOCUS)(sec.title));
  };

  const submit = () => {
    const val = inp.trim();
    if (!val) return;
    if (focusedSection && addMsg) {
      addMsg("user", val);
      setLocalThinking(true);
      setTimeout(() => {
        setLocalThinking(false);
        addMsg("ai", pick(AI_FOCUS)(focusedSection.title));
      }, 600 + Math.random() * 400);
    } else {
      send(val);
    }
    setInp("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
      <div style={panelHead}>
        <Bot size={14} style={{ color: "#1D9E75" }} /> AI 助手
        {focusedSection && (
          <span
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              color: "#3C3489",
              background: "#EEEDFE",
              border: "0.5px solid #CECBF6",
              borderRadius: 12,
              padding: "2px 8px 2px 6px",
            }}
          >
            <Sparkles size={9} style={{ color: "#7F77DD" }} />
            聚焦：{focusedSection.title}
            <button
              type="button"
              onClick={() => setFocusedSection?.(null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                color: "#5c5a52",
                marginLeft: 2,
              }}
              aria-label="退出聚焦模式"
            >
              <X size={9} />
            </button>
          </span>
        )}
      </div>

      {/* Message list — also a drop target */}
      <div
        style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {msgs.map((m, i) => (
          <div
            key={`${m.from}-${i}`}
            style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", marginBottom: 6 }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: m.from === "user" ? "flex-end" : "flex-start",
                maxWidth: "88%",
              }}
            >
              <div
                style={{
                  padding: "7px 11px",
                  borderRadius: 10,
                  fontSize: 12,
                  lineHeight: 1.65,
                  background:
                    m.from === "user" ? "#EEEDFE" : m.from === "sys" ? "var(--color-background-secondary)" : "#E1F5EE",
                  color:
                    m.from === "user" ? "#3C3489" : m.from === "sys" ? "var(--color-text-tertiary)" : "#085041",
                  fontStyle: m.from === "sys" ? "italic" : "normal",
                  borderBottomRightRadius: m.from === "user" ? 3 : 10,
                  borderBottomLeftRadius: m.from !== "user" ? 3 : 10,
                }}
              >
                {m.from === "sys" && <RotateCcw size={10} style={{ marginRight: 4, verticalAlign: -1 }} />}
                {m.from === "ai" && i > 0 && <Sparkles size={10} style={{ marginRight: 4, verticalAlign: -1 }} />}
                {m.text}
              </div>
              {m.action && (
                <button
                  type="button"
                  onClick={() => restore?.(m.action.undoTo)}
                  style={{
                    marginTop: 3,
                    fontSize: 10,
                    color: "var(--color-text-tertiary)",
                    background: "none",
                    border: "0.5px solid var(--color-border-tertiary)",
                    borderRadius: 6,
                    padding: "2px 8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <RotateCcw size={9} /> {m.action.label}
                </button>
              )}
            </div>
          </div>
        ))}
        {(thinking || localThinking) && (
          <div style={{ display: "flex", marginBottom: 6 }}>
            <div
              style={{
                padding: "9px 14px",
                borderRadius: 10,
                borderBottomLeftRadius: 3,
                background: "#E1F5EE",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {[0, 0.15, 0.3].map((delay) => (
                <span
                  key={delay}
                  className="anim-blink"
                  style={{
                    display: "block",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#1D9E75",
                    animationDelay: `${delay}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={chatEnd} />
      </div>

      {/* Drop hint when no focusedSection and secs available */}
      {!focusedSection && secs && (
        <div
          style={{
            padding: "4px 12px",
            fontSize: 10,
            color: "var(--color-text-tertiary)",
            textAlign: "center",
            borderTop: "0.5px solid var(--color-border-tertiary)",
          }}
        >
          拖入章节卡片进入聚焦分析模式
        </div>
      )}

      <div
        style={{
          padding: "8px 12px",
          borderTop: "0.5px solid var(--color-border-tertiary)",
          display: "flex",
          gap: 6,
          flexShrink: 0,
        }}
      >
        <input
          value={inp}
          onChange={(e) => setInp(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && submit()}
          placeholder={focusedSection ? `关于「${focusedSection.title}」的想法...` : "输入你的想法，如：把结论提前试试..."}
          style={{
            flex: 1,
            fontSize: 12,
            padding: "7px 10px",
            borderRadius: 8,
            border: `0.5px solid ${focusedSection ? "#CECBF6" : "var(--color-border-tertiary)"}`,
            background: focusedSection ? "#FAFAFE" : "var(--color-background-secondary)",
            color: "var(--color-text-primary)",
            outline: "none",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = focusedSection ? "#7F77DD" : "var(--color-border-secondary)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = focusedSection ? "#CECBF6" : "var(--color-border-tertiary)";
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
            background: focusedSection ? "#7F77DD" : "#7F77DD",
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
