import { html } from "hono/html";

export function renderFooter() {
  return html`<footer class="container site-footer">
    <small>מרפאת תחזוקה לתוכנה — ללא אבחון רפואי וללא שירותים חיצוניים.</small>
  </footer>`;
}
