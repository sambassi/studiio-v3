import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useVideoConfig,
} from 'remotion';
import { TextCard } from './TextCard';
import { VideoClip } from './VideoClip';

interface TimelineItem {
  type: string;
  duration: number;
  label: string;
  text?: string;
}

interface StudioVideoReelProps {
  title: string;
  subtitle: string;
  rushUrls: string[];
  musicUrl: string | null;
  characterUrl: string | null;
  timeline: TimelineItem[];
  mode: string;
  objectives: string[];
}

const MODE_COLORS: Record<string, string> = {
  cardio: '#EF4444',
  musculation: '#3B82F6',
  yoga: '#10B981',
  temoignage: '#8B5CF6',
  tutoriel: '#F59E0B',
  default: '#7C3AED',
};

export const StudioVideoReel: React.FC<StudioVideoReelProps> = ({
  title,
  subtitle,
  rushUrls,
  musicUrl,
  characterUrl,
  timeline,
  mode,
  objectives,
}) => {
  const { fps } = useVideoConfig();
  const accentColor = MODE_COLORS[mode] || MODE_COLORS.default;

  let rushIndex = 0;
  let currentFrame = 0;

  const sequences = timeline.map((item, index) => {
    const durationInFrames = Math.round(item.duration * fps);
    const from = currentFrame;
    currentFrame += durationInFrames;

    if (item.type === 'intro') {
      return (
        <Sequence key={`seq-${index}`} from={from} durationInFrames={durationInFrames}>
          <TextCard
            text={title}
            subtitle={subtitle}
            backgroundColor={accentColor}
            textColor="#FFFFFF"
            isIntro
            characterUrl={characterUrl}
          />
        </Sequence>
      );
    }

    if (item.type === 'text') {
      return (
        <Sequence key={`seq-${index}`} from={from} durationInFrames={durationInFrames}>
          <TextCard
            text={item.text || item.label}
            backgroundColor={accentColor}
            textColor="#FFFFFF"
          />
        </Sequence>
      );
    }

    if (item.type === 'objective') {
      const objIndex = objectives.findIndex((o) => o === item.text);
      const objNumber = objIndex >= 0 ? objIndex + 1 : index;
      return (
        <Sequence key={`seq-${index}`} from={from} durationInFrames={durationInFrames}>
          <TextCard
            text={item.text || item.label}
            subtitle={`Objectif ${objNumber}`}
            backgroundColor={accentColor}
            textColor="#FFFFFF"
          />
        </Sequence>
      );
    }

    if (item.type === 'video') {
      const url = rushUrls[rushIndex] || '';
      rushIndex++;
      return (
        <Sequence key={`seq-${index}`} from={from} durationInFrames={durationInFrames}>
          <VideoClip
            src={url}
            label={item.label}
            showLabel={!!item.label}
          />
        </Sequence>
      );
    }

    if (item.type === 'outro') {
      return (
        <Sequence key={`seq-${index}`} from={from} durationInFrames={durationInFrames}>
          <TextCard
            text={item.text || 'Merci !'}
            subtitle="studiio.pro"
            backgroundColor={accentColor}
            textColor="#FFFFFF"
            isOutro
          />
        </Sequence>
      );
    }

    // Fallback: treat as text card
    return (
      <Sequence key={`seq-${index}`} from={from} durationInFrames={durationInFrames}>
        <TextCard
          text={item.label}
          backgroundColor={accentColor}
          textColor="#FFFFFF"
        />
      </Sequence>
    );
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {sequences}

      {/* Background music */}
      {musicUrl && (
        <Audio src={musicUrl} volume={0.3} />
      )}
    </AbsoluteFill>
  );
};
