import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Point,
  getHeartOutlinePoints,
  getHeartVolumePoints,
  getHeartNormal,
  sampleTextPoints,
} from '../utils/particleMath';
import { soundController } from '../utils/audio';

interface ParticleLoveCanvasProps {
  isPlaying: boolean;
  onSequenceComplete?: () => void;
  onPhaseChange?: (phase: string) => void;
}

// Particle for text & heart formation
class MainParticle {
  x: number;
  y: number;
  destX: number;
  destY: number;
  vx: number = 0;
  vy: number = 0;
  baseSize: number;
  size: number;
  color: string;
  alpha: number;
  sparkleSpeed: number;
  sparkleOffset: number;
  isStreaking: boolean = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.destX = x;
    this.destY = y;
    this.baseSize = Math.random() * 1.6 + 1.4;
    this.size = this.baseSize;
    this.sparkleSpeed = Math.random() * 0.08 + 0.03;
    this.sparkleOffset = Math.random() * Math.PI * 2;

    const palette = [
      '#ffffff', // bright diamond
      '#ffffff',
      '#ffe4e6', // soft rose
      '#fecdd3', // pale pink
      '#fda4af', // cherry bloom
      '#f43f5e', // vivid rose
      '#ec4899', // bright pink
      '#a855f7', // subtle violet glow
    ];
    this.color = palette[Math.floor(Math.random() * palette.length)];
    this.alpha = Math.random() * 0.4 + 0.6;
  }

  explode(centerX: number, centerY: number, power: number = 10) {
    const angle = Math.atan2(this.y - centerY, this.x - centerX) + (Math.random() - 0.5) * 0.7;
    const speed = (Math.random() * 0.5 + 0.3) * power;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.isStreaking = true;
  }

  update(isExploding: boolean, time: number) {
    if (isExploding) {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.972;
      this.vy *= 0.972;
    } else {
      const dx = this.destX - this.x;
      const dy = this.destY - this.y;
      this.vx += dx * 0.035;
      this.vy += dy * 0.035;
      this.vx *= 0.86;
      this.vy *= 0.86;
      this.x += this.vx;
      this.y += this.vy;
      this.isStreaking = Math.hypot(this.vx, this.vy) > 5;
    }

    // Twinkle shimmer
    this.alpha = 0.6 + 0.4 * Math.sin(time * this.sparkleSpeed + this.sparkleOffset);
  }

  draw(ctx: CanvasRenderingContext2D) {
    const speed = Math.hypot(this.vx, this.vy);

    if (this.isStreaking && speed > 2.5) {
      // Motion streak line
      ctx.beginPath();
      ctx.moveTo(this.x - this.vx * 1.8, this.y - this.vy * 1.8);
      ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = Math.min(this.size * 1.2, speed * 0.5);
      ctx.globalAlpha = Math.min(1, this.alpha * 1.2);
      ctx.stroke();
    } else {
      // Shimmering particle
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha;
      ctx.fill();

      // Soft glow for brighter particles
      if (this.size > 2) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha * 0.25;
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1.0;
  }
}

// Expanding ripple particle along heart boundary
class RippleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number = 0.9;
  maxLife: number = 90;
  life: number = 0;
  size: number;
  color: string;
  active: boolean = true;

  constructor(x: number, y: number, nx: number, ny: number, speed: number = 1.0) {
    this.x = x;
    this.y = y;
    this.vx = nx * speed;
    this.vy = ny * speed;
    this.size = Math.random() * 1.6 + 1.2;
    const colors = ['#f43f5e', '#ec4899', '#fda4af', '#ffffff'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.992;
    this.vy *= 0.992;
    this.life++;
    this.alpha = Math.max(0, 0.9 * (1 - this.life / this.maxLife));
    if (this.life >= this.maxLife) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active || this.alpha <= 0) return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

// Matrix falling stream column
interface MatrixColumn {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  headChar: string;
  length: number;
  changeTimer: number;
}

// Floating interactive heart / sparkle
interface SparkleHeart {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rotation: number;
  vRot: number;
  color: string;
  isHeart: boolean;
}

export const ParticleLoveCanvas: React.FC<ParticleLoveCanvasProps> = ({
  isPlaying,
  onSequenceComplete,
  onPhaseChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // States
  const [currentText, setCurrentText] = useState<string>('');
  const [isFinale, setIsFinale] = useState<boolean>(false);

  // Animation timeline state
  const stateRef = useRef<{
    state: 'IDLE' | 'MATRIX_INTRO' | 'SEQUENCE' | 'FINAL_HEART';
    particles: MainParticle[];
    rippleParticles: RippleParticle[];
    sparkles: SparkleHeart[];
    matrixCols: MatrixColumn[];
    isExploding: boolean;
    textOpacity: number;
    rippleTimer: number;
    time: number;
    heartScale: number;
    heartCenterX: number;
    heartCenterY: number;
    currentWordIndex: number;
    currentWord: string;
    wordOpacity: number;
    wordFontSize: number;
    wordCenterY: number;
  }>({
    state: 'IDLE',
    particles: [],
    rippleParticles: [],
    sparkles: [],
    matrixCols: [],
    isExploding: false,
    textOpacity: 0,
    rippleTimer: 0,
    time: 0,
    heartScale: 1,
    heartCenterX: 0,
    heartCenterY: 0,
    currentWordIndex: -1,
    currentWord: '',
    wordOpacity: 0,
    wordFontSize: 50,
    wordCenterY: 0,
  });

  // Matrix characters: romantic phrase "I LOVE YOU VICUSEA ❤"
  const matrixChars = ['I', 'L', 'O', 'V', 'E', 'Y', 'O', 'U', 'V', 'I', 'C', 'U', 'S', 'E', 'A', '❤', '✦'];

  // Initialize particles & matrix columns
  const initSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isMobile = w < 600;

    // Responsive particle count: ~1100 on mobile, ~1700 on desktop for 60fps
    const particleCount = isMobile
      ? Math.min(1250, Math.max(900, Math.floor((w * h) / 380)))
      : Math.min(1800, Math.max(1300, Math.floor((w * h) / 600)));

    const particles: MainParticle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new MainParticle(Math.random() * w, Math.random() * h));
    }

    // Matrix rain columns: slightly narrower on mobile
    const colStep = isMobile ? 20 : 25;
    const colCount = Math.floor(w / colStep);
    const matrixCols: MatrixColumn[] = [];
    for (let i = 0; i < colCount; i++) {
      const len = Math.floor(Math.random() * 8 + 5);
      const chars: string[] = [];
      for (let j = 0; j < len; j++) {
        chars.push(matrixChars[Math.floor(Math.random() * matrixChars.length)]);
      }
      matrixCols.push({
        x: i * colStep + 10,
        y: Math.random() * -h,
        speed: Math.random() * 0.5 + 0.35, // slow, gentle rain
        chars,
        headChar: chars[0],
        length: len,
        changeTimer: 0,
      });
    }

    stateRef.current.particles = particles;
    stateRef.current.matrixCols = matrixCols;
    stateRef.current.heartCenterX = w / 2;
    stateRef.current.heartCenterY = isMobile ? h * 0.44 : h / 2 - 15;
    stateRef.current.heartScale = isMobile ? Math.min(w / 31, h / 42) : Math.min(w, h) / 38;
  }, []);

  // Update targets for particles based on text
  const updateParticleTargets = useCallback((text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isMobile = w < 600;

    // Center Y position for text and heart
    const cy = isMobile ? h * 0.44 : h / 2 - 15;

    // Dynamic responsive font size tailored for mobile viewports
    let fontSize: number;
    if (text.length <= 2) {
      // Numbers "3", "2", "1"
      fontSize = isMobile ? Math.min(w * 0.44, 150) : Math.min(w / 3.2, h / 3.2, 190);
    } else {
      // "I love you\nVicusea" (mobile) or "I love you Vicusea" (PC)
      if (isMobile) {
        fontSize = Math.min(w / 7.6, 50);
      } else {
        fontSize = Math.min(w / 17, h / 7, 78);
      }
    }

    fontSize = Math.max(36, Math.min(fontSize, 190));

    // Store current word info for core glowing text rendering
    stateRef.current.currentWord = text;
    stateRef.current.wordOpacity = 0;
    stateRef.current.wordFontSize = fontSize;
    stateRef.current.wordCenterY = cy;

    const densityStep = isMobile ? 2 : 3;
    const textPoints = sampleTextPoints(text, w, h, fontSize, cy, densityStep);
    const particles = stateRef.current.particles;

    if (textPoints.length === 0) return;

    particles.forEach((p, idx) => {
      if (idx < textPoints.length) {
        p.destX = textPoints[idx].x;
        p.destY = textPoints[idx].y;
      } else {
        const mirrorPt = textPoints[idx % textPoints.length];
        p.destX = mirrorPt.x + (Math.random() - 0.5) * 6;
        p.destY = mirrorPt.y + (Math.random() - 0.5) * 6;
      }
    });

    soundController.playSparkleSound();
  }, []);

  // Set particle targets to form the glowing heart
  const setHeartTargets = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isMobile = w < 600;
    const cx = w / 2;
    const cy = isMobile ? h * 0.44 : h / 2 - 15;
    const scale = isMobile ? Math.min(w / 31, h / 42) : Math.min(w, h) / 38;

    stateRef.current.heartCenterX = cx;
    stateRef.current.heartCenterY = cy;
    stateRef.current.heartScale = scale;

    const particles = stateRef.current.particles;
    const heartPoints = getHeartVolumePoints(particles.length, cx, cy, scale);

    particles.forEach((p, idx) => {
      const pt = heartPoints[idx % heartPoints.length];
      p.destX = pt.x;
      p.destY = pt.y;
    });

    soundController.playSparkleSound();
    soundController.playHeartbeatSound();
  }, []);

  // Heart Ripple generation with very slow, gentle expansion
  const createHeartRipple = () => {
    const s = stateRef.current;
    const count = window.innerWidth < 600 ? 70 : 95;
    const outline = getHeartOutlinePoints(count, s.heartCenterX, s.heartCenterY, s.heartScale);
    const step = (Math.PI * 2) / count;

    outline.forEach((pt, i) => {
      const t = i * step;
      const normal = getHeartNormal(t);
      s.rippleParticles.push(
        new RippleParticle(pt.x, pt.y, normal.nx, normal.ny, Math.random() * 0.5 + 0.9)
      );
    });
  };

  // Start sequence animation with very slow romantic pacing
  const runSequence = useCallback(async () => {
    const s = stateRef.current;
    s.state = 'MATRIX_INTRO';
    onPhaseChange?.('intro');

    // Matrix rain trickle for 3.0s before countdown
    await new Promise((r) => setTimeout(r, 3000));

    s.state = 'SEQUENCE';

    // 1. Countdown: "3", "2", "1" with very slow, serene transitions (3.8s each)
    const countdown = ['3', '2', '1'];
    for (const num of countdown) {
      setCurrentText(num);
      onPhaseChange?.(num);
      updateParticleTargets(num);
      await new Promise((r) => setTimeout(r, 3800));

      // Slow, soft explosion (1.3s)
      s.isExploding = true;
      soundController.playBurstSound();
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(40);
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const cx = window.innerWidth / 2;
        const cy = s.wordCenterY || window.innerHeight / 2;
        s.particles.forEach((p) => p.explode(cx, cy, 10));
      }
      await new Promise((r) => setTimeout(r, 1300));
      s.isExploding = false;
    }

    // 2. Immediately after 3, 2, 1: "I love you Vicusea" (5.5s leisurely hold)
    const isMobile = window.innerWidth < 600;
    const loveText = isMobile ? 'I love you\nVicusea' : 'I love you Vicusea';
    setCurrentText('I love you Vicusea');
    onPhaseChange?.('I love you Vicusea');
    updateParticleTargets(loveText);
    await new Promise((r) => setTimeout(r, 5500));

    // Slow-motion burst into the finale (1.6s)
    s.isExploding = true;
    soundController.playBurstSound();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(60);
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const cx = window.innerWidth / 2;
      const cy = s.wordCenterY || window.innerHeight / 2;
      s.particles.forEach((p) => p.explode(cx, cy, 11));
    }
    await new Promise((r) => setTimeout(r, 1600));
    s.isExploding = false;

    // 3. Finale: Grand Heart Formation
    s.state = 'FINAL_HEART';
    setCurrentText('❤️');
    setIsFinale(true);
    onPhaseChange?.('finale');
    setHeartTargets();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([60, 40, 80]);
    }

    // Trigger celebratory heart confetti
    try {
      confetti({
        particleCount: window.innerWidth < 600 ? 55 : 85,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#f43f5e', '#fb7185', '#fda4af', '#ffffff', '#ec4899'],
        shapes: ['circle'],
        ticks: 260,
      });
    } catch {
      // Ignore
    }

    onSequenceComplete?.();
  }, [updateParticleTargets, setHeartTargets, onPhaseChange, onSequenceComplete]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      // Limit DPR to 2 to prevent mobile GPUs from lagging
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMobile = w < 600;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform before scaling
      ctx.scale(dpr, dpr);

      stateRef.current.heartCenterX = w / 2;
      stateRef.current.heartCenterY = isMobile ? h * 0.44 : h / 2 - 15;
      stateRef.current.heartScale = isMobile ? Math.min(w / 31, h / 42) : Math.min(w, h) / 38;

      if (stateRef.current.particles.length === 0) {
        initSimulation();
      } else if (stateRef.current.state === 'FINAL_HEART') {
        setHeartTargets();
      } else if (stateRef.current.state === 'SEQUENCE' && stateRef.current.currentWord) {
        updateParticleTargets(stateRef.current.currentWord);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    const render = () => {
      const s = stateRef.current;
      s.time += 0.024; // gentle, slower simulation step
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMobile = w < 600;

      // Dark trailing fade for motion blur effect
      ctx.fillStyle = 'rgba(5, 3, 8, 0.28)';
      ctx.fillRect(0, 0, w, h);

      // 1. Draw Matrix Rain
      ctx.font = isMobile ? '12px monospace' : '14px monospace';
      s.matrixCols.forEach((col) => {
        col.y += col.speed;
        if (col.y > h + 150) {
          col.y = -Math.random() * 200 - 50;
          col.speed = Math.random() * 0.5 + 0.35;
        }

        col.changeTimer++;
        if (col.changeTimer % 18 === 0) {
          col.chars[Math.floor(Math.random() * col.chars.length)] =
            matrixChars[Math.floor(Math.random() * matrixChars.length)];
        }

        // Draw character column
        for (let j = 0; j < col.length; j++) {
          const charY = col.y - j * (isMobile ? 16 : 18);
          if (charY > -20 && charY < h + 20) {
            if (j === 0) {
              // Glowing head character
              ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
              ctx.fillText(col.headChar, col.x, charY);
            } else {
              // Trailing characters fading down
              const alpha = Math.max(0, 0.42 * (1 - j / col.length));
              ctx.fillStyle = `rgba(244, 114, 182, ${alpha})`;
              ctx.fillText(col.chars[j], col.x, charY);
            }
          }
        }
      });

      // 2. Draw & Update Main Particles
      if (s.state === 'FINAL_HEART') {
        // Calm, slower heartbeat pulsation
        const beat = 1 + 0.038 * Math.sin(s.time * 1.35) + 0.016 * Math.sin(s.time * 2.7);
        const curScale = s.heartScale * beat;
        const heartPoints = getHeartOutlinePoints(100, s.heartCenterX, s.heartCenterY, curScale);

        // Adjust dest points with current heartbeat beat
        const outlineCount = Math.floor(s.particles.length * 0.65);
        s.particles.forEach((p, idx) => {
          if (idx < outlineCount) {
            const pt = heartPoints[idx % heartPoints.length];
            p.destX = pt.x;
            p.destY = pt.y;
          }
        });

        // Spawn periodic heart ripples (slower interval)
        s.rippleTimer++;
        if (s.rippleTimer % (isMobile ? 36 : 30) === 0) {
          createHeartRipple();
        }

        // Update & Draw Ripple Particles
        for (let i = s.rippleParticles.length - 1; i >= 0; i--) {
          const rp = s.rippleParticles[i];
          rp.update();
          if (rp.active) {
            rp.draw(ctx);
          } else {
            s.rippleParticles.splice(i, 1);
          }
        }
      }

      // Draw main particles
      s.particles.forEach((p) => {
        p.update(s.isExploding, s.time);
        p.draw(ctx);
      });

      // 3. Draw Interactive Sparkles
      for (let i = s.sparkles.length - 1; i >= 0; i--) {
        const sp = s.sparkles[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy -= 0.02; // float gently upward
        sp.rotation += sp.vRot;
        sp.alpha -= 0.012;

        if (sp.alpha <= 0) {
          s.sparkles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.rotate(sp.rotation);
        ctx.globalAlpha = sp.alpha;

        if (sp.isHeart) {
          ctx.font = `${sp.size}px sans-serif`;
          ctx.fillStyle = sp.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('❤', 0, 0);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, sp.size, 0, Math.PI * 2);
          ctx.fillStyle = sp.color;
          ctx.fill();
        }
        ctx.restore();
      }

      // 3.5 Draw sequence word if active (guarantees crystal-clear legibility on mobile & PC)
      if (s.state === 'SEQUENCE' && s.currentWord) {
        if (!s.isExploding && s.wordOpacity < 0.96) {
          s.wordOpacity += 0.035; // gentle fade in
        } else if (s.isExploding) {
          s.wordOpacity = Math.max(0, s.wordOpacity - 0.05);
        }

        if (s.wordOpacity > 0.02) {
          ctx.save();
          ctx.globalAlpha = s.wordOpacity;
          ctx.font = `900 ${s.wordFontSize}px "Plus Jakarta Sans", sans-serif, system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(244, 63, 94, 0.95)';
          ctx.shadowBlur = isMobile ? 22 : 32;
          ctx.fillStyle = '#ffffff';

          const lines = s.currentWord.split('\n');
          const lineHeight = s.wordFontSize * 1.24;
          const startY = s.wordCenterY - ((lines.length - 1) * lineHeight) / 2;

          lines.forEach((line, idx) => {
            ctx.fillText(line.trim(), w / 2, startY + idx * lineHeight);
          });

          ctx.restore();
        }
      }

      // 4. Draw Final Glowing Center Text: "I LOVE YOU VICUSEA ❤️"
      if (s.state === 'FINAL_HEART') {
        if (s.textOpacity < 1) {
          s.textOpacity += 0.01;
        }

        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Outer glow
        ctx.shadowColor = 'rgba(244, 63, 94, 0.95)';
        ctx.shadowBlur = isMobile ? 20 : 28;

        if (isMobile) {
          // On mobile: 2-line layout fits naturally inside the heart cavity
          const line1Size = Math.min(Math.max(w / 16, 20), 25);
          const line2Size = Math.min(Math.max(w / 13, 24), 30);
          const centerY = s.heartCenterY + 4;

          // Line 1: "I LOVE YOU"
          ctx.font = `700 ${line1Size}px "Plus Jakarta Sans", sans-serif, system-ui`;
          ctx.fillStyle = `rgba(255, 255, 255, ${s.textOpacity})`;
          ctx.fillText('I LOVE YOU', s.heartCenterX, centerY - 16);

          // Line 2: "VICUSEA ❤️"
          ctx.font = `900 ${line2Size}px "Plus Jakarta Sans", sans-serif, system-ui`;
          ctx.fillStyle = `rgba(255, 255, 255, ${s.textOpacity})`;
          ctx.fillText('VICUSEA ❤️', s.heartCenterX, centerY + 16);

          // Subtitle
          if (s.textOpacity > 0.4) {
            const subAlpha = (s.textOpacity - 0.4) * 1.6;
            ctx.font = `500 12px "Plus Jakarta Sans", sans-serif`;
            ctx.fillStyle = `rgba(254, 205, 211, ${subAlpha})`;
            ctx.shadowBlur = 8;
            ctx.fillText('forever & always in my heart', s.heartCenterX, centerY + 44);
          }
        } else {
          // Desktop single line
          const fontSize = Math.min(Math.max(w / 22, 22), 36);
          const textY = s.heartCenterY + 12;

          ctx.font = `900 ${fontSize}px "Plus Jakarta Sans", sans-serif, system-ui`;
          ctx.fillStyle = `rgba(255, 255, 255, ${s.textOpacity})`;
          ctx.fillText('I LOVE YOU VICUSEA ❤️', s.heartCenterX, textY);

          if (s.textOpacity > 0.4) {
            const subAlpha = (s.textOpacity - 0.4) * 1.6;
            ctx.font = `500 ${Math.max(13, fontSize * 0.45)}px "Plus Jakarta Sans", sans-serif`;
            ctx.fillStyle = `rgba(254, 205, 211, ${subAlpha})`;
            ctx.shadowBlur = 10;
            ctx.fillText('forever & always in my heart', s.heartCenterX, textY + fontSize * 1.4);
          }
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [initSimulation, setHeartTargets]);

  // Run sequence when isPlaying becomes true
  useEffect(() => {
    if (isPlaying) {
      runSequence();
    }
  }, [isPlaying, runSequence]);

  // Touch / mouse interaction: creates sparkling fairy dust & floating hearts
  const handlePointerInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }

    // Spawn 4-8 tiny sparkling hearts or stars
    const count = 5;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 0.8;
      stateRef.current.sparkles.push({
        x: clientX + (Math.random() - 0.5) * 10,
        y: clientY + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: Math.random() * 12 + 10,
        alpha: 1,
        rotation: (Math.random() - 0.5) * 0.4,
        vRot: (Math.random() - 0.5) * 0.1,
        color: ['#ff4d6d', '#ff758f', '#ff85a1', '#f72585', '#ffffff'][
          Math.floor(Math.random() * 5)
        ],
        isHeart: Math.random() > 0.4,
      });
    }
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-[#050308] touch-none"
      onMouseMove={handlePointerInteraction}
      onTouchStart={(e) => {
        handlePointerInteraction(e);
        soundController.playSparkleSound();
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.(15);
        }
      }}
      onTouchMove={handlePointerInteraction}
      onClick={(e) => {
        handlePointerInteraction(e);
        soundController.playSparkleSound();
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block cursor-pointer touch-none" />

      {/* Screen reader & accessible text */}
      <div className="sr-only" aria-live="polite">
        {currentText || 'Love message for Vicusea'}
      </div>
    </div>
  );
};
