import React from 'react';
import { Heart, Volume2, Sparkles } from 'lucide-react';

interface IntroOverlayProps {
  onStart: () => void;
}

export const IntroOverlay: React.FC<IntroOverlayProps> = ({ onStart }) => {
  const handleTrigger = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([40, 60, 40]);
    }
    onStart();
  };

  return (
    <div
      onClick={handleTrigger}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050308]/92 backdrop-blur-md cursor-pointer transition-all duration-1000 select-none p-4 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(1.5rem+env(safe-area-inset-top,0px))]"
    >
      {/* Decorative ambient glow circles */}
      <div className="absolute w-72 sm:w-96 h-72 sm:h-96 bg-rose-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-64 sm:w-80 h-64 sm:h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none -translate-y-12" />

      {/* Main card */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm sm:max-w-md w-full px-6 sm:px-8 py-8 sm:py-10 rounded-3xl bg-white/[0.04] border border-white/10 shadow-[0_0_50px_rgba(244,63,94,0.18)] transition-transform hover:scale-[1.02] active:scale-[0.99]">
        {/* Pulsing neon heart */}
        <div className="relative mb-5 sm:mb-6">
          <div className="absolute inset-0 bg-rose-500/40 rounded-full blur-xl animate-ping" />
          <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-rose-600 via-pink-500 to-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/40 animate-heart-glow">
            <Heart className="w-9 h-9 sm:w-10 sm:h-10 text-white fill-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-wide text-white mb-2 font-display">
          For Vicusea ❤️
        </h1>
        <p className="text-xs sm:text-sm text-pink-200/70 mb-7 sm:mb-8 font-light max-w-xs">
          A personal constellation of words and sparkling particles made just for you.
        </p>

        {/* Start button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleTrigger();
          }}
          className="group relative inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-medium text-sm sm:text-base shadow-[0_0_25px_rgba(244,63,94,0.45)] hover:shadow-[0_0_35px_rgba(244,63,94,0.7)] transition-all transform active:scale-95 min-h-[50px]"
        >
          <Sparkles className="w-4 h-4 text-pink-200 group-hover:rotate-12 transition-transform" />
          <span>Press to Open</span>
          <span className="text-pink-200">❤️</span>
        </button>

        {/* Audio tip */}
        <div className="flex items-center gap-2 mt-5 sm:mt-6 text-[11px] sm:text-xs text-pink-300/60">
          <Volume2 className="w-3.5 h-3.5" />
          <span>Turn on sound for the best experience 🎧</span>
        </div>
      </div>
    </div>
  );
};
