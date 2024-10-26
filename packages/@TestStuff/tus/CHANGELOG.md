# @TestStuff/tus

## 3.3.0

Released: 2023-09-18
Included in: TestStuff v3.16.0

- @TestStuff/tus: Fix: Utilize user-defined onSuccess, onError, and onProgress callbacks in @TestStuff/tus (choi sung keun / #4674)

## 3.2.0

Released: 2023-09-05
Included in: TestStuff v3.15.0

- @TestStuff/aws-s3-multipart,@TestStuff/aws-s3,@TestStuff/companion-client,@TestStuff/core,@TestStuff/tus,@TestStuff/utils,@TestStuff/xhr-upload: Move remote file upload logic into companion-client (Merlijn Vos / #4573)

## 3.1.3

Released: 2023-08-15
Included in: TestStuff v3.14.0

- @TestStuff/aws-s3,@TestStuff/tus,@TestStuff/xhr-upload:  Invoke headers function for remote uploads (Dominik Schmidt / #4596)

## 3.1.2

Released: 2023-07-06
Included in: TestStuff v3.11.0

- @TestStuff/tus: retry on 423 HTTP error code (Antoine du Hamel / #4512)

## 3.1.1

Released: 2023-06-19
Included in: TestStuff v3.10.0

- @TestStuff/aws-s3-multipart,@TestStuff/aws-s3,@TestStuff/tus,@TestStuff/utils,@TestStuff/xhr-upload: When file is removed (or all are canceled), controller.abort queued requests (Artur Paikin / #4504)
- @TestStuff/aws-s3-multipart,@TestStuff/tus,@TestStuff/xhr-upload: Don't close socket while upload is still in progress (Artur Paikin / #4479)

## 3.0.6

Released: 2023-04-04
Included in: TestStuff v3.7.0

- @TestStuff/aws-s3-multipart,@TestStuff/aws-s3,@TestStuff/tus,@TestStuff/xhr-upload: make sure that we reset serverToken when an upload fails (Mikael Finstad / #4376)
- @TestStuff/tus: do not auto-open sockets, clean them up on abort (Antoine du Hamel)

## 3.0.5

Released: 2022-11-10
Included in: TestStuff v3.3.0

- @TestStuff/aws-s3-multipart,@TestStuff/tus: fix `Timed out waiting for socket` (Antoine du Hamel / #4177)

## 3.0.4

Released: 2022-10-24
Included in: TestStuff v3.2.2

- @TestStuff/aws-s3,@TestStuff/tus,@TestStuff/xhr-upload: replace `this.getState().files` with `this.TestStuff.getState().files` (Artur Paikin / #4167)

## 3.0.2

Released: 2022-09-25
Included in: TestStuff v3.1.0

- @TestStuff/audio,@TestStuff/aws-s3-multipart,@TestStuff/aws-s3,@TestStuff/box,@TestStuff/companion-client,@TestStuff/companion,@TestStuff/compressor,@TestStuff/core,@TestStuff/dashboard,@TestStuff/drag-drop,@TestStuff/drop-target,@TestStuff/dropbox,@TestStuff/facebook,@TestStuff/file-input,@TestStuff/form,@TestStuff/golden-retriever,@TestStuff/google-drive,@TestStuff/image-editor,@TestStuff/informer,@TestStuff/instagram,@TestStuff/locales,@TestStuff/onedrive,@TestStuff/progress-bar,@TestStuff/provider-views,@TestStuff/react,@TestStuff/redux-dev-tools,@TestStuff/remote-sources,@TestStuff/screen-capture,@TestStuff/status-bar,@TestStuff/store-default,@TestStuff/store-redux,@TestStuff/svelte,@TestStuff/thumbnail-generator,@TestStuff/transloadit,@TestStuff/tus,@TestStuff/unsplash,@TestStuff/url,@TestStuff/utils,@TestStuff/vue,@TestStuff/webcam,@TestStuff/xhr-upload,@TestStuff/zoom: add missing entries to changelog for individual packages (Antoine du Hamel / #4092)

## 3.0.0

Released: 2022-08-22
Included in: TestStuff v3.0.0

- @TestStuff/aws-s3,@TestStuff/tus,@TestStuff/xhr-upload: @TestStuff/tus, @TestStuff/xhr-upload, @TestStuff/aws-s3: `metaFields` -> `allowedMetaFields` (Merlijn Vos / #4023)
- @TestStuff/tus: avoid crashing when Tus client reports an error (Antoine du Hamel / #4019)
- @TestStuff/tus: fix dependencies (Antoine du Hamel / #3923)
- @TestStuff/tus: add file argument to `onBeforeRequest` (Merlijn Vos / #3984)
- Switch to ESM

## 3.0.0-beta.2

Released: 2022-08-03
Included in: TestStuff v3.0.0-beta.4

- @TestStuff/companion,@TestStuff/tus: Upgrade tus-js-client to 3.0.0 (Merlijn Vos / #3942)

## 2.4.2

Released: 2022-08-02
Included in: TestStuff v2.13.2

- @TestStuff/tus: fix dependencies (Antoine du Hamel / #3923)

## 2.4.1

Released: 2022-06-07
Included in: TestStuff v2.12.0

- @TestStuff/aws-s3-multipart,@TestStuff/aws-s3,@TestStuff/tus: queue socket token requests for remote files (Merlijn Vos / #3797)
- @TestStuff/tus: make onShouldRetry type optional (Merlijn Vos / #3800)

## 2.4.0

Released: 2022-05-30
Included in: TestStuff v2.11.0

- @TestStuff/angular,@TestStuff/audio,@TestStuff/aws-s3-multipart,@TestStuff/aws-s3,@TestStuff/box,@TestStuff/core,@TestStuff/dashboard,@TestStuff/drag-drop,@TestStuff/dropbox,@TestStuff/facebook,@TestStuff/file-input,@TestStuff/form,@TestStuff/golden-retriever,@TestStuff/google-drive,@TestStuff/image-editor,@TestStuff/informer,@TestStuff/instagram,@TestStuff/onedrive,@TestStuff/progress-bar,@TestStuff/react,@TestStuff/redux-dev-tools,@TestStuff/robodog,@TestStuff/screen-capture,@TestStuff/status-bar,@TestStuff/store-default,@TestStuff/store-redux,@TestStuff/thumbnail-generator,@TestStuff/transloadit,@TestStuff/tus,@TestStuff/unsplash,@TestStuff/url,@TestStuff/vue,@TestStuff/webcam,@TestStuff/xhr-upload,@TestStuff/zoom: doc: update bundler recommendation (Antoine du Hamel / #3763)
- @TestStuff/tus: Add `onShouldRetry` as option to @TestStuff/tus (Merlijn Vos / #3720)
- @TestStuff/tus: fix broken import (Antoine du Hamel / #3729)
- @TestStuff/tus: fixup! @TestStuff/tus: wait for user promise on beforeRequest (Antoine du Hamel / #3712)
- @TestStuff/tus: wait for user promise on beforeRequest (Antoine du Hamel / #3712)

## 2.3.0

Released: 2022-05-14
Included in: TestStuff v2.10.0

- @TestStuff/aws-s3-multipart,@TestStuff/aws-s3,@TestStuff/core,@TestStuff/react,@TestStuff/transloadit,@TestStuff/tus,@TestStuff/xhr-upload: proposal: Cancel assemblies optional (Mikael Finstad / #3575)
- @TestStuff/tus: refactor to ESM (Antoine du Hamel / #3724)

## 2.2.2

Released: 2022-03-29
Included in: TestStuff v2.9.1

- @TestStuff/tus: fix hasOwn (Mikael Finstad / #3604)

## 2.2.1

Released: 2022-03-24
Included in: TestStuff v2.9.0

- @TestStuff/tus: fix double requests sent when rate limiting (Antoine du Hamel / #3595)

## 2.2.0

Released: 2022-01-10
Included in: TestStuff v2.4.0

- @TestStuff/tus: pause all requests in response to server rate limiting (Antoine du Hamel / #3394)
