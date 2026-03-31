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

const SecurityCard: React.FC<{
  title: string;
  items: string[];
  color: string;
  delay: number;
  icon: string;
}> = ({ title, items, color, delay, icon }) => {
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
        padding: 28,
        borderTop: `3px solid ${color}`,
        flex: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
        <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.white }}>{title}</div>
      </div>
      {items.map((item, i) => {
        const itemDelay = delay + 10 + i * 6;
        const itemProgress = spring({ frame, fps, delay: itemDelay, config: { damping: 200 } });
        return (
          <div
            key={i}
            style={{
              opacity: itemProgress,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div style={{ color, fontSize: 14, marginTop: 2 }}>●</div>
            <div style={{ fontSize: 15, color: COLORS.textSecondary, lineHeight: 1.5 }}>{item}</div>
          </div>
        );
      })}
    </div>
  );
};

const ProviderBar: React.FC<{
  name: string;
  strength: number;
  color: string;
  delay: number;
  description: string;
}> = ({ name, strength, color, delay, description }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, delay, config: { damping: 200 } });
  const barWidth = interpolate(progress, [0, 1], [0, strength]);

  return (
    <div style={{ opacity: progress, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.white }}>{name}</span>
        <span style={{ fontSize: 12, color: COLORS.gray }}>{description}</span>
      </div>
      <div style={{ background: `${COLORS.grayDark}44`, borderRadius: 6, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${barWidth}%`, height: "100%", background: color, borderRadius: 6 }} />
      </div>
    </div>
  );
};

export const SecurityScene: React.FC = () => {
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
      <div style={{ opacity: headerOpacity, fontSize: 20, color: COLORS.red, fontWeight: 700, textTransform: "uppercase", letterSpacing: 4, marginBottom: 12 }}>
        Security
      </div>
      <div style={{ opacity: headerOpacity, fontSize: 48, fontWeight: 900, color: COLORS.white, marginBottom: 36 }}>
        Security Best Practices
      </div>

      <div style={{ display: "flex", gap: 24, marginBottom: 30 }}>
        <SecurityCard
          delay={10}
          icon="🔒"
          title="Encryption at Rest"
          color={COLORS.red}
          items={[
            "Secrets are base64-encoded, NOT encrypted by default",
            "Enable EncryptionConfiguration on API server",
            "Use KMS providers (AWS KMS, GCP KMS) for production",
          ]}
        />
        <SecurityCard
          delay={30}
          icon="🛡️"
          title="RBAC Policies"
          color={COLORS.secondary}
          items={[
            "Use resourceNames to restrict to specific secrets",
            "Grant only 'get', never 'list' or 'watch' unless needed",
            "Use ServiceAccounts, not user accounts, for apps",
          ]}
        />
        <SecurityCard
          delay={50}
          icon="🔑"
          title="External Managers"
          color={COLORS.green}
          items={[
            "HashiCorp Vault with Agent Injector",
            "External Secrets Operator (ESO)",
            "Sealed Secrets for GitOps-safe encryption",
          ]}
        />
      </div>

      {/* Encryption providers strength */}
      <div style={{ background: COLORS.bgCard, borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 16, color: COLORS.gray, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: 2 }}>
          Encryption Providers (strongest to weakest)
        </div>
        <ProviderBar name="KMS v2" strength={100} color={COLORS.green} delay={70} description="External KMS — RECOMMENDED" />
        <ProviderBar name="aescbc" strength={80} color={COLORS.primary} delay={78} description="AES-CBC, key stored locally" />
        <ProviderBar name="aesgcm" strength={65} color={COLORS.yellow} delay={86} description="AES-GCM, must rotate keys" />
        <ProviderBar name="secretbox" strength={70} color={COLORS.orange} delay={94} description="XSalsa20 + Poly1305" />
        <ProviderBar name="identity" strength={10} color={COLORS.red} delay={102} description="NO encryption (default!)" />
      </div>
    </AbsoluteFill>
  );
};
