export const AGENT_NODES = [
  { id: 'plan',   label: 'Planner',  sub: 'reads repo, drafts approach',  icon: 'plan' },
  { id: 'code',   label: 'Coder',    sub: 'writes diff against files',    icon: 'code' },
  { id: 'verify', label: 'Verifier', sub: 'runs tests, tsc, eslint',      icon: 'verify' },
  { id: 'critic', label: 'Critic',   sub: 'evidence-first debug loop',    icon: 'critic' },
  { id: 'ship',   label: 'Ship',     sub: 'commit & open PR',             icon: 'ship' },
];
