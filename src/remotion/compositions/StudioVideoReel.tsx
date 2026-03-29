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

  const sequences = timeline.map((item, index) => { const durationInFrames = Math.round(item.duration * fps); const from = currentFrame; currentFrame += durationInFrames; return { type: item.type, from, durationInFrames }; });

  return null;
};
