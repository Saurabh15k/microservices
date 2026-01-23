const express=require("express");
const createAuthMiddleware=require("../middlewares/auth.middleware");
const sellerControllers=require("../controllers/seller.controller");

const router=express.Router();

router.get('/metrics',
    createAuthMiddleware(['seller']),
    sellerControllers.getMetrics
);

router.get('/orders',
    createAuthMiddleware(['seller']),
    sellerControllers.getOrders
)

router.get("/products",
    createAuthMiddleware(['seller']),
    sellerControllers.getProducts
)

module.exports=router;