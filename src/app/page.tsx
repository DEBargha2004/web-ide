'use client'

import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '@/components/ui/resizable'
import { Editor } from '@monaco-editor/react'
import { Play } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cloneDeep } from 'lodash'
import { cn } from '@/lib/utils'

type codeObject = { id: string; value: string }

export default function Home () {
  const [code, setCode] = useState<codeObject[]>([
    { id: 'html', value: '' },
    { id: 'css', value: '' },
    { id: 'javascript', value: '' }
  ])
  const [selectedType, setSelectedType] = useState('html')
  const [logs, setLogs] = useState<string[]>([])
  const [srcDoc, setSrcDoc] = useState('')
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const consoleRef = useRef<HTMLDivElement | null>(null)

  const run = useCallback((code: codeObject[]) => {
    const js = code.find(c => c.id === 'javascript')
    const css = code.find(c => c.id === 'css')
    const html = code.find(c => c.id === 'html')
    const srcCode = `<html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Document</title>
            <style>${css?.value}</style>
          </head>
          <body>
            ${html?.value}
            <script>
              console.originalLog = console.log
              console.originalError = console.error
              console.log = (...args) => {
                args = args.map(arg => JSON.stringify(arg))
                window.parent.postMessage({ type: 'console', data: args }, '*')
              }
              console.error = (...args) => {
                window.parent.postMessage({ type: 'console_error', data: args }, '*')
              } 
              try { ${js?.value} } catch (e) { console.log('error');console.error(e) }
            </script>
          </body>
        </html>`

    setSrcDoc(srcCode)
  }, [])

  useEffect(() => {
    function setToConsole (value: string[]) {
      value = value.map(v => `${v}`)
      setLogs(initial_logs => [...initial_logs, ...value])
    }
    function getConsoleValue (e: MessageEvent) {
      switch (e.data.type) {
        case 'console':
          setToConsole(e.data.data)
          break

        case 'console_error':
          setToConsole(e.data.data)
          break
        default:
          break
      }
    }
    window.addEventListener('message', getConsoleValue)

    return () => {
      window.removeEventListener('message', getConsoleValue)
    }
  }, [])

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [logs])

  const selectedCode = useMemo(() => {
    return code.find(c => c.id === selectedType)
  }, [selectedType, code])

  return (
    <div>
      <div className='h-[60px] flex items-center justify-center'>
        <Button onClick={() => run(code)}>
          <Play />
          Run
        </Button>
      </div>
      <ResizablePanelGroup
        direction='horizontal'
        className='grid grid-cols-2 h-[calc(100%-60px)]'
      >
        <ResizablePanel defaultSize={20} maxSize={60} minSize={10}>
          <div className={cn(`h-full w-full flex flex-col pl-2 truncate`)}>
            {code.map(c => (
              <div
                key={c.id}
                className={cn(
                  'cursor-pointer hover:bg-slate-200',
                  selectedType === c.id && 'bg-slate-200'
                )}
                onClick={() => setSelectedType(c.id)}
              >
                {c.id}
              </div>
            ))}
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={100}>
          <Editor
            value={selectedCode?.value}
            onChange={e =>
              setCode(c => {
                c = cloneDeep(c)
                const selected_code = c.find(c => c.id === selectedType)
                //@ts-ignore
                selected_code.value = e || ''
                return c
              })
            }
            theme='vs-dark'
            language={selectedType}
            height={window.innerHeight - 60}
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50}>
          <ResizablePanelGroup
            direction='vertical'
            className='grid grid-rows-2'
          >
            <ResizablePanel>
              <iframe
                ref={iframeRef}
                srcDoc={srcDoc}
                // sandbox='allow-scripts'
                width='100%'
                height='100%'
              />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel>
              <div
                className='h-full overflow-y-auto py-1 bg-stone-800'
                ref={consoleRef}
              >
                {logs.map((l, i) => (
                  <div
                    key={i}
                    className='font-semibold text-sm text-white p-[2px] '
                  >
                    <p className=' border-stone-600 border-b mx-3'>
                      <p className='rounded hover:bg-stone-900 p-1'>{l}</p>
                    </p>
                  </div>
                ))}
              </div>
            </ResizablePanel>
            <ResizableHandle />
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
