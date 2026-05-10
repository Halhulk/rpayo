import { Router, type Request, type Response, type NextFunction } from "express";
import { capturePayment, createParticipantPayment, failPayment } from "../services/paymentService.js";

export const paymentsRouter = Router();

paymentsRouter.post(
  "/sessions/:sessionId/participants/:participantId/payments",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createParticipantPayment(req.params.sessionId, req.params.participantId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

paymentsRouter.post("/:paymentId/capture", (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(capturePayment(req.params.paymentId));
  } catch (error) {
    next(error);
  }
});

paymentsRouter.post("/:paymentId/fail", (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(failPayment(req.params.paymentId));
  } catch (error) {
    next(error);
  }
});
