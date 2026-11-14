import assert from "node:assert/strict";
import { afterEach, describe, it } from "vitest";
import type Database from "better-sqlite3";
import { createApp } from "../app.js";
import { openDatabase, seedDemoData } from "../db.js";

const openDatabases: Database.Database[] = [];

function createTestContext() {
  const database = openDatabase(":memory:");
  openDatabases.push(database);
  return { database, app: createApp(database) };
}

function formRequest(path: string, values: Record<string, string>, method = "POST"): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(values).toString(),
  };
}

afterEach(() => {
  for (const database of openDatabases.splice(0)) {
    database.close();
  }
});

describe("Agent Clinic web application", () => {
  it("preserves the Hello Hono JSON API", async () => {
    const { app } = createTestContext();
    const response = await app.request("/api/hello");

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /application\/json/);
    assert.deepEqual(await response.json(), { message: "Hello Hono!" });
  });

  it("renders a Hebrew right-to-left dashboard with current data", async () => {
    const { app, database } = createTestContext();
    seedDemoData(database);

    const response = await app.request("/");
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(body, /<html lang="he" dir="rtl">/);
    assert.match(body, /<header class="site-header">/);
    assert.match(body, /<main class="container page-content">/);
    assert.match(body, /<footer class="container site-footer">/);
    assert.match(body, /סוכנים רשומים/);
    assert.match(body, /תקלות פתוחות/);
    assert.match(body, /תור המשימות מתעכב/);
  });

  it("renders course progress from the Hebrew task board", async () => {
    const { app } = createTestContext();
    const response = await app.request("/course");
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(body, /התקדמות הקורס/);
    assert.match(body, /משימות שהושלמו/);
    assert.match(body, /שלב 1:/);
    assert.match(body, /שלב 8: השלמת MVP/);
    assert.doesNotMatch(body, /שלב 9: Skill ליצירת Feature Spec/);
    assert.match(body, /<progress/);
  });

  it("serves Pico CSS and the responsive stylesheet locally", async () => {
    const { app } = createTestContext();
    const picoResponse = await app.request("/assets/pico.min.css");
    const customResponse = await app.request("/static/styles.css");
    const picoCss = await picoResponse.text();
    const customCss = await customResponse.text();

    assert.equal(picoResponse.status, 200);
    assert.match(picoResponse.headers.get("content-type") ?? "", /text\/css/);
    assert.match(picoCss, /Pico/);
    assert.equal(customResponse.status, 200);
    assert.match(customCss, /max-width: 560px/);
  });

  it("applies the schema migration and seeds demo data only once", () => {
    const { database } = createTestContext();
    seedDemoData(database);
    seedDemoData(database);

    assert.equal(
      database.prepare<[], { count: number }>("SELECT COUNT(*) AS count FROM schema_migrations").get()?.count,
      1,
    );
    assert.equal(database.prepare<[], { count: number }>("SELECT COUNT(*) AS count FROM agents").get()?.count, 2);
    assert.equal(database.prepare<[], { count: number }>("SELECT COUNT(*) AS count FROM ailments").get()?.count, 3);
  });

  it("creates, updates, and deactivates an agent", async () => {
    const { app, database } = createTestContext();
    const createResponse = await app.request(
      "/agents",
      formRequest("/agents", { name: "בדיקת נתונים", description: "סוכן בדיקה" }),
    );

    assert.equal(createResponse.status, 303);
    const location = createResponse.headers.get("location");
    assert.ok(location);
    const agentId = Number(location.split("/").at(-1));

    const detailResponse = await app.request(location);
    assert.equal(detailResponse.status, 200);
    assert.match(await detailResponse.text(), /בדיקת נתונים/);

    const updateResponse = await app.request(
      `/agents/${agentId}/update`,
      formRequest(`/agents/${agentId}/update`, { name: "סוכן מעודכן", description: "תיאור חדש" }),
    );
    assert.equal(updateResponse.status, 303);
    assert.equal(database.prepare<[number], { name: string }>("SELECT name FROM agents WHERE id = ?").get(agentId)?.name, "סוכן מעודכן");

    const statusResponse = await app.request(`/agents/${agentId}/status`, {
      method: "POST",
    });
    assert.equal(statusResponse.status, 303);
    assert.equal(database.prepare<[number], { status: string }>("SELECT status FROM agents WHERE id = ?").get(agentId)?.status, "inactive");
  });

  it("rejects invalid agent input without writing it to SQLite", async () => {
    const { app, database } = createTestContext();
    const response = await app.request(
      "/agents",
      formRequest("/agents", { name: "x", description: "" }),
    );

    assert.equal(response.status, 400);
    assert.match(await response.text(), /בין 2 ל־80 תווים/);
    assert.equal(database.prepare<[], { count: number }>("SELECT COUNT(*) AS count FROM agents").get()?.count, 0);
  });

  it("escapes user-provided agent names in HTML", async () => {
    const { app } = createTestContext();
    const response = await app.request(
      "/agents",
      formRequest("/agents", { name: "<script>alert(1)</script>", description: "טקסט" }),
    );

    assert.equal(response.status, 303);
    const location = response.headers.get("location");
    assert.ok(location);
    const page = await app.request(location);
    const body = await page.text();

    assert.equal(page.status, 200);
    assert.doesNotMatch(body, /<script>alert/);
    assert.match(body, /&lt;script&gt;/);
  });

  it("creates, updates, filters, and retains an ailment", async () => {
    const { app, database } = createTestContext();
    const agentId = database
      .prepare<[string, string, string, string]>(
        "INSERT INTO agents (name, description, status, created_at, updated_at) VALUES (?, ?, 'active', ?, ?)",
      )
      .run("סוכן תרגול", "", new Date().toISOString(), new Date().toISOString()).lastInsertRowid;

    const createResponse = await app.request(
      "/ailments",
      formRequest("/ailments", {
        agent_id: String(agentId),
        title: "שגיאת דוגמה",
        description: "תיאור מפורט לתקלה",
        severity: "high",
      }),
    );
    assert.equal(createResponse.status, 303);

    const ailment = database
      .prepare<[], { id: number }>("SELECT id FROM ailments")
      .get();
    assert.ok(ailment);

    const updateResponse = await app.request(
      `/ailments/${ailment.id}/update`,
      formRequest(`/ailments/${ailment.id}/update`, {
        description: "התקלה נותחה ונפתרה",
        severity: "medium",
        status: "resolved",
        treatment: "הוגדרה תצורה מתוקנת",
        outcome: "הריצה הבאה הסתיימה בהצלחה",
      }),
    );
    assert.equal(updateResponse.status, 303);

    const detail = await app.request(`/ailments/${ailment.id}`);
    const detailBody = await detail.text();
    assert.equal(detail.status, 200);
    assert.match(detailBody, /הריצה הבאה הסתיימה בהצלחה/);
    assert.match(detailBody, /נפתרה/);

    const openList = await app.request("/ailments?status=open");
    assert.doesNotMatch(await openList.text(), /שגיאת דוגמה/);
    const resolvedList = await app.request("/ailments?status=resolved");
    assert.match(await resolvedList.text(), /שגיאת דוגמה/);

    const saved = database
      .prepare<[number], { status: string; treatment: string; outcome: string }>(
        "SELECT status, treatment, outcome FROM ailments WHERE id = ?",
      )
      .get(ailment.id);
    assert.deepEqual(saved, {
      status: "resolved",
      treatment: "הוגדרה תצורה מתוקנת",
      outcome: "הריצה הבאה הסתיימה בהצלחה",
    });
  });

  it("rejects invalid ailment values, unknown agents, and filters", async () => {
    const { app, database } = createTestContext();
    const invalidForm = await app.request(
      "/ailments",
      formRequest("/ailments", {
        agent_id: "999",
        title: "תקלה",
        description: "תיאור תקין",
        severity: "unknown",
      }),
    );
    assert.equal(invalidForm.status, 400);
    assert.equal(database.prepare<[], { count: number }>("SELECT COUNT(*) AS count FROM ailments").get()?.count, 0);

    const invalidFilter = await app.request("/ailments?status=unknown");
    assert.equal(invalidFilter.status, 400);
  });

  it("returns not-found responses instead of success for unknown routes and records", async () => {
    const { app } = createTestContext();
    const unknownPage = await app.request("/not-a-page");
    const unknownAgent = await app.request("/agents/987654");
    const wrongMethod = await app.request("/", { method: "POST" });

    assert.equal(unknownPage.status, 404);
    assert.equal(unknownAgent.status, 404);
    assert.equal(wrongMethod.status, 404);
  });
});
