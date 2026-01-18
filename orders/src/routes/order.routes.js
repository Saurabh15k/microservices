const express=require('express');
const orderControllers=require("../controllers/order.controller");
const authMiddleware=require("../middlewares/auth.middleware");
const validationMiddleware=require('../middlewares/validation.middleware');
const router=express.Router();

router.post("/",
    validationMiddleware.validateCreateOrder,
    authMiddleware.createAuthMiddleware(['user']),
    orderControllers.createOrder
);

module.exports=router;