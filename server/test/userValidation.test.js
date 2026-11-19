import test from 'node:test'
import assert from 'node:assert/strict'
import { validateUserInput } from '../src/utils/userValidation.js'

test('valid create trims names', () => {
  assert.deepEqual(validateUserInput({ firstName: '  Ada ', lastName: ' Lovelace ' }), {
    value: { firstName: 'Ada', lastName: 'Lovelace' },
  })
})

test('lastName optional (omitted or empty)', () => {
  assert.deepEqual(validateUserInput({ firstName: 'Ada' }).value, { firstName: 'Ada' })
  assert.deepEqual(validateUserInput({ firstName: 'Ada', lastName: '   ' }).value, { firstName: 'Ada', lastName: '' })
})

test('firstName required, non-empty after trimming', () => {
  assert.ok(validateUserInput({}).error)
  assert.ok(validateUserInput(undefined).error)
  assert.ok(validateUserInput({ firstName: '   ' }).error)
})

test('rejects non-strings', () => {
  for (const bad of [123, null, {}, [], true]) {
    assert.ok(validateUserInput({ firstName: bad }).error, `firstName ${JSON.stringify(bad)}`)
    assert.ok(validateUserInput({ firstName: 'A', lastName: bad }).error, `lastName ${JSON.stringify(bad)}`)
  }
})

test('rejects control characters', () => {
  assert.ok(validateUserInput({ firstName: 'Ad\u0000a' }).error)
  assert.ok(validateUserInput({ firstName: 'Ada\n' }).error)
  assert.ok(validateUserInput({ firstName: 'Ada', lastName: 'Lo\tve' }).error)
  assert.ok(validateUserInput({ firstName: 'Ada\u007f' }).error)
})

test('length limits: 40 ok, 41 rejected', () => {
  assert.ok(!validateUserInput({ firstName: 'a'.repeat(40), lastName: 'b'.repeat(40) }).error)
  assert.ok(validateUserInput({ firstName: 'a'.repeat(41) }).error)
  assert.ok(validateUserInput({ firstName: 'a', lastName: 'b'.repeat(41) }).error)
})

test('unicode names (Hebrew) are accepted', () => {
  assert.equal(validateUserInput({ firstName: 'יעקב' }).value.firstName, 'יעקב')
})

test('partial updates only validate provided fields', () => {
  assert.deepEqual(validateUserInput({}, { partial: true }), { value: {} })
  assert.deepEqual(validateUserInput({ lastName: 'X' }, { partial: true }).value, { lastName: 'X' })
  assert.ok(validateUserInput({ firstName: '' }, { partial: true }).error)
  assert.ok(validateUserInput({ firstName: 5 }, { partial: true }).error)
})
