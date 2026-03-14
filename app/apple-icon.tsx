import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 36,
          background: "linear-gradient(135deg, #1e3a5f, #0f2440)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <span
          style={{
            fontSize: 120,
            fontWeight: 800,
            color: "white",
            lineHeight: 1,
          }}
        >
          S
        </span>
        <div
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "#3b82f6",
          }}
        />
      </div>
    ),
    { ...size }
  )
}
