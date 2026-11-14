import { html } from "hono/html";

export function renderMain(title: string, content: ReturnType<typeof html>) {
  return html`<main class="container page-content">
    <h1>${title}</h1>
    ${content}
  </main>`;
}
