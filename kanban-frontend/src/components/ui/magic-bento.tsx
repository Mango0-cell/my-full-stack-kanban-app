"use client";
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import { gsap } from "gsap";
import { motion, AnimatePresence } from "motion/react";
import { MousePointer2, Zap, BarChart2, FileText, Settings, Shield, X, ArrowUpRight } from "lucide-react";

export interface BentoCardProps {
  color?: string;
  title?: string;
  description?: string;
  longDescription?: string;
  features?: string[];
  label?: string;
  textAutoHide?: boolean;
  disableAnimations?: boolean;
  icon?: React.ElementType;
  iconColor?: string;
  accentColor?: string;
}

export interface BentoProps {
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  disableAnimations?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  enableTilt?: boolean;
  glowColor?: string;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
  cards?: BentoCardProps[];
}

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = "99, 102, 241";
const MOBILE_BREAKPOINT = 768;

const defaultCardData: BentoCardProps[] = [
  {
    color: '#0d1120', title: 'Drag & Drop', label: 'Board', icon: MousePointer2, iconColor: '#818cf8', accentColor: '#6366f1',
    description: 'Move cards fluidly across columns with buttery smooth animations.',
    longDescription: 'Our drag-and-drop engine is built on @dnd-kit — one of the fastest, most accessible DnD libraries available. Cards snap into place with spring physics, giving you the tactile feeling of real objects moving through space.',
    features: ['Spring physics animations', 'Keyboard DnD accessible', 'Multi-board drag support', 'Touch & mobile ready'],
  },
  {
    color: '#0d1120', title: 'Real-time Sync', label: 'Collaboration', icon: Zap, iconColor: '#34d399', accentColor: '#10b981',
    description: 'Changes appear instantly for every team member — zero refresh needed.',
    longDescription: 'Powered by WebSocket connections, every card move, title edit, or comment instantly propagates to all connected teammates. Conflict resolution ensures no work is ever lost, even when two people edit simultaneously.',
    features: ['Sub-100ms sync latency', 'Offline-first queue', 'Conflict resolution', 'Presence indicators'],
  },
  {
    color: '#0d1120', title: 'Smart Analytics', label: 'Insights', icon: BarChart2, iconColor: '#f59e0b', accentColor: '#f59e0b',
    description: 'Track velocity, cycle time, and team performance at a glance.',
    longDescription: 'Visualize your team\'s throughput with burndown charts, cumulative flow diagrams, and lead-time histograms. Spot bottlenecks before they become blockers and export reports in CSV or PDF with one click.',
    features: ['Burndown & CFD charts', 'Lead/cycle time tracking', 'Custom date ranges', 'CSV & PDF export'],
  },
  {
    color: '#0d1120', title: 'Rich Cards', label: 'Cards', icon: FileText, iconColor: '#60a5fa', accentColor: '#3b82f6',
    description: 'Markdown editor, file attachments, comments, and custom fields.',
    longDescription: 'Each card is a lightweight document. Write detailed descriptions in Markdown, attach files up to 25 MB, mention teammates with @, set due dates, add labels, and create custom field types — all without leaving the board.',
    features: ['Plate.js Markdown editor', 'File attachments (25 MB)', '@mentions & comments', 'Custom field types'],
  },
  {
    color: '#0d1120', title: 'Automations', label: 'Workflow', icon: Settings, iconColor: '#c084fc', accentColor: '#a855f7',
    description: 'Set triggers and actions to eliminate repetitive tasks.',
    longDescription: 'Build no-code automation rules like "When a card moves to Done, notify the requester and close the linked issue." Connect to Slack, GitHub, Jira, and dozens more via our webhook engine.',
    features: ['No-code rule builder', 'Slack & GitHub integrations', 'Webhook engine', 'Scheduled automations'],
  },
  {
    color: '#0d1120', title: 'Enterprise SSO', label: 'Security', icon: Shield, iconColor: '#f87171', accentColor: '#ef4444',
    description: 'SAML, custom roles, and audit logs for large teams.',
    longDescription: 'Meet your compliance requirements with SOC 2 Type II certified infrastructure. SAML 2.0 SSO, SCIM provisioning, granular role-based access control, and immutable audit logs give your security team full visibility.',
    features: ['SAML 2.0 & SCIM', 'Granular RBAC', 'Immutable audit logs', 'SOC 2 Type II certified'],
  },
];

const createParticleElement = (
  x: number,
  y: number,
  color: string = DEFAULT_GLOW_COLOR
): HTMLDivElement => {
  const el = document.createElement("div");
  el.className = "particle";
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const calculateSpotlightValues = (radius: number) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75,
});

const updateCardGlowProperties = (
  card: HTMLElement,
  mouseX: number,
  mouseY: number,
  glow: number,
  radius: number
) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;
  card.style.setProperty("--glow-x", `${relativeX}%`);
  card.style.setProperty("--glow-y", `${relativeY}%`);
  card.style.setProperty("--glow-intensity", glow.toString());
  card.style.setProperty("--glow-radius", `${radius}px`);
};

const ParticleCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  disableAnimations?: boolean;
  style?: React.CSSProperties;
  particleCount?: number;
  glowColor?: string;
  enableTilt?: boolean;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
}> = ({
  children,
  className = "",
  disableAnimations = false,
  style,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = true,
  clickEffect = false,
  enableMagnetism = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef<HTMLDivElement[]>([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef<gsap.core.Tween | null>(null);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(
        Math.random() * width,
        Math.random() * height,
        glowColor
      )
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();
    particlesRef.current.forEach((particle) => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: "back.in(1.7)",
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        },
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;
    if (!particlesInitialized.current) initializeParticles();

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;
        const clone = particle.cloneNode(true) as HTMLDivElement;
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(
          clone,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
        );
        gsap.to(clone, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: "none",
          repeat: -1,
          yoyo: true,
        });
        gsap.to(clone, {
          opacity: 0.3,
          duration: 1.5,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true,
        });
      }, index * 100);
      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;
    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();
      if (enableTilt) {
        gsap.to(element, {
          rotateX: 5,
          rotateY: 5,
          duration: 0.3,
          ease: "power2.out",
          transformPerspective: 1000,
        });
      }
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();
      if (enableTilt) {
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      }
      if (enableMagnetism) {
        gsap.to(element, { x: 0, y: 0, duration: 0.3, ease: "power2.out" });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!enableTilt && !enableMagnetism) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        gsap.to(element, {
          rotateX: ((y - centerY) / centerY) * -10,
          rotateY: ((x - centerX) / centerX) * 10,
          duration: 0.1,
          ease: "power2.out",
          transformPerspective: 1000,
        });
      }
      if (enableMagnetism) {
        magnetismAnimationRef.current = gsap.to(element, {
          x: (x - centerX) * 0.05,
          y: (y - centerY) * 0.05,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!clickEffect) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );
      const ripple = document.createElement("div");
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 1000;
      `;
      element.appendChild(ripple);
      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          onComplete: () => ripple.remove(),
        }
      );
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("click", handleClick);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("click", handleClick);
      clearAllParticles();
    };
  }, [
    animateParticles,
    clearAllParticles,
    disableAnimations,
    enableTilt,
    enableMagnetism,
    clickEffect,
    glowColor,
  ]);

  return (
    <div
      ref={cardRef}
      className={`${className} relative overflow-hidden`}
      style={{ ...style, position: "relative", overflow: "hidden" }}
    >
      {children}
    </div>
  );
};

const GlobalSpotlight: React.FC<{
  gridRef: React.RefObject<HTMLDivElement | null>;
  disableAnimations?: boolean;
  enabled?: boolean;
  spotlightRadius?: number;
  glowColor?: string;
}> = ({
  gridRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR,
}) => {
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (disableAnimations || !gridRef?.current || !enabled) return;

    const spotlight = document.createElement("div");
    spotlight.className = "global-spotlight";
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%,
        rgba(${glowColor}, 0.08) 15%,
        rgba(${glowColor}, 0.04) 25%,
        rgba(${glowColor}, 0.02) 40%,
        rgba(${glowColor}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = (e: MouseEvent) => {
      if (!spotlightRef.current || !gridRef.current) return;
      const section = gridRef.current.closest(".bento-section-wrapper");
      const rect = section?.getBoundingClientRect();
      const mouseInside =
        rect &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      const cards = gridRef.current.querySelectorAll(".card");

      if (!mouseInside) {
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3 });
        cards.forEach((card) => {
          (card as HTMLElement).style.setProperty("--glow-intensity", "0");
        });
        return;
      }

      const { proximity, fadeDistance } =
        calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;

      cards.forEach((card) => {
        const cardElement = card as HTMLElement;
        const cardRect = cardElement.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance =
          Math.hypot(e.clientX - centerX, e.clientY - centerY) -
          Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);
        minDistance = Math.min(minDistance, effectiveDistance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity =
            (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }
        updateCardGlowProperties(
          cardElement,
          e.clientX,
          e.clientY,
          glowIntensity,
          spotlightRadius
        );
      });

      gsap.to(spotlightRef.current, {
        left: e.clientX,
        top: e.clientY,
        duration: 0.1,
      });

      const targetOpacity =
        minDistance <= proximity
          ? 0.8
          : minDistance <= fadeDistance
          ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
          : 0;

      gsap.to(spotlightRef.current, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.2 : 0.5,
      });
    };

    const handleMouseLeave = () => {
      gridRef.current?.querySelectorAll(".card").forEach((card) => {
        (card as HTMLElement).style.setProperty("--glow-intensity", "0");
      });
      if (spotlightRef.current) {
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3 });
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
};

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return isMobile;
};

const MagicBento: React.FC<BentoProps> = ({
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = false,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = true,
  cards = defaultCardData,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = disableAnimations || isMobile;
  const [expandedCard, setExpandedCard] = useState<BentoCardProps | null>(null);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (expandedCard) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [expandedCard]);

  return (
    <>
      {/* ── Expanded card overlay ── */}
      <AnimatePresence>
        {expandedCard && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setExpandedCard(null)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            {/* Card */}
            <motion.div
              className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 overflow-hidden"
              style={{ backgroundColor: expandedCard.color || '#0d1120' }}
              initial={{ opacity: 0, scale: 0.88, y: 32, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.92, y: 16, filter: 'blur(4px)' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Accent gradient top bar */}
              <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${expandedCard.accentColor || '#6366f1'}80, ${expandedCard.accentColor || '#6366f1'}20)` }} />

              {/* Background icon */}
              {expandedCard.icon && (
                <div className="absolute top-6 right-6 opacity-[0.07] pointer-events-none">
                  <expandedCard.icon style={{ color: expandedCard.iconColor || '#818cf8' }} className="w-28 h-28" strokeWidth={0.8} />
                </div>
              )}

              <div className="p-7 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {expandedCard.icon && (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${expandedCard.accentColor || '#6366f1'}20` }}>
                        <expandedCard.icon style={{ color: expandedCard.iconColor || '#818cf8' }} className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-mono uppercase tracking-widest block mb-0.5"
                        style={{ color: expandedCard.iconColor || '#94a3b8' }}>{expandedCard.label}</span>
                      <h3 className="text-xl font-bold text-slate-100">{expandedCard.title}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedCard(null)}
                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-all duration-150"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Long description */}
                <p className="text-sm text-slate-300 leading-relaxed">
                  {expandedCard.longDescription || expandedCard.description}
                </p>

                {/* Features */}
                {expandedCard.features && expandedCard.features.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-mono uppercase tracking-widest text-slate-600">Includes</p>
                    <div className="grid grid-cols-2 gap-2">
                      {expandedCard.features.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-xs text-slate-400 py-1.5 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: expandedCard.accentColor || '#6366f1' }} />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .bento-section {
          --glow-x: 50%;
          --glow-y: 50%;
          --glow-intensity: 0;
          --glow-radius: 200px;
          --glow-color: ${glowColor};
          --border-color: rgba(255,255,255,0.08);
          --background-dark: #0f1117;
          --white: hsl(0, 0%, 100%);
        }

        .card-responsive {
          display: grid;
          grid-template-columns: 1fr;
          width: 90%;
          margin: 0 auto;
          padding: 0.5rem;
          gap: 0.5rem;
        }

        @media (min-width: 600px) {
          .card-responsive { grid-template-columns: repeat(2, 1fr); }
        }

        @media (min-width: 1024px) {
          .card-responsive { grid-template-columns: repeat(4, 1fr); }
          .card-responsive .card:nth-child(3) { grid-column: span 2; grid-row: span 2; }
          .card-responsive .card:nth-child(4) { grid-column: 1 / span 2; grid-row: 2 / span 2; }
          .card-responsive .card:nth-child(6) { grid-column: 4; grid-row: 3; }
        }

        .card--border-glow::after {
          content: '';
          position: absolute;
          inset: 0;
          padding: 6px;
          background: radial-gradient(var(--glow-radius) circle at var(--glow-x) var(--glow-y),
            rgba(${glowColor}, calc(var(--glow-intensity) * 0.8)) 0%,
            rgba(${glowColor}, calc(var(--glow-intensity) * 0.4)) 30%,
            transparent 60%);
          border-radius: inherit;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          pointer-events: none;
          z-index: 1;
        }

        .card--border-glow:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 30px rgba(${glowColor}, 0.15);
        }

        .text-clamp-1 {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 1;
          line-clamp: 1;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .text-clamp-2 {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>

      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
        />
      )}

      <div
        className="bento-section bento-section-wrapper grid gap-2 p-3 max-w-[54rem] select-none relative mx-auto"
        ref={gridRef}
      >
        <div className="card-responsive">
          {cards.map((card, index) => {
            const baseClassName = `card flex flex-col justify-between relative aspect-[4/3] min-h-[280px] w-full max-w-full p-7 rounded-[20px] border border-solid font-light overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-0.5 ${
              enableBorderGlow ? "card--border-glow" : ""
            }`;

            const cardStyle = {
              backgroundColor: card.color || "var(--background-dark)",
              borderColor: "var(--border-color)",
              color: "var(--white)",
              "--glow-x": "50%",
              "--glow-y": "50%",
              "--glow-intensity": "0",
              "--glow-radius": "200px",
            } as React.CSSProperties;

            const cardInner = (
              <>
                <div className="card__header flex justify-between gap-3 relative text-slate-400">
                  <span className="card__label text-xs font-mono uppercase tracking-widest" style={{ color: card.iconColor || '#94a3b8' }}>
                    {card.label}
                  </span>
                </div>
                {/* Icon */}
                {card.icon && (
                  <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-25 transition-opacity">
                    <card.icon style={{ color: card.iconColor || '#818cf8' }} className="w-20 h-20" strokeWidth={1} />
                  </div>
                )}
                {/* Readability gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                <div className="card__content flex flex-col relative text-white">
                  <h3 className={`card__title font-semibold text-lg m-0 mb-1 ${textAutoHide ? "text-clamp-1" : ""}`}>
                    {card.title}
                  </h3>
                  <p className={`card__description text-sm leading-relaxed text-slate-300 mb-3 ${textAutoHide ? "text-clamp-2" : ""}`}>
                    {card.description}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpandedCard(card); }}
                    className="flex items-center gap-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-y-1 group-hover:translate-y-0 w-fit"
                    style={{ color: card.iconColor || '#818cf8' }}
                  >
                    Read more
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </>
            );

            if (enableStars) {
              return (
                <ParticleCard
                  key={index}
                  className={`${baseClassName} group`}
                  style={cardStyle}
                  disableAnimations={shouldDisableAnimations}
                  particleCount={particleCount}
                  glowColor={glowColor}
                  enableTilt={enableTilt}
                  clickEffect={clickEffect}
                  enableMagnetism={enableMagnetism}
                >
                  {cardInner}
                </ParticleCard>
              );
            }

            return (
              <div key={index} className={`${baseClassName} group`} style={cardStyle}>
                {cardInner}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MagicBento;
