import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import careRouter from "./care";
import pharmaciesRouter from "./pharmacies";
import remindersRouter from "./reminders";
import adminRouter from "./admin";
import authRouter from "./auth";
import shopkeeperRouter from "./shopkeeper";
import doctorsRouter from "./doctors";
import medicineStoreRouter from "./medicine-store";
import doctorPanelRouter from "./doctor-panel";
import patientRouter from "./patient";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(remindersRouter);
router.use(pharmaciesRouter);
router.use(careRouter);
router.use("/admin", adminRouter);
router.use("/auth", authRouter);
router.use("/shopkeeper", shopkeeperRouter);
router.use("/doctors", doctorsRouter);
router.use("/medicine-store", medicineStoreRouter);
router.use("/doctor-panel", doctorPanelRouter);
router.use("/patient", patientRouter);

export default router;
