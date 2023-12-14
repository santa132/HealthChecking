    const mongoose = require('mongoose')

    const DBconnection = async() => {
    const conn = await mongoose
        .connect(process.env.DATABASE_URL)
        .catch(err => {
            console.log(`Can't connect to the DB`.red, err)
        })
    console.log(`MongoDB Connected: ${conn.connection.host}`.yellow.bold.underline)
    }

    module.exports = DBconnection