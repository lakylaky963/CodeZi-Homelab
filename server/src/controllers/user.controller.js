import User from '../models/user.model.js'
import to from 'await-to-js'

/**
 * .lean() returns an object rather than the mongoose document
 * this makes queries faster, but you cannot modify the returned result
 *
 *
 */

export const getUsers = async (req, res) => {
  console.log('📡 [Controller] getUsers requested')
  const [error, users] = await to(User.find({}).lean())
  if (error) {
    console.error('❌ [Controller] getUsers database error:', error)
    return res.status(500).send({ error })
  }

  console.log(`✅ [Controller] getUsers retrieved ${users?.length || 0} users`)
  // Always return an empty array [] if no users exist yet, with a 200 status
  return res.json({ users: users || [] })
}

export const getUser = async (req, res) => {
  const { id } = req.params
  console.log(`📡 [Controller] getUser requested for ID/name: "${id}"`)

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
  if (error) {
    console.error(`❌ [Controller] getUser error for "${id}":`, error)
    return res.status(500).send({ error })
  }

  // 🔥 THE CRUCIAL FIX: If the query completes but returns null (user not found)
  if (!user) {
    console.warn(`⚠️ [Controller] getUser: User not found for ID/name: "${id}"`)
    return res.status(404).json({ error: 'User not found' })
  }

  console.log(`✅ [Controller] getUser found user: ${user.firstName} ${user.lastName || ''}`)
  return res.json({ user })
}

export const createUser = async (req, res) => {
  const { firstName, lastName } = req.body
  console.log(`📡 [Controller] createUser payload:`, { firstName, lastName })
  if (!firstName) {
    console.warn('⚠️ [Controller] createUser: missing firstName')
    return res.status(400).send({ error: 'firstName required' })
  }

  const [error, user] = await to(User.create({ firstName, lastName }))
  if (error) {
    console.error('❌ [Controller] createUser database error:', error)
    return res.status(500).send({ error })
  }
  console.log(`✅ [Controller] createUser success:`, user)
  return res.json({ user })
}

export const updateUser = async (req, res) => {
  const { id } = req.params
  const { firstName, lastName } = req.body
  console.log(`📡 [Controller] updateUser requested for ID: "${id}" with payload:`, { firstName, lastName })

  // Guard against casting crash if ID is invalid hex
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    console.warn(`⚠️ [Controller] updateUser: invalid user ID format: "${id}"`)
    return res.status(400).send({ error: 'Invalid User ID format' })
  }

  const [error, user] = await to(
    User.findByIdAndUpdate(
      id,
      { firstName, lastName },
      { returnDocument: 'after' }
    ).lean()
  )
  if (error) {
    console.error(`❌ [Controller] updateUser error for ID "${id}":`, error)
    return res.status(500).send({ error })
  }
  
  if (!user) {
    console.warn(`⚠️ [Controller] updateUser: User to update not found: "${id}"`)
    return res.status(404).send({ error: 'User to update not found' })
  }
    
  console.log(`✅ [Controller] updateUser success:`, user)
  return res.json({ user })
}

export const deleteUser = async (req, res) => {
  const { id } = req.params
  console.log(`📡 [Controller] deleteUser requested for ID: "${id}"`)

  // Guard against casting crash if ID is invalid hex
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    console.warn(`⚠️ [Controller] deleteUser: invalid user ID format: "${id}"`)
    return res.status(400).send({ error: 'Invalid User ID format' })
  }

  const [error, user] = await to(User.findByIdAndDelete(id).lean())
  if (error) {
    console.error(`❌ [Controller] deleteUser error for ID "${id}":`, error)
    return res.status(500).send({ error })
  }
  
  if (!user) {
    console.warn(`⚠️ [Controller] deleteUser: User to delete not found: "${id}"`)
    return res.status(404).send({ error: 'User to delete not found' })
  }
    
  console.log(`✅ [Controller] deleteUser success for ID: "${id}"`)
  return res.json({ user })
}