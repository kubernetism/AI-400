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

const CodeBlock: React.FC<{
  code: string;
  delay: number;
  title?: string;
}> = ({ code, delay, title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, delay, config: { damping: 200 } });
  const y = interpolate(progress, [0, 1], [30, 0]);

  const lines = code.split("\n");
  const visibleChars = interpolate(frame, [delay, delay + lines.join("").length * 0.4], [0, lines.join("").length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let charCount = 0;
  const visibleLines = lines.map((line) => {
    const start = charCount;
    charCount += line.length;
    if (start >= visibleChars) return "";
    if (charCount <= visibleChars) return line;
    return line.substring(0, Math.floor(visibleChars - start));
  });

  return (
    <div style={{ opacity: progress, transform: `translateY(${y}px)` }}>
      {title && (
        <div style={{ fontSize: 14, color: COLORS.gray, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 2 }}>
          {title}
        </div>
      )}
      <div
        style={{
          background: "#0d1117",
          borderRadius: 12,
          padding: 20,
          border: `1px solid ${COLORS.grayDark}44`,
        }}
      >
        <pre style={{ fontFamily: monoFont, fontSize: 14, color: COLORS.textSecondary, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          {visibleLines.join("\n")}
          <span style={{ opacity: frame % 30 < 15 ? 1 : 0, color: COLORS.primary }}>▌</span>
        </pre>
      </div>
    </div>
  );
};

export const ConfigMapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const methods = [
    { icon: "1", label: "From Literals", color: COLORS.primary },
    { icon: "2", label: "From File", color: COLORS.green },
    { icon: "3", label: "From Directory", color: COLORS.yellow },
    { icon: "4", label: "From .env File", color: COLORS.orange },
    { icon: "5", label: "YAML Manifest", color: COLORS.secondary },
    { icon: "6", label: "Mixed Sources", color: COLORS.accent },
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
      <div style={{ opacity: headerOpacity, fontSize: 20, color: COLORS.configMap, fontWeight: 700, textTransform: "uppercase", letterSpacing: 4, marginBottom: 12 }}>
        Deep Dive
      </div>
      <div style={{ opacity: headerOpacity, fontSize: 48, fontWeight: 900, color: COLORS.white, marginBottom: 40 }}>
        <span style={{ color: COLORS.configMap }}>ConfigMaps</span> — Creating
      </div>

      <div style={{ display: "flex", gap: 40, flex: 1 }}>
        {/* Left: Creation methods */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          {methods.map((m, i) => {
            const delay = 10 + i * 8;
            const scale = spring({ frame, fps, delay, config: { damping: 200 } });
            const x = interpolate(scale, [0, 1], [-30, 0]);
            return (
              <div
                key={m.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  opacity: scale,
                  transform: `translateX(${x}px)`,
                  background: `${m.color}11`,
                  border: `1px solid ${m.color}33`,
                  borderRadius: 10,
                  padding: "12px 20px",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${m.color}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: m.color,
                  }}
                >
                  {m.icon}
                </div>
                <div style={{ fontSize: 17, color: COLORS.white, fontWeight: 600 }}>
                  {m.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Code example */}
        <div style={{ flex: 1.5, display: "flex", flexDirection: "column", gap: 20 }}>
          <CodeBlock
            delay={15}
            title="kubectl create (literals)"
            code={`kubectl create configmap app-config \\
  --from-literal=APP_ENV=production \\
  --from-literal=APP_PORT=8080 \\
  --from-literal=LOG_LEVEL=info`}
          />
          <CodeBlock
            delay={50}
            title="Declarative YAML"
            code={`apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_ENV: "production"
  APP_PORT: "8080"
  LOG_LEVEL: "info"`}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
