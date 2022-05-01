import React, { useCallback } from 'react'
import MonacoEditor from '@monaco-editor/react'
import theme from './theme'
import options from './options'

export default function Editor ({
  onDidMount,
}: {
  onDidMount: (monaco: any, editor: any) => void
}) {
  const onEditorDidMount = useCallback(
    (editor: any, monaco: any) => {
      monaco.editor.defineTheme('custom', theme)
      monaco.editor.setTheme('custom')
      onDidMount(monaco, editor)
    },
    [onDidMount],
  )

  return (
    <MonacoEditor
      height="100%"
      defaultLanguage="markdown"
      defaultValue="# Welcome to Yfs"
      onMount={onEditorDidMount}
      loading={<></>}
      options={options}
    />
  )
}
