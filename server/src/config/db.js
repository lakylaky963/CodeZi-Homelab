import mongoose from 'mongoose'

mongoose.set('strictQuery', false)
mongoose.set('bufferCommands', false)

const forceLocal = process.env.FORCE_LOCAL_MONGO === 'true'
const localMongoURI = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/codezi'

const connectWithURI = async (uri, label) => {
  if (!uri) {
    throw new Error(`No URI provided for ${label}`)
  }

  const connectOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
  }

  await mongoose.connect(uri, connectOptions)
  console.log(`✅ Connected to MongoDB via ${label}`)
}

const connectMongo = async () => {
  const onlineMongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL

  if (forceLocal) {
    console.log('⚠️ FORCE_LOCAL_MONGO is enabled. Connecting to local MongoDB only.')
    try {
      await connectWithURI(localMongoURI, 'local MongoDB')
      return true
    } catch (localError) {
      console.error('⚠️ Local MongoDB connection failed:', localError.message || localError)
      console.log('🚫 No MongoDB connection established; continuing without DB.')
      return false
    }
  }

  if (onlineMongoURI) {
    console.log('🌐 Trying online MongoDB connection from .env...')
    try {
      await connectWithURI(onlineMongoURI, 'online MongoDB')
      return true
    } catch (onlineError) {
      console.error('⚠️ Online MongoDB connection failed:', onlineError.message || onlineError)
      console.log('🔄 Falling back to local MongoDB...')
    }
  } else {
    console.log('⚠️ No online MongoDB URL found in MONGO_URI or DATABASE_URL.')
    console.log('🔄 Trying local MongoDB...')
  }

  try {
    await connectWithURI(localMongoURI, 'local MongoDB')
    return true
  } catch (localError) {
    console.error('⚠️ Local MongoDB connection failed:', localError.message || localError)
    console.log('🚫 No MongoDB connection established; continuing without DB.')
    return false
  }
}

export default connectMongo
