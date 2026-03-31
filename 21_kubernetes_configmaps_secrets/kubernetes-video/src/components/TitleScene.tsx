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

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12 } });
  const titleY = interpolate(
    spring({ frame, fps, delay: 10, config: { damping: 200 } }),
    [0, 1],
    [60, 0]
  );
  const titleOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const badgeScale = spring({
    frame,
    fps,
    delay: 35,
    config: { damping: 12 },
  });
  const lineWidth = interpolate(frame, [20, 50], [0, 600], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const k8sWheelRotation = interpolate(frame, [0, fps * 6], [0, 360]);

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
      {/* Kubernetes wheel icon */}
      <div
        style={{
          transform: `scale(${logoScale}) rotate(${k8sWheelRotation}deg)`,
          marginBottom: 30,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={COLORS.kubernetes}
            strokeWidth="4"
          />
          <circle cx="50" cy="50" r="12" fill={COLORS.kubernetes} />
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <line
              key={angle}
              x1="50"
              y1="50"
              x2={50 + 40 * Math.cos((angle * Math.PI) / 180)}
              y2={50 + 40 * Math.sin((angle * Math.PI) / 180)}
              stroke={COLORS.kubernetes}
              strokeWidth="4"
              strokeLinecap="round"
            />
          ))}
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <circle
              key={`dot-${angle}`}
              cx={50 + 40 * Math.cos((angle * Math.PI) / 180)}
              cy={50 + 40 * Math.sin((angle * Math.PI) / 180)}
              r="6"
              fill={COLORS.kubernetes}
            />
          ))}
        </svg>
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 72,
          fontWeight: 900,
          color: COLORS.white,
          textAlign: "center",
          lineHeight: 1.1,
        }}
      >
        Kubernetes
        <br />
        <span style={{ color: COLORS.configMap }}>ConfigMaps</span>
        {" & "}
        <span style={{ color: COLORS.secret }}>Secrets</span>
      </div>

      {/* Divider */}
      <div
        style={{
          width: lineWidth,
          height: 3,
          background: `linear-gradient(90deg, ${COLORS.configMap}, ${COLORS.secret})`,
          marginTop: 24,
          marginBottom: 24,
          borderRadius: 2,
        }}
      />

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          fontSize: 28,
          color: COLORS.gray,
          textAlign: "center",
        }}
      >
        Complete Guide for CKA/CKAD Exam Preparation
      </div>

      {/* Badge */}
      <div
        style={{
          transform: `scale(${badgeScale})`,
          marginTop: 30,
          padding: "10px 28px",
          borderRadius: 30,
          background: `linear-gradient(135deg, ${COLORS.kubernetes}22, ${COLORS.secondary}22)`,
          border: `1px solid ${COLORS.kubernetes}55`,
          fontSize: 18,
          color: COLORS.primary,
          fontWeight: 700,
        }}
      >
        Basic to Expert Level
      </div>
    </AbsoluteFill>
  );
};
