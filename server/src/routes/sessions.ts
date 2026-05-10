import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { db } from "../data/store.js";

export const sessionsRouter = Router();

const createDemoSchema = z.object({
  templateIndex: z.number().int().min(0).optional(),
  participantNames: z.array(z.string().min(1)).optional()
});

const addParticipantSchema = z.object({
  name: z.string().min(1)
});

sessionsRouter.get("/", (_req: Request, res: Response) => {
  res.json({ sessions: db.listSessions() });
});

sessionsRouter.post("/demo", (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createDemoSchema.parse(req.body);
    const session = db.createDemoSession(input);
    res.status(201).json({
      full: db.getSessionFull(session.id),
      hostUrl: `/host/${session.id}`
    });
  } catch (error) {
    next(error);
  }
});

sessionsRouter.post("/reset-demo", (_req: Request, res: Response) => {
  const session = db.resetDemo();
  res.json({
    full: db.getSessionFull(session.id),
    hostUrl: `/host/${session.id}`
  });
});

sessionsRouter.get("/:sessionId", (req: Request, res: Response) => {
  const full = db.getSessionFull(req.params.sessionId);
  if (!full) return res.status(404).json({ error: "SESSION_NOT_FOUND" });
  res.json(full);
});

sessionsRouter.post("/:sessionId/participants", (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = addParticipantSchema.parse(req.body);
    const participant = db.addParticipant(req.params.sessionId, input.name);
    if (!participant) return res.status(404).json({ error: "SESSION_NOT_FOUND" });

    res.status(201).json({
      participant,
      full: db.getSessionFull(req.params.sessionId)
    });
  } catch (error) {
    next(error);
  }
});
