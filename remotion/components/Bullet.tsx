import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Bullet: React.FC<{ text: string; index: number; color: string }> = ({
  text, index, color,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = 12 + index * 12;
  const enter = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const x = interpolate(enter, [0, 1], [-40, 0]);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 20,
      opacity, transform: `translateX(${x}px)`, marginBottom: 28,
    }}>
      <div style={{ width: 18, height: 18, borderRadius: 9, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 46, color: 'white', lineHeight: 1.25 }}>{text}</span>
    </div>
  );
};
