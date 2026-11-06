import React, { useState } from 'react';
import { Volume2, VolumeX, RotateCcw, Heart, Maximize2, Minimize2, Mail } from 'lucide-react';
import { soundController } from '../utils/audio';

interface ControlsBarProps {
  onReplay: () => void;
  onOpenLetter: () => void;
  currentPhase: string;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  onReplay,
  onOpenLetter,
  currentPhase,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundController.getIsMuted());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const supportsFullscreen = typeof document !== 'undefined' && 'fullscreenEnabled' in document;

  const toggleSound = () => {
    const muted = soundController.toggleMute();
    setIsMuted(muted);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(15);
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // Fallback
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch {
        // Fallback
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-6 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-2 max-w-4xl mx-auto pointer-events-none select-none">
      {/* Current phase or romantic note badge */}
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/10 backdrop-blur-md shadow-lg text-xs text-pink-200/90 max-w-[170px] sm:max-w-none truncate">
        <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 shrink-0 animate-pulse" />
        <span className="font-medium tracking-wide truncate">
          {currentPhase === 'finale'
            ? 'Forever & Always ❤️'
            : currentPhase === 'intro'
            ? 'Starting...'
            : currentPhase
            ? `${currentPhase}`
            : 'For Vicusea'}
        </span>
      </div>

      {/* Floating control buttons with minimum 44x44px touch targets */}
      <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 p-1 rounded-full bg-white/[0.08] border border-white/10 backdrop-blur-md shadow-lg">
        {/* Love Note */}
        <button
          onClick={() => {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate?.(20);
            }
            onOpenLetter();
          }}
          title="Open Love Letter"
          aria-label="Open Love Letter"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 px-3 rounded-full text-xs font-medium text-pink-200 hover:text-white hover:bg-rose-500/25 active:scale-95 transition-all"
        >
          <Mail className="w-4 h-4 text-rose-400" />
          <span className="hidden sm:inline">Letter</span>
        </button>

        {/* Audio Mute / Unmute */}
        <button
          onClick={toggleSound}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-pink-200 hover:text-white hover:bg-white/15 active:scale-95 transition-all"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-pink-400/80" />
          ) : (
            <Volume2 className="w-4 h-4 text-rose-400" />
          )}
        </button>

        {/* Replay */}
        <button
          onClick={() => {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate?.(25);
            }
            onReplay();
          }}
          title="Replay Animation"
          aria-label="Replay Animation"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-pink-200 hover:text-white hover:bg-white/15 active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4 text-pink-300" />
        </button>

        {/* Fullscreen (if supported) */}
        {supportsFullscreen && (
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="min-h-[44px] min-w-[44px] hidden xs:flex items-center justify-center rounded-full text-pink-200 hover:text-white hover:bg-white/15 active:scale-95 transition-all"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-pink-300" />
            ) : (
              <Maximize2 className="w-4 h-4 text-pink-300" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
