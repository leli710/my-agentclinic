import { html } from "hono/html";
import { renderFooter } from "./footer.js";
import { renderHeader } from "./header.js";
import { renderMain } from "./main.js";

export function renderLayout(title: string, content: ReturnType<typeof html>) {
  return html`<!doctype html>
    <html lang="he" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="לוח תחזוקה מקומי לסוכני תוכנה" />
        <title>${title} · Agent Clinic</title>
        <link rel="stylesheet" href="/assets/pico.min.css" />
        <link rel="stylesheet" href="/static/styles.css" />
      </head>
      <body>
        ${renderHeader()}
        ${renderMain(title, content)}
        ${renderFooter()}
      </body>
    </html>`;
}
