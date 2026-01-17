const {body, param, validationResult}=require('express-validator');
const mongoose=require('mongoose');

function responseWithValidationErrors(req,res,next){
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        console.log('VALIDATION ERRORS:',errors.array());
        return res.status(400).json({errors:errors.array()});
    }
    next();
}

const validateAddItemToCart=[
    body('productId').isString().withMessage('Product ID must be a string.')
    .custom(value=>mongoose.Types.ObjectId.isValid(value)).withMessage("Invalid Product ID format"),
    body('quantity').isInt({min:1}).withMessage('Quantity must be a positive integer'),
    responseWithValidationErrors
]

const validateUpdateCartItem=[
    param('productId').isString().withMessage('Product ID must be a string.')
    .custom(value=>mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid Product ID format'),
    body('quantity').isInt({min:1}).withMessage('Quantity must be a positive integer'),
    responseWithValidationErrors
]

module.exports={
    validateAddItemToCart,
    validateUpdateCartItem
}