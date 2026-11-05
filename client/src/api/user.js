import axios from 'axios'

const UserClient = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER_URL}/api/user`,
  timeout: 5000,
})

// Renaming/deleting users needs the homelab main password. Asked once, kept for this browser tab.
const KEY = 'codezi-admin-password'
const stored = () => { try { return sessionStorage.getItem(KEY) || '' } catch { return '' } }

UserClient.interceptors.request.use((config) => {
  const pass = stored()
  if (pass) config.headers['x-admin-password'] = pass
  return config
})

UserClient.interceptors.response.use(undefined, async (error) => {
  const config = error.config
  if (error.response?.status === 401 && config && !config._askedForPassword) {
    const pass = window.prompt('Admin password (the homelab main password):')
    if (pass) {
      try { sessionStorage.setItem(KEY, pass) } catch { /* private mode */ }
      config._askedForPassword = true
      config.headers['x-admin-password'] = pass
      return UserClient.request(config)
    }
  }
  return Promise.reject(error)
})

export const getUser = ({ id }) => UserClient.get(`/${id}`)

export const getUsers = () => UserClient.get()

export const createUser = ({ firstName, lastName }) =>
  UserClient.post('/', {
    firstName,
    lastName,
  })

export const updateUser = ({ id, firstName, lastName }) =>
  UserClient.patch(`/${id}`, {
    firstName,
    lastName,
  })

export const deleteUser = ({ id }) => UserClient.delete(`/${id}`)
