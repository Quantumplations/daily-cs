import React from 'react';
import { Composition } from 'remotion';
import { DailyCS } from './DailyCS';
import { StoryboardSchema } from '../src/schema';
import { FPS, totalDurationFrames } from '../src/timing';
import sample from '../fixtures/storyboard.sample.json';

const sampleStoryboard = StoryboardSchema.parse(sample);

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="DailyCS"
      component={DailyCS}
      durationInFrames={totalDurationFrames(sampleStoryboard)}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ ...sampleStoryboard, music: null }}
      calculateMetadata={({ props }) => {
        const sb = StoryboardSchema.parse(props);
        return { durationInFrames: totalDurationFrames(sb) };
      }}
    />
  );
};
