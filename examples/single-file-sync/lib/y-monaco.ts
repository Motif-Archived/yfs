import * as Y from 'yjs'
import * as error from 'lib0/error.js'
import { createMutex, mutex } from 'lib0/mutex.js'
import * as awarenessProtocol from 'y-protocols/awareness.js'
import { YDOC_UPDATE_ORIGIN_CURRENT_EDITOR } from './constants'

type Direction = any
type Selection = {
  start: Y.RelativePosition
  end: Y.RelativePosition
  direction: Direction
}

class RelativeSelection {
  start: Y.RelativePosition
  end: Y.RelativePosition
  direction: Direction

  constructor (
    start: Y.RelativePosition,
    end: Y.RelativePosition,
    direction: Direction,
  ) {
    this.start = start
    this.end = end
    this.direction = direction
  }
}

const createRelativeSelection = (
  editor: any,
  monacoModel: any,
  type: Y.AbstractType<any>,
) => {
  const sel = editor.getSelection()
  if (sel !== null) {
    const startPos = sel.getStartPosition()
    const endPos = sel.getEndPosition()
    const start = Y.createRelativePositionFromTypeIndex(
      type,
      monacoModel.getOffsetAt(startPos),
    )
    const end = Y.createRelativePositionFromTypeIndex(
      type,
      monacoModel.getOffsetAt(endPos),
    )
    return new RelativeSelection(start, end, sel.getDirection())
  }
  return null
}

const createMonacoSelectionFromRelativeSelection = (
  monaco: any,
  editor: any,
  type: Y.AbstractType<any>,
  relSel: Selection,
  doc: Y.Doc,
) => {
  const start = Y.createAbsolutePositionFromRelativePosition(relSel.start, doc)
  const end = Y.createAbsolutePositionFromRelativePosition(relSel.end, doc)
  if (
    start !== null &&
    end !== null &&
    start.type === type &&
    end.type === type
  ) {
    const model = editor.getModel()
    if (!model) {
      return null
    }
    const startPos = model.getPositionAt(start.index)
    const endPos = model.getPositionAt(end.index)
    return monaco.Selection.createWithDirection(
      startPos.lineNumber,
      startPos.column,
      endPos.lineNumber,
      endPos.column,
      relSel.direction,
    )
  }
  return null
}

export class MonacoBinding {
  doc: Y.Doc
  ytext: Y.Text
  monacoModel: any
  editor: any
  mux: mutex
  color: number
  awareness: awarenessProtocol.Awareness | undefined
  _savedSelections: Map<any, Selection>
  _decorations: any
  _rerenderDecorations: any
  _monacoChangeHandler: any
  _beforeTransaction: () => void
  _ytextObserver: (event: Y.YTextEvent) => void

  constructor (
    monaco: any,
    ytext: Y.Text,
    monacoModel: any,
    editor: any,
    awareness: awarenessProtocol.Awareness,
    userId: number,
  ) {
    this.doc = ytext.doc as Y.Doc
    this.ytext = ytext
    this.monacoModel = monacoModel
    this.editor = editor
    this.mux = createMutex()
    this._savedSelections = new Map()
    this.color = userId % 8

    this._beforeTransaction = () => {
      this.mux(() => {
        this._savedSelections = new Map()
        if (editor.getModel() === monacoModel) {
          const rsel = createRelativeSelection(editor, monacoModel, ytext)
          if (rsel !== null) {
            this._savedSelections.set(editor, rsel)
          }
        }
      })
    }

    this.doc.on('beforeAllTransactions', this._beforeTransaction)

    this._decorations = new Map()

    this._rerenderDecorations = () => {
      if (awareness && editor.getModel() === monacoModel) {
        // render decorations
        const currentDecorations = this._decorations.get(editor) || []
        const newDecorations: any = []
        awareness.getStates().forEach((state, clientID) => {
          if (
            clientID !== this.doc.clientID &&
            state.selection != null &&
            state.selection.anchor != null &&
            state.selection.head != null
          ) {
            const anchorAbs = Y.createAbsolutePositionFromRelativePosition(
              state.selection.anchor,
              this.doc,
            )
            const headAbs = Y.createAbsolutePositionFromRelativePosition(
              state.selection.head,
              this.doc,
            )
            if (
              anchorAbs !== null &&
              headAbs !== null &&
              anchorAbs.type === ytext &&
              headAbs.type === ytext
            ) {
              let start, end, afterContentClassName, beforeContentClassName
              if (anchorAbs.index < headAbs.index) {
                start = monacoModel.getPositionAt(anchorAbs.index)
                end = monacoModel.getPositionAt(headAbs.index)
                afterContentClassName = `ySelectionHead yBorder-${this.color}`
                beforeContentClassName = null
              } else {
                start = monacoModel.getPositionAt(headAbs.index)
                end = monacoModel.getPositionAt(anchorAbs.index)
                afterContentClassName = null
                beforeContentClassName = `ySelectionHead yBorder-${this.color}`
              }
              newDecorations.push({
                range: new monaco.Range(
                  start.lineNumber,
                  start.column,
                  end.lineNumber,
                  end.column,
                ),
                options: {
                  className: `ySelection-${this.color}`,
                  afterContentClassName,
                  beforeContentClassName,
                },
              })
            }
          }
        })
        this._decorations.set(
          editor,
          editor.deltaDecorations(currentDecorations, newDecorations),
        )
      } else {
        // ignore decorations
        this._decorations.delete(editor)
      }
    }

    this._ytextObserver = event => {
      this.mux(() => {
        let index = 0
        event.delta.forEach(op => {
          if (op.retain !== undefined) {
            index += op.retain
          } else if (op.insert !== undefined) {
            const pos = monacoModel.getPositionAt(index)
            const range = new monaco.Selection(
              pos.lineNumber,
              pos.column,
              pos.lineNumber,
              pos.column,
            )
            monacoModel.applyEdits([{ range, text: op.insert as string }])
            index += (op.insert as any).length
          } else if (op.delete !== undefined) {
            const pos = monacoModel.getPositionAt(index)
            const endPos = monacoModel.getPositionAt(index + op.delete)
            const range = new monaco.Selection(
              pos.lineNumber,
              pos.column,
              endPos.lineNumber,
              endPos.column,
            )
            monacoModel.applyEdits([{ range, text: '' }])
          } else {
            throw error.unexpectedCase()
          }
        })
        this._savedSelections.forEach((rsel, editor) => {
          const sel = createMonacoSelectionFromRelativeSelection(
            monaco,
            editor,
            ytext,
            rsel,
            this.doc,
          )
          if (sel !== null) {
            editor.setSelection(sel)
          }
        })
      })
      this._rerenderDecorations()
    }

    ytext.observe(this._ytextObserver)
    monacoModel.setValue(ytext.toString())

    this._monacoChangeHandler = monacoModel.onDidChangeContent((event: any) => {
      // Apply changes from right to left
      this.mux(() => {
        this.doc.transact(() => {
          event.changes
            .sort(
              (change1: any, change2: any) =>
                change2.rangeOffset - change1.rangeOffset,
            )
            .forEach((change: any) => {
              ytext.delete(change.rangeOffset, change.rangeLength)
              ytext.insert(change.rangeOffset, change.text)
            })
        }, YDOC_UPDATE_ORIGIN_CURRENT_EDITOR)
      })
    })

    monacoModel.onWillDispose(() => {
      this.destroy()
    })

    if (awareness) {
      editor.onDidChangeCursorSelection(() => {
        if (editor.getModel() === monacoModel) {
          const sel = editor.getSelection()
          if (sel === null) {
            return
          }
          let anchor = monacoModel.getOffsetAt(sel.getStartPosition())
          let head = monacoModel.getOffsetAt(sel.getEndPosition())
          if (sel.getDirection() === monaco.SelectionDirection.RTL) {
            const tmp = anchor
            anchor = head
            head = tmp
          }
          awareness.setLocalStateField('selection', {
            anchor: Y.createRelativePositionFromTypeIndex(ytext, anchor),
            head: Y.createRelativePositionFromTypeIndex(ytext, head),
          })
        }
      })
      awareness.on('change', this._rerenderDecorations)
      this.awareness = awareness
    }
  }

  destroy (): void {
    this._monacoChangeHandler.dispose()
    this.ytext.unobserve(this._ytextObserver)
    this.doc.off('beforeAllTransactions', this._beforeTransaction)
    if (this.awareness) {
      this.awareness.off('change', this._rerenderDecorations)
    }
  }
}
