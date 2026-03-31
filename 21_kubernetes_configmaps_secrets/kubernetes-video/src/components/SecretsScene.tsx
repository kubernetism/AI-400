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
  weights: ["400"],
  subsets: ["latin"],
});

const SecretTypeRow: React.FC<{
  type: string;
  purpose: string;
  delay: number;
  color: string;
}> = ({ type, purpose, delay, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, delay, config: { damping: 200 } });
  const x = interpolate(progress, [0, 1], [-20, 0]);

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateX(${x}px)`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "10px 16px",
        borderRadius: 8,
        background: `${color}08`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div style={{ fontFamily: monoFont, fontSize: 13, color, fontWeight: 700, minWidth: 280 }}>
        {type}
      </div>
      <div style={{ fontSize: 15, color: COLORS.textSecondary }}>
        {purpose}
      </div>
    </div>
  );
};

export const SecretsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const secretTypes = [
    { type: "Opaque", purpose: "Generic, user-defined data (default)", color: COLORS.secret },
    { type: "kubernetes.io/tls", purpose: "TLS certificate + private key", color: COLORS.primary },
    { type: "kubernetes.io/dockerconfigjson", purpose: "Docker registry credentials", color: COLORS.green },
    { type: "kubernetes.io/basic-auth", purpose: "Basic authentication (user + password)", color: COLORS.yellow },
    { type: "kubernetes.io/ssh-auth", purpose: "SSH private key authentication", color: COLORS.orange },
    { type: "kubernetes.io/service-account-token", purpose: "ServiceAccount token (auto-created)", color: COLORS.secondary },
  ];

  const codeProgress = spring({ frame, fps, delay: 60, config: { damping: 200 } });
  const codeY = interpolate(codeProgress, [0, 1], [30, 0]);

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
      <div style={{ opacity: headerOpacity, fontSize: 20, color: COLORS.secret, fontWeight: 700, textTransform: "uppercase", letterSpacing: 4, marginBottom: 12 }}>
        Deep Dive
      </div>
      <div style={{ opacity: headerOpacity, fontSize: 48, fontWeight: 900, color: COLORS.white, marginBottom: 40 }}>
        <span style={{ color: COLORS.secret }}>Secrets</span> — Types & Creation
      </div>

      <div style={{ display: "flex", gap: 40, flex: 1 }}>
        {/* Left: Secret types */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 16, color: COLORS.gray, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 2 }}>
            Secret Types
          </div>
          {secretTypes.map((s, i) => (
            <SecretTypeRow key={s.type} type={s.type} purpose={s.purpose} delay={10 + i * 8} color={s.color} />
          ))}
        </div>

        {/* Right: Base64 encoding */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              opacity: codeProgress,
              transform: `translateY(${codeY}px)`,
            }}
          >
            <div style={{ fontSize: 16, color: COLORS.gray, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 2 }}>
              Base64 vs stringData
            </div>
            <div style={{ background: "#0d1117", borderRadius: 12, padding: 20, border: `1px solid ${COLORS.grayDark}44` }}>
              <pre style={{ fontFamily: monoFont, fontSize: 13, color: COLORS.textSecondary, margin: 0, lineHeight: 1.7 }}>
                <span style={{ color: COLORS.gray }}># Option A: data (base64)</span>
                {"\n"}
                <span style={{ color: COLORS.secret }}>data:</span>
                {"\n  username: "}
                <span style={{ color: COLORS.yellow }}>YWRtaW4=</span>
                {"\n  password: "}
                <span style={{ color: COLORS.yellow }}>UzNjdXIzUEBzcyE=</span>
                {"\n\n"}
                <span style={{ color: COLORS.gray }}># Option B: stringData (plain text)</span>
                {"\n"}
                <span style={{ color: COLORS.green }}>stringData:</span>
                {"\n  username: "}
                <span style={{ color: COLORS.green }}>admin</span>
                {"\n  password: "}
                <span style={{ color: COLORS.green }}>S3cur3P@ss!</span>
              </pre>
            </div>
          </div>

          {/* Tip box */}
          <TipBox frame={frame} fps={fps} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TipBox: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const scale = spring({ frame, fps, delay: 85, config: { damping: 12 } });
  return (
    <div
      style={{
        transform: `scale(${scale})`,
        background: `${COLORS.green}11`,
        border: `1px solid ${COLORS.green}33`,
        borderRadius: 12,
        padding: "14px 24px",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.green, marginBottom: 6 }}>
        CKA/CKAD Tip
      </div>
      <div style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 1.5 }}>
        stringData is write-only — it never appears in <span style={{ fontFamily: "monospace", color: COLORS.primary }}>kubectl get</span>. When both data and stringData have the same key, stringData wins.
      </div>
    </div>
  );
};
