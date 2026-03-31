import React from "react";
import { Composition } from "remotion";
import { KubernetesVideo } from "./KubernetesVideo";
import { FPS, WIDTH, HEIGHT } from "./components/constants";

// 9 scenes * 180 frames - 8 transitions * 15 frames = 1620 - 120 = 1500 frames
const TOTAL_DURATION = 9 * 6 * FPS - 8 * 15;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="KubernetesConfigMapsSecrets"
      component={KubernetesVideo}
      durationInFrames={TOTAL_DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
