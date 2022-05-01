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
  // onNonProgrammaticDocUpdateImmediate: (encodedYDoc: string) => void
  // onLocalEditorUpdateDebounced: (encodedYDoc: string) => void

  constructor (
    monaco: any,
    editor: any,
    userId: number
    // onNonProgrammaticDocUpdateImmediate: (encodedYDoc: string) => void,
    // onLocalEditorUpdateDebounced: (encodedYDoc: string) => void,
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

    // this.doc.on('update', (_update: Uint8Array, origin: string) => {
    //   if (!this.doc) {
    //     return
    //   }

    //   if (origin !== YDOC_UPDATE_ORIGIN_PROGRAMMATIC) {
    //     // Important: ignore updates from notifyRemoteYDocUpdate. E.g.
    //     // when changing a template, this will update the yDoc associated
    //     // with the motif.json file, if it's loaded. But this update should
    //     // not trigger the onContentUpdate as this will tell the editor
    //     // that there is new content, even when it's not the active
    //     // file, causing an invalid state, where editor content is not
    //     // the same as content that is trying to be updated.
    //     this.onNonProgrammaticDocUpdateImmediate(this.doc.getText().toString())
    //   }

    //   if (origin === YDOC_UPDATE_ORIGIN_CURRENT_EDITOR) {
    //     this.mux(() => {
    //       this.clearTimeout()
    //       this.updateTimeoutId = setTimeout(async () => {
    //         if (!this.doc) {
    //           return
    //         }
    //         this.onLocalEditorUpdateDebounced(
    //           fromUint8Array(Y.encodeStateAsUpdate(this.doc)),
    //         )
    //         this.updateTimeoutId = null
    //       }, 600)
    //     })
    //   }
    // })

    if (!this.webRTCProvider.connected) {
      this.webRTCProvider.connect()
    }
  }

  // notifyRemoteYDocUpdate (
  //   newEncodedYDoc: string,
  //   triggerYDocUpdateCallback: boolean,
  // ): void {
  //   // This function is called in two cases: when another doc gets
  //   // programmatically updated (such as motif.json upon template change),
  //   // or when a yDoc is open/initiated in a yConfig, and a remote server
  //   // update comes in (flow: client 1 makes a change, and disconnects. Later,
  //   // client 2 connects and opens the file, loads local version, while
  //   // Replicache is updating in the background – so changes cannot come
  //   // from Yjs real time syncs).
  //   if (
  //     newEncodedYDoc === this.initialEncodedYDoc ||
  //     (this.doc &&
  //       newEncodedYDoc === fromUint8Array(Y.encodeStateAsUpdate(this.doc)))
  //   ) {
  //     return
  //   } else {
  //     if (this.doc) {
  //       // IMPORTANT: Unless explicitly asking for the contrary,
  //       // set origin to 'YDOC_UPDATE_ORIGIN_PROGRAMMATIC'
  //       // to ensure that a local update to the current editor
  //       // (via onContentUpdate) is not called.
  //       //
  //       // Currently, triggerYDocUpdate is only set to true for
  //       // the demos with automatically entered text. This is safe
  //       // since it's always only the currently open file that
  //       // sends these updates.
  //       //
  //       // The currently open file will trigger this update every time
  //       // it changes (while we figure out a way to tell Replicache to
  //       // distinguish between local and remote updates), so it's
  //       // important that we use applyUpdate and not something else that
  //       // might reset the doc/editor state.
  //       Y.applyUpdate(
  //         this.doc,
  //         toUint8Array(newEncodedYDoc),
  //         triggerYDocUpdateCallback
  //           ? YDOC_UPDATE_ORIGIN_CURRENT_EDITOR
  //           : YDOC_UPDATE_ORIGIN_PROGRAMMATIC,
  //       )
  //     }
  //   }
  // }

  // clearDoc (): void {
  //   if (!this.doc) {
  //     return
  //   }
  //   const text = this.doc.getText()
  //   const oldContent = text.toString()
  //   text.delete(0, oldContent.length)
  // }

  // clearTimeout (): void {
  //   if (this.updateTimeoutId !== null) {
  //     clearTimeout(this.updateTimeoutId)
  //   }
  // }

  destroy (): void {
    // this.clearTimeout()
    this.awareness?.destroy()
    this.monacoBinding?.destroy()
    this.webRTCProvider?.disconnect()
    this.webRTCProvider?.destroy()
    this.doc?.destroy()
  }
}
