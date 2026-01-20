const express=require("express");
const paymentControllers=require("../controllers/payment.controller");
const authMiddlewares=require("../middlewares/auth.middleware");
const router=express.Router();

router.post("/create/:orderId",
    authMiddlewares.createAuthMiddleware(['user']),
    paymentControllers.createPayment
)

router.post("/verify",
    authMiddlewares.createAuthMiddleware(['user']),
    paymentControllers.verfiyPayment
)

module.exports=router;