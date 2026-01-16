const express=require('express');
const validators=require('../middlewares/product.validator');
const productController=require('../controllers/product.controller');
const multer=require('multer');
const createAuthMiddleware=require('../middlewares/auth.middleware');

const router=express.Router();

const upload=multer({storage:multer.memoryStorage()});

router.post('/',
    createAuthMiddleware(['seller','admin']),
    upload.array('images',5),
    validators.createProductValidations,
    productController.createProduct
);

router.get('/',productController.getProducts);
router.delete('/:id',createAuthMiddleware(['seller']),productController.deleteProduct);
router.put('/:id',createAuthMiddleware(['seller']),productController.updateProduct);
router.get('/seller',createAuthMiddleware(['seller']),productController.getProductBySeller);

router.get("/:id",productController.getProductById);

module.exports=router;