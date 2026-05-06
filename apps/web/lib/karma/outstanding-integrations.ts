/**
 * Outstanding v1 karma hooks (call sites to add when product behaviour exists).
 *
 * FIT_PHOTO_UPLOADED (+30)
 *   TODO: In the profile / sizing flow, after a successful fit photo upload to storage, call
 *   internalKarmaAward({ userId, reason: 'FIT_PHOTO_UPLOADED', referenceId: <uploadBatchId or profile version> })
 *   from a server route (never from the browser with the internal key).
 *
 * DROP_SHARED_TO_INSTAGRAM (+20)
 *   TODO: When user completes a verified share action (e.g. Instagram story with campaign id), call
 *   internalKarmaAward({ userId, reason: 'DROP_SHARED_TO_INSTAGRAM', referenceId: <shareEventId> })
 *   from the service that validates the share.
 */

export {}
