import { html } from "hono/html";
import type {
  AgentStatus,
  AilmentSeverity,
  AilmentStatus,
  AilmentStatusFilter,
} from "./domain.js";
import type { CourseStageProgress } from "./course-progress.js";
import type {
  AgentDetailViewProps,
  AgentListViewProps,
  AilmentDetailViewProps,
  AilmentListViewProps,
  CourseProgressViewProps,
  DashboardViewProps,
} from "./views/props.js";
import { renderLayout } from "./views/layout.js";

const severityLabels: Record<AilmentSeverity, string> = {
  low: "נמוכה",
  medium: "בינונית",
  high: "גבוהה",
  critical: "קריטית",
};

const statusLabels: Record<AilmentStatus, string> = {
  open: "פתוחה",
  in_progress: "בטיפול",
  resolved: "נפתרה",
};

const filterLabels: Record<AilmentStatusFilter, string> = {
  all: "כל המצבים",
  open: "פתוחות",
  in_progress: "בטיפול",
  resolved: "נפתרו",
};

const agentStatusLabels: Record<AgentStatus, string> = {
  active: "פעיל",
  inactive: "מושבת",
};

function severityBadge(severity: AilmentSeverity) {
  return html`<span class="badge severity-${severity}">${severityLabels[severity]}</span>`;
}

function statusBadge(status: AilmentStatus) {
  return html`<span class="badge status-${status}">${statusLabels[status]}</span>`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "לא ידוע"
    : new Intl.DateTimeFormat("he-IL", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function ailmentRows(ailments: AilmentListViewProps["ailments"]) {
  if (ailments.length === 0) {
    return html`<tr>
      <td colspan="5" class="empty-state">אין תקלות להצגה כרגע. גם זה סוג של הצלחה.</td>
    </tr>`;
  }

  return ailments.map(
    (ailment) => html`<tr>
      <td>
        <a href="/ailments/${ailment.id}"><strong>${ailment.title}</strong></a>
        <small class="cell-secondary">${ailment.description}</small>
      </td>
      <td><a href="/agents/${ailment.agent_id}">${ailment.agent_name}</a></td>
      <td>${severityBadge(ailment.severity)}</td>
      <td>${statusBadge(ailment.status)}</td>
      <td>${formatDate(ailment.updated_at)}</td>
    </tr>`,
  );
}

export function renderDashboard({ summary }: DashboardViewProps) {
  const content = html`<section class="intro-panel">
      <p class="eyebrow">ביקור בוקר</p>
      <p class="intro-copy">
        תמונת מצב של סוכני התוכנה שלך. בלי סטטוסקופ — רק נתונים, תיעוד וקצת תקווה.
      </p>
      <div class="action-row">
        <a href="/agents" role="button">ניהול סוכנים</a>
        <a href="/ailments" role="button" class="secondary">פתיחת תקלה</a>
      </div>
    </section>

    <section class="stats-grid" aria-label="סיכום מצב">
      <article class="stat-card">
        <span class="stat-label">סוכנים רשומים</span>
        <strong class="stat-value">${summary.agentCount}</strong>
        <small>${summary.activeAgentCount} פעילים</small>
      </article>
      <article class="stat-card">
        <span class="stat-label">תקלות פתוחות</span>
        <strong class="stat-value">${summary.openAilmentCount}</strong>
        <small>פתוחות או בטיפול</small>
      </article>
      <article class="stat-card">
        <span class="stat-label">חומרה קריטית</span>
        <strong class="stat-value">${summary.severityCounts.critical}</strong>
        <small>כדאי לטפל קודם</small>
      </article>
      <article class="stat-card">
        <span class="stat-label">חומרה גבוהה</span>
        <strong class="stat-value">${summary.severityCounts.high}</strong>
        <small>ממתינות לתשומת לב</small>
      </article>
    </section>

    <section class="content-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">יומן המרפאה</p>
          <h2>עדכונים אחרונים</h2>
        </div>
        <a href="/ailments">לכל התקלות ←</a>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th scope="col">תקלה</th><th scope="col">סוכן</th><th scope="col">חומרה</th><th scope="col">מצב</th><th scope="col">עדכון</th></tr>
          </thead>
          <tbody>${ailmentRows(summary.recentAilments)}</tbody>
        </table>
      </div>
    </section>`;
  return renderLayout("לוח מצב", content);
}

function stageStatus(stage: CourseStageProgress): string {
  if (stage.totalTasks > 0 && stage.completedTasks === stage.totalTasks) {
    return "הושלם";
  }
  if (stage.blockedTasks > 0) {
    return "חסום";
  }
  if (stage.completedTasks > 0) {
    return "בתהליך";
  }
  if (stage.approvalTasks > 0) {
    return "ממתין לאישור";
  }
  return "ממתין";
}

export function renderCourseProgress({ progress }: CourseProgressViewProps) {
  const completionLabel = progress.totalTasks === 0
    ? "אין משימות להצגה"
    : `${progress.completedTasks} מתוך ${progress.totalTasks} משימות הושלמו`;
  const content = html`<section class="intro-panel">
      <p class="eyebrow">לוח הקורס</p>
      <p class="intro-copy">
        התקדמות שמחושבת ישירות מתיבות הסימון ב־TASKS.md, בלי מקור נתונים נוסף.
      </p>
    </section>

    <section class="stats-grid course-stats" aria-label="סיכום התקדמות הקורס">
      <article class="stat-card">
        <span class="stat-label">משימות שהושלמו</span>
        <strong class="stat-value">${progress.completedTasks}</strong>
        <small>${completionLabel}</small>
      </article>
      <article class="stat-card">
        <span class="stat-label">ממתינות לאישור</span>
        <strong class="stat-value">${progress.approvalTasks}</strong>
        <small>נדרשת החלטת משתמשת</small>
      </article>
      <article class="stat-card">
        <span class="stat-label">חסומות</span>
        <strong class="stat-value">${progress.blockedTasks}</strong>
        <small>ממתינות לתנאי מקדים</small>
      </article>
    </section>

    <section class="content-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">חלוקה לפי שלבים</p>
          <h2>התקדמות הקורס</h2>
        </div>
      </div>
      <div class="course-stage-grid">
        ${progress.stages.map((stage) => html`<article class="course-stage-card">
          <div class="card-topline">
            <h3>שלב ${stage.number}: ${stage.title}</h3>
            <span class="course-stage-status">${stageStatus(stage)}</span>
          </div>
          <progress value="${stage.completedTasks}" max="${stage.totalTasks || 1}">
            ${stage.completedTasks} מתוך ${stage.totalTasks}
          </progress>
          <p class="muted">${stage.completedTasks} מתוך ${stage.totalTasks} משימות הושלמו</p>
        </article>`)}
      </div>
    </section>`;

  return renderLayout("התקדמות הקורס", content);
}

export function renderAgents({ agents, error, values }: AgentListViewProps) {
  const content = html`<section class="content-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">צוות המרפאה</p>
          <h2>הסוכנים שלך</h2>
        </div>
        <span class="count-pill">${agents.length} סוכנים</span>
      </div>
      ${error ? html`<p class="form-error" role="alert">${error}</p>` : ""}
      <form method="post" action="/agents" class="form-card">
        <h3>רישום סוכן חדש</h3>
        <label for="agent-name">שם הסוכן</label>
        <input id="agent-name" name="name" required minlength="2" maxlength="80" value="${values?.name ?? ""}" />
        <label for="agent-description">מה הוא עושה?</label>
        <textarea id="agent-description" name="description" maxlength="500" rows="3">${values?.description ?? ""}</textarea>
        <button type="submit">הוספת סוכן</button>
      </form>

      <div class="agent-grid">
        ${agents.length === 0
          ? html`<article class="empty-card"><h3>עוד אין סוכנים</h3><p>רשמי את הסוכן הראשון כדי לפתוח את המרפאה.</p></article>`
          : agents.map(
              (agent) => html`<article class="agent-card">
                <div class="card-topline">
                  <span class="agent-symbol" aria-hidden="true">◈</span>
                  <span class="badge ${agent.status === "active" ? "status-active" : "status-inactive"}">${agentStatusLabels[agent.status]}</span>
                </div>
                <h3><a href="/agents/${agent.id}">${agent.name}</a></h3>
                <p>${agent.description || "עדיין לא נוסף תיאור לסוכן הזה."}</p>
                <a class="text-link" href="/agents/${agent.id}">תיק הסוכן ←</a>
              </article>`,
            )}
      </div>
    </section>`;
  return renderLayout("ניהול סוכנים", content);
}

export function renderAgentDetail({ agent, ailments, error, values }: AgentDetailViewProps) {
  const content = html`<p class="back-link"><a href="/agents">→ חזרה לסוכנים</a></p>
    <section class="detail-grid">
      <article class="form-card">
        <div class="card-topline">
          <p class="eyebrow">תיק סוכן #${agent.id}</p>
          <span class="badge ${agent.status === "active" ? "status-active" : "status-inactive"}">${agentStatusLabels[agent.status]}</span>
        </div>
        ${error ? html`<p class="form-error" role="alert">${error}</p>` : ""}
        <form method="post" action="/agents/${agent.id}/update">
          <label for="agent-name">שם הסוכן</label>
          <input id="agent-name" name="name" required minlength="2" maxlength="80" value="${values?.name ?? agent.name}" />
          <label for="agent-description">תיאור</label>
          <textarea id="agent-description" name="description" maxlength="500" rows="4">${values?.description ?? agent.description}</textarea>
          <button type="submit">שמירת פרטים</button>
        </form>
        <form method="post" action="/agents/${agent.id}/status" class="inline-form">
          <button class="secondary outline" type="submit">${agent.status === "active" ? "השבתת הסוכן" : "הפעלת הסוכן"}</button>
        </form>
        <p class="muted">נוסף: ${formatDate(agent.created_at)}</p>
      </article>
      <section>
        <div class="section-heading"><h2>תיק תקלות</h2>        <a href="/ailments?agent_id=${agent.id}">פתיחת תקלה +</a></div>
        <div class="stack-list">
          ${ailments.length === 0
            ? html`<article class="empty-card"><p>אין תקלות משויכות לסוכן הזה.</p></article>`
            : ailments.map(
                (ailment) => html`<article class="list-card">
                  <div class="card-topline">
                    <a href="/ailments/${ailment.id}"><strong>${ailment.title}</strong></a>
                    ${statusBadge(ailment.status)}
                  </div>
                  <p>${ailment.description}</p>
                  ${severityBadge(ailment.severity)}
                </article>`,
              )}
        </div>
      </section>
    </section>`;
  return renderLayout(agent.name, content);
}

export function renderAilments({ ailments, activeAgents, filter, error, values }: AilmentListViewProps) {
  const content = html`<section class="content-section">
      <div class="section-heading">
        <div><p class="eyebrow">יומן תחזוקה</p><h2>תקלות וטיפולים</h2></div>
        <span class="count-pill">${ailments.length} רשומות</span>
      </div>
      <form method="get" action="/ailments" class="filter-form">
        <label for="status-filter">סינון לפי מצב</label>
        <select id="status-filter" name="status">
          ${(["all", "open", "in_progress", "resolved"] as const).map(
            (status) => filter === status
              ? html`<option value="${status}" selected>${filterLabels[status]}</option>`
              : html`<option value="${status}">${filterLabels[status]}</option>`,
          )}
        </select>
        <button class="secondary" type="submit">סינון</button>
      </form>
      ${error ? html`<p class="form-error" role="alert">${error}</p>` : ""}
      <form method="post" action="/ailments" class="form-card">
        <h3>פתיחת תקלה</h3>
        ${activeAgents.length === 0
          ? html`<p class="notice">כדי לפתוח תקלה, צריך קודם להוסיף סוכן פעיל.</p>`
          : html`<label for="agent-id">הסוכן המושפע</label>
              <select id="agent-id" name="agent_id" required>
                <option value="">בחירת סוכן</option>
                ${activeAgents.map(
                  (agent) => values?.agentId === String(agent.id)
                    ? html`<option value="${agent.id}" selected>${agent.name}</option>`
                    : html`<option value="${agent.id}">${agent.name}</option>`,
                )}
              </select>
              <label for="ailment-title">כותרת התקלה</label>
              <input id="ailment-title" name="title" required minlength="3" maxlength="120" value="${values?.title ?? ""}" />
              <label for="ailment-description">תיאור</label>
              <textarea id="ailment-description" name="description" required minlength="3" maxlength="2000" rows="3">${values?.description ?? ""}</textarea>
              <label for="ailment-severity">חומרה</label>
              <select id="ailment-severity" name="severity">
                ${(["low", "medium", "high", "critical"] as const).map(
                  (severity) => (values?.severity ?? "medium") === severity
                    ? html`<option value="${severity}" selected>${severityLabels[severity]}</option>`
                    : html`<option value="${severity}">${severityLabels[severity]}</option>`,
                )}
              </select>
              <button type="submit">רישום תקלה</button>`}
      </form>
      <div class="table-wrap">
        <table>
          <thead><tr><th scope="col">תקלה</th><th scope="col">סוכן</th><th scope="col">חומרה</th><th scope="col">מצב</th><th scope="col">עדכון</th></tr></thead>
          <tbody>${ailmentRows(ailments)}</tbody>
        </table>
      </div>
    </section>`;
  return renderLayout("ניהול תקלות", content);
}

export function renderAilmentDetail({ ailment, error, values }: AilmentDetailViewProps) {
  const content = html`<p class="back-link"><a href="/ailments">→ חזרה לתקלות</a></p>
    <section class="detail-grid ailment-detail">
      <article class="form-card">
        <div class="card-topline"><p class="eyebrow">תקלה #${ailment.id} · <a href="/agents/${ailment.agent_id}">${ailment.agent_name}</a></p>${statusBadge(ailment.status)}</div>
        <h2>${ailment.title}</h2>
        ${error ? html`<p class="form-error" role="alert">${error}</p>` : ""}
        <form method="post" action="/ailments/${ailment.id}/update">
          <label for="ailment-description">תיאור התקלה</label>
          <textarea id="ailment-description" name="description" required minlength="3" maxlength="2000" rows="4">${values?.description ?? ailment.description}</textarea>
          <label for="ailment-severity">חומרה</label>
          <select id="ailment-severity" name="severity">
            ${(["low", "medium", "high", "critical"] as const).map(
              (severity) => (values?.severity ?? ailment.severity) === severity
                ? html`<option value="${severity}" selected>${severityLabels[severity]}</option>`
                : html`<option value="${severity}">${severityLabels[severity]}</option>`,
            )}
          </select>
          <label for="ailment-status">מצב</label>
          <select id="ailment-status" name="status">
            ${(["open", "in_progress", "resolved"] as const).map(
              (status) => (values?.status ?? ailment.status) === status
                ? html`<option value="${status}" selected>${statusLabels[status]}</option>`
                : html`<option value="${status}">${statusLabels[status]}</option>`,
            )}
          </select>
          <label for="ailment-treatment">מה עשינו? (טיפול)</label>
          <textarea id="ailment-treatment" name="treatment" maxlength="2000" rows="4">${values?.treatment ?? ailment.treatment}</textarea>
          <label for="ailment-outcome">ומה קרה אחר כך? (תוצאה)</label>
          <textarea id="ailment-outcome" name="outcome" maxlength="2000" rows="4">${values?.outcome ?? ailment.outcome}</textarea>
          <button type="submit">שמירת עדכון</button>
        </form>
        <p class="muted">נפתחה: ${formatDate(ailment.created_at)} · עודכנה: ${formatDate(ailment.updated_at)}</p>
      </article>
      <aside class="detail-aside">
        <p class="eyebrow">חומרה</p>
        ${severityBadge(ailment.severity)}
        <hr />
        <p class="eyebrow">סטטוס</p>
        ${statusBadge(ailment.status)}
        <p class="muted">התיעוד נשמר במחשב הזה בלבד.</p>
      </aside>
    </section>`;
  return renderLayout(ailment.title, content);
}

export function renderNotFound() {
  return renderLayout(
    "לא נמצא",
    html`<article class="empty-card"><p>הרשומה שחיפשת לא נמצאה. אולי היא יצאה להפסקה.</p><a href="/">חזרה ללוח המצב</a></article>`,
  );
}

export function parseSeverity(value: string | undefined): AilmentSeverity | undefined {
  return value === "low" || value === "medium" || value === "high" || value === "critical" ? value : undefined;
}

export function parseAilmentStatus(value: string | undefined): AilmentStatus | undefined {
  return value === "open" || value === "in_progress" || value === "resolved" ? value : undefined;
}

export function parseAilmentFilter(value: string | undefined): AilmentStatusFilter {
  return value === "open" || value === "in_progress" || value === "resolved" ? value : "all";
}

export function parseAgentStatus(value: string | undefined): AgentStatus | undefined {
  return value === "active" || value === "inactive" ? value : undefined;
}
