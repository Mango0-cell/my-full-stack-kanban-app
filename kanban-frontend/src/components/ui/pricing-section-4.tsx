"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles as SparklesComp } from "@/components/ui/sparkles";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { motion } from "motion/react";
import { useRef, useState } from "react";

const plans = [
  {
    name: "Starter",
    description: "Great for small teams and startups getting organized",
    price: 12,
    yearlyPrice: 99,
    buttonText: "Get started",
    buttonVariant: "outline" as const,
    includes: [
      "Free includes:",
      "Unlimited Cards",
      "Custom backgrounds",
      "2-factor authentication",
      "Basic analytics",
      "Email support",
      "5 team members",
    ],
  },
  {
    name: "Business",
    description: "Best value for growing teams that need advanced features",
    price: 48,
    yearlyPrice: 399,
    buttonText: "Get started",
    buttonVariant: "default" as const,
    popular: true,
    includes: [
      "Everything in Starter, plus:",
      "Advanced checklists",
      "Custom fields",
      "Serverless automations",
      "Priority support",
      "Unlimited members",
      "Advanced analytics",
    ],
  },
  {
    name: "Enterprise",
    description: "Advanced security and unlimited access for large teams",
    price: 96,
    yearlyPrice: 899,
    buttonText: "Get started",
    buttonVariant: "outline" as const,
    includes: [
      "Everything in Business, plus:",
      "Multi-board management",
      "Guest access control",
      "Attachment permissions",
      "SSO & SAML",
      "Dedicated support",
      "Custom integrations",
    ],
  },
];

const PricingSwitch = ({ onSwitch }: { onSwitch: (value: string) => void }) => {
  const [selected, setSelected] = useState("0");
  const handleSwitch = (value: string) => { setSelected(value); onSwitch(value); };

  return (
    <div className="flex justify-center">
      <div className="relative z-10 mx-auto flex w-fit rounded-full bg-[#1a2030] border border-white/[0.08] p-1">
        {["Monthly", "Yearly"].map((label, i) => {
          const val = String(i);
          const isSelected = selected === val;
          return (
            <button key={label} onClick={() => handleSwitch(val)}
              className={cn("relative z-10 w-fit h-10 rounded-full sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors", isSelected ? "text-white" : "text-slate-400")}
            >
              {isSelected && (
                <motion.span layoutId="pricing-switch-4"
                  className="absolute top-0 left-0 h-10 w-full rounded-full border-4 shadow-sm shadow-indigo-600 border-indigo-600 bg-gradient-to-t from-indigo-500 to-indigo-600"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function PricingSection4() {
  const [isYearly, setIsYearly] = useState(false);
  const pricingRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (i: number) => ({ y: 0, opacity: 1, filter: "blur(0px)", transition: { delay: i * 0.15, duration: 0.5 } }),
    hidden: { filter: "blur(10px)", y: -20, opacity: 0 },
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden" style={{ background: 'rgba(10,12,18,0.82)', backdropFilter: 'blur(2px)' }} ref={pricingRef}>
      {/* Subtle grid + sparkles */}
      <TimelineContent animationNum={4} timelineRef={pricingRef} customVariants={revealVariants}
        className="absolute top-0 h-96 w-full overflow-hidden pointer-events-none [mask-image:radial-gradient(50%_50%,white,transparent)]"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:70px_80px]" />
        <SparklesComp density={400} speed={0.5} color="#818cf8"
          className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
        />
      </TimelineContent>

      {/* Indigo glow */}
      <div className="absolute top-0 left-[10%] right-[10%] w-[80%] h-full z-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at center, #6366f1 0%, transparent 60%)", opacity: 0.12, mixBlendMode: "screen" }}
      />

      {/* Content */}
      <div className="relative z-10 pt-24 pb-16 px-4">
        <article className="text-center mb-10 max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl md:text-4xl font-semibold text-white">
            <VerticalCutReveal splitBy="words" staggerDuration={0.12} staggerFrom="first" reverse containerClassName="justify-center"
              transition={{ type: "spring", stiffness: 250, damping: 40 }}
            >
              Plans that work best for you
            </VerticalCutReveal>
          </h2>
          <TimelineContent as="p" animationNum={0} timelineRef={pricingRef} customVariants={revealVariants} className="text-gray-400 text-sm">
            Trusted by teams worldwide. Pick the plan that fits your workflow.
          </TimelineContent>
          <TimelineContent as="div" animationNum={1} timelineRef={pricingRef} customVariants={revealVariants}>
            <PricingSwitch onSwitch={(v) => setIsYearly(parseInt(v) === 1)} />
          </TimelineContent>
        </article>

        <div className="grid md:grid-cols-3 max-w-5xl gap-6 mx-auto px-4">
          {plans.map((plan, index) => (
            <TimelineContent key={plan.name} as="div" animationNum={2 + index} timelineRef={pricingRef} customVariants={revealVariants}>
              <Card className={cn(
                "relative text-white border-white/[0.08] hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(99,102,241,0.2)] transition-all duration-300 cursor-pointer",
                plan.popular
                  ? "bg-gradient-to-b from-[#1e2840] to-[#161c2e] shadow-[0px_-10px_200px_0px_#4f46e580] z-20"
                  : "bg-gradient-to-b from-[#151b27] to-[#0f1420] z-10"
              )}>
                <CardHeader className="text-left pb-4">
                  {plan.popular && (
                    <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 mb-2 block">Most popular</span>
                  )}
                  <h3 className="text-2xl font-medium mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-semibold">
                      $<NumberFlow format={{ currency: "USD" }} value={isYearly ? plan.yearlyPrice : plan.price} className="text-4xl font-semibold" />
                    </span>
                    <span className="text-slate-400 text-sm">/{isYearly ? "year" : "month"}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <button className={cn("w-full mb-6 p-3 text-base font-medium rounded-xl transition-all duration-200",
                    plan.popular
                      ? "bg-indigo-500 hover:bg-indigo-400 shadow-lg shadow-indigo-900/40 border border-indigo-400/30 text-white"
                      : "bg-[#1e2433] hover:bg-[#252d3d] border border-white/[0.07] hover:border-white/[0.14] text-slate-200"
                  )}>
                    {plan.buttonText}
                  </button>
                  <div className="space-y-2 pt-4 border-t border-white/[0.06]">
                    <h4 className="font-medium text-sm text-slate-300 mb-3">{plan.includes[0]}</h4>
                    <ul className="space-y-2">
                      {plan.includes.slice(1).map((feature, fi) => (
                        <li key={fi} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full shrink-0" />
                          <span className="text-sm text-slate-400">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TimelineContent>
          ))}
        </div>
      </div>
    </div>
  );
}
