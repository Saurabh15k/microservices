const express=require('express');
const validators=require("../middlewares/validator.middleware")
const authController=require('../controllers/auth.controller')
const authMiddleware=require('../middlewares/auth.middleware')
const router=express.Router();

router.post('/register',validators.registerValidator,authController.registerUser);
router.post('/login', validators.loginValidator, authController.loginUser);
router.get('/me',authMiddleware.authUser,authController.getCurrentUser)
router.get('/logout',authController.logoutUser)
router.get('/users/me/addresses',authMiddleware.authUser,authController.getUserAddresses)
router.post('/users/me/addresses',validators.addUserAddressesValidator,authMiddleware.authUser,authController.addUserAddresses)
router.delete('/users/me/addresses/:addressId',authMiddleware.authUser,authController.deleteUserAddresses)

module.exports=router;