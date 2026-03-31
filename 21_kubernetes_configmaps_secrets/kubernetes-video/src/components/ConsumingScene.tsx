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

const MethodCard: React.FC<{
  delay: number;
  letter: string;
  title: string;
  description: string;
  autoUpdate: string;
  restartNeeded: string;
  color: string;
}> = ({ delay, letter, title, description, autoUpdate, restartNeeded, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, delay, config: { damping: 200 } });
  const y = interpolate(progress, [0, 1], [40, 0]);

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${y}px)`,
        background: COLORS.bgCard,
        borderRadius: 16,
        padding: 24,
        borderTop: `3px solid ${color}`,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        flex: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `${color}22`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 700,
            color,
          }}
        >
          {letter}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.white }}>
          {title}
        </div>
      </div>
      <div style={{ fontSize: 15, color: COLORS.textSecondary, lineHeight: 1.5 }}>
        {description}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: "auto" }}>
        <Tag label={`Auto-update: ${autoUpdate}`} color={autoUpdate === "YES" ? COLORS.green : COLORS.red} />
        <Tag label={`Restart: ${restartNeeded}`} color={restartNeeded === "NO" ? COLORS.green : COLORS.red} />
      </div>
    </div>
  );
};

const Tag: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <div
    style={{
      fontSize: 12,
      fontWeight: 700,
      color,
      background: `${color}15`,
      padding: "4px 10px",
      borderRadius: 6,
      border: `1px solid ${color}33`,
    }}
  >
    {label}
  </div>
);

export const ConsumingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
        Consumption Methods
      </div>
      <div style={{ opacity: headerOpacity, fontSize: 48, fontWeight: 900, color: COLORS.white, marginBottom: 40 }}>
        How Pods Use <span style={{ color: COLORS.configMap }}>ConfigMaps</span>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        <MethodCard
          delay={10}
          letter="A"
          title="Env Variables"
          description="Individual keys via valueFrom configMapKeyRef or all keys via envFrom"
          autoUpdate="NO"
          restartNeeded="YES"
          color={COLORS.primary}
        />
        <MethodCard
          delay={25}
          letter="B"
          title="Command Args"
          description="Pass config values as command-line arguments using $(VAR_NAME) syntax"
          autoUpdate="NO"
          restartNeeded="YES"
          color={COLORS.yellow}
        />
        <MethodCard
          delay={40}
          letter="C"
          title="Volume Mount"
          description="Mount as files in a directory. Each key becomes a file. Auto-updates in ~60-90s"
          autoUpdate="YES"
          restartNeeded="NO"
          color={COLORS.green}
        />
        <MethodCard
          delay={55}
          letter="D"
          title="SubPath Mount"
          description="Mount a single file without overwriting directory. Does NOT auto-update!"
          autoUpdate="NO"
          restartNeeded="YES"
          color={COLORS.red}
        />
      </div>

      {/* Warning callout */}
      <WarningBox />
    </AbsoluteFill>
  );
};

const WarningBox: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, delay: 75, config: { damping: 12 } });

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        marginTop: 30,
        background: `${COLORS.yellow}11`,
        border: `1px solid ${COLORS.yellow}33`,
        borderRadius: 12,
        padding: "16px 28px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <span style={{ fontSize: 24 }}>⚠️</span>
      <span style={{ fontSize: 17, color: COLORS.yellow, fontWeight: 600 }}>
        CKA/CKAD Gotcha: subPath mounts do NOT receive automatic updates when ConfigMap changes!
      </span>
    </div>
  );
};
