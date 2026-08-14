import { TooltipProvider } from '@/components/ui/tooltip'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Toolbar } from '@/components/Toolbar'
import { DbmlEditor } from '@/components/DbmlEditor'
import { Canvas } from '@/components/Canvas'

function App() {
  return (
    <TooltipProvider>
      <div className="flex h-svh flex-col">
        <Toolbar />
        <ResizablePanelGroup orientation="horizontal" className="flex-1">
          <ResizablePanel defaultSize={35} minSize={20}>
            <DbmlEditor />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={65} minSize={30}>
            <Canvas />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  )
}

export default App
