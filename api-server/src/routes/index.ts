import { Router, type IRouter } from "express";
import healthRouter from "./health";
import entriesRouter from "./entries";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/entries", entriesRouter);

export default router;
