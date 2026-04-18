"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Sparkles } from "@/components/ui/sparkles";
import GradualBlur from "@/components/ui/gradual-blur";
import MagicBento from "@/components/ui/magic-bento";
import BlurText from "@/components/ui/blur-text";
import GradientText from "@/components/ui/gradient-text";
import ScrollReveal from "@/components/ui/scroll-reveal";
import Stepper, { Step } from "@/components/ui/stepper";
import PricingSection4 from "@/components/ui/pricing-section-4";
import { LayoutGrid, Zap, Users, ArrowRight, CheckCircle2 } from "lucide-react";

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.0, 0, 0.2, 1] as [number, number, number, number] } }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100 overflow-x-hidden">

      {/* ── Navbar (logo only) ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#0f1117]/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <LayoutGrid className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-slate-100 tracking-tight">Kanban Flow</span>
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_60%,#6366f155,transparent_65%)]" />
        <Sparkles density={700} speed={0.6} color="#818cf8" opacity={0.5} className="absolute inset-0 w-full h-full" />
        <div className="absolute -left-1/2 bottom-0 aspect-[1/0.7] z-10 w-[200%] rounded-[100%] border-t border-white/[0.08] bg-[#0f1117]" />

        <div className="relative z-20 flex flex-col items-center text-center px-4 gap-8 max-w-4xl mx-auto">
          <h1 className="font-bold text-white leading-[1.05] tracking-tight" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
            Organize smarter,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">
              Ship faster.
            </span>
          </h1>

          <p className="max-w-xl text-[clamp(1rem,2vw,1.2rem)] text-slate-400 leading-relaxed">
            Visual project boards built for modern teams. Drag, drop, and deliver — from idea to production.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register" className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white font-medium px-7 py-3 rounded-lg transition-all duration-150 text-sm shadow-lg shadow-indigo-500/20">
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="flex items-center gap-2 border border-white/10 hover:border-white/25 text-slate-300 hover:text-white font-medium px-7 py-3 rounded-lg transition-all duration-150 text-sm bg-white/[0.03] hover:bg-white/[0.07]">
              Log in to your account
            </Link>
          </div>
        </div>

        <GradualBlur position="bottom" height="12rem" strength={3} divCount={8} curve="bezier" style={{ background: "transparent" }} />
      </section>

      {/* ── Features (split layout) ── */}
      <motion.section
        className="relative py-24 px-6 bg-[#0f1117]"
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}
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
              <BlurText
                text="Built for teams that move fast"
                delay={80}
                animateBy="words"
                direction="top"
                className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-tight text-transparent"
              />
            </GradientText>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              From solo founders to enterprise teams — Kanban Flow adapts to how you actually work. Every feature is designed to reduce friction and keep your team in flow.
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

      {/* ── ScrollReveal tagline ── */}
      <motion.section
        className="py-24 px-8 max-w-4xl mx-auto"
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}
      >
        <ScrollReveal enableBlur baseOpacity={0.05} baseRotation={4} blurStrength={6} textClassName="text-slate-100">
          Stop managing chaos in spreadsheets. Your team deserves a tool that shows exactly who is doing what, when it is due, and what is blocking progress — all in a single glance.
        </ScrollReveal>
      </motion.section>

      {/* ── Pricing (full screen) ── */}
      <section>
        <PricingSection4 />
      </section>

      {/* ── How it works (last content section) ── */}
      <motion.section
        className="py-28 px-4 bg-[#161b27]"
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-xs font-mono uppercase tracking-widest text-indigo-400">Getting started</p>
            <GradientText colors={["#6366f1", "#818cf8", "#34d399", "#818cf8", "#6366f1"]} animationSpeed={7} className="!mx-auto">
              <BlurText
                text="Up and running in minutes"
                delay={70}
                animateBy="words"
                direction="bottom"
                className="text-[clamp(1.8rem,4vw,3rem)] font-bold text-transparent"
              />
            </GradientText>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Three simple steps to get your team organized and shipping.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 items-center">
            {/* Left: step overview */}
            <div className="space-y-6">
              {[
                { num: "01", title: "Create your workspace", desc: "Set up your first project board in under 30 seconds. No credit card required.", color: "#818cf8", Icon: LayoutGrid },
                { num: "02", title: "Invite your team", desc: "Add teammates by email. Assign roles — admin, editor, or viewer.", color: "#34d399", Icon: Users },
                { num: "03", title: "Ship faster", desc: "Drag cards, write rich descriptions, attach files, and track your velocity.", color: "#f59e0b", Icon: Zap },
              ].map((step) => (
                <div key={step.num} className="flex gap-4 p-5 rounded-xl bg-[#1e2433] border border-white/[0.06] hover:border-white/10 transition-colors duration-200">
                  <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${step.color}20` }}>
                    <step.Icon className="w-5 h-5" style={{ color: step.color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-600">{step.num}</span>
                      <h3 className="text-sm font-semibold text-slate-100">{step.title}</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: interactive Stepper */}
            <div>
              <Stepper
                initialStep={1}
                onFinalStepCompleted={() => { window.location.href = "/register"; }}
                nextButtonText="Next step"
                backButtonText="Back"
                stepCircleContainerClassName="bg-[#1e2433]"
              >
                <Step>
                  <div className="pb-6 space-y-3">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <LayoutGrid className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-100">Create your workspace</h3>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Sign up and set up your first project board instantly. Name it, describe it, and invite your team — no credit card required.
                    </p>
                    <div className="mt-4 rounded-lg bg-[#0f1117] border border-white/[0.06] p-4 text-xs font-mono text-slate-500">
                      <span className="text-indigo-400">$ </span>kanban new &quot;Q3 Product Roadmap&quot;
                      <br /><span className="text-emerald-400">✓ Board created successfully</span>
                    </div>
                  </div>
                </Step>
                <Step>
                  <div className="pb-6 space-y-3">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-100">Invite your team</h3>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Add teammates by email and assign roles. Everyone sees real-time updates the moment changes happen.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {["Design", "Engineering", "Product", "Marketing"].map((tag) => (
                        <span key={tag} className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{tag}</span>
                      ))}
                    </div>
                  </div>
                </Step>
                <Step>
                  <div className="pb-6 space-y-3">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-amber-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-100">Ship faster</h3>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Drag cards across columns, write rich Markdown descriptions, attach files, leave comments, and track your team velocity.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
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
      </motion.section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] px-6 py-8">
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
