import User from '../models/user.model.js'

const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)

export const getUsers = async (req, res) => {
  console.log('📡 [Controller] getUsers requested')
  try {
    const users = await User.find({}).lean()
    console.log(`✅ [Controller] getUsers retrieved ${users?.length || 0} users`)
    return res.json({ users: users || [] })
  } catch (error) {
    console.error('❌ [Controller] getUsers database error:', error)
    return res.status(500).json({ error: error.message || 'Failed to fetch users' })
  }
}

export const getUser = async (req, res) => {
  const { id } = req.params
  console.log(`📡 [Controller] getUser requested for ID/name: "${id}"`)

  try {
    let user = null

    if (isValidObjectId(id)) {
      user = await User.findById(id).lean()
    } else {
      user = await User.findOne({ firstName: id }).lean()
    }

    if (!user) {
      console.warn(`⚠️ [Controller] getUser: User not found for ID/name: "${id}"`)
      return res.status(404).json({ error: 'User not found' })
    }

    console.log(`✅ [Controller] getUser found user: ${user.firstName} ${user.lastName || ''}`)
    return res.json({ user })
  } catch (error) {
    console.error(`❌ [Controller] getUser error for "${id}":`, error)
    return res.status(500).json({ error: error.message || 'Failed to fetch user' })
  }
}

export const createUser = async (req, res) => {
  const firstName = req.body.firstName?.trim()
  const lastName = req.body.lastName?.trim()

  console.log('📡 [Controller] createUser payload:', { firstName, lastName })
  if (!firstName) {
    console.warn('⚠️ [Controller] createUser: missing firstName')
    return res.status(400).json({ error: 'firstName is required' })
  }

  try {
    const user = await User.create({ firstName, lastName })
    console.log('✅ [Controller] createUser success:', user)
    return res.status(201).json({ user })
  } catch (error) {
    console.error('❌ [Controller] createUser database error:', error)
    return res.status(500).json({ error: error.message || 'Failed to create user' })
  }
}

export const updateUser = async (req, res) => {
  const { id } = req.params
  const firstName = req.body.firstName?.trim()
  const lastName = req.body.lastName?.trim()

  console.log(`📡 [Controller] updateUser requested for ID: "${id}" with payload:`, { firstName, lastName })

  if (!isValidObjectId(id)) {
    console.warn(`⚠️ [Controller] updateUser: invalid user ID format: "${id}"`)
    return res.status(400).json({ error: 'Invalid User ID format' })
  }

  const updateFields = {}
  if (firstName) updateFields.firstName = firstName
  if (lastName !== undefined) updateFields.lastName = lastName

  if (Object.keys(updateFields).length === 0) {
    console.warn(`⚠️ [Controller] updateUser: no update fields provided for ID "${id}"`)
    return res.status(400).json({ error: 'At least one field is required to update' })
  }

  try {
    const user = await User.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
      lean: true,
    })

    if (!user) {
      console.warn(`⚠️ [Controller] updateUser: User to update not found: "${id}"`)
      return res.status(404).json({ error: 'User to update not found' })
    }

    console.log('✅ [Controller] updateUser success:', user)
    return res.json({ user })
  } catch (error) {
    console.error(`❌ [Controller] updateUser error for ID "${id}":`, error)
    return res.status(500).json({ error: error.message || 'Failed to update user' })
  }
}

export const deleteUser = async (req, res) => {
  const { id } = req.params
  console.log(`📡 [Controller] deleteUser requested for ID: "${id}"`)

  if (!isValidObjectId(id)) {
    console.warn(`⚠️ [Controller] deleteUser: invalid user ID format: "${id}"`)
    return res.status(400).json({ error: 'Invalid User ID format' })
  }

  try {
    const user = await User.findByIdAndDelete(id).lean()

    if (!user) {
      console.warn(`⚠️ [Controller] deleteUser: User to delete not found: "${id}"`)
      return res.status(404).json({ error: 'User to delete not found' })
    }

    console.log(`✅ [Controller] deleteUser success for ID: "${id}"`)
    return res.json({ user })
  } catch (error) {
    console.error(`❌ [Controller] deleteUser error for ID "${id}":`, error)
    return res.status(500).json({ error: error.message || 'Failed to delete user' })
  }
}
