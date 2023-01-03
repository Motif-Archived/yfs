# YFS

Synchronize text files between the browser and the file system using the
[File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
and [Yjs](https://yjs.dev/).


Blog post explaining the underlying concepts: [Syncing text files between browser and disk using Yjs and the File System Access API](https://motif.land/blog/syncing-text-files-using-yjs-and-the-file-system-access-api).

<br />
<p align="center">
  <a aria-label="NPM version" href="https://www.npmjs.com/package/@yfs/react">
    <img alt="" src="https://badgen.net/npm/v/@yfs/react">
  </a>
  <a aria-label="License" href="https://github.com/motifland/yfs/blob/main/LICENSE">
    <img alt="" src="https://badgen.net/npm/license/@yfs/react">
  </a>
</p>

## Installation

To get started, install the `@yfs/react` package via npm or yarn:

```shell
# npm
npm install @yfs/react

# Yarn
yarn add @yfs/react
```

## Usage

Example:

<!-- prettier-ignore -->
```jsx
import React, { useState } from 'react'
import * as Y from 'yjs'
import useYFS from '@yfs/react'

function Editor () {
  const { setRootDirectory, directoryName, syncDoc } = useYFS()
  const [doc] = useState<Y.Doc>(new Y.Doc())

  return (
    <div>
      <button
        onClick={() => {
          if (!directoryName) {
            setRootDirectory(true)
          } else {
            syncDoc('my-file.md', doc)
          }
        }}
      >
        Sync
      </button>
      {/* Editor code... */}
    </div>
  )
}
```

## Authors

This library is created by the team behind [Motif](https://motif.land)
([@motifland](https://twitter.com/motifland)).

- Michael Fester ([@michaelfester](https://twitter.com/michaelfester))

It is based on the great work by [Kevin Jahns](https://twitter.com/kevin_jahns)
on [Yjs](https://yjs.dev/).

## License

MIT
