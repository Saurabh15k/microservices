const mongoose=require('mongoose');

const paymentSchema=new mongoose.Schema({
    order:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
    },
    paymentId:{
        type:String
    },
    signature:{
        type:String
    },
    razorpayOrderId:{
        type:String,
        required:true
    },
    status:{
        type:String,
        enum:["PENDING","FAILED","COMPLETED"],
        default:"PENDING"
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    price:{
        amount:{type:Number,required:true},
        currency:{type:String,required:true,enum:['USD','INR'],default:'INR'}
    }
},{timestamps:true});

const paymentModel=mongoose.model("payments",paymentSchema);

module.exports=paymentModel;

