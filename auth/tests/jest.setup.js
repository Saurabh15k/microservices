jest.setTimeout(60000) // 60 seconds

const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

let mongo

beforeAll(async () => {
    mongo = await MongoMemoryServer.create()
    const uri = mongo.getUri()

    process.env.MONGODB_URI = uri
    process.env.JWT_SECRET_KEY = 'test_jwt_secret_key'

    await mongoose.connect(uri)
})

afterEach(async () => {
    if (mongoose.connection.readyState !== 1) return

    const collections = await mongoose.connection.db.collections()
    for (const collection of collections) {
        await collection.deleteMany({})
    }
})

afterAll(async () => {
    await mongoose.connection.close()
    if (mongo) await mongo.stop()
})
