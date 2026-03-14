import { ImageResponse } from "next/og"

export const alt = "SpaceOps - Facility Management & Quality Control Platform"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #1e3a5f 0%, #0f2440 60%, #0a1628 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* Accent dot */}
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 80,
            width: 48,
            height: 48,
            borderRadius: 10,
            background: "#3b82f6",
            opacity: 0.9,
          }}
        />
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 40, fontWeight: 800, color: "white" }}>S</span>
          </div>
          <span style={{ fontSize: 48, fontWeight: 700, color: "white", letterSpacing: "-1px" }}>
            SpaceOps
          </span>
        </div>
        {/* Tagline */}
        <p
          style={{
            fontSize: 36,
            color: "rgba(255,255,255,0.85)",
            fontWeight: 400,
            lineHeight: 1.4,
            maxWidth: "700px",
            margin: 0,
          }}
        >
          Facility Management & Quality Control Platform for Janitorial Services
        </p>
        {/* Features */}
        <div
          style={{
            display: "flex",
            gap: "32px",
            marginTop: "48px",
          }}
        >
          {["Inspections", "Scheduling", "Real-time Tracking", "Reports"].map(
            (label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: "#3b82f6",
                  }}
                />
                <span style={{ fontSize: 20, color: "rgba(255,255,255,0.7)" }}>
                  {label}
                </span>
              </div>
            )
          )}
        </div>
        {/* Domain */}
        <p
          style={{
            position: "absolute",
            bottom: 60,
            right: 80,
            fontSize: 22,
            color: "rgba(255,255,255,0.4)",
            margin: 0,
          }}
        >
          onyxspaceops.com
        </p>
      </div>
    ),
    { ...size }
  )
}
