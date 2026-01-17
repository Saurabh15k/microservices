const express=require('express');
const authMiddleware=require('../middlewares/auth.middleware');
const cartController=require('../controllers/cart.controller');
const validationsMiddleware=require('../middlewares/validator.middleware');
const router=express.Router();

router.post('/items',
    validationsMiddleware.validateAddItemToCart
    ,authMiddleware.createAuthMiddleware(['user']),
    cartController.addItemToCart
);

router.patch('/items/:productId',
    validationsMiddleware.validateUpdateCartItem,
    authMiddleware.createAuthMiddleware(['user']),
    cartController.updateItemQuantity
)

router.get('/',authMiddleware.createAuthMiddleware(['user']),cartController.getCart);


module.exports=router;