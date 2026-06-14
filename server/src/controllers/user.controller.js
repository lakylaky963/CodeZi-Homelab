import User from 'models/user.model'
import to from 'await-to-js'

/**
 * .lean() returns an object rather than the mongoose document
 * this makes queries faster, but you cannot modify the returned result
 *
 *
 */

export const getUsers = async (req, res) => {
  const [error, users] = await to(User.find({}).lean())
  if (error) return res.status(500).send({ error })

  // Always return an empty array [] if no users exist yet, with a 200 status
  return res.json({ users: users || [] })
}

export const getUser = async (req, res) => {
  const { id } = req.params

  // Safety Check: If the id is a simple username string (like "avi") instead of a 24-char Mongo ObjectId,
  // find by a 'username' or 'firstName' field instead of letting findById crash.
  let query;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    query = User.findById(id).lean();
  } else {
    // If you track users by a username or firstName field, query that when it's not a valid ObjectId
    query = User.findOne({ firstName: id }).lean(); 
  }

  const [error, user] = await to(query)
  
  // If Mongoose encounters a database connection error or schema breakdown
  if (error) return res.status(500).send({ error })

  // 🔥 THE CRUCIAL FIX: If the query completes but returns null (user not found)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  return res.json({ user })
}

export const createUser = async (req, res) => {
  const { firstName, lastName } = req.body
  if (!firstName) return res.status(400).send({ error: 'firstName required' })

  const [error, user] = await to(User.create({ firstName, lastName }))
  if (error) return res.status(500).send({ error })
  return res.json({ user })
}

export const updateUser = async (req, res) => {
  const { id } = req.params
  const { firstName, lastName } = req.body

  // Guard against casting crash if ID is invalid hex
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).send({ error: 'Invalid User ID format' })
  }

  const [error, user] = await to(
    User.findByIdAndUpdate(
      id,
      { firstName, lastName },
      { returnDocument: 'after' }
    ).lean()
  )
  if (error) return res.status(500).send({ error })
  
  if (!user) return res.status(404).send({ error: 'User to update not found' })
    
  return res.json({ user })
}

export const deleteUser = async (req, res) => {
  const { id } = req.params

  // Guard against casting crash if ID is invalid hex
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).send({ error: 'Invalid User ID format' })
  }

  const [error, user] = await to(User.findByIdAndDelete(id).lean())
  if (error) return res.status(500).send({ error })
  
  if (!user) return res.status(404).send({ error: 'User to delete not found' })
    
  return res.json({ user })
}