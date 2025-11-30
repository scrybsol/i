import React, { useEffect, useRef, useState } from 'react';

interface MuxPlayerProps {
  playbackId: string;
  thumbnailUrl?: string;
  title?: string;
  onDurationChange?: (duration: number) => void;
  onViewTracked?: () => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'mux-player': MuxPlayerElement;
    }
  }
}

interface MuxPlayerElement extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> {
  'playback-id'?: string;
  'poster'?: string;
  'metadata-video-title'?: string;
  'stream-type'?: string;
  'controls'?: boolean;
  ref?: React.Ref<HTMLElement>;
}

export default function MuxPlayer({
  playbackId,
  thumbnailUrl,
  title,
  onDurationChange,
  onViewTracked,
}: MuxPlayerProps) {
  const playerRef = useRef<HTMLElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    // Load Mux Player script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mux/mux-player';
    script.async = true;
    script.onload = () => {
      setPlayerReady(true);
      setError(null);
    };
    script.onerror = () => {
      setError('Failed to load Mux Player');
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!playerRef.current || !playerReady) return;

    const player = playerRef.current as any;

    const handlePlay = () => {
      setIsPlaying(true);
      if (!hasTrackedView && onViewTracked) {
        setHasTrackedView(true);
        onViewTracked();
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleDurationChange = () => {
      if (onDurationChange && player.duration) {
        onDurationChange(player.duration);
      }
    };

    if (player.addEventListener) {
      player.addEventListener('play', handlePlay);
      player.addEventListener('pause', handlePause);
      player.addEventListener('durationchange', handleDurationChange);
    }

    return () => {
      if (player.removeEventListener) {
        player.removeEventListener('play', handlePlay);
        player.removeEventListener('pause', handlePause);
        player.removeEventListener('durationchange', handleDurationChange);
      }
    };
  }, [playerReady, onDurationChange, onViewTracked, hasTrackedView]);

  if (!playerReady) {
    return (
      <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center">
        <p className="text-gray-400">Loading player...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-gray-400 text-xs mt-2">Playback ID: {playbackId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
      <mux-player
        ref={playerRef}
        playback-id={playbackId}
        poster={thumbnailUrl}
        metadata-video-title={title || 'Video'}
        stream-type="on-demand"
        controls
      />
    </div>
  );
}
