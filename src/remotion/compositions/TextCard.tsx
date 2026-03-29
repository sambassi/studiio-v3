import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

interface TextCardProps {
  text: string;
  subtitle?: string;
  backgroundColor?: string;
  textColor?: string;
  isIntro?: boolean;
  isOutro?: boolean;
  characterUrl?: string | null;
}

export const TextCard: React.FC<TextCardProps> = ({
  text,
  subtitle,
  backgroundColor = '#7C3AED',
  textColor = '#FFFFFF',
  isIntro = false,
  isOutro = false,
  characterUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  const exitProgress = spring({
    frame: frame - (durationInFrames - 15),
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  const opacity = interpolate(
    frame,
    [0, 10, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const scale = interpolate(enterProgress, [0, 1], [0.8, 1]);
  const translateY = interpolate(exitProgress, [0, 1], [0, -50]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        padding: '40px',
      }}
    >
      {/* Decorative gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)`,
        }}
      />

      {/* Character image */}
      {characterUrl && isIntro && (
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            overflow: 'hidden',
            border: `4px solid ${textColor}`,
            marginBottom: 30,
            transform: `scale(${scale})`,
            zIndex: 1,
          }}
        >
          <img
            src={characterUrl}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Main text */}
      <div
        style={{
          transform: `scale(${scale}) translateY(${translateY}px)`,
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        <h1
          style={{
            color: textColor,
            fontSize: isIntro ? 64 : isOutro ? 48 : 56,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            textShadow: '2px 2px 8px rgba(0,0,0,0.3)',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {text}
        </h1>
        {subtitle && (
          <p
            style={{
              color: textColor,
              fontSize: 28,
              fontFamily: 'Arial, sans-serif',
              marginTop: 16,
              opacity: 0.9,
              textShadow: '1px 1px 4px rgba(0,0,0,0.3)',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Outro CTA */}
      {isOutro && (
        <div
          style={{
            marginTop: 40,
            padding: '16px 40px',
            backgroundColor: textColor,
            borderRadius: 50,
            transform: `scale(${scale})`,
            zIndex: 1,
          }}
        >
          <span
            style={{
              color: backgroundColor,
              fontSize: 24,
              fontWeight: 'bold',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            Suivez-nous!
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
