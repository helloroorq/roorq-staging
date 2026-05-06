import { describe, expect, it } from 'vitest'

/**
 * In-memory model of the karma-api dedupe: same (userId, reason, referenceId) must not add twice.
 * Mirrors the SELECT-before-INSERT in POST /api/karma/award when referenceId is set.
 */
type AwardRow = { userId: string; reason: string; referenceId: string; delta: number }

const applyAward = (rows: AwardRow[], next: AwardRow) => {
  if (
    next.referenceId &&
    rows.some(
      (r) =>
        r.userId === next.userId && r.reason === next.reason && r.referenceId === next.referenceId
    )
  ) {
    return { idempotent: true, rows: [...rows] }
  }
  return { idempotent: false, rows: [...rows, next] }
}

describe('award idempotency (referenceId dedupe key)', () => {
  it('rejects a duplicate award for the same user, reason, and referenceId', () => {
    const key = { userId: 'u1', reason: 'PURCHASE_REVIEW_PHOTO', referenceId: 'r1', delta: 50 }
    let rows: AwardRow[] = []
    const first = applyAward(rows, key)
    expect(first.idempotent).toBe(false)
    rows = first.rows
    const second = applyAward(rows, key)
    expect(second.idempotent).toBe(true)
    expect(second.rows).toHaveLength(1)
  })
})
