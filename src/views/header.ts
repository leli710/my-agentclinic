import { html } from "hono/html";

export function renderHeader() {
  return html`<header class="site-header">
    <nav class="container" aria-label="ניווט ראשי">
      <a class="brand" href="/" aria-label="Agent Clinic — דף הבית">
        <span class="brand-mark" aria-hidden="true">✚</span>
        <span>Agent Clinic</span>
      </a>
      <ul>
        <li><a href="/">לוח מצב</a></li>
        <li><a href="/agents">סוכנים</a></li>
        <li><a href="/ailments">תקלות</a></li>
        <li><a href="/course">התקדמות הקורס</a></li>
      </ul>
    </nav>
  </header>`;
}
