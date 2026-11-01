# Grok hooks

Grok reads hooks from `.claude/settings.json`, so `guard.js` already runs for Grok. Run `/hooks-trust` once to enable project hooks.

Add a JSON file here only for a Grok-only event. It must call `.agents/hooks/guard.js`.
