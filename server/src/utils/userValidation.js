// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/

const checkName = (value, field, { required, max }) => {
  if (typeof value !== 'string') return { error: `${field} must be a string` }
  if (CONTROL_CHARS.test(value)) return { error: `${field} contains invalid characters` }
  const trimmed = value.trim()
  if (required && trimmed.length < 1) return { error: `${field} is required` }
  if (trimmed.length > max) return { error: `${field} must be at most ${max} characters` }
  return { value: trimmed }
}

export const NAME_MAX = 40

// Validates a user payload. Returns { value } or { error }.
// partial=true (updates): fields may be omitted; only provided fields are validated.
export const validateUserInput = (body, { partial = false } = {}) => {
  const input = body && typeof body === 'object' ? body : {}
  const value = {}

  if (input.firstName === undefined) {
    if (!partial) return { error: 'firstName is required' }
  } else {
    const r = checkName(input.firstName, 'firstName', { required: true, max: NAME_MAX })
    if (r.error) return { error: r.error }
    value.firstName = r.value
  }

  if (input.lastName !== undefined) {
    const r = checkName(input.lastName, 'lastName', { required: false, max: NAME_MAX })
    if (r.error) return { error: r.error }
    value.lastName = r.value
  }

  return { value }
}
