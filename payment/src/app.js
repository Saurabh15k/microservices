const express=require('express');
const cookieParser=require("cookie-parser");
const paymentRoutes=require("./routes/payment.route");
const app=express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.get('/',(req,res)=>{
    res.status(200).json({
        message:"Payment service is running"
    })
})
app.use("/api/payment",paymentRoutes);

module.exports=app;