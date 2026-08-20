import { useEffect, useRef } from 'react';

type KaplayWindow = Window & {
  kaplay?: (options?: Record<string, unknown>) => {
    add?: (item: unknown) => unknown;
    draw?: (...args: unknown[]) => void;
  };
};

const SCRIPT_URL = 'https://unpkg.com/kaplay@3000.0.0/dist/kaplay.js';

export function KaplayStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const drawFallback = () => {
      const context = canvas.getContext('2d');
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#173c48';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#f6b36c';
      context.beginPath();
      context.arc(28, 30, 9, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#ef7184';
      context.fillRect(51, 20, 18, 18);
      context.fillStyle = '#69d4c5';
      context.beginPath();
      context.moveTo(88, 39);
      context.lineTo(101, 17);
      context.lineTo(114, 39);
      context.closePath();
      context.fill();
      context.fillStyle = 'rgba(246, 244, 232, .44)';
      context.font = '9px DM Mono, monospace';
      context.fillText('STAGE READY', 8, 51);
    };

    const bootKaplay = () => {
      const kaplay = (window as KaplayWindow).kaplay;
      if (!kaplay) {
        drawFallback();
        return;
      }
      try {
        const stage = kaplay({
          canvas,
          width: 120,
          height: 55,
          background: [23, 60, 72],
          global: false,
          crisp: true,
        });
        if (stage.add && stage.draw) {
          stage.draw();
        } else {
          drawFallback();
        }
      } catch {
        drawFallback();
      }
    };

    const current = document.querySelector<HTMLScriptElement>(
      'script[data-kaplay-calculator]',
    );
    if (current) {
      if ((window as KaplayWindow).kaplay) bootKaplay();
      else current.addEventListener('load', bootKaplay, { once: true });
      return () => current.removeEventListener('load', bootKaplay);
    }

    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.dataset.kaplayCalculator = 'true';
    script.addEventListener('load', bootKaplay, { once: true });
    script.addEventListener('error', drawFallback, { once: true });
    document.head.appendChild(script);
    drawFallback();

    return () => {
      script.removeEventListener('load', bootKaplay);
      script.removeEventListener('error', drawFallback);
    };
  }, []);

  return (
    <div className="stage-visual" aria-label="Kaplay visual stage">
      <canvas
        ref={canvasRef}
        className="stage-canvas"
        width="120"
        height="55"
        aria-hidden="true"
      />
    </div>
  );
}