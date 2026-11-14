import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import type Database from "better-sqlite3";
import { parseCourseProgress } from "./course-progress.js";
import {
  createAgent,
  createAilment,
  getAgent,
  getAilment,
  getDashboardSummary,
  listAgents,
  listAilments,
  listAilmentsForAgent,
  toggleAgentStatus,
  updateAgent,
  updateAilment,
} from "./db.js";
import type { AilmentSeverity, AilmentStatus } from "./domain.js";
import { renderAgentDetail, renderAgents, renderAilmentDetail, renderAilments, renderCourseProgress, renderDashboard, renderNotFound } from "./views.js";
import { readTextField, validateAgentInput, validateAilmentCreateInput, validateAilmentUpdateInput } from "./validation.js";

const staticAssetOptions = {
  rewriteRequestPath: (path: string) => path.replace(/^\/assets/, ""),
};

function parseId(value: string): number | undefined {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

function parseSeverity(value: string): AilmentSeverity {
  return value === "low" || value === "medium" || value === "high" || value === "critical"
    ? value
    : "medium";
}

function parseStatus(value: string): AilmentStatus {
  return value === "open" || value === "in_progress" || value === "resolved" ? value : "open";
}

export function createApp(database: Database.Database): Hono {
  const app = new Hono();

  app.use(
    "/assets/*",
    serveStatic({
      ...staticAssetOptions,
      root: "./node_modules/@picocss/pico/css",
    }),
  );
  app.use(
    "/static/*",
    serveStatic({
      ...staticAssetOptions,
      root: "./public",
      rewriteRequestPath: (path: string) => path.replace(/^\/static/, ""),
    }),
  );

  app.get("/api/hello", (context) => context.json({ message: "Hello Hono!" }));

  app.get("/", (context) => context.html(renderDashboard({ summary: getDashboardSummary(database) })));

  app.get("/course", async (context) => {
    const taskBoard = await readFile(resolve(process.cwd(), "TASKS.md"), "utf8");
    const progress = parseCourseProgress(taskBoard);
    return context.html(renderCourseProgress({ progress }));
  });

  app.get("/agents", (context) => context.html(renderAgents({ agents: listAgents(database) })));

  app.post("/agents", async (context) => {
    const form = await context.req.formData();
    const result = validateAgentInput(form);
    if (!result.value) {
      return context.html(
        renderAgents({
          agents: listAgents(database),
          error: result.errors.name ?? result.errors.description ?? "הפרטים שהוזנו אינם תקינים.",
          values: {
            name: readTextField(form, "name"),
            description: readTextField(form, "description"),
          },
        }),
        400,
      );
    }

    const id = createAgent(database, result.value.name, result.value.description);
    return context.redirect(`/agents/${id}`, 303);
  });

  app.get("/agents/:id", (context) => {
    const id = parseId(context.req.param("id"));
    const agent = id === undefined ? undefined : getAgent(database, id);
    if (!agent) {
      return context.html(renderNotFound(), 404);
    }
    return context.html(
      renderAgentDetail({
        agent,
        ailments: listAilmentsForAgent(database, agent.id),
      }),
    );
  });

  app.post("/agents/:id/update", async (context) => {
    const id = parseId(context.req.param("id"));
    const agent = id === undefined ? undefined : getAgent(database, id);
    if (!agent) {
      return context.html(renderNotFound(), 404);
    }

    const form = await context.req.formData();
    const result = validateAgentInput(form);
    if (!result.value) {
      return context.html(
        renderAgentDetail({
          agent,
          ailments: listAilmentsForAgent(database, agent.id),
          error: result.errors.name ?? result.errors.description ?? "הפרטים שהוזנו אינם תקינים.",
          values: {
            name: readTextField(form, "name"),
            description: readTextField(form, "description"),
          },
        }),
        400,
      );
    }

    updateAgent(database, agent.id, result.value.name, result.value.description);
    return context.redirect(`/agents/${agent.id}`, 303);
  });

  app.post("/agents/:id/status", (context) => {
    const id = parseId(context.req.param("id"));
    const agent = id === undefined ? undefined : getAgent(database, id);
    if (!agent) {
      return context.html(renderNotFound(), 404);
    }

    toggleAgentStatus(database, agent.id);
    return context.redirect(`/agents/${agent.id}`, 303);
  });

  app.get("/ailments", (context) => {
    const rawFilter = context.req.query("status");
    const rawAgentId = context.req.query("agent_id");
    const validFilter =
      rawFilter === undefined ||
      rawFilter === "all" ||
      rawFilter === "open" ||
      rawFilter === "in_progress" ||
      rawFilter === "resolved";
    if (!validFilter) {
      return context.text("ערך הסינון אינו תקין.", 400);
    }
    const filter = rawFilter ?? "all";
    const activeAgents = listAgents(database).filter((agent) => agent.status === "active");
    const selectedAgentId = rawAgentId === undefined ? undefined : parseId(rawAgentId);
    const selectedAgent = activeAgents.find((agent) => agent.id === selectedAgentId);
    return context.html(
      renderAilments({
        ailments: listAilments(database, filter),
        activeAgents,
        filter,
        values: selectedAgent
          ? {
              agentId: String(selectedAgent.id),
              title: "",
              description: "",
              severity: "medium",
            }
          : undefined,
      }),
    );
  });

  app.post("/ailments", async (context) => {
    const form = await context.req.formData();
    const result = validateAilmentCreateInput(form);
    const agent = result.value ? getAgent(database, result.value.agentId) : undefined;
    const agentError = result.value && (!agent || agent.status !== "active")
      ? "אפשר לפתוח תקלה רק עבור סוכן פעיל."
      : undefined;

    if (!result.value || agentError) {
      return context.html(
        renderAilments({
          ailments: listAilments(database),
          activeAgents: listAgents(database).filter((item) => item.status === "active"),
          filter: "all",
          error: agentError ?? result.errors.agent_id ?? result.errors.title ?? result.errors.description ?? result.errors.severity ?? "הפרטים שהוזנו אינם תקינים.",
          values: {
            agentId: readTextField(form, "agent_id"),
            title: readTextField(form, "title"),
            description: readTextField(form, "description"),
            severity: parseSeverity(readTextField(form, "severity")),
          },
        }),
        400,
      );
    }

    createAilment(database, result.value);
    return context.redirect("/ailments", 303);
  });

  app.get("/ailments/:id", (context) => {
    const id = parseId(context.req.param("id"));
    const ailment = id === undefined ? undefined : getAilment(database, id);
    if (!ailment) {
      return context.html(renderNotFound(), 404);
    }
    return context.html(renderAilmentDetail({ ailment }));
  });

  app.post("/ailments/:id/update", async (context) => {
    const id = parseId(context.req.param("id"));
    const ailment = id === undefined ? undefined : getAilment(database, id);
    if (!ailment) {
      return context.html(renderNotFound(), 404);
    }

    const form = await context.req.formData();
    const result = validateAilmentUpdateInput(form);
    if (!result.value) {
      return context.html(
        renderAilmentDetail({
          ailment,
          error:
            result.errors.description ??
            result.errors.severity ??
            result.errors.status ??
            result.errors.treatment ??
            result.errors.outcome ??
            "הפרטים שהוזנו אינם תקינים.",
          values: {
            description: readTextField(form, "description"),
            severity: parseSeverity(readTextField(form, "severity")),
            status: parseStatus(readTextField(form, "status")),
            treatment: readTextField(form, "treatment"),
            outcome: readTextField(form, "outcome"),
          },
        }),
        400,
      );
    }

    updateAilment(database, ailment.id, result.value);
    return context.redirect(`/ailments/${ailment.id}`, 303);
  });

  app.notFound((context) => context.html(renderNotFound(), 404));
  app.onError((error, context) => {
    console.error("Agent Clinic request failed:", error);
    return context.text("הפעולה נכשלה. הפרטים נשמרו ביומן השרת לבדיקה.", 500);
  });

  return app;
}
