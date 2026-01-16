const mongoose=require('mongoose');

async function connectDB() {
    try{
        if(!process.env.MONGODB_URI){
            console.log('MongoDB_URI is not defined in enviornment variables.');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
    }catch(err){
        console.log(err)
    }
};

module.exports=connectDB;