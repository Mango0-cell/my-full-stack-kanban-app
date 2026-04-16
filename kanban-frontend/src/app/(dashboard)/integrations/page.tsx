'use client';

import { Terminal, GitBranch, Webhook } from 'lucide-react';

const integrations = [
  { name: 'GitHub', desc: 'Sync pull requests and issues directly into your kanban board.', icon: GitBranch, connected: false },
  { name: 'Webhooks', desc: 'Send real-time events to your external services.', icon: Webhook, connected: false },
  { name: 'CLI Tools', desc: 'Manage your board from the terminal.', icon: Terminal, connected: true },
];

export default function IntegrationsPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10">
      <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: 'var(--color-text-primary)' }}>
        Integrations
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
        Connect external tools to your workspace.
      </p>

      <div className="space-y-4">
        {integrations.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="flex items-center justify-between p-5 rounded-xl transition-all duration-200"
                 style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                     style={{ backgroundColor: 'var(--color-surface-4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Icon className="h-5 w-5" style={{ color: 'var(--color-text-primary)' }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.name}</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.desc}</p>
                </div>
              </div>
              <button
                className="px-4 py-2 rounded-lg text-xs font-medium transition-all active:scale-95"
                style={item.connected
                  ? { backgroundColor: 'var(--color-surface-4)', color: 'var(--color-text-secondary)', border: '1px solid rgba(255,255,255,0.1)' }
                  : { backgroundColor: 'var(--color-brand-500)', color: '#ffffff' }
                }
              >
                {item.connected ? 'Connected' : 'Connect'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
