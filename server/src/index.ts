import express from "express";
import cors from "cors";
import { paymentsRouter } from "./routes/payments.js";
import { sessionsRouter } from "./routes/sessions.js";

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : true;

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "splitcart-demo-server-v2" });
});

app.use("/api/sessions", sessionsRouter);
app.use("/api/payments", paymentsRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";

  const status =
    message === "SESSION_NOT_FOUND" || message === "PARTICIPANT_NOT_FOUND" || message === "PAYMENT_NOT_FOUND" ? 404 :
    message === "PAYMENT_AMOUNT_EXCEEDS_ALLOWED_REMAINING_TOTAL" || message === "PARTICIPANT_OR_SESSION_ALREADY_PAID" ? 409 :
    400;

  res.status(status).json({ error: message });
});

const port = Number(process.env.PORT ?? 4000);

app.listen(port, () => {
  console.log(`SplitCart API v2 running on http://localhost:${port}`);
});
