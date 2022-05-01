import { set as idbSet, get as idbGet } from 'idb-keyval'
import { STORE_KEY_CACHED_FS_FILE } from './constants'

type LastWriteCacheData = {
  name: string
  content: string
  lastModified: number
}

const getLastWriteCacheKey = (name: string) => {
  return `${STORE_KEY_CACHED_FS_FILE}-${name}`
}

export const setLastWriteCacheData = async (
  name: string,
  content: string,
  lastModified: number
) => {
  await idbSet(
    getLastWriteCacheKey(name),
    JSON.stringify({
      name,
      content,
      lastModified
    })
  )
}

export const getLastWriteCacheData = async (
  name: string
): Promise<LastWriteCacheData | undefined> => {
  const jsonFile = await idbGet(getLastWriteCacheKey(name))
  if (jsonFile) {
    return JSON.parse(jsonFile)
  }
  return undefined
}
