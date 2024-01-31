import { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'

export default function TerminalWindow () {
  useEffect(() => {
    const terminal = new Terminal()

    terminal.open(document.getElementById('terminal'))
    terminal.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ')
  }, [])
  return <div id='terminal' className='bg-black' />
}
