const mongoose=require('mongoose');
const {MongoMemoryServer}=require('mongodb-memory-server');

jest.setTimeout(60000);

let mongo;

beforeAll(async()=>{
    mongo=await MongoMemoryServer.create();
    const mongoUri=mongo.getUri();
    process.env.MONGODB_URI=mongoUri;
    process.env.JWT_SECRET_KEY='testSecretKey';
    await mongoose.connect(mongoUri);
})

afterEach(async()=>{
    if(mongoose.connection.readyState!==1) return;

    const collections=await mongoose.connection.db.collections();
    for(const collection of collections){
        await collection.deleteMany({});
    }
})

afterAll(async()=>{
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if(mongo) await mongo.stop();
})
