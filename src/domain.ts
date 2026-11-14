export const agentStatuses = ["active", "inactive"] as const;
export type AgentStatus = (typeof agentStatuses)[number];

export const ailmentSeverities = ["low", "medium", "high", "critical"] as const;
export type AilmentSeverity = (typeof ailmentSeverities)[number];

export const ailmentStatuses = ["open", "in_progress", "resolved"] as const;
export type AilmentStatus = (typeof ailmentStatuses)[number];

export interface Agent {
  id: number;
  name: string;
  description: string;
  status: AgentStatus;
  created_at: string;
  updated_at: string;
}

export interface Ailment {
  id: number;
  agent_id: number;
  title: string;
  description: string;
  severity: AilmentSeverity;
  status: AilmentStatus;
  treatment: string;
  outcome: string;
  created_at: string;
  updated_at: string;
}

export interface AilmentWithAgent extends Ailment {
  agent_name: string;
}

export interface DashboardSummary {
  agentCount: number;
  activeAgentCount: number;
  openAilmentCount: number;
  severityCounts: Record<AilmentSeverity, number>;
  recentAilments: AilmentWithAgent[];
}

export type AilmentStatusFilter = AilmentStatus | "all";

export interface FieldErrors {
  name?: string;
  description?: string;
  agent_id?: string;
  title?: string;
  severity?: string;
  status?: string;
  treatment?: string;
  outcome?: string;
}
