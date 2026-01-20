const express=require('express');
const cookieParser=require("cookie-parser");
const paymentRoutes=require("./routes/payment.route");
const app=express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.use("/api/payment",paymentRoutes);

module.exports=app;