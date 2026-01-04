const mongoose = require('mongoose')

async function connectToDB() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not defined');
        }
        mongoose.connect(process.env.MONGODB_URI)
        console.log("connected to db sucessfully.")
    } catch (error) {
        console.log(error)
    }
}

module.exports = connectToDB;