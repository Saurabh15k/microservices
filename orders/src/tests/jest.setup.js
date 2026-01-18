jest.setTimeout(60000);
const mongoose=require('mongoose');
const {MongoMemoryServer}=require("mongodb-memory-server");

let mongo;

beforeAll(async()=>{
    mongo=await MongoMemoryServer.create();
    const uri=mongo.getUri();
    process.env.MONGODB_URI=uri;
    await mongoose.connect(uri,{
        dbName:'jest',
    })
})

beforeEach(async()=>{
    const collections=await mongoose.connection.db.collections();
    for(const collection of collections){
        await collection.deleteMany();
    }
})

afterAll(async()=>{
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if(mongo){
        await mongo.stop();
    }
})