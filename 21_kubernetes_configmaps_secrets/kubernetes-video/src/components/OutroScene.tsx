import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { COLORS } from "./constants";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin"],
});

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12 } });
  const titleOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineWidth = interpolate(frame, [15, 45], [0, 500], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const topics = [
    { label: "ConfigMaps", color: COLORS.configMap },
    { label: "Secrets", color: COLORS.secret },
    { label: "Security", color: COLORS.red },
    { label: "RBAC", color: COLORS.secondary },
    { label: "Encryption", color: COLORS.green },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 40%, ${COLORS.bgLight} 0%, ${COLORS.bg} 70%)`,
        fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      {/* K8s icon */}
      <div style={{ transform: `scale(${logoScale})`, marginBottom: 24 }}>
        <svg width="80" height="80" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke={COLORS.kubernetes} strokeWidth="4" />
          <circle cx="50" cy="50" r="12" fill={COLORS.kubernetes} />
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <React.Fragment key={angle}>
              <line
                x1="50" y1="50"
                x2={50 + 40 * Math.cos((angle * Math.PI) / 180)}
                y2={50 + 40 * Math.sin((angle * Math.PI) / 180)}
                stroke={COLORS.kubernetes} strokeWidth="4" strokeLinecap="round"
              />
              <circle
                cx={50 + 40 * Math.cos((angle * Math.PI) / 180)}
                cy={50 + 40 * Math.sin((angle * Math.PI) / 180)}
                r="6" fill={COLORS.kubernetes}
              />
            </React.Fragment>
          ))}
        </svg>
      </div>

      <div style={{ opacity: titleOpacity, fontSize: 52, fontWeight: 900, color: COLORS.white, textAlign: "center" }}>
        Key Topics Covered
      </div>

      <div
        style={{
          width: lineWidth,
          height: 3,
          background: `linear-gradient(90deg, ${COLORS.configMap}, ${COLORS.secret})`,
          marginTop: 20,
          marginBottom: 30,
          borderRadius: 2,
        }}
      />

      {/* Topic pills */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        {topics.map((t, i) => {
          const pillScale = spring({ frame, fps, delay: 25 + i * 8, config: { damping: 12 } });
          return (
            <div
              key={t.label}
              style={{
                transform: `scale(${pillScale})`,
                padding: "10px 24px",
                borderRadius: 30,
                background: `${t.color}15`,
                border: `1px solid ${t.color}44`,
                fontSize: 18,
                fontWeight: 700,
                color: t.color,
              }}
            >
              {t.label}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          opacity: interpolate(frame, [50, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          marginTop: 50,
          fontSize: 22,
          color: COLORS.gray,
          textAlign: "center",
        }}
      >
        Practice with <span style={{ color: COLORS.primary, fontWeight: 700 }}>kubectl</span> and ace your CKA/CKAD exam!
      </div>
    </AbsoluteFill>
  );
};
