
import { Router } from "express";
import { checkAuth, login, logout } from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const authRouter = Router()


authRouter.post("/login",login)
authRouter.get("/me",checkAuth)
authRouter.get("/logout",authMiddleware,logout)



export default authRouter
