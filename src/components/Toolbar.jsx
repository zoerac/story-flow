import { GitFork } from "lucide-react";

export function Toolbar() {
  return (
    <div style={{ height: 34, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)" }}>
      <GitFork size={14} style={{ color: "#7F77DD" }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>StoryFlow Demo</span>
      <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>结构驱动演示文稿编辑器</span>
    </div>
  );
}
