const mongoose=require("mongoose");

async function connectDB() {
    try {
        if(!process.env.MONGODB_URI){
            throw new Error("MongoDB connnection string is not defined in enviorment variables.");
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected successfully.")
    } catch (error) {
        console.log("MongoDB connection error.",error)
    }
}

module.exports=connectDB;