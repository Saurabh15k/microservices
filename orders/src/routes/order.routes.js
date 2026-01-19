const express=require('express');
const orderControllers=require("../controllers/order.controller");
const authMiddleware=require("../middlewares/auth.middleware");
const validationMiddleware=require('../middlewares/validation.middleware');
const router=express.Router();

router.post("/",
    authMiddleware.createAuthMiddleware(['user']),
    validationMiddleware.validateCreateOrder,
    orderControllers.createOrder
);

router.get('/me',
    authMiddleware.createAuthMiddleware(['user']),
    orderControllers.getMyOrders
)

router.post("/:id/cancel",
    authMiddleware.createAuthMiddleware(['user']),
    orderControllers.cancelOrderById
)

router.patch("/:id/address",
    authMiddleware.createAuthMiddleware(['user']),
    validationMiddleware.validateUpdateAddress,
    orderControllers.updateOrderAddress
)

router.get('/:id',
    authMiddleware.createAuthMiddleware(['user','admin']),
    orderControllers.getOrderById
)

module.exports=router;