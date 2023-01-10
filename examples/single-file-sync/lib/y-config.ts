import * as Y from 'yjs'
import * as awarenessProtocol from 'y-protocols/awareness.js'
import { WebrtcProvider } from 'y-webrtc'
import { IndexeddbPersistence } from 'y-indexeddb'
import * as mutex from 'lib0/mutex.js'
import { MonacoBinding } from './y-monaco'
import { ROOM_ID, WEBRTC_SIGNALING_SERVERS } from './constants'

export const YDOC_UPDATE_ORIGIN_CURRENT_EDITOR =
  'YDOC_UPDATE_ORIGIN_CURRENT_EDITOR'
export const YDOC_UPDATE_ORIGIN_PROGRAMMATIC = 'YDOC_UPDATE_ORIGIN_PROGRAMMATIC'

export class YConfig {
  roomId: string
  monaco: any
  model: any
  editor: any
  userId: number
  doc: Y.Doc | undefined
  initialEncodedYDoc: string | undefined
  awareness: awarenessProtocol.Awareness | undefined
  webRTCProvider: WebrtcProvider | undefined
  indexedDBPersistence: IndexeddbPersistence | undefined
  monacoBinding: MonacoBinding | undefined
  mux: mutex.mutex
  updateTimeoutId: ReturnType<typeof setTimeout> | null

  constructor (
    monaco: any,
    editor: any,
    userId: number
  ) {
    this.roomId = ROOM_ID
    // this.onNonProgrammaticDocUpdateImmediate = onNonProgrammaticDocUpdateImmediate
    // this.onLocalEditorUpdateDebounced = onLocalEditorUpdateDebounced
    this.monaco = monaco
    this.editor = editor
    this.model = editor.getModel()
    this.userId = userId
    this.mux = mutex.createMutex()
    this.updateTimeoutId = null
    this.initYDoc()
  }

  initYDoc (): void {
    this.doc = new Y.Doc()

    this.awareness = new awarenessProtocol.Awareness(this.doc)

    this.webRTCProvider = new WebrtcProvider(this.roomId, this.doc, {
      signaling: WEBRTC_SIGNALING_SERVERS,
      password: null,
      awareness: this.awareness,
      maxConns: 50 + Math.floor(Math.random() * 15),
      filterBcConns: true,
      peerOpts: {}
    })

    this.monacoBinding = new MonacoBinding(
      this.monaco,
      this.doc.getText(),
      this.model,
      this.editor,
      this.awareness,
      this.userId
    )

    this.indexedDBPersistence = new IndexeddbPersistence(
      'y-indexeddb',
      this.doc
    )

    if (!this.webRTCProvider.connected) {
      this.webRTCProvider.connect()
    }
  }

  destroy (): void {
    this.awareness?.destroy()
    this.monacoBinding?.destroy()
    this.webRTCProvider?.disconnect()
    this.webRTCProvider?.destroy()
    this.doc?.destroy()
  }
}
