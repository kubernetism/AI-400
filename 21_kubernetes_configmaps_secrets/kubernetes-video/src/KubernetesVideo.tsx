import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { TitleScene } from "./components/TitleScene";
import { IntroScene } from "./components/IntroScene";
import { ComparisonScene } from "./components/ComparisonScene";
import { ConfigMapScene } from "./components/ConfigMapScene";
import { ConsumingScene } from "./components/ConsumingScene";
import { SecretsScene } from "./components/SecretsScene";
import { SecurityScene } from "./components/SecurityScene";
import { ExamTipsScene } from "./components/ExamTipsScene";
import { OutroScene } from "./components/OutroScene";
import { FPS } from "./components/constants";

const SCENE_DURATION = 6 * FPS; // 6 seconds per scene
const TRANSITION_DURATION = 15; // frames

export const KubernetesVideo: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
        <TitleScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
        <IntroScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
        <ComparisonScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
        <ConfigMapScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
        <ConsumingScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
        <SecretsScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
        <SecurityScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
        <ExamTipsScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
