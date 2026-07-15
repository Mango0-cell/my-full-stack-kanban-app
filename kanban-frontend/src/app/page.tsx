"use client";

import Link from "next/link";
import { motion } from "motion/react";
import MagicBento from "@/components/ui/magic-bento";
import BlurText from "@/components/ui/blur-text";
import GradientText from "@/components/ui/gradient-text";
import dynamic from "next/dynamic";
const Plasma = dynamic(() => import("@/components/ui/plasma"), { ssr: false });
import Stepper, { Step } from "@/components/ui/stepper";
import PricingSection4 from "@/components/ui/pricing-section-4";
import { LayoutGrid, Zap, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { useIsMobile } from "@/lib/hooks/useIsMobile";

const sectionVariants = {
  hidden: { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export default function LandingPage() {
  // Mobile GPUs choke on the fullscreen WebGL plasma (60 shader iterations per
  // pixel every frame, behind translucent scroll overlays). Render it on
  // desktop only; mobile gets a static, GPU-cheap gradient instead. `null`
  // (pre-detection) renders neither, keeping desktop byte-identical to before.
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen text-slate-100 overflow-x-hidden" style={{ backgroundColor: '#0a0c12' }}>
      {/* ── Background: animated WebGL plasma (desktop) / static gradient (mobile) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ willChange: 'transform' }}>
        {isMobile === false && (
          <Plasma
            color="#6366f1"
            speed={0.6}
            direction="forward"
            scale={1.1}
            opacity={0.72}
            mouseInteractive={false}
          />
        )}
        {isMobile === true && (
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.20), transparent 60%), radial-gradient(ellipse 70% 60% at 85% 100%, rgba(139,92,246,0.14), transparent 55%), #0a0c12',
            }}
          />
        )}
      </div>

      {/* ── Navbar (logo only) ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] backdrop-blur-md" style={{ background: 'rgba(10,12,18,0.75)' }}>
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <LayoutGrid className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-slate-100 tracking-tight">Kanban Flow</span>
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20">

        <div className="relative z-[10] flex flex-col items-center text-center px-4 gap-6 max-w-4xl mx-auto">
          {/* Primary: "Kanban" blur-reveal + "Flow" gradient blur-reveal */}
          <div
            className="flex flex-wrap items-baseline justify-center gap-x-[0.18em]"
            style={{ fontSize: "clamp(4rem, 10vw, 7.5rem)" }}
          >
            <BlurText
              text="Kanban"
              delay={150}
              animateBy="words"
              direction="top"
              stepDuration={0.5}
              threshold={0.01}
              className="font-extrabold tracking-tight leading-none text-slate-100"
            />
            {/* Animate the GradientText wrapper — avoids will-change stacking-context breaking bg-clip */}
            <motion.div
              initial={{ filter: 'blur(10px)', opacity: 0, y: -50 }}
              animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'inline-block' }}
            >
              <GradientText
                colors={["#818cf8", "#c4b5fd", "#f0abfc", "#6366f1", "#818cf8"]}
                animationSpeed={5}
                className="!mx-0"
              >
                <span className="font-extrabold tracking-tight leading-none text-transparent">
                  Flow
                </span>
              </GradientText>
            </motion.div>
          </div>

          {/* Secondary: subtitle — plain white, no gradient */}
          <h2
            className="font-semibold text-slate-200 leading-tight tracking-tight"
            style={{ fontSize: "clamp(1.4rem, 3.5vw, 2.2rem)" }}
          >
            Organize smarter, Ship faster.
          </h2>

          <p className="max-w-xl text-[clamp(0.95rem,2vw,1.1rem)] text-slate-400 leading-relaxed">
            Visual project boards built for modern teams. Drag, drop, and deliver — from idea to production.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
            <Link href="/register" className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white font-medium px-7 py-3 rounded-lg transition-all duration-150 text-sm shadow-lg shadow-indigo-500/20">
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="flex items-center gap-2 border border-white/10 hover:border-white/25 text-slate-300 hover:text-white font-medium px-7 py-3 rounded-lg transition-all duration-150 text-sm bg-white/[0.03] hover:bg-white/[0.07]">
              Log in to your account
            </Link>
          </div>
        </div>

      </section>

      {/* ── Features (split layout) ── */}
      <motion.section
        className="relative z-10 py-24 px-6"
        style={{ background: 'rgba(10,12,18,0.88)' }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={sectionVariants}
      >
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          {/* Left: text */}
          <div className="lg:w-[38%] shrink-0 space-y-6">
            <p className="text-xs font-mono uppercase tracking-widest text-indigo-400">Everything you need</p>
            <GradientText
              colors={["#818cf8", "#c4b5fd", "#f0abfc", "#818cf8"]}
              animationSpeed={6}
              className="!mx-0 text-left"
            >
              <span className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-tight text-transparent">
                Built for teams that move fast
              </span>
            </GradientText>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              From solo founders to enterprise teams — Kanban Flow adapts to how you actually work. Every feature is designed to reduce friction and keep your team in flow.
            </p>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm italic border-l-2 border-indigo-500/30 pl-4">
              Stop managing chaos in spreadsheets. Your team deserves a tool that shows exactly who is doing what, when it&apos;s due, and what&apos;s blocking progress — all in a single glance.
            </p>
            <div className="space-y-3 pt-2">
              {[
                { label: "10,000+", desc: "Teams worldwide" },
                { label: "99.9%", desc: "Uptime SLA" },
                { label: "< 100ms", desc: "Real-time sync" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-slate-100 text-sm">{stat.label}</span>
                  <span className="text-slate-500 text-sm">{stat.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: bento grid */}
          <div className="lg:w-[62%] w-full">
            <MagicBento enableStars enableSpotlight enableBorderGlow enableMagnetism clickEffect glowColor="99, 102, 241" />
          </div>
        </div>
      </motion.section>

      {/* ── Pricing (full screen) ── */}
      <motion.section
        className="relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={sectionVariants}
      >
        <PricingSection4 />
      </motion.section>

      {/* ── How it works ── */}
      <motion.section
        className="relative z-10 py-24 px-6"
        style={{ background: 'rgba(10,12,18,0.88)' }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={sectionVariants}
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14 space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-indigo-400">Getting started</p>
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold text-slate-100">
              Up and running in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">
                minutes
              </span>
            </h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
              Three simple steps to get your team organized and shipping.
            </p>
          </div>

          {/* Two-column: steps left, Stepper right */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* Left: numbered step cards */}
            <div className="lg:w-[42%] shrink-0 space-y-3">
              {[
                { num: "01", title: "Create your workspace", desc: "Set up your first project board in under 30 seconds. No credit card required.", color: "#818cf8", Icon: LayoutGrid },
                { num: "02", title: "Invite your team", desc: "Add teammates by email. Assign roles — admin, editor, or viewer.", color: "#34d399", Icon: Users },
                { num: "03", title: "Ship faster", desc: "Drag cards, write rich descriptions, attach files, and track your velocity.", color: "#f59e0b", Icon: Zap },
              ].map((step) => (
                <div
                  key={step.num}
                  className="flex gap-4 p-5 rounded-xl bg-[#1a2030] border border-white/[0.06] hover:border-white/[0.14] hover:bg-[#1f2840] hover:shadow-[0_0_20px_rgba(99,102,241,0.08)] transition-all duration-200"
                >
                  <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${step.color}18` }}>
                    <step.Icon className="w-5 h-5" style={{ color: step.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-600">{step.num}</span>
                      <h3 className="text-sm font-semibold text-slate-100">{step.title}</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: interactive Stepper — no forced aspect ratio */}
            <div className="lg:w-[58%] w-full">
              <div className="rounded-2xl bg-[#1a2030] border border-white/[0.06] overflow-hidden">
                <Stepper
                  initialStep={1}
                  onFinalStepCompleted={() => { window.location.href = "/register"; }}
                  nextButtonText="Next step"
                  backButtonText="Back"
                  stepCircleContainerClassName="!bg-transparent"
                  className="!min-h-0 !p-0 sm:!aspect-auto md:!aspect-auto"
                >
                  <Step>
                    <div className="pb-4 space-y-3">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                          <LayoutGrid className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-100">Create your workspace</h3>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Sign up and set up your first project board instantly. Name it, describe it, and invite your team — no credit card required.
                      </p>
                      <div className="rounded-lg bg-[#0f1117] border border-white/[0.06] p-4 text-xs font-mono text-slate-500">
                        <span className="text-indigo-400">$ </span>kanban new &quot;Q3 Product Roadmap&quot;
                        <br /><span className="text-emerald-400">✓ Board created successfully</span>
                      </div>
                    </div>
                  </Step>
                  <Step>
                    <div className="pb-4 space-y-3">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-emerald-400" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-100">Invite your team</h3>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Add teammates by email and assign roles. Everyone sees real-time updates the moment changes happen.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {["Design", "Engineering", "Product", "Marketing"].map((tag) => (
                          <span key={tag} className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </Step>
                  <Step>
                    <div className="pb-4 space-y-3">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4 text-amber-400" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-100">Ship faster</h3>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Drag cards, write rich Markdown, attach files, leave comments, and track your team velocity.
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {["Drag & Drop", "Markdown Editor", "File Attachments", "Analytics"].map((f) => (
                          <div key={f} className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />{f}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Step>
                </Stepper>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] px-6 py-8 relative z-10" style={{ background: 'rgba(10,12,18,0.88)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <LayoutGrid className="w-4 h-4 text-indigo-400" />
            <span className="font-medium text-slate-400">Kanban Flow</span>
          </div>
          <span className="text-sm text-slate-600">© {new Date().getFullYear()} Kanban Flow. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
