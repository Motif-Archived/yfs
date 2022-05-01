export type HandleWithPath = {
  handle: FileSystemHandle
  path: string[]
  type: 'file' | 'directory'
}

const readWriteOptions = { mode: 'readwrite' }

export const isReadWritePermissionGranted = async (
  handle: FileSystemFileHandle | FileSystemDirectoryHandle
) => {
  return (await (handle as any).queryPermission(readWriteOptions)) === 'granted'
}

export const askReadWritePermissionsIfNeeded = async (
  handle: FileSystemFileHandle | FileSystemDirectoryHandle
) => {
  if (await isReadWritePermissionGranted(handle)) {
    return true
  }

  const permission = await (handle as any).requestPermission(readWriteOptions)
  return permission === 'granted'
}

const createEmptyFileInFolder = async (
  parentDirectoryHandle: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemFileHandle> => {
  return await parentDirectoryHandle.getFileHandle(name, { create: true })
}

export const createFolderInFolder = async (
  parentDirectoryHandle: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemDirectoryHandle> => {
  return await parentDirectoryHandle.getDirectoryHandle(name, { create: true })
}

const writeContentToFile = async (
  fileHandle: FileSystemFileHandle,
  content: string
) => {
  const writable = await (fileHandle as any).createWritable()
  await writable.write(content)
  await writable.close()
}

export const writeContentToFileIfChanged = async (
  fsFile: globalThis.File,
  fileHandle: FileSystemFileHandle,
  content: string
) => {
  const fsFileContent = await fsFile.text()
  if (fsFileContent === content) {
    return
  }
  await writeContentToFile(fileHandle, content)
}

export const renameFile = async (
  fsFile: globalThis.File,
  parentDirectoryHandle: FileSystemDirectoryHandle,
  name: string
) => {
  // Move and rename is not currently supported by the FileSystem
  // Access API so we need to do this they manual way by creating
  // a new file and deleting the old one.
  const content = await fsFile.text()
  await createFile(parentDirectoryHandle, name, content)
  await deleteFile(parentDirectoryHandle, fsFile.name)
}

export const moveFile = async (
  fsFile: globalThis.File,
  sourceDirectoryHandle: FileSystemDirectoryHandle,
  destinationDirectoryHandle: FileSystemDirectoryHandle
) => {
  // Same comment as renameFile
  const content = await fsFile.text()
  await createFile(destinationDirectoryHandle, fsFile.name, content)
  await deleteFile(sourceDirectoryHandle, fsFile.name)
}

export const moveFolderContent = async (
  sourceFolderHandle: FileSystemDirectoryHandle,
  destinationFolderHandle: FileSystemDirectoryHandle
) => {
  for await (const handle of (sourceFolderHandle as any).values()) {
    if (handle.kind === 'file') {
      const fsFile = await (handle as FileSystemFileHandle).getFile()
      await moveFile(fsFile, sourceFolderHandle, destinationFolderHandle)
    } else if (handle.kind === 'directory') {
      await moveFolder(handle, sourceFolderHandle, destinationFolderHandle)
    }
  }
}

export const moveFolder = async (
  folderHandle: FileSystemDirectoryHandle,
  parentDirectoryHandle: FileSystemDirectoryHandle,
  destinationFolderHandle: FileSystemDirectoryHandle
) => {
  const newFolderHandle = await createFolderInFolder(
    destinationFolderHandle,
    folderHandle.name
  )
  await moveFolderContent(folderHandle, newFolderHandle)
  await deleteFolder(folderHandle.name, parentDirectoryHandle)
}

export const renameFolder = async (
  folderHandle: FileSystemDirectoryHandle,
  parentDirectoryHandle: FileSystemDirectoryHandle,
  newName: string
) => {
  const newFolderHandle = await createFolderInFolder(
    parentDirectoryHandle,
    newName
  )
  try {
    await moveFolderContent(folderHandle, newFolderHandle)
    await deleteFolder(folderHandle.name, parentDirectoryHandle)
  } catch {
    // Do nothing
  }
}

export const createFile = async (
  parentDirectoryHandle: FileSystemDirectoryHandle,
  name: string,
  content: string
): Promise<FileSystemFileHandle> => {
  const newFileHandle = await createEmptyFileInFolder(
    parentDirectoryHandle,
    name
  )
  await writeContentToFile(newFileHandle, content)
  return newFileHandle
}

export const deleteFile = async (
  parentDirectoryHandle: FileSystemDirectoryHandle,
  name: string
) => {
  await parentDirectoryHandle.removeEntry(name)
}

export const deleteFolder = async (
  name: string,
  parentDirectoryHandle: FileSystemDirectoryHandle
) => {
  await parentDirectoryHandle.removeEntry(name, {
    recursive: true
  })
}

export const getFSFileHandle = async (
  name: string,
  directoryHandle: FileSystemDirectoryHandle
): Promise<FileSystemFileHandle | undefined> => {
  for await (const handle of (directoryHandle as any).values()) {
    const relativePath = (await directoryHandle.resolve(handle)) || []
    if (relativePath?.length === 1 && relativePath[0] === name) {
      return handle
    }
  }
  return undefined
}

export const isHandlesEqual = async (
  handle: FileSystemHandle | undefined,
  otherHandle: FileSystemHandle | undefined
) => {
  if (!handle && !otherHandle) {
    return true
  }

  if (handle && otherHandle) {
    return await (handle as any)?.isSameEntry(otherHandle)
  }

  return false
}

export const isIgnoredPath = (path: string[]): boolean => {
  // Return true if the file at the given path should be ignored for
  // syncing. This is the case currently if the path contains a component
  // that starts with a period, e.g. ".git" or ".DS_Store".
  return !!path.find(p => p.startsWith('.') || p.endsWith('.crswap'))
}

export const isTextMimeType = (file: globalThis.File) => {
  // Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
  return file.type.startsWith('text/') || !file.type
}
