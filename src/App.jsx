import { useRef, useState } from "react";
import { ChatPanel } from "./components/ChatPanel";
import { SlidePreview } from "./components/SlidePreview";
import { StorylinePanel } from "./components/StorylinePanel";
import { Toolbar } from "./components/Toolbar";
import { VersionTree } from "./components/VersionTree";
import { useStoryflow } from "./hooks/useStoryflow";

function App() {
  const story = useStoryflow();
  const [layout, setLayout] = useState({
    leftW: 220,
    rightW: 190,
    leftOpen: true,
    rightOpen: true,
  });
  const shellRef = useRef(null);

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
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div ref={shellRef} style={S.shell}>
        {/* SLOT:toolbar */}
        <Toolbar
          leftOpen={layout.leftOpen}
          rightOpen={layout.rightOpen}
          setLeftOpen={setLeftOpen}
          setRightOpen={setRightOpen}
        />
        {/* SLOT:intro */}
        <div
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
                commitVersion={story.commitVersion}
              />
            )}
          </div>
          <ResizeBar hidden={!layout.leftOpen} onMouseDown={startResize("left")} />
          <div style={S.col}>
            <SlidePreview
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
      </div>
    </div>
  );
}

const S = {
  shell: {
    width: "min(100%, 980px)",
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
    height: 580,
    background: "var(--color-background-primary)",
  },
  col: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
};

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
