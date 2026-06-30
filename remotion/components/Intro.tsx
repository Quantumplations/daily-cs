import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Intro: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 200 } });
  const scale = interpolate(s, [0, 1], [0.8, 1]);
  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(circle at center,#1e293b,#020617)',
      justifyContent: 'center', alignItems: 'center',
    }}>
      <div style={{ transform: `scale(${scale})`, opacity: s, textAlign: 'center' }}>
        <div style={{ fontSize: 42, letterSpacing: 14, color: '#f59e0b', fontWeight: 700 }}>
          DAILY CS
        </div>
        <h1 style={{ fontSize: 84, color: 'white', margin: '22px 0 0', fontWeight: 900 }}>
          {title}
        </h1>
      </div>
    </AbsoluteFill>
  );
};
