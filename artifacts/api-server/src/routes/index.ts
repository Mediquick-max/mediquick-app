import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pharmaciesRouter from "./pharmacies";
import remindersRouter from "./reminders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(remindersRouter);
router.use(pharmaciesRouter);

export default router;
