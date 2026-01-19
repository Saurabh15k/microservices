const mongoose=require('mongoose');

const addressSchema=new mongoose.Schema({
    street:String,
    city:String,
    state:String,
    zip:String,
    country:String,
});

const orderSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    items:[
        {
            product:{
                type:mongoose.Schema.Types.ObjectId,
                required:true
            },
            quantity:{
                type:Number,
                default:1,
                min:1
            },
            price:{
                amount:{
                    type:Number,
                    required:true
                },
                currency:{
                    type:String,
                    required:true,
                    enum:['INR','USD'],
                    default:'INR'
                }
            }
        }
    ],
    status:{
        type:String,
        enum:['PENDING','SHIPPED','DELIVERED','CANCELLED','CONFIRMED','RETURNED',"OUT_FOR_DELIVERY"]
    },
    totalPrice:{
        amount:{
            type:Number,
            required:true
        },
        currency:{
            type:String,
            enum:['USD','INR'],
            default:"INR"
        }
    },
    shippingAddress:{
        type:addressSchema,
        required:true
    },
},{timestamps:true})

const orderModel=mongoose.model('order',orderSchema);

module.exports=orderModel;