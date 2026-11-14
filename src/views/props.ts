import type {
  Agent,
  AilmentSeverity,
  AilmentStatus,
  AilmentStatusFilter,
  AilmentWithAgent,
  DashboardSummary,
  FieldErrors,
} from "../domain.js";
import type { CourseProgress } from "../course-progress.js";

export interface DashboardViewProps {
  summary: DashboardSummary;
}

export interface CourseProgressViewProps {
  progress: CourseProgress;
}

export interface AgentListViewProps {
  agents: Agent[];
  error?: string;
  values?: { name: string; description: string };
}

export interface AgentDetailViewProps {
  agent: Agent;
  ailments: AilmentWithAgent[];
  error?: string;
  values?: { name: string; description: string };
}

export interface AilmentListViewProps {
  ailments: AilmentWithAgent[];
  activeAgents: Agent[];
  filter: AilmentStatusFilter;
  error?: string;
  values?: {
    agentId: string;
    title: string;
    description: string;
    severity: AilmentSeverity;
  };
}

export interface AilmentDetailViewProps {
  ailment: AilmentWithAgent;
  error?: string;
  values?: {
    description: string;
    severity: AilmentSeverity;
    status: AilmentStatus;
    treatment: string;
    outcome: string;
  };
  fieldErrors?: FieldErrors;
}
