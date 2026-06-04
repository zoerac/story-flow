import { ChatPanel } from "./components/ChatPanel";
import { SlidePreview } from "./components/SlidePreview";
import { StorylinePanel } from "./components/StorylinePanel";
import { Toolbar } from "./components/Toolbar";
import { VersionTree } from "./components/VersionTree";
import { useStoryflow } from "./hooks/useStoryflow";

function App() {
  const story = useStoryflow();

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={S.shell}>
        {/* SLOT:toolbar */}
        <Toolbar />
        {/* SLOT:intro */}
        <div style={S.root}>
          <StorylinePanel
            secs={story.secs}
            sel={story.sel}
            setSel={story.setSel}
            setSelPage={story.setSelPage}
            dragI={story.dragI}
            setDragI={story.setDragI}
            overI={story.overI}
            setOverI={story.setOverI}
            onDrop={story.onDrop}
          />
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
          <VersionTree vers={story.vers} curV={story.curV} restore={story.restore} />
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
    gridTemplateColumns: "200px minmax(0,1fr) 180px",
    height: 580,
    background: "var(--color-background-primary)",
  },
  col: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
};

export default App;
