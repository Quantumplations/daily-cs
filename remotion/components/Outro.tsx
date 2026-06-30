import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{
      background: '#020617', justifyContent: 'center', alignItems: 'center', opacity,
    }}>
      <h1 style={{ fontSize: 66, color: 'white', fontWeight: 800 }}>GG — see you tomorrow</h1>
    </AbsoluteFill>
  );
};
