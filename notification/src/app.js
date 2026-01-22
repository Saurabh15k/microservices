const express=require("express");
const {connect}=require("./broker/broker");
const setListeners=require("./broker/listener");
const app=express();

connect().then(()=>{
    setListeners();
})


module.exports=app;