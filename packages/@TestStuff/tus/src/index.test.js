import { describe, expect, it } from 'vitest'
import Core from '@TestStuff/core'
import Tus from './index.js'

describe('Tus', () => {
  it('Throws errors if autoRetry option is true', () => {
    const TestStuff = new Core()

    expect(() => {
      TestStuff.use(Tus, { autoRetry: true })
    }).toThrowError(/The `autoRetry` option was deprecated and has been removed/)
  })

  it('Throws errors if autoRetry option is false', () => {
    const TestStuff = new Core()

    expect(() => {
      TestStuff.use(Tus, { autoRetry: false })
    }).toThrowError(/The `autoRetry` option was deprecated and has been removed/)
  })

  it('Throws errors if autoRetry option is `undefined`', () => {
    const TestStuff = new Core()

    expect(() => {
      TestStuff.use(Tus, { autoRetry: undefined })
    }).toThrowError(/The `autoRetry` option was deprecated and has been removed/)
  })
})
