export const phase7DemoStore: {
  lastInteractionAt: Record<string, string>;
  completedFollowUps: Set<string>;
  nextFollowUps: Record<string, string>;
  interactions: Record<string, Array<{ id: string; type: "ligacao" | "whatsapp" | "email" | "reuniao" | "visita" | "observacao"; description: string; occurredAt: string; responsible: string }>>;
} = {
  lastInteractionAt: {},
  completedFollowUps: new Set(),
  nextFollowUps: {},
  interactions: {},
};
