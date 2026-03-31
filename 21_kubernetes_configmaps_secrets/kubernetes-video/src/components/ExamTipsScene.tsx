import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { COLORS } from "./constants";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin"],
});

const { fontFamily: monoFont } = loadMono("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

const TipItem: React.FC<{
  tip: string;
  command?: string;
  delay: number;
  index: number;
}> = ({ tip, command, delay, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, delay, config: { damping: 200 } });
  const x = interpolate(progress, [0, 1], [30, 0]);

  const colors = [COLORS.primary, COLORS.green, COLORS.yellow, COLORS.orange, COLORS.secondary, COLORS.accent, COLORS.red, COLORS.configMap];
  const color = colors[index % colors.length];

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateX(${x}px)`,
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
        padding: "12px 0",
        borderBottom: `1px solid ${COLORS.grayDark}33`,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `${color}22`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 700,
          color,
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {index + 1}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, color: COLORS.white, lineHeight: 1.5, fontWeight: 600 }}>
          {tip}
        </div>
        {command && (
          <div
            style={{
              fontFamily: monoFont,
              fontSize: 13,
              color: COLORS.primary,
              background: `${COLORS.primary}11`,
              padding: "6px 12px",
              borderRadius: 6,
              marginTop: 6,
              display: "inline-block",
            }}
          >
            {command}
          </div>
        )}
      </div>
    </div>
  );
};

export const ExamTipsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tips = [
    { tip: "Use --dry-run=client -o yaml to generate YAML quickly", command: "kubectl create configmap X --from-literal=K=V --dry-run=client -o yaml" },
    { tip: "Decode secrets with jsonpath + base64", command: "kubectl get secret X -o jsonpath='{.data.password}' | base64 -d" },
    { tip: "subPath mounts do NOT auto-update when ConfigMap changes" },
    { tip: "Env vars from ConfigMaps/Secrets require pod restart to update" },
    { tip: "Use stringData for Secrets — auto-encodes to base64" },
    { tip: "Volume-mounted Secrets use tmpfs (in-memory) — never written to disk" },
    { tip: "Immutable ConfigMaps/Secrets reduce API server load at scale" },
    { tip: "API keys in ConfigMaps is an anti-pattern — always use Secrets" },
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
      <div style={{ opacity: headerOpacity, fontSize: 20, color: COLORS.yellow, fontWeight: 700, textTransform: "uppercase", letterSpacing: 4, marginBottom: 12 }}>
        Exam Preparation
      </div>
      <div style={{ opacity: headerOpacity, fontSize: 48, fontWeight: 900, color: COLORS.white, marginBottom: 36 }}>
        CKA/CKAD Exam Tips
      </div>

      <div style={{ display: "flex", gap: 40 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {tips.slice(0, 4).map((t, i) => (
            <TipItem key={i} tip={t.tip} command={t.command} delay={10 + i * 12} index={i} />
          ))}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {tips.slice(4).map((t, i) => (
            <TipItem key={i + 4} tip={t.tip} command={t.command} delay={10 + (i + 4) * 12} index={i + 4} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
