import React from 'react'
import GitHub from 'components/Editor/GitHub'
import styles from './Navbar.module.css'
import sharedStyles from '../../styles/Shared.module.css'

export default function Navbar () {
  return (
    <nav className={styles.nav}>
      <div>
        <h1>File Sync Demo</h1>
        <p>
          Using the{' '}
          <a
            className={sharedStyles.subtleLink}
            href='https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API'
            target='_blank'
            rel='noreferrer'
          >
            File System Access API
          </a>{' '}
          +{' '}
          <a
            className={sharedStyles.subtleLink}
            href='https://yjs.dev/'
            target='_blank'
            rel='noreferrer'
          >
            Yjs
          </a>
        </p>
      </div>
      <div>
        <a
          href='https://motif.land/blog/syncing-text-files-using-yjs-and-the-file-system-access-api'
          target='_blank'
          rel='noreferrer'
        >
          Read blog post ↗
        </a>
        <a
          href='https://github.com/motifland/yfs'
          target='_blank'
          rel='noreferrer'
        >
          <GitHub />
        </a>
      </div>
    </nav>
  )
}
