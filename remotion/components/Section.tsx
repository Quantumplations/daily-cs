import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import type { Section as SectionData } from '../../src/schema';
import { categoryStyle } from '../theme';
import { Bullet } from './Bullet';

export const Section: React.FC<{ section: SectionData }> = ({ section }) => {
  const { color, icon } = categoryStyle(section.category);
  const frame = useCurrentFrame();
  const headerY = interpolate(frame, [0, 15], [30, 0], { extrapolateRight: 'clamp' });
  const headerO = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(135deg,#0f172a,#1e293b)',
      padding: 110, justifyContent: 'center',
    }}>
      <div style={{ transform: `translateY(${headerY}px)`, opacity: headerO, marginBottom: 56 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 16, background: color,
          padding: '12px 30px', borderRadius: 999, fontSize: 34, color: 'white', fontWeight: 700,
        }}>
          <span>{icon}</span><span>{section.category}</span>
        </div>
        <h1 style={{ fontSize: 68, color: 'white', margin: '26px 0 0', fontWeight: 800 }}>
          {section.headline}
        </h1>
      </div>
      <div>
        {section.bullets.map((b, i) => (
          <Bullet key={i} text={b} index={i} color={color} />
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 64, left: 110, fontSize: 30, color: '#94a3b8' }}>
        {section.source.name}
      </div>
    </AbsoluteFill>
  );
};
