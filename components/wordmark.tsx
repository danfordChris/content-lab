export function Wordmark({ size = 15 }: { size?: number }) {
  return (
    <span className="mono font-medium" style={{ fontSize: size }}>
      <span style={{ color: "#8a8a90" }}>&lt;</span>
      <span style={{ color: "#fff" }}>Danford</span>
      <span style={{ color: "#2563eb" }}>Chris</span>
      <span style={{ color: "#8a8a90" }}>/&gt;</span>
    </span>
  );
}
