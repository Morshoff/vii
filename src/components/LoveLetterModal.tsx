import React, { useState } from 'react';
import { X, Heart, Sparkles, Copy, Check, Send } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundController } from '../utils/audio';

interface LoveLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoveLetterModal: React.FC<LoveLetterModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [letterText, setLetterText] = useState<string>(
    'Викуся, ты самая прекрасная и нежная. С каждым ударом сердца я понимаю, как сильно люблю тебя. Ты — мой свет, моя радость и моё бесконечное вдохновение. 3, 2, 1... I love you, Vicusea! ❤️'
  );

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const triggerHeartBurst = () => {
    soundController.playSparkleSound();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#ff4d6d', '#ff758f', '#ff85a1', '#f43f5e', '#ffffff'],
    });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md transition-opacity select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-lg w-full bg-[#110716]/98 border-t sm:border border-pink-500/25 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(244,63,94,0.3)] text-pink-100 max-h-[90vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
      >
        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 p-2 rounded-full text-pink-300 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center shadow-md shadow-rose-500/30 shrink-0">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white tracking-wide font-display">
              Для любимой Викуси ❤️
            </h2>
            <p className="text-xs text-pink-300/70 font-light">
              С любовью и нежностью
            </p>
          </div>
        </div>

        {/* Letter Body */}
        <div className="relative mb-5 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/5">
          {isEditing ? (
            <textarea
              value={letterText}
              onChange={(e) => setLetterText(e.target.value)}
              rows={4}
              className="w-full bg-transparent text-sm text-pink-100 focus:outline-none resize-none font-sans leading-relaxed"
              placeholder="Напишите здесь самые нежные слова для Викуси..."
            />
          ) : (
            <p className="text-sm sm:text-base text-pink-100/90 leading-relaxed font-sans italic">
              "{letterText}"
            </p>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-pink-300/60 pt-3 border-t border-white/5">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="hover:text-pink-200 transition-colors underline underline-offset-4 py-1"
            >
              {isEditing ? 'Сохранить слова' : 'Изменить текст'}
            </button>
            <span className="flex items-center gap-1 font-mono">
              3 · 2 · 1 · ❤️
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => {
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate?.([30, 30, 50]);
              }
              triggerHeartBurst();
            }}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 min-h-[48px] py-3 px-5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-medium text-sm hover:from-rose-500 hover:to-pink-500 shadow-md shadow-rose-600/30 transition-all active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            <span>Отправить сердечки ❤️</span>
          </button>

          <button
            onClick={() => {
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate?.(20);
              }
              handleCopy();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[48px] py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-pink-200 text-sm transition-all active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Ссылка скопирована!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Поделиться ссылкой</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
