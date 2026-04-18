"use client";

import Link from "next/link";
import { useRef } from "react";
import { Sparkles } from "@/components/ui/sparkles";
import GradualBlur from "@/components/ui/gradual-blur";
import MagicBento from "@/components/ui/magic-bento";
import GlareHover from "@/components/ui/glare-hover";
import GlitchText from "@/components/ui/glitch-text";
import ScrollReveal from "@/components/ui/scroll-reveal";
import Stepper, { Step } from "@/components/ui/stepper";
import PricingSection from "@/components/ui/pricing-section";
import { LayoutGrid, Zap, Users, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const featuresRef = useRef<HTMLElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100 overflow-x-hidden">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#0f1117]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-slate-100 tracking-tight">
            Kanban Flow Pro
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-slate-400 hover:text-slate-100 transition-colors duration-200 px-3 py-1.5"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-1.5 rounded-md transition-colors duration-200"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,#6366f180,transparent_70%)]" />
        <Sparkles
          density={900}
          speed={0.8}
          color="#818cf8"
          opacity={0.6}
          className="absolute inset-0 w-full h-full"
        />

        {/* Radial glow floor */}
        <div className="absolute -left-1/2 bottom-0 aspect-[1/0.7] z-10 w-[200%] rounded-[100%] border-t border-white/10 bg-[#0f1117]" />

        {/* Hero content */}
        <div className="relative z-20 flex flex-col items-center text-center px-4 gap-8">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-indigo-300">
            <Zap className="w-3 h-3" />
            Now in public beta
          </div>

          <GlitchText
            enableOnHover
            speed={0.8}
            bgColor="#0f1117"
            className="!text-[clamp(2.5rem,8vw,6rem)] leading-none tracking-tight"
          >
            Kanban Flow Pro
          </GlitchText>

          <p className="max-w-lg text-[clamp(1rem,2vw,1.25rem)] text-slate-400 leading-relaxed">
            Organize smarter. Ship faster.
            <br />
            Visual project boards built for modern teams.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white font-medium px-6 py-3 rounded-md transition-all duration-150 text-sm"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-medium px-6 py-3 rounded-md transition-all duration-150 text-sm bg-white/[0.03] hover:bg-white/[0.06]"
            >
              Log in to your account
            </Link>
          </div>

          <button
            onClick={scrollToFeatures}
            className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors flex flex-col items-center gap-1"
          >
            <span>See what&apos;s inside</span>
            <span className="animate-bounce">↓</span>
          </button>
        </div>

        {/* Bottom blur fade into next section */}
        <GradualBlur
          position="bottom"
          height="10rem"
          strength={3}
          divCount={8}
          curve="bezier"
          style={{ background: "transparent" }}
        />
      </section>

      {/* ── Features ── */}
      <section
        ref={featuresRef}
        className="relative py-24 px-4 bg-[#0f1117]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-indigo-400">
              Everything you need
            </p>
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-semibold text-slate-100">
              Built for teams that move fast
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
              From solo founders to enterprise teams — Kanban Flow Pro adapts
              to how you actually work.
            </p>
          </div>

          <MagicBento
            enableStars
            enableSpotlight
            enableBorderGlow
            enableMagnetism
            clickEffect
            glowColor="99, 102, 241"
          />
        </div>
      </section>

      {/* ── ScrollReveal tagline ── */}
      <section className="py-24 px-8 max-w-4xl mx-auto">
        <ScrollReveal
          enableBlur
          baseOpacity={0.05}
          baseRotation={4}
          blurStrength={6}
          textClassName="text-slate-100"
        >
          Stop managing chaos in spreadsheets. Your team deserves a tool that
          shows exactly who is doing what, when it is due, and what is
          blocking progress — all in a single glance.
        </ScrollReveal>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-4 bg-[#161b27]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-indigo-400">
              Getting started
            </p>
            <h2 className="text-[clamp(1.8rem,4vw,2.5rem)] font-semibold text-slate-100">
              Up and running in minutes
            </h2>
          </div>

          <Stepper
            initialStep={1}
            onFinalStepCompleted={() => {
              window.location.href = "/register";
            }}
            nextButtonText="Next step"
            backButtonText="Back"
            stepCircleContainerClassName="bg-[#161b27]"
          >
            <Step>
              <div className="pb-6 space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    Create your workspace
                  </h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Sign up and set up your first project board in seconds. Name it,
                  describe it, and invite your team — no credit card required.
                </p>
                <div className="mt-4 rounded-lg bg-[#1e2433] border border-white/[0.06] p-4 text-xs font-mono text-slate-500">
                  <span className="text-indigo-400">$ </span>
                  kanban new &quot;Q3 Product Roadmap&quot;
                  <br />
                  <span className="text-emerald-400">✓ Board created successfully</span>
                </div>
              </div>
            </Step>

            <Step>
              <div className="pb-6 space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    Invite your team
                  </h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Add teammates by email. Assign roles — admin, editor, or viewer.
                  Everyone sees real-time updates the moment changes happen.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Design", "Engineering", "Product", "Marketing"].map(
                    (tag) => (
                      <span
                        key={tag}
                        className="text-xs font-mono px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                      >
                        {tag}
                      </span>
                    )
                  )}
                </div>
              </div>
            </Step>

            <Step>
              <div className="pb-6 space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    Ship faster
                  </h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Drag cards across columns, write rich descriptions with Markdown,
                  attach files, leave comments, and track your velocity over time.
                  Everything in one place.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    "Drag & Drop",
                    "Markdown Editor",
                    "File Attachments",
                    "Analytics",
                  ].map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 text-xs text-slate-400"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </Step>
          </Stepper>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <PricingSection />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 flex justify-center">
        <GlareHover
          width="min(90vw, 700px)"
          height="320px"
          background="#161b27"
          borderRadius="16px"
          borderColor="rgba(255,255,255,0.08)"
          glareColor="#818cf8"
          glareOpacity={0.25}
          glareSize={300}
        >
          <div className="flex flex-col items-center text-center gap-6 px-8">
            <p className="text-xs font-mono uppercase tracking-widest text-indigo-400">
              Ready to start?
            </p>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-semibold text-slate-100 leading-snug">
              Your team&apos;s command center
              <br />
              starts here.
            </h2>
            <p className="text-sm text-slate-400 max-w-sm">
              Free to start, no credit card required. Upgrade when you need
              more power.
            </p>
            <Link
              href="/register"
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-medium px-8 py-3 rounded-md transition-all duration-150 text-sm"
            >
              Create your free account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </GlareHover>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <LayoutGrid className="w-4 h-4 text-indigo-400" />
            <span>Kanban Flow Pro</span>
            <span className="text-slate-700">·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link
              href="/login"
              className="hover:text-slate-300 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="hover:text-slate-300 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
