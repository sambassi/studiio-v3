import React from 'react';
import { Composition } from 'remotion';
import { StudioVideoReel } from './compositions/StudioVideoReel';
import { StudioVideoTV } from './compositions/StudioVideoTV';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="StudioVideoReel"
        component={StudioVideoReel}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'Ma Video',
          subtitle: '',
          rushUrls: [] as string[],
          musicUrl: null as string | null,
          characterUrl: null as string | null,
          timeline: [] as Array<{ type: string; duration: number; label: string; text?: string }>,
          mode: 'cardio' as string,
          objectives: [] as string[],
        }}
      />
      <Composition
        id="StudioVideoTV"
        component={StudioVideoTV}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'Ma Video',
          subtitle: '',
          rushUrls: [] as string[],
          musicUrl: null as string | null,
          characterUrl: null as string | null,
          timeline: [] as Array<{ type: string; duration: number; label: string; text?: string }>,
          mode: 'cardio' as string,
          objectives: [] as string[],
        }}
      />
    </>
  );
};
