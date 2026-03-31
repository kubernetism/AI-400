import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { COLORS } from "./constants";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin"],
});

const FadeInBox: React.FC<{
  delay: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, delay, config: { damping: 200 } });
  const y = interpolate(progress, [0, 1], [40, 0]);
  return (
    <div style={{ opacity: progress, transform: `translateY(${y}px)`, ...style }}>
      {children}
    </div>
  );
};

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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
      {/* Section header */}
      <div
        style={{
          opacity: headerOpacity,
          fontSize: 20,
          color: COLORS.primary,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 4,
          marginBottom: 12,
        }}
      >
        Introduction
      </div>
      <div
        style={{
          opacity: headerOpacity,
          fontSize: 48,
          fontWeight: 900,
          color: COLORS.white,
          marginBottom: 50,
        }}
      >
        What Are ConfigMaps & Secrets?
      </div>

      <div style={{ display: "flex", gap: 40, flex: 1 }}>
        {/* Left side - Explanation */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
          <FadeInBox delay={10}>
            <div
              style={{
                background: COLORS.bgCard,
                borderRadius: 16,
                padding: 30,
                borderLeft: `4px solid ${COLORS.primary}`,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.white, marginBottom: 10 }}>
                Kubernetes API Objects
              </div>
              <div style={{ fontSize: 18, color: COLORS.textSecondary, lineHeight: 1.6 }}>
                ConfigMaps and Secrets <span style={{ color: COLORS.primary }}>decouple configuration data</span> from
                container images, making applications portable across environments.
              </div>
            </div>
          </FadeInBox>

          <FadeInBox delay={25}>
            <div
              style={{
                background: COLORS.bgCard,
                borderRadius: 16,
                padding: 30,
                borderLeft: `4px solid ${COLORS.green}`,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.white, marginBottom: 10 }}>
                12-Factor App (Factor III)
              </div>
              <div style={{ fontSize: 18, color: COLORS.textSecondary, lineHeight: 1.6 }}>
                Store configuration in the environment, not in code.
              </div>
            </div>
          </FadeInBox>
        </div>

        {/* Right side - Cluster diagram */}
        <FadeInBox delay={15} style={{ flex: 1 }}>
          <div
            style={{
              background: `${COLORS.bgLight}`,
              borderRadius: 20,
              border: `2px solid ${COLORS.grayDark}`,
              padding: 40,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                fontSize: 16,
                color: COLORS.gray,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 3,
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              Kubernetes Cluster
            </div>

            <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
              {/* ConfigMap box */}
              <Sequence from={20} layout="none" premountFor={fps}>
                <ClusterBox
                  label="ConfigMap"
                  color={COLORS.configMap}
                  items={["DB_HOST=...", "DB_PORT=...", "LOG_LVL=..."]}
                  delay={20}
                />
              </Sequence>

              {/* Arrow */}
              <Sequence from={30} layout="none" premountFor={fps}>
                <Arrow delay={30} />
              </Sequence>

              {/* Secret box */}
              <Sequence from={35} layout="none" premountFor={fps}>
                <ClusterBox
                  label="Secret"
                  color={COLORS.secret}
                  items={["DB_PASS=...", "API_KEY=...", "TLS_CERT=.."]}
                  delay={35}
                />
              </Sequence>

              {/* Arrow */}
              <Sequence from={45} layout="none" premountFor={fps}>
                <Arrow delay={45} />
              </Sequence>

              {/* Pod box */}
              <Sequence from={50} layout="none" premountFor={fps}>
                <ClusterBox
                  label="Pod"
                  color={COLORS.green}
                  items={["App Container", "reads config", "at runtime"]}
                  delay={50}
                />
              </Sequence>
            </div>
          </div>
        </FadeInBox>
      </div>
    </AbsoluteFill>
  );
};

const ClusterBox: React.FC<{
  label: string;
  color: string;
  items: string[];
  delay: number;
}> = ({ label, color, items, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, delay, config: { damping: 12 } });

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        background: `${color}11`,
        border: `2px solid ${color}55`,
        borderRadius: 12,
        padding: 20,
        minWidth: 180,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700, color, marginBottom: 10 }}>
        {label}
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            fontSize: 13,
            color: COLORS.textSecondary,
            fontFamily: "monospace",
            lineHeight: 1.8,
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
};

const Arrow: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        display: "flex",
        alignItems: "center",
        fontSize: 28,
        color: COLORS.gray,
      }}
    >
      ➜
    </div>
  );
};
