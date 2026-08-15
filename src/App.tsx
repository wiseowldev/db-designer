import { useEffect } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Toolbar } from '@/components/Toolbar'
import { DbmlEditor } from '@/components/DbmlEditor'
import { Canvas } from '@/components/Canvas'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useSchemaStore } from '@/store/schemaStore'
import { exportCurrentSchema } from '@/lib/exportSchema'

function App() {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey
      if (!mod) return

      if (event.key.toLowerCase() === 's') {
        event.preventDefault()
        void exportCurrentSchema()
        return
      }

      // The DBML editor has its own character-level undo/redo (CodeMirror's
      // default keymap) — defer to it while focus is there instead of also
      // firing the schema-level undo for the same keypress.
      const target = event.target as HTMLElement | null
      if (target?.closest('.cm-editor')) return

      if (event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) useSchemaStore.temporal.getState().redo()
        else useSchemaStore.temporal.getState().undo()
      } else if (event.key.toLowerCase() === 'y') {
        event.preventDefault()
        useSchemaStore.temporal.getState().redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <TooltipProvider>
      <div className="flex h-svh flex-col">
        <Toolbar />
        <ResizablePanelGroup orientation="horizontal" className="flex-1">
          <ResizablePanel defaultSize={35} minSize={20}>
            <ErrorBoundary label="DBML editor">
              <DbmlEditor />
            </ErrorBoundary>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={65} minSize={30}>
            <ErrorBoundary label="Diagram">
              <Canvas />
            </ErrorBoundary>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  )
}

export default App
