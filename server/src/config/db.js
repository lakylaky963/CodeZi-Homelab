import mongoose from 'mongoose'

const connectMongo = () =>
  new Promise((res, rej) => {
    const mongoURI = process.env.MONGO_URI || process.env.DATABASE_URL

    if (!mongoURI) {
      console.log('No MongoDB URL found in MONGO_URI or DATABASE_URL; continuing without DB connection.')
      res()
      return
    }

    mongoose.connect(mongoURI).catch((err) => {
      console.error(err)
      rej(err)
    })

    const db = mongoose.connection
    db.once('open', () => {
      console.log('connected to mongodb')
      res()
    })
  })

export default connectMongo
