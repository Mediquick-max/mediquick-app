import { Router, type IRouter } from "express";
import healthRouter from "./health";
import careRouter from "./care";
import pharmaciesRouter from "./pharmacies";
import remindersRouter from "./reminders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(remindersRouter);
router.use(pharmaciesRouter);
router.use(careRouter);

export default router;
