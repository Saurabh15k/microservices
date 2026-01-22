require('dotenv').config()
const app=require("./src/app")
const connectToDB=require('./src/db/db')
const {connect}=require("./src/broker/broker");

connectToDB();
connect();

app.listen(3000,()=>{
    console.log("Auth server is running on port 3000.")
})