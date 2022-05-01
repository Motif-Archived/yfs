import * as Diff from 'diff'

type YDelta = { retain: number } | { delete: number } | { insert: string }

// Compute the set of Yjs delta operations (that is, `insert` and
// `delete`) required to go from initialText to finalText.
// Based on https://github.com/kpdecker/jsdiff.
export const getDeltaOperations = (
  initialText: string,
  finalText: string
): YDelta[] => {
  if (initialText === finalText) {
    return []
  }

  const edits = Diff.diffChars(initialText, finalText)
  let prevOffset = 0
  let deltas: YDelta[] = []

  for (const edit of edits) {
    if (edit.removed && edit.value) {
      deltas = [
        ...deltas,
        ...[
          ...(prevOffset > 0 ? [{ retain: prevOffset }] : []),
          { delete: edit.value.length }
        ]
      ]
      prevOffset = 0
    } else if (edit.added && edit.value) {
      deltas = [...deltas, ...[{ retain: prevOffset }, { insert: edit.value }]]
      prevOffset = edit.value.length
    } else {
      prevOffset = edit.value.length
    }
  }
  return deltas
}
