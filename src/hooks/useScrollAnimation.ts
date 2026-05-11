import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface PaperConfig {
  id: string;
  startX: number;
  startY: number;
  rotation: number;
  scale: number;
}

export const PAPERS: PaperConfig[] = [
  { id: 'bill',      startX: -35, startY: -28, rotation: -8,  scale: 1    },
  { id: 'due-slip',  startX:  36, startY: -22, rotation:  6,  scale: 0.9  },
  { id: 'inventory', startX: -40, startY:  22, rotation:  5,  scale: 0.95 },
  { id: 'customer',  startX:  38, startY:  30, rotation: -7,  scale: 0.85 },
  { id: 'barcode',   startX: -18, startY: -42, rotation: 12,  scale: 0.7  },
  { id: 'note',      startX:  22, startY:  40, rotation: -4,  scale: 0.75 },
];

export function useScrollAnimation(isMobile: boolean) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const paperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const laptopRef = useRef<HTMLDivElement>(null);
  const laptopGlowRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const statCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const chatbotRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const setPaperRef = useCallback((el: HTMLDivElement | null, i: number) => {
    paperRefs.current[i] = el;
  }, []);
  const setStatRef = useCallback((el: HTMLDivElement | null, i: number) => {
    statCardRefs.current[i] = el;
  }, []);

  useEffect(() => {
    if (isMobile || !sceneRef.current || !viewportRef.current) return;

    let ctx: gsap.Context | null = null;

    const raf = requestAnimationFrame(() => {
      ctx = gsap.context(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const cx = vw / 2;
        const cy = vh / 2;

        // ── Position papers ──
        PAPERS.forEach((p, i) => {
          const el = paperRefs.current[i];
          if (!el) return;
          const w = el.offsetWidth;
          const h = el.offsetHeight;
          gsap.set(el, {
            x: cx + (p.startX / 100) * vw - w / 2,
            y: cy + (p.startY / 100) * vh - h / 2,
            rotation: p.rotation,
            scale: p.scale,
            opacity: 1,
          });
        });

        // ── Idle float ──
        PAPERS.forEach((_, i) => {
          const el = paperRefs.current[i];
          if (!el) return;
          gsap.to(el, {
            y: `+=${6 + Math.random() * 10}`,
            rotation: `+=${1.5 + Math.random() * 3}`,
            duration: 3.5 + Math.random() * 2,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 1.5,
          });
        });

        // ── Master timeline ──
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sceneRef.current,
            start: 'top top',
            end: 'bottom bottom',
            pin: viewportRef.current,
            scrub: 1.5,
            anticipatePin: 1,
          },
        });

        // Phase 1: Hero fades (0 → 0.15)
        tl.to(heroTextRef.current, {
          opacity: 0, y: -50, duration: 0.15, ease: 'power2.in',
        }, 0);

        // Phase 2: Papers converge (0.05 → 0.50)
        PAPERS.forEach((p, i) => {
          const el = paperRefs.current[i];
          if (!el) return;
          const w = el.offsetWidth;
          const h = el.offsetHeight;

          tl.to(el, {
            x: cx - w / 2,
            y: cy - h / 2 - 20,
            scale: 0.08,
            rotation: p.rotation + (p.startX < 0 ? -220 : 220),
            opacity: 0,
            duration: 0.35,
            ease: 'power3.inOut',
          }, 0.05 + i * 0.035);
        });

        // Phase 3: Laptop activates (0.38 → 0.55)
        tl.to(laptopGlowRef.current, { opacity: 1, duration: 0.1, ease: 'power2.inOut' }, 0.38);
        tl.to(laptopRef.current, { scale: 1.08, duration: 0.15, ease: 'power2.out' }, 0.40);

        // Dashboard appears (0.48 → 0.52)
        tl.to(dashboardRef.current, { opacity: 1, scale: 1, duration: 0.1, ease: 'power2.out' }, 0.48);

        // Stat cards (0.52 → 0.62)
        statCardRefs.current.forEach((el, i) => {
          if (!el) return;
          tl.to(el, { opacity: 1, y: 0, duration: 0.05, ease: 'power2.out' }, 0.52 + i * 0.02);
        });

        // Chart + list (0.62 → 0.72)
        tl.to(chartRef.current, { opacity: 1, y: 0, duration: 0.07, ease: 'power2.out' }, 0.62);
        tl.to(listRef.current, { opacity: 1, y: 0, duration: 0.07, ease: 'power2.out' }, 0.65);

        // Chatbot (0.70)
        tl.to(chatbotRef.current, { opacity: 1, scale: 1, duration: 0.05, ease: 'back.out(2)' }, 0.70);

        // Glow settles
        tl.to(laptopGlowRef.current, { opacity: 0.12, duration: 0.1 }, 0.68);

        // Phase 4: Laptop shifts up to make room for CTA (0.75 → 0.85)
        tl.to(laptopRef.current, { y: -60, duration: 0.12, ease: 'power2.inOut' }, 0.75);

        // CTA (0.78 → 0.90)
        tl.to(ctaRef.current, { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, 0.80);

      }, sceneRef);
    });

    return () => {
      cancelAnimationFrame(raf);
      if (ctx) ctx.revert();
    };
  }, [isMobile]);

  return {
    sceneRef, viewportRef, paperRefs, laptopRef, laptopGlowRef,
    heroTextRef, dashboardRef, statCardRefs, chartRef, listRef,
    chatbotRef, ctaRef, setPaperRef, setStatRef,
  };
}
