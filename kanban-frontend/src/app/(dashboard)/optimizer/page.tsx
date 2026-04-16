'use client';

import { Brain, Sparkles, Cpu, Zap, CircuitBoard } from 'lucide-react';

const models = [
  {
    name: 'Claude Code Optimizer',
    provider: 'Anthropic',
    description: 'Execute real-time semantic analysis on project boards to identify architectural bottlenecks and PR risks.',
    version: 'v2.4.0-alpha',
    icon: Brain,
    accentColor: 'rgba(99,102,241,0.1)',
    badgeColor: 'rgba(99,102,241,0.15)',
    iconColor: 'var(--color-brand-400)',
    sessions: '12',
    optimizations: '842',
  },
  {
    name: 'Gemini 2.5 Pro',
    provider: 'Google DeepMind',
    description: 'Multi-modal reasoning engine with deep code understanding, long-context analysis, and cross-file dependency mapping.',
    version: 'v2.5.0-stable',
    icon: Sparkles,
    accentColor: 'rgba(56,189,248,0.1)',
    badgeColor: 'rgba(56,189,248,0.15)',
    iconColor: '#38bdf8',
    sessions: '8',
    optimizations: '1,204',
  },
  {
    name: 'GPT-5 Turbo',
    provider: 'OpenAI',
    description: 'Advanced chain-of-thought optimizer for complex refactoring tasks, test generation, and architecture suggestions.',
    version: 'v5.0.1-turbo',
    icon: Zap,
    accentColor: 'rgba(16,185,129,0.1)',
    badgeColor: 'rgba(16,185,129,0.15)',
    iconColor: '#10b981',
    sessions: '15',
    optimizations: '967',
  },
  {
    name: 'Llama 4 Maverick',
    provider: 'Meta AI',
    description: 'Open-weight model optimized for on-premise deployment with strong performance on code completion and bug detection.',
    version: 'v4.1.0-maverick',
    icon: Cpu,
    accentColor: 'rgba(251,146,60,0.1)',
    badgeColor: 'rgba(251,146,60,0.15)',
    iconColor: '#fb923c',
    sessions: '6',
    optimizations: '531',
  },
  {
    name: 'Mistral Large',
    provider: 'Mistral AI',
    description: 'European-built large language model with efficient inference, strong multilingual support, and code optimization capabilities.',
    version: 'v3.2.0-large',
    icon: CircuitBoard,
    accentColor: 'rgba(168,85,247,0.1)',
    badgeColor: 'rgba(168,85,247,0.15)',
    iconColor: '#a855f7',
    sessions: '9',
    optimizations: '718',
  },
];

export default function OptimizerPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: 'var(--color-text-primary)' }}>
        Code Optimizer
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
        AI-powered analysis for your project boards.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {models.map((model) => {
          const Icon = model.icon;
          return (
            <div
              key={model.name}
              className="p-6 rounded-xl relative overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 blur-3xl -mr-16 -mt-16"
                style={{ backgroundColor: model.accentColor }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-widest"
                    style={{ backgroundColor: model.badgeColor, color: model.iconColor }}
                  >
                    AI Powered
                  </span>
                  <span
                    className="text-[10px] uppercase"
                    style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
                  >
                    {model.version}
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <Icon className="h-6 w-6" style={{ color: model.iconColor }} />
                  <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {model.name}
                  </h3>
                </div>
                <p className="text-[11px] mb-3" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  by {model.provider}
                </p>
                <p className="text-xs leading-relaxed mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                  {model.description}
                </p>

                <div className="space-y-3 mb-6">
                  {[
                    { label: 'Active Sessions', value: model.sessions },
                    { label: 'Optimizations/Day', value: model.optimizations, highlight: true },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex justify-between items-center p-2 rounded"
                      style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <span
                        className="text-[10px] uppercase"
                        style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}
                      >
                        {item.label}
                      </span>
                      <span
                        className="text-[10px]"
                        style={{
                          color: item.highlight ? 'var(--color-success)' : 'var(--color-text-primary)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  className="w-full py-2 rounded text-[11px] uppercase font-medium transition-colors"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Configure Model Parameters
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
