export function clearClientSessionState() {
  if (typeof window === 'undefined') return;
  try {
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (
        k.startsWith('chat-cache:') ||
        k.startsWith('kanban_canceled_cards:') ||
        k.startsWith('kanban_archived_projects:')
      ) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    // noop
  }
}
