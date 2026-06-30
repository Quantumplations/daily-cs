import React from 'react';
import { AbsoluteFill, Audio, Series, staticFile } from 'remotion';
import type { Storyboard } from '../src/schema';
import { INTRO_FRAMES, OUTRO_FRAMES, sectionDurationFrames } from '../src/timing';
import { Intro } from './components/Intro';
import { Section } from './components/Section';
import { Outro } from './components/Outro';
import { fontFamily } from './fonts';

export type DailyCSProps = Storyboard & { music?: string | null };

export const DailyCS: React.FC<DailyCSProps> = ({ title, language, sections, music }) => {
  return (
    <AbsoluteFill style={{ fontFamily: fontFamily(language) }}>
      {music ? <Audio src={staticFile(music)} volume={0.3} /> : null}
      <Series>
        <Series.Sequence durationInFrames={INTRO_FRAMES}>
          <Intro title={title} />
        </Series.Sequence>
        {sections.map((s, i) => (
          <Series.Sequence key={i} durationInFrames={sectionDurationFrames(s.bullets.length)}>
            <Section section={s} />
          </Series.Sequence>
        ))}
        <Series.Sequence durationInFrames={OUTRO_FRAMES}>
          <Outro />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
