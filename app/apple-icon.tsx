import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
          fontSize: 92,
          fontWeight: 700,
        }}
      >
        <span style={{ color: "#8A8A8A" }}>&lt;</span>
        <span style={{ color: "#2563EB" }}>/</span>
        <span style={{ color: "#8A8A8A" }}>&gt;</span>
      </div>
    ),
    size
  );
}
