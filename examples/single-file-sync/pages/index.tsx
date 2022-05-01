import React, { useCallback, useRef } from 'react'
import useFileSync from '@yfs/react'
import Editor from 'components/Editor'
import Head from 'components/Head'
import Navbar from 'components/Navbar'
import Footer from 'components/Footer'
import Header from 'components/Header'
import { useInterval } from 'lib/use-interval'
import styles from '../styles/Shared.module.css'
import { YConfig } from 'lib/y-config'
import { TEST_FILE_NAME } from 'lib/constants'

export default function Home () {
  const config = useRef<YConfig | undefined>(undefined)
  const {
    isSupported,
    setRootDirectory,
    unsetRootDirectory,
    grantWritePermission,
    directoryName,
    isWritePermissionGranted,
    syncDoc
  } = useFileSync()

  const onEditorDidMount = useCallback((monaco: any, editor: any) => {
    config.current?.destroy()
    config.current = new YConfig(monaco, editor, Math.floor(Math.random() * 8))
  }, [])

  const sync = useCallback(() => {
    if (!config.current?.doc) {
      return
    }
    syncDoc(TEST_FILE_NAME, config.current.doc)
  }, [syncDoc])

  useInterval(sync, isWritePermissionGranted ? 10000 : null)

  return (
    <div className={styles.container}>
      <Head />
      <Navbar />
      <main className={styles.main}>
        <Header
          isFSAPISupported={isSupported}
          directoryName={directoryName}
          setRootDirectory={setRootDirectory}
        />
        <div className={styles.editorContainer}>
          <Editor onDidMount={onEditorDidMount} />
        </div>
        <Footer
          directoryName={directoryName}
          isWritePermissionGranted={isWritePermissionGranted}
          unsetRootDirectory={unsetRootDirectory}
          grantWritePermission={grantWritePermission}
        />
      </main>
    </div>
  )
}
