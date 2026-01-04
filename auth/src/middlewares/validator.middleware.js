const {body,validationResult}=require('express-validator');

const responseWithValidationErrors=(req,res,next)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        console.log('VALIDATION ERRORS', errors.array())
        return res.status(400).json({errors:errors.array()});
    }
    next();
};

const registerValidator=[
    body('username').isString().withMessage('Username must be string')
    .isLength({min:3}).withMessage('Username must be at least 3 characters long.'),
    body('email').isEmail().withMessage('Invaild email address.'),
    body('password').isLength({min:6}).withMessage('Password must be atleast 6 characters long.'),
    body('fullName.firstName').isString().withMessage('FirstName must be string.')
    .notEmpty().withMessage('FirstName is required.'),
    body('fullName.lastName').isString().withMessage('LastName must be string.')
    .notEmpty().withMessage('LastName is required.'),
    body('role').optional().isIn(['user','seller']).withMessage('Role must be either user or seller.'),
    responseWithValidationErrors
];

const loginValidator=[
    body('email').isEmail().withMessage('Invaild email address.'),
    body('password').isLength({min:6}).withMessage('Password must be atleast 6 characters long.'),
    responseWithValidationErrors
]

const addUserAddressesValidator=[
    body('street').isString().withMessage('Street must be string.').notEmpty().withMessage('Street is required.'),
    body('city').isString().withMessage('City must be string.').notEmpty().withMessage('City is required.'),
    body('state').isString().withMessage('State must be string.').notEmpty().withMessage('State is required.'),
    body('zip').isString().withMessage('Zip must be string.').notEmpty().withMessage('Zip is required.'),
    body('country').isString().withMessage('Country must be string.').notEmpty().withMessage('Country is required.'),
    body('isDefault').optional().isBoolean().withMessage('isDefault must be boolean.'),
    responseWithValidationErrors
]

module.exports={
    registerValidator,
    loginValidator,
    addUserAddressesValidator
}