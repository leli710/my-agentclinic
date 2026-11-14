import { readdirSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import Database from "better-sqlite3";
import type {
  AilmentSeverity,
  AilmentStatus,
  AilmentWithAgent,
  Agent,
  AgentStatus,
  DashboardSummary,
} from "./domain.js";

const migrationPattern = /^\d{3}_[a-z0-9_]+\.sql$/;

export function openDatabase(
  databasePath = resolve(process.cwd(), "data", "agent-clinic.sqlite"),
  migrationsDirectory = resolve(process.cwd(), "migrations"),
): Database.Database {
  if (databasePath !== ":memory:") {
    const absolutePath = isAbsolute(databasePath) ? databasePath : resolve(databasePath);
    mkdirSync(dirname(absolutePath), { recursive: true });
    databasePath = absolutePath;
  }

  const database = new Database(databasePath);
  database.pragma("foreign_keys = ON");

  try {
    applyMigrations(database, migrationsDirectory);
  } catch (error) {
    database.close();
    throw error;
  }

  return database;
}

export function applyMigrations(database: Database.Database, migrationsDirectory: string): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const migrations = readdirSync(migrationsDirectory)
    .filter((name) => migrationPattern.test(name))
    .sort();
  const appliedNames = new Set(
    database.prepare<[], { name: string }>("SELECT name FROM schema_migrations").all().map(({ name }) => name),
  );

  for (const migrationName of migrations) {
    if (appliedNames.has(migrationName)) {
      continue;
    }

    const sql = readFileSync(resolve(migrationsDirectory, migrationName), "utf8");
    const applyMigration = database.transaction(() => {
      database.exec(sql);
      database
        .prepare<[string, string]>("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)")
        .run(migrationName, new Date().toISOString());
    });

    applyMigration();
  }
}

export function seedDemoData(database: Database.Database): void {
  const agentCount = database.prepare<[], { count: number }>("SELECT COUNT(*) AS count FROM agents").get()?.count;
  if (agentCount === undefined) {
    throw new Error("Could not read agent count while seeding demo data.");
  }
  if (agentCount > 0) {
    return;
  }

  const now = new Date().toISOString();
  const seed = database.transaction(() => {
    const insertAgent = database.prepare<[string, string, AgentStatus, string, string]>(
      "INSERT INTO agents (name, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    );
    const schedulerId = Number(
      insertAgent.run(
        "סוכן תזמון",
        "מתאם משימות רקע ומדווח על זמני ביצוע.",
        "active",
        now,
        now,
      ).lastInsertRowid,
    );
    const reporterId = Number(
      insertAgent.run(
        "סוכן דיווח",
        "מפיק סיכומים ותובנות מתוך תוצאות הרצה.",
        "active",
        now,
        now,
      ).lastInsertRowid,
    );
    const insertAilment = database.prepare<
      [number, string, string, AilmentSeverity, AilmentStatus, string, string, string, string]
    >(
      `INSERT INTO ailments
        (agent_id, title, description, severity, status, treatment, outcome, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    insertAilment.run(
      schedulerId,
      "תור המשימות מתעכב",
      "משימות מתוזמנות ממתינות זמן רב מהרגיל לפני התחלה.",
      "high",
      "in_progress",
      "הוגדל מספר העובדים המקבילים ונאספו מדידות חדשות.",
      "",
      now,
      now,
    );
    insertAilment.run(
      reporterId,
      "דוח שבועי חסר סעיף סיכום",
      "הדוח נוצר, אך פסקת הסיכום אינה מופיעה בתוצאה.",
      "medium",
      "open",
      "",
      "",
      now,
      now,
    );
    insertAilment.run(
      reporterId,
      "תווית זמן לא עקבית",
      "תווית אזור הזמן בדוח לא תאמה לתאריך שנוצר.",
      "low",
      "resolved",
      "הוגדר אזור זמן מפורש בתהליך יצירת הדוח.",
      "התאריך והתווית תואמים בהרצה חוזרת.",
      now,
      now,
    );
  });

  seed();
}

export function listAgents(database: Database.Database): Agent[] {
  return database.prepare<[], Agent>("SELECT * FROM agents ORDER BY status, name").all();
}

export function getAgent(database: Database.Database, id: number): Agent | undefined {
  return database.prepare<[number], Agent>("SELECT * FROM agents WHERE id = ?").get(id);
}

export function createAgent(database: Database.Database, name: string, description: string): number {
  const now = new Date().toISOString();
  const result = database
    .prepare<[string, string, string, string]>(
      "INSERT INTO agents (name, description, status, created_at, updated_at) VALUES (?, ?, 'active', ?, ?)",
    )
    .run(name, description, now, now);
  return Number(result.lastInsertRowid);
}

export function updateAgent(database: Database.Database, id: number, name: string, description: string): void {
  database
    .prepare<[string, string, string, number]>(
      "UPDATE agents SET name = ?, description = ?, updated_at = ? WHERE id = ?",
    )
    .run(name, description, new Date().toISOString(), id);
}

export function toggleAgentStatus(database: Database.Database, id: number): void {
  database
    .prepare<[string, number]>(
      "UPDATE agents SET status = CASE status WHEN 'active' THEN 'inactive' ELSE 'active' END, updated_at = ? WHERE id = ?",
    )
    .run(new Date().toISOString(), id);
}

export function listAilments(
  database: Database.Database,
  status: AilmentStatus | "all" = "all",
): AilmentWithAgent[] {
  const query = `SELECT ailments.*, agents.name AS agent_name
    FROM ailments JOIN agents ON agents.id = ailments.agent_id`;
  if (status === "all") {
    return database.prepare<[], AilmentWithAgent>(`${query} ORDER BY ailments.updated_at DESC`).all();
  }
  return database
    .prepare<[AilmentStatus], AilmentWithAgent>(`${query} WHERE ailments.status = ? ORDER BY ailments.updated_at DESC`)
    .all(status);
}

export function getAilment(database: Database.Database, id: number): AilmentWithAgent | undefined {
  return database
    .prepare<[number], AilmentWithAgent>(
      `SELECT ailments.*, agents.name AS agent_name
       FROM ailments JOIN agents ON agents.id = ailments.agent_id
       WHERE ailments.id = ?`,
    )
    .get(id);
}

export function listAilmentsForAgent(database: Database.Database, agentId: number): AilmentWithAgent[] {
  return database
    .prepare<[number], AilmentWithAgent>(
      `SELECT ailments.*, agents.name AS agent_name
       FROM ailments JOIN agents ON agents.id = ailments.agent_id
       WHERE ailments.agent_id = ?
       ORDER BY ailments.updated_at DESC`,
    )
    .all(agentId);
}

export function createAilment(
  database: Database.Database,
  input: {
    agentId: number;
    title: string;
    description: string;
    severity: AilmentSeverity;
  },
): number {
  const now = new Date().toISOString();
  const result = database
    .prepare<[number, string, string, AilmentSeverity, string, string]>(
      `INSERT INTO ailments
        (agent_id, title, description, severity, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'open', ?, ?)`,
    )
    .run(input.agentId, input.title, input.description, input.severity, now, now);
  return Number(result.lastInsertRowid);
}

export function updateAilment(
  database: Database.Database,
  id: number,
  input: {
    description: string;
    severity: AilmentSeverity;
    status: AilmentStatus;
    treatment: string;
    outcome: string;
  },
): void {
  database
    .prepare<[string, AilmentSeverity, AilmentStatus, string, string, string, number]>(
      `UPDATE ailments
       SET description = ?, severity = ?, status = ?, treatment = ?, outcome = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      input.description,
      input.severity,
      input.status,
      input.treatment,
      input.outcome,
      new Date().toISOString(),
      id,
    );
}

export function getDashboardSummary(database: Database.Database): DashboardSummary {
  const counts = database
    .prepare<
      [],
      { agent_count: number; active_agent_count: number; open_ailment_count: number }
    >(
      `SELECT
        (SELECT COUNT(*) FROM agents) AS agent_count,
        (SELECT COUNT(*) FROM agents WHERE status = 'active') AS active_agent_count,
        (SELECT COUNT(*) FROM ailments WHERE status != 'resolved') AS open_ailment_count`,
    )
    .get();
  if (!counts) {
    throw new Error("Could not read dashboard summary counts.");
  }

  const severityRows = database
    .prepare<[], { severity: AilmentSeverity; count: number }>(
      "SELECT severity, COUNT(*) AS count FROM ailments WHERE status != 'resolved' GROUP BY severity",
    )
    .all();
  const severityCounts: Record<AilmentSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  for (const row of severityRows) {
    severityCounts[row.severity] = row.count;
  }

  const recentAilments = database
    .prepare<[], AilmentWithAgent>(
      `SELECT ailments.*, agents.name AS agent_name
       FROM ailments JOIN agents ON agents.id = ailments.agent_id
       ORDER BY ailments.updated_at DESC
       LIMIT 5`,
    )
    .all();

  return {
    agentCount: counts.agent_count,
    activeAgentCount: counts.active_agent_count,
    openAilmentCount: counts.open_ailment_count,
    severityCounts,
    recentAilments,
  };
}
