import React, { useState } from 'react';
import { ParticleLoveCanvas } from './components/ParticleLoveCanvas';
import { IntroOverlay } from './components/IntroOverlay';
import { ControlsBar } from './components/ControlsBar';
import { LoveLetterModal } from './components/LoveLetterModal';
import { soundController } from './utils/audio';

export default function App() {
  const [started, setStarted] = useState<boolean>(false);
  const [sessionKey, setSessionKey] = useState<number>(1);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [isLetterOpen, setIsLetterOpen] = useState<boolean>(false);

  const handleStart = async () => {
    setStarted(true);
    await soundController.playMusic();
  };

  const handleReplay = () => {
    soundController.restartMusic();
    setCurrentPhase('intro');
    setSessionKey((prev) => prev + 1);
  };

  return (
    <main className="fixed inset-0 w-full h-full h-[100dvh] overflow-hidden bg-[#050308] select-none touch-none">
      {/* Intro Overlay shown initially to capture user gesture for audio & build excitement */}
      {!started && <IntroOverlay onStart={handleStart} />}

      {/* Main Canvas with Particle System and Matrix Rain */}
      {started && (
        <ParticleLoveCanvas
          key={sessionKey}
          isPlaying={started}
          onPhaseChange={(phase) => setCurrentPhase(phase)}
          onSequenceComplete={() => setCurrentPhase('finale')}
        />
      )}

      {/* Persistent floating controls (Mute, Replay, Love Letter, Fullscreen) */}
      {started && (
        <ControlsBar
          onReplay={handleReplay}
          onOpenLetter={() => setIsLetterOpen(true)}
          currentPhase={currentPhase}
        />
      )}

      {/* Love Letter Modal */}
      <LoveLetterModal
        isOpen={isLetterOpen}
        onClose={() => setIsLetterOpen(false)}
      />
    </main>
  );
}
