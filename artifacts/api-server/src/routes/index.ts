import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import careRouter from "./care";
import pharmaciesRouter from "./pharmacies";
import remindersRouter from "./reminders";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(remindersRouter);
router.use(pharmaciesRouter);
router.use(careRouter);
router.use("/admin", adminRouter);

export default router;
