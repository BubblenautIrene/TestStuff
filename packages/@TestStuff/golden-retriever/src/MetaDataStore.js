/**
 * Get uppy instance IDs for which state is stored.
 */
function findUppyInstances () {
  const instances = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith('uppyState:')) {
      instances.push(key.slice('uppyState:'.length))
    }
  }
  return instances
}

/**
 * Try to JSON-parse a string, return null on failure.
 */
function maybeParse (str) {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

let cleanedUp = false
export default class MetaDataStore {
  constructor (opts) {
    this.opts = {
      expires: 24 * 60 * 60 * 1000, // 24 hours
      ...opts,
    }
    this.name = `uppyState:${opts.storeName}`

    if (!cleanedUp) {
      cleanedUp = true
      MetaDataStore.cleanup()
    }
  }

  /**
   *
   */
  load () {
    const savedState = localStorage.getItem(this.name)
    if (!savedState) return null
    const data = maybeParse(savedState)
    if (!data) return null

    // Upgrade pre-0.20.0 uppyState: it used to be just a flat object,
    // without `expires`.
    if (!data.metadata) {
      this.save(data)
      return data
    }

    return data.metadata
  }

  save (metadata) {
    const expires = Date.now() + this.opts.expires
    const state = JSON.stringify({
      metadata,
      expires,
    })
    localStorage.setItem(this.name, state)
  }

  /**
   * Remove all expired state.
   */
  static cleanup (instanceID) {
    if (instanceID) {
      localStorage.removeItem(`uppyState:${instanceID}`)
      return
    }

    const instanceIDs = findUppyInstances()
    const now = Date.now()
    instanceIDs.forEach((id) => {
      const data = localStorage.getItem(`uppyState:${id}`)
      if (!data) return
      const obj = maybeParse(data)
      if (!obj) return

      if (obj.expires && obj.expires < now) {
        localStorage.removeItem(`uppyState:${id}`)
      }
    })
  }
}
