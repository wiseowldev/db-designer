const DBML_FILE_TYPES: FilePickerAcceptType[] = [
  { description: 'DBML', accept: { 'text/plain': ['.dbml'] } },
]

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

function downloadFallback(text: string, suggestedName: string) {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = suggestedName
  a.click()
  URL.revokeObjectURL(url)
}

// Saved DBML is plain, portable DBML — no table/field position metadata is embedded,
// so it opens cleanly in other DBML tools too. Positions instead live in this app's
// localStorage autosave (see store persistence); re-importing a .dbml file elsewhere
// authored (or after clearing local storage) re-lays-out tables in a grid.
export async function saveDbmlToFile(dbmlText: string, suggestedName = 'schema.dbml') {
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({ suggestedName, types: DBML_FILE_TYPES })
      const writable = await handle.createWritable()
      await writable.write(dbmlText)
      await writable.close()
      return
    } catch (err) {
      if (isAbort(err)) return
      // Fall through to the download fallback on any other failure (e.g. permission denied).
    }
  }
  downloadFallback(dbmlText, suggestedName)
}

export async function openDbmlFile(): Promise<string | null> {
  if ('showOpenFilePicker' in window) {
    try {
      const [handle] = await window.showOpenFilePicker({ types: DBML_FILE_TYPES })
      const file = await handle.getFile()
      return await file.text()
    } catch (err) {
      if (isAbort(err)) return null
      // Fall through to the <input type="file"> fallback on any other failure.
    }
  }

  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.dbml,text/plain'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      file.text().then(resolve)
    }
    input.click()
  })
}
