import React from 'react'
import styles from './Header.module.css'

export default function Header ({
  isFSAPISupported,
  directoryName,
  setRootDirectory,
}: {
  isFSAPISupported: boolean
  directoryName: string | undefined
  setRootDirectory: (writable: boolean) => void
}) {
  return (
    <div style={{ position: 'absolute', top: -60 }}>
      {isFSAPISupported && !directoryName && (
        <button
          className={styles.cta}
          onClick={() => {
            setRootDirectory(true)
          }}
        >
          Select folder
        </button>
      )}
      {!isFSAPISupported && (
        <p className={styles.warning}>
          The File System Access API is currently not supported in this browser.
        </p>
      )}
    </div>
  )
}
