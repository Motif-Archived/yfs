import React from 'react'
import NextHead from 'next/head'

export default function Head () {
  return (
    <NextHead>
      <title>File Sync Demo</title>
      <meta
        name='description'
        content='Synchronize text files between the browser and the file system'
      />
      <link rel='icon' href='/favicon.ico' />
    </NextHead>
  )
}
