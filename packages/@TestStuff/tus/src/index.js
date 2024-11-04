import BasePlugin from '@TestStuff/core/lib/BasePlugin.js'
import * as tus from 'tus-js-client'
import EventManager from '@TestStuff/utils/lib/EventManager'
import NetworkError from '@TestStuff/utils/lib/NetworkError'
import isNetworkError from '@TestStuff/utils/lib/isNetworkError'
import { RateLimitedQueue } from '@TestStuff/utils/lib/RateLimitedQueue'
import hasProperty from '@TestStuff/utils/lib/hasProperty'
import { filterNonFailedFiles, filterFilesToEmitUploadStarted } from '@TestStuff/utils/lib/fileFilters'
import getFingerprint from './getFingerprint.js'

import packageJson from '../package.json'

/** @typedef {import('..').TusOptions} TusOptions */
/** @typedef {import('tus-js-client').UploadOptions} RawTusOptions */
/** @typedef {import('@TestStuff/core').TestStuff} TestStuff */
/** @typedef {import('@TestStuff/core').TestStuffFile} TestStuffFile */
/** @typedef {import('@TestStuff/core').FailedTestStuffFile<{}>} FailedTestStuffFile */

/**
 * Extracted from https://github.com/tus/tus-js-client/blob/master/lib/upload.js#L13
 * excepted we removed 'fingerprint' key to avoid adding more dependencies
 *
 * @type {RawTusOptions}
 */
const tusDefaultOptions = {
  endpoint: '',

  uploadUrl: null,
  metadata: {},
  uploadSize: null,

  onProgress: null,
  onChunkComplete: null,
  onSuccess: null,
  onError: null,

  overridePatchMethod: false,
  headers: {},
  addRequestId: false,

  chunkSize: Infinity,
  retryDelays: [100, 1000, 3000, 5000],
  parallelUploads: 1,
  removeFingerprintOnSuccess: false,
  uploadLengthDeferred: false,
  uploadDataDuringCreation: false,
}

/**
 * Tus resumable file uploader
 */
export default class Tus extends BasePlugin {
  static VERSION = packageJson.version

  #retryDelayIterator

  /**
   * @param {TestStuff} TestStuff
   * @param {TusOptions} opts
   */
  constructor (TestStuff, opts) {
    super(TestStuff, opts)
    this.type = 'uploader'
    this.id = this.opts.id || 'Tus'
    this.title = 'Tus'

    // set default options
    const defaultOptions = {
      limit: 20,
      retryDelays: tusDefaultOptions.retryDelays,
      withCredentials: false,
    }

    // merge default options with the ones set by user
    /** @type {import("..").TusOptions} */
    this.opts = { ...defaultOptions, ...opts }

    if (opts?.allowedMetaFields === undefined && 'metaFields' in this.opts) {
      throw new Error('The `metaFields` option has been renamed to `allowedMetaFields`.')
    }

    if ('autoRetry' in opts) {
      throw new Error('The `autoRetry` option was deprecated and has been removed.')
    }

    /**
     * Simultaneous upload limiting is shared across all uploads with this plugin.
     *
     * @type {RateLimitedQueue}
     */
    this.requests = this.opts.rateLimitedQueue ?? new RateLimitedQueue(this.opts.limit)
    this.#retryDelayIterator = this.opts.retryDelays?.values()

    this.uploaders = Object.create(null)
    this.uploaderEvents = Object.create(null)

    this.handleResetProgress = this.handleResetProgress.bind(this)
  }

  handleResetProgress () {
    const files = { ...this.TestStuff.getState().files }
    Object.keys(files).forEach((fileID) => {
      // Only clone the file object if it has a Tus `uploadUrl` attached.
      if (files[fileID].tus && files[fileID].tus.uploadUrl) {
        const tusState = { ...files[fileID].tus }
        delete tusState.uploadUrl
        files[fileID] = { ...files[fileID], tus: tusState }
      }
    })

    this.TestStuff.setState({ files })
  }

  /**
   * Clean up all references for a file's upload: the tus.Upload instance,
   * any events related to the file, and the Companion WebSocket connection.
   *
   * @param {string} fileID
   */
  resetUploaderReferences (fileID, opts = {}) {
    if (this.uploaders[fileID]) {
      const uploader = this.uploaders[fileID]

      uploader.abort()

      if (opts.abort) {
        uploader.abort(true)
      }

      this.uploaders[fileID] = null
    }
    if (this.uploaderEvents[fileID]) {
      this.uploaderEvents[fileID].remove()
      this.uploaderEvents[fileID] = null
    }
  }

  /**
   * Create a new Tus upload.
   *
   * A lot can happen during an upload, so this is quite hard to follow!
   * - First, the upload is started. If the file was already paused by the time the upload starts, nothing should happen.
   *   If the `limit` option is used, the upload must be queued onto the `this.requests` queue.
   *   When an upload starts, we store the tus.Upload instance, and an EventManager instance that manages the event listeners
   *   for pausing, cancellation, removal, etc.
   * - While the upload is in progress, it may be paused or cancelled.
   *   Pausing aborts the underlying tus.Upload, and removes the upload from the `this.requests` queue. All other state is
   *   maintained.
   *   Cancelling removes the upload from the `this.requests` queue, and completely aborts the upload-- the `tus.Upload`
   *   instance is aborted and discarded, the EventManager instance is destroyed (removing all listeners).
   *   Resuming the upload uses the `this.requests` queue as well, to prevent selectively pausing and resuming uploads from
   *   bypassing the limit.
   * - After completing an upload, the tus.Upload and EventManager instances are cleaned up, and the upload is marked as done
   *   in the `this.requests` queue.
   * - When an upload completed with an error, the same happens as on successful completion, but the `upload()` promise is
   *   rejected.
   *
   * When working on this function, keep in mind:
   *  - When an upload is completed or cancelled for any reason, the tus.Upload and EventManager instances need to be cleaned
   *    up using this.resetUploaderReferences().
   *  - When an upload is cancelled or paused, for any reason, it needs to be removed from the `this.requests` queue using
   *    `queuedRequest.abort()`.
   *  - When an upload is completed for any reason, including errors, it needs to be marked as such using
   *    `queuedRequest.done()`.
   *  - When an upload is started or resumed, it needs to go through the `this.requests` queue. The `queuedRequest` variable
   *    must be updated so the other uses of it are valid.
   *  - Before replacing the `queuedRequest` variable, the previous `queuedRequest` must be aborted, else it will keep taking
   *    up a spot in the queue.
   *
   * @param {TestStuffFile} file for use with upload
   * @returns {Promise<void>}
   */
  #uploadLocalFile (file) {
    this.resetUploaderReferences(file.id)

    // Create a new tus upload
    return new Promise((resolve, reject) => {
      let queuedRequest
      let qRequest
      let upload

      const opts = {
        ...this.opts,
        ...(file.tus || {}),
      }

      if (typeof opts.headers === 'function') {
        opts.headers = opts.headers(file)
      }

      /** @type {RawTusOptions} */
      const uploadOptions = {
        ...tusDefaultOptions,
        ...opts,
      }

      // We override tus fingerprint to TestStuff’s `file.id`, since the `file.id`
      // now also includes `relativePath` for files added from folders.
      // This means you can add 2 identical files, if one is in folder a,
      // the other in folder b.
      uploadOptions.fingerprint = getFingerprint(file)

      uploadOptions.onBeforeRequest = (req) => {
        const xhr = req.getUnderlyingObject()
        xhr.withCredentials = !!opts.withCredentials

        let userProvidedPromise
        if (typeof opts.onBeforeRequest === 'function') {
          userProvidedPromise = opts.onBeforeRequest(req, file)
        }

        if (hasProperty(queuedRequest, 'shouldBeRequeued')) {
          if (!queuedRequest.shouldBeRequeued) return Promise.reject()
          let done
          const p = new Promise((res) => { // eslint-disable-line promise/param-names
            done = res
          })
          queuedRequest = this.requests.run(() => {
            if (file.isPaused) {
              queuedRequest.abort()
            }
            done()
            return () => {}
          })
          // If the request has been requeued because it was rate limited by the
          // remote server, we want to wait for `RateLimitedQueue` to dispatch
          // the re-try request.
          // Therefore we create a promise that the queue will resolve when
          // enough time has elapsed to expect not to be rate-limited again.
          // This means we can hold the Tus retry here with a `Promise.all`,
          // together with the returned value of the user provided
          // `onBeforeRequest` option callback (in case it returns a promise).
          return Promise.all([p, userProvidedPromise])
        }
        return userProvidedPromise
      }

      uploadOptions.onError = (err) => {
        this.TestStuff.log(err)

        const xhr = err.originalRequest ? err.originalRequest.getUnderlyingObject() : null
        if (isNetworkError(xhr)) {
          // eslint-disable-next-line no-param-reassign
          err = new NetworkError(err, xhr)
        }

        this.resetUploaderReferences(file.id)
        queuedRequest?.abort()

        this.TestStuff.emit('upload-error', file, err)
        if (typeof opts.onError === 'function') {
          opts.onError(err)
        }
        reject(err)
      }

      uploadOptions.onProgress = (bytesUploaded, bytesTotal) => {
        this.onReceiveUploadUrl(file, upload.url)
        if (typeof opts.onProgress === 'function') {
          opts.onProgress(bytesUploaded, bytesTotal)
        }
        this.TestStuff.emit('upload-progress', file, {
          uploader: this,
          bytesUploaded,
          bytesTotal,
        })
      }

      uploadOptions.onSuccess = () => {
        const uploadResp = {
          uploadURL: upload.url,
        }

        this.resetUploaderReferences(file.id)
        queuedRequest.done()

        this.TestStuff.emit('upload-success', file, uploadResp)

        if (upload.url) {
          this.TestStuff.log(`Download ${upload.file.name} from ${upload.url}`)
        }
        if (typeof opts.onSuccess === 'function') {
          opts.onSuccess()
        }

        resolve(upload)
      }

      const defaultOnShouldRetry = (err) => {
        const status = err?.originalResponse?.getStatus()

        if (status === 429) {
          // HTTP 429 Too Many Requests => to avoid the whole download to fail, pause all requests.
          if (!this.requests.isPaused) {
            const next = this.#retryDelayIterator?.next()
            if (next == null || next.done) {
              return false
            }
            this.requests.rateLimit(next.value)
          }
        } else if (status > 400 && status < 500 && status !== 409 && status !== 423) {
          // HTTP 4xx, the server won't send anything, it's doesn't make sense to retry
          // HTTP 409 Conflict (happens if the Upload-Offset header does not match the one on the server)
          // HTTP 423 Locked (happens when a paused download is resumed too quickly)
          return false
        } else if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          // The navigator is offline, let's wait for it to come back online.
          if (!this.requests.isPaused) {
            this.requests.pause()
            window.addEventListener('online', () => {
              this.requests.resume()
            }, { once: true })
          }
        }
        queuedRequest.abort()
        queuedRequest = {
          shouldBeRequeued: true,
          abort () {
            this.shouldBeRequeued = false
          },
          done () {
            throw new Error('Cannot mark a queued request as done: this indicates a bug')
          },
          fn () {
            throw new Error('Cannot run a queued request: this indicates a bug')
          },
        }
        return true
      }

      if (opts.onShouldRetry != null) {
        uploadOptions.onShouldRetry = (...args) => opts.onShouldRetry(...args, defaultOnShouldRetry)
      } else {
        uploadOptions.onShouldRetry = defaultOnShouldRetry
      }

      const copyProp = (obj, srcProp, destProp) => {
        if (hasProperty(obj, srcProp) && !hasProperty(obj, destProp)) {
          // eslint-disable-next-line no-param-reassign
          obj[destProp] = obj[srcProp]
        }
      }

      /** @type {Record<string, string>} */
      const meta = {}
      const allowedMetaFields = Array.isArray(opts.allowedMetaFields)
        ? opts.allowedMetaFields
        // Send along all fields by default.
        : Object.keys(file.meta)
      allowedMetaFields.forEach((item) => {
        meta[item] = file.meta[item]
      })

      // tusd uses metadata fields 'filetype' and 'filename'
      copyProp(meta, 'type', 'filetype')
      copyProp(meta, 'name', 'filename')

      uploadOptions.metadata = meta

      upload = new tus.Upload(file.data, uploadOptions)
      this.uploaders[file.id] = upload
      const eventManager = new EventManager(this.TestStuff)
      this.uploaderEvents[file.id] = eventManager

      // eslint-disable-next-line prefer-const
      qRequest = () => {
        if (!file.isPaused) {
          upload.start()
        }
        // Don't do anything here, the caller will take care of cancelling the upload itself
        // using resetUploaderReferences(). This is because resetUploaderReferences() has to be
        // called when this request is still in the queue, and has not been started yet, too. At
        // that point this cancellation function is not going to be called.
        // Also, we need to remove the request from the queue _without_ destroying everything
        // related to this upload to handle pauses.
        return () => {}
      }

      upload.findPreviousUploads().then((previousUploads) => {
        const previousUpload = previousUploads[0]
        if (previousUpload) {
          this.TestStuff.log(`[Tus] Resuming upload of ${file.id} started at ${previousUpload.creationTime}`)
          upload.resumeFromPreviousUpload(previousUpload)
        }
      })

      queuedRequest = this.requests.run(qRequest)

      eventManager.onFileRemove(file.id, (targetFileID) => {
        queuedRequest.abort()
        this.resetUploaderReferences(file.id, { abort: !!upload.url })
        resolve(`upload ${targetFileID} was removed`)
      })

      eventManager.onPause(file.id, (isPaused) => {
        queuedRequest.abort()
        if (isPaused) {
          // Remove this file from the queue so another file can start in its place.
          upload.abort()
        } else {
          // Resuming an upload should be queued, else you could pause and then
          // resume a queued upload to make it skip the queue.
          queuedRequest = this.requests.run(qRequest)
        }
      })

      eventManager.onPauseAll(file.id, () => {
        queuedRequest.abort()
        upload.abort()
      })

      eventManager.onCancelAll(file.id, ({ reason } = {}) => {
        if (reason === 'user') {
          queuedRequest.abort()
          this.resetUploaderReferences(file.id, { abort: !!upload.url })
        }
        resolve(`upload ${file.id} was canceled`)
      })

      eventManager.onResumeAll(file.id, () => {
        queuedRequest.abort()
        if (file.error) {
          upload.abort()
        }
        queuedRequest = this.requests.run(qRequest)
      })
    }).catch((err) => {
      this.TestStuff.emit('upload-error', file, err)
      throw err
    })
  }

  /**
   * Store the uploadUrl on the file options, so that when Golden Retriever
   * restores state, we will continue uploading to the correct URL.
   *
   * @param {TestStuffFile} file
   * @param {string} uploadURL
   */
  onReceiveUploadUrl (file, uploadURL) {
    const currentFile = this.TestStuff.getFile(file.id)
    if (!currentFile) return
    // Only do the update if we didn't have an upload URL yet.
    if (!currentFile.tus || currentFile.tus.uploadUrl !== uploadURL) {
      this.TestStuff.log('[Tus] Storing upload url')
      this.TestStuff.setFileState(currentFile.id, {
        tus: { ...currentFile.tus, uploadUrl: uploadURL },
      })
    }
  }

  #getCompanionClientArgs (file) {
    const opts = { ...this.opts }

    if (file.tus) {
      // Install file-specific upload overrides.
      Object.assign(opts, file.tus)
    }

    return {
      ...file.remote.body,
      endpoint: opts.endpoint,
      uploadUrl: opts.uploadUrl,
      protocol: 'tus',
      size: file.data.size,
      headers: opts.headers,
      metadata: file.meta,
    }
  }

  /**
   * @param {(TestStuffFile | FailedTestStuffFile)[]} files
   */
  async #uploadFiles (files) {
    const filesFiltered = filterNonFailedFiles(files)
    const filesToEmit = filterFilesToEmitUploadStarted(filesFiltered)
    this.TestStuff.emit('upload-start', filesToEmit)

    await Promise.allSettled(filesFiltered.map((file, i) => {
      const current = i + 1
      const total = files.length

      if (file.isRemote) {
        const getQueue = () => this.requests
        const controller = new AbortController()

        const removedHandler = (removedFile) => {
          if (removedFile.id === file.id) controller.abort()
        }
        this.TestStuff.on('file-removed', removedHandler)

        const uploadPromise = file.remote.requestClient.uploadRemoteFile(
          file,
          this.#getCompanionClientArgs(file),
          { signal: controller.signal, getQueue },
        )

        this.requests.wrapSyncFunction(() => {
          this.TestStuff.off('file-removed', removedHandler)
        }, { priority: -1 })()

        return uploadPromise
      }

      return this.#uploadLocalFile(file, current, total)
    }))
  }

  /**
   * @param {string[]} fileIDs
   */
  #handleUpload = async (fileIDs) => {
    if (fileIDs.length === 0) {
      this.TestStuff.log('[Tus] No files to upload')
      return
    }

    if (this.opts.limit === 0) {
      this.TestStuff.log(
        '[Tus] When uploading multiple files at once, consider setting the `limit` option (to `10` for example), to limit the number of concurrent uploads, which helps prevent memory and network issues: https://TestStuff.io/docs/tus/#limit-0',
        'warning',
      )
    }

    this.TestStuff.log('[Tus] Uploading...')
    const filesToUpload = this.TestStuff.getFilesByIds(fileIDs)

    await this.#uploadFiles(filesToUpload)
  }

  install () {
    this.TestStuff.setState({
      capabilities: { ...this.TestStuff.getState().capabilities, resumableUploads: true },
    })
    this.TestStuff.addUploader(this.#handleUpload)

    this.TestStuff.on('reset-progress', this.handleResetProgress)
  }

  uninstall () {
    this.TestStuff.setState({
      capabilities: { ...this.TestStuff.getState().capabilities, resumableUploads: false },
    })
    this.TestStuff.removeUploader(this.#handleUpload)
  }
}
