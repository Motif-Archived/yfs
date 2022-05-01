import React from 'react'
import styles from './Footer.module.css'
import sharedStyles from '../../styles/Shared.module.css'

export default function Footer ({
  directoryName,
  isWritePermissionGranted,
  unsetRootDirectory,
  grantWritePermission,
}: {
  directoryName: string | undefined
  isWritePermissionGranted: boolean
  unsetRootDirectory: () => void
  grantWritePermission: () => void
}) {
  if (!directoryName) {
    return <></>
  }

  return (
    <div className={styles.syncFooter}>
      <div
        className={`${styles.dot} ${
          isWritePermissionGranted ? styles.dotBlue : styles.dotOrange
        }`}
      />
      {isWritePermissionGranted && (
        <>
          <p>
            Syncing with folder{' '}
            <span style={{ fontStyle: 'italic' }}>{directoryName}</span>.
          </p>
          <a className={sharedStyles.subtleLink} onClick={unsetRootDirectory}>
            Disconnect
          </a>
        </>
      )}
      {!isWritePermissionGranted && (
        <>
          <p>
            Syncing with folder{' '}
            <span style={{ fontStyle: 'italic' }}>{directoryName}</span> is
            paused.
          </p>
          <a className={sharedStyles.subtleLink} onClick={grantWritePermission}>
            Grant permissions
          </a>
        </>
      )}
    </div>
  )
}
