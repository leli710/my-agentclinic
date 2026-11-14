import type {
  AilmentSeverity,
  AilmentStatus,
  FieldErrors,
} from "./domain.js";

export interface AgentInput {
  name: string;
  description: string;
}

export interface AilmentCreateInput {
  agentId: number;
  title: string;
  description: string;
  severity: AilmentSeverity;
}

export interface AilmentUpdateInput {
  description: string;
  severity: AilmentSeverity;
  status: AilmentStatus;
  treatment: string;
  outcome: string;
}

export interface ValidationResult<T> {
  value?: T;
  errors: FieldErrors;
}

export function readTextField(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function validateAgentInput(form: FormData): ValidationResult<AgentInput> {
  const name = readTextField(form, "name");
  const description = readTextField(form, "description");
  const errors: FieldErrors = {};

  if (name.length < 2 || name.length > 80) {
    errors.name = "שם הסוכן צריך להכיל בין 2 ל־80 תווים.";
  }
  if (description.length > 500) {
    errors.description = "התיאור יכול להכיל עד 500 תווים.";
  }

  return Object.keys(errors).length > 0 ? { errors } : { value: { name, description }, errors };
}

export function validateAilmentCreateInput(form: FormData): ValidationResult<AilmentCreateInput> {
  const rawAgentId = readTextField(form, "agent_id");
  const title = readTextField(form, "title");
  const description = readTextField(form, "description");
  const severity = parseSeverity(readTextField(form, "severity"));
  const agentId = Number(rawAgentId);
  const errors: FieldErrors = {};

  if (!Number.isSafeInteger(agentId) || agentId < 1) {
    errors.agent_id = "יש לבחור סוכן תקין.";
  }
  if (title.length < 3 || title.length > 120) {
    errors.title = "כותרת התקלה צריכה להכיל בין 3 ל־120 תווים.";
  }
  if (description.length < 3 || description.length > 2000) {
    errors.description = "תיאור התקלה צריך להכיל בין 3 ל־2,000 תווים.";
  }
  if (!severity) {
    errors.severity = "יש לבחור רמת חומרה תקינה.";
  }

  return Object.keys(errors).length > 0 || !severity
    ? { errors }
    : { value: { agentId, title, description, severity }, errors };
}

export function validateAilmentUpdateInput(form: FormData): ValidationResult<AilmentUpdateInput> {
  const description = readTextField(form, "description");
  const severity = parseSeverity(readTextField(form, "severity"));
  const status = parseStatus(readTextField(form, "status"));
  const treatment = readTextField(form, "treatment");
  const outcome = readTextField(form, "outcome");
  const errors: FieldErrors = {};

  if (description.length < 3 || description.length > 2000) {
    errors.description = "תיאור התקלה צריך להכיל בין 3 ל־2,000 תווים.";
  }
  if (!severity) {
    errors.severity = "יש לבחור רמת חומרה תקינה.";
  }
  if (!status) {
    errors.status = "יש לבחור מצב תקין.";
  }
  if (treatment.length > 2000) {
    errors.treatment = "תיאור הטיפול יכול להכיל עד 2,000 תווים.";
  }
  if (outcome.length > 2000) {
    errors.outcome = "תיאור התוצאה יכול להכיל עד 2,000 תווים.";
  }

  return Object.keys(errors).length > 0 || !severity || !status
    ? { errors }
    : { value: { description, severity, status, treatment, outcome }, errors };
}

function parseSeverity(value: string): AilmentSeverity | undefined {
  return value === "low" || value === "medium" || value === "high" || value === "critical"
    ? value
    : undefined;
}

function parseStatus(value: string): AilmentStatus | undefined {
  return value === "open" || value === "in_progress" || value === "resolved" ? value : undefined;
}
