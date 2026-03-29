import React from 'react';
import {
  AbsoluteFill,
  Video,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

interface VideoClipProps {
  src: string;
  label?: string;
  showLabel?: boolean;
}

export const VideoClip: React.FC<VideoClipProps> = ({
  src,
  label,
  showLabel = false,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Fade in/out transitions
  const opacity = interpolate(
    frame,
    [0, 8, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Subtle zoom effect (Ken Burns)
  const scale = interpolate(
    frame,
    [0, durationInFrames],
    [1.0, 1.08],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', opacity }}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <Video
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </AbsoluteFill>

      {/* Optional label overlay */}
      {showLabel && label && (
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: '8px 24px',
              borderRadius: 8,
            }}
          >
            <span
              style={{
                color: '#FFFFFF',
                fontSize: 20,
                fontFamily: 'Arial, sans-serif',
                fontWeight: '600',
              }}
            >
              {label}
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
