import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { openDatabase, seedDemoData } from "./db.js";

const database = openDatabase(process.env.AGENT_CLINIC_DB);
seedDemoData(database);
const app = createApp(database);
const server = serve(
  {
    fetch: app.fetch,
    hostname: "127.0.0.1",
    port: 3000,
  },
  () => {
    console.log("Agent Clinic is listening at http://127.0.0.1:3000");
  },
);

server.on("error", (error: Error) => {
  console.error("Agent Clinic server failed to start:", error);
  process.exitCode = 1;
});
