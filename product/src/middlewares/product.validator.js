const {body,validationResult}=require('express-validator');

const responseWithValidationErrors=(req,res,next)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        console.log('Validation errors:',errors.array());
        return res.status(400).json({errors:errors.array()})
    }
    next()
}

const createProductValidations=[
    body('title').isString().trim().notEmpty().withMessage('title is required'),
    body('description').optional().isString().withMessage('description must be a string')
    .trim().isLength({max:500}).withMessage('description max length is 500 characters'),
    body('priceAmount').notEmpty().withMessage('priceAmount is required').bail()
    .isFloat({gt:0}).withMessage('priceAmount must be a number > 0'),
    body('priceCurrency').optional().isIn(['USD','INR']).withMessage('priceCurrency must be USD or INR'),
    responseWithValidationErrors
]

module.exports={
    createProductValidations,
}