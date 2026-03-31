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

export const ComparisonScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rows = [
    { feature: "Purpose", configMap: "Non-sensitive config data", secret: "Sensitive data (passwords, tokens)" },
    { feature: "Encoding", configMap: "Plain text", secret: "Base64-encoded (at rest)" },
    { feature: "Size Limit", configMap: "1 MiB", secret: "1 MiB" },
    { feature: "Encryption", configMap: "Not encrypted", secret: "Can be encrypted at rest" },
    { feature: "Storage", configMap: "Stored on disk", secret: "tmpfs (in-memory) when mounted" },
    { feature: "RBAC", configMap: "Standard RBAC", secret: "Stricter RBAC recommended" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        fontFamily,
        padding: 80,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ opacity: headerOpacity, fontSize: 20, color: COLORS.primary, fontWeight: 700, textTransform: "uppercase", letterSpacing: 4, marginBottom: 12 }}>
        Comparison
      </div>
      <div style={{ opacity: headerOpacity, fontSize: 48, fontWeight: 900, color: COLORS.white, marginBottom: 40 }}>
        ConfigMap vs Secret
      </div>

      {/* Table */}
      <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${COLORS.grayDark}` }}>
        {/* Header row */}
        <div style={{ display: "flex", background: COLORS.bgLight }}>
          {["Feature", "ConfigMap", "Secret"].map((h, i) => {
            const headerColors = [COLORS.white, COLORS.configMap, COLORS.secret];
            const colOpacity = interpolate(frame, [5 + i * 5, 15 + i * 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={h} style={{ flex: 1, padding: "18px 24px", fontSize: 18, fontWeight: 700, color: headerColors[i], opacity: colOpacity }}>
                {h}
              </div>
            );
          })}
        </div>

        {/* Data rows */}
        {rows.map((row, i) => {
          const rowDelay = 15 + i * 8;
          const rowProgress = spring({ frame, fps, delay: rowDelay, config: { damping: 200 } });
          const rowY = interpolate(rowProgress, [0, 1], [20, 0]);
          return (
            <div
              key={row.feature}
              style={{
                display: "flex",
                opacity: rowProgress,
                transform: `translateY(${rowY}px)`,
                background: i % 2 === 0 ? `${COLORS.bgLight}88` : "transparent",
                borderTop: `1px solid ${COLORS.grayDark}44`,
              }}
            >
              <div style={{ flex: 1, padding: "14px 24px", fontSize: 16, fontWeight: 700, color: COLORS.white }}>
                {row.feature}
              </div>
              <div style={{ flex: 1, padding: "14px 24px", fontSize: 16, color: COLORS.textSecondary }}>
                {row.configMap}
              </div>
              <div style={{ flex: 1, padding: "14px 24px", fontSize: 16, color: COLORS.textSecondary }}>
                {row.secret}
              </div>
            </div>
          );
        })}
      </div>

      {/* Decision tree hint */}
      <div style={{ marginTop: 30, display: "flex", justifyContent: "center" }}>
        <DecisionHint frame={frame} fps={fps} />
      </div>
    </AbsoluteFill>
  );
};

const DecisionHint: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const scale = spring({ frame, fps, delay: 70, config: { damping: 12 } });
  return (
    <div
      style={{
        transform: `scale(${scale})`,
        background: `${COLORS.yellow}11`,
        border: `1px solid ${COLORS.yellow}44`,
        borderRadius: 12,
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <span style={{ fontSize: 28 }}>💡</span>
      <span style={{ fontSize: 18, color: COLORS.yellow, fontWeight: 700 }}>
        Is the data sensitive? → YES = Secret | NO = ConfigMap
      </span>
    </div>
  );
};
