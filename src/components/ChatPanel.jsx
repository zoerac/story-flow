import { useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, MessagesSquare, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { AI_FOCUS } from "../data/focus";

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const MAX_BUBBLES = 3;
const DISMISS_MS = 6000;
const LEAVE_MS = 180;

// NOTE for Codex: App.jsx needs to pass these props to <ChatPanel>:
//   dragI={story.dragI}  focusedSection={story.focusedSection}
//   setFocusedSection={story.setFocusedSection}  addMsg={story.addMsg}  secs={story.secs}
// 浮层形态：中列只保留底部对话框，最近消息以浮层气泡淡入浮现在输入框上方，数秒后自动淡出（悬停暂停、点击固定）。
export function ChatPanel({ msgs, send, thinking, chatEnd, restore, dragI, focusedSection, setFocusedSection, addMsg, secs }) {
  const [inp, setInp] = useState("");
  const [localThinking, setLocalThinking] = useState(false);
  const [bubbles, setBubbles] = useState([]); // { key, from, text, action, leaving, pinned }
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const seen = useRef(0);
  const timers = useRef({});

  const scheduleDismiss = (key) => {
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => {
      setBubbles((prev) => prev.map((b) => (b.key === key ? { ...b, leaving: true } : b)));
      timers.current[key] = setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.key !== key));
        delete timers.current[key];
      }, LEAVE_MS);
    }, DISMISS_MS);
  };

  // 监听消息增量：把新消息转为浮层气泡，并各自排期自动淡出
  useEffect(() => {
    if (msgs.length <= seen.current) return;
    const fresh = msgs.slice(seen.current).map((m, idx) => ({ key: seen.current + idx, ...m }));
    seen.current = msgs.length;
    setBubbles((prev) => [...prev, ...fresh].slice(-MAX_BUBBLES));
    fresh.forEach((b) => scheduleDismiss(b.key));
  }, [msgs]);

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const pauseDismiss = (key) => clearTimeout(timers.current[key]);
  const resumeDismiss = (key, pinned) => {
    if (!pinned) scheduleDismiss(key);
  };
  const togglePin = (key) => {
    setBubbles((prev) =>
      prev.map((b) => {
        if (b.key !== key) return b;
        const pinned = !b.pinned;
        if (pinned) clearTimeout(timers.current[key]);
        else scheduleDismiss(key);
        return { ...b, pinned, leaving: false };
      }),
    );
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDropActive(false);
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

  const isThinking = thinking || localThinking;

  return (
    <div style={wrap} onDragOver={(e) => e.preventDefault()}>
      <div
        style={{ ...stack, pointerEvents: "auto" }}
        onDragOver={(e) => {
          e.preventDefault();
          if (dragI != null) setDropActive(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDropActive(false);
        }}
        onDrop={handleDrop}
      >
        {/* 展开的完整对话历史（默认收起，避免遮挡幻灯） */}
        {historyOpen && (
          <div className="anim-bubble-in" style={historyCard}>
            <div style={historyHead}>
              <MessagesSquare size={12} style={{ color: "#1D9E75" }} /> 对话历史
              <button type="button" onClick={() => setHistoryOpen(false)} style={historyClose} aria-label="收起历史">
                <ChevronDown size={13} />
              </button>
            </div>
            <div style={historyScroll}>
              {msgs.map((m, i) => (
                <HistoryRow key={`${m.from}-${i}`} m={m} restore={restore} />
              ))}
              <div ref={chatEnd} />
            </div>
          </div>
        )}

        {/* 浮层气泡区：最近消息淡入浮现，悬停暂停、点击固定 */}
        {!historyOpen && (
          <div style={bubbleArea}>
            {bubbles.map((b) => (
              <FloatingBubble
                key={b.key}
                bubble={b}
                restore={restore}
                onPin={() => togglePin(b.key)}
                onPause={() => pauseDismiss(b.key)}
                onResume={() => resumeDismiss(b.key, b.pinned)}
              />
            ))}
            {isThinking && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div className="anim-bubble-in" style={{ ...bubbleBase, ...aiBubble, display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 0.15, 0.3].map((delay) => (
                    <span
                      key={delay}
                      className="anim-blink"
                      style={{ display: "block", width: 6, height: 6, borderRadius: "50%", background: "#1D9E75", animationDelay: `${delay}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 单一对话框 */}
        <div style={{ ...inputCard, borderColor: dropActive ? "#7F77DD" : "var(--color-border-tertiary)", boxShadow: dropActive ? "0 0 0 2px rgba(127,119,221,0.25)" : "0 4px 16px rgba(26,25,21,0.08)" }}>
          <div style={inputTopRow}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--color-text-tertiary)" }}>
              <Bot size={12} style={{ color: "#1D9E75" }} /> AI 助手
            </span>
            {focusedSection ? (
              <span style={focusChip}>
                <Sparkles size={9} style={{ color: "#7F77DD" }} />
                聚焦：{focusedSection.title}
                <button type="button" onClick={() => setFocusedSection?.(null)} style={focusChipClose} aria-label="退出聚焦模式">
                  <X size={9} />
                </button>
              </span>
            ) : (
              <span style={{ fontSize: 10, color: dropActive ? "#7F77DD" : "var(--color-text-tertiary)" }}>
                {dropActive ? "松开进入聚焦分析" : "可拖入章节卡片深聊"}
              </span>
            )}
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              style={{ ...historyToggle, color: historyOpen ? "#3C3489" : "var(--color-text-tertiary)", background: historyOpen ? "#EEEDFE" : "transparent" }}
              aria-label="对话历史"
              title="对话历史"
            >
              <MessagesSquare size={13} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={inp}
              onChange={(e) => setInp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && submit()}
              placeholder={focusedSection ? `关于「${focusedSection.title}」的想法...` : "输入你的想法，如：把结论提前试试..."}
              style={{
                flex: 1,
                fontSize: 12,
                padding: "8px 10px",
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
      </div>
    </div>
  );
}

function FloatingBubble({ bubble, restore, onPin, onPause, onResume }) {
  const isUser = bubble.from === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div
        className={bubble.leaving ? "anim-bubble-out" : "anim-bubble-in"}
        onMouseEnter={onPause}
        onMouseLeave={onResume}
        onClick={onPin}
        title={bubble.pinned ? "已固定（点击取消）" : "点击固定此气泡"}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: isUser ? "flex-end" : "flex-start",
          maxWidth: "82%",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            ...bubbleBase,
            ...(bubble.from === "user" ? userBubble : bubble.from === "sys" ? sysBubble : aiBubble),
            borderBottomRightRadius: isUser ? 3 : 12,
            borderBottomLeftRadius: !isUser ? 3 : 12,
            boxShadow: bubble.pinned ? "0 0 0 1.5px #CECBF6, 0 6px 18px rgba(26,25,21,0.12)" : "0 6px 18px rgba(26,25,21,0.1)",
          }}
        >
          {bubble.from === "sys" && <RotateCcw size={10} style={{ marginRight: 4, verticalAlign: -1 }} />}
          {bubble.from === "ai" && bubble.key > 0 && <Sparkles size={10} style={{ marginRight: 4, verticalAlign: -1 }} />}
          {bubble.text}
        </div>
        {bubble.action && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              restore?.(bubble.action.undoTo);
            }}
            style={undoBtn}
          >
            <RotateCcw size={9} /> {bubble.action.label}
          </button>
        )}
      </div>
    </div>
  );
}

function HistoryRow({ m, restore }) {
  const isUser = m.from === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 6 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", maxWidth: "88%" }}>
        <div
          style={{
            ...bubbleBase,
            ...(m.from === "user" ? userBubble : m.from === "sys" ? sysBubble : aiBubble),
            boxShadow: "none",
            borderBottomRightRadius: isUser ? 3 : 10,
            borderBottomLeftRadius: !isUser ? 3 : 10,
          }}
        >
          {m.from === "sys" && <RotateCcw size={10} style={{ marginRight: 4, verticalAlign: -1 }} />}
          {m.text}
        </div>
        {m.action && (
          <button type="button" onClick={() => restore?.(m.action.undoTo)} style={undoBtn}>
            <RotateCcw size={9} /> {m.action.label}
          </button>
        )}
      </div>
    </div>
  );
}

const wrap = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  justifyContent: "center",
  padding: "0 16px 14px",
  pointerEvents: "none",
  zIndex: 5,
};

const stack = {
  width: "min(100%, 460px)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const bubbleArea = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  justifyContent: "flex-end",
};

const bubbleBase = {
  padding: "7px 11px",
  borderRadius: 12,
  fontSize: 12,
  lineHeight: 1.6,
};

const userBubble = { background: "#EEEDFE", color: "#3C3489" };
const aiBubble = { background: "#E1F5EE", color: "#085041" };
const sysBubble = { background: "var(--color-background-secondary)", color: "var(--color-text-tertiary)", fontStyle: "italic" };

const undoBtn = {
  marginTop: 3,
  fontSize: 10,
  color: "var(--color-text-tertiary)",
  background: "var(--color-background-primary)",
  border: "0.5px solid var(--color-border-tertiary)",
  borderRadius: 6,
  padding: "2px 8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 3,
};

const inputCard = {
  background: "var(--color-background-primary)",
  border: "0.5px solid var(--color-border-tertiary)",
  borderRadius: 12,
  padding: "8px 10px 10px",
  display: "flex",
  flexDirection: "column",
  gap: 7,
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const inputTopRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const focusChip = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  fontSize: 10,
  color: "#3C3489",
  background: "#EEEDFE",
  border: "0.5px solid #CECBF6",
  borderRadius: 12,
  padding: "2px 8px 2px 6px",
};

const focusChipClose = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
  display: "flex",
  alignItems: "center",
  color: "#5c5a52",
  marginLeft: 2,
};

const historyToggle = {
  marginLeft: "auto",
  width: 24,
  height: 24,
  padding: 0,
  border: 0,
  borderRadius: 6,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  transition: "background 0.15s, color 0.15s",
};

const historyCard = {
  background: "var(--color-background-primary)",
  border: "0.5px solid var(--color-border-tertiary)",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 8px 24px rgba(26,25,21,0.12)",
  display: "flex",
  flexDirection: "column",
  maxHeight: 280,
};

const historyHead = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 12px",
  borderBottom: "0.5px solid var(--color-border-tertiary)",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--color-text-secondary)",
};

const historyClose = {
  marginLeft: "auto",
  width: 22,
  height: 22,
  padding: 0,
  border: 0,
  background: "transparent",
  color: "var(--color-text-tertiary)",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const historyScroll = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  padding: "8px 12px",
};
