const quote = (string) => `'${string.replaceAll('\\', '\\\\').replaceAll('\'', '\\\'')}'`;
const join = (timeout) => timeout > 0 ? `join(${timeout / 1000})` : 'join()';
const write = (starts) => starts.length > 0 ? starts.map((args) => `start(${args.map(quote).join(', ')})`).join('\n        ').concat('\n\n        write()') : 'write()';

export const format = ({ port, IN, OUT, length, timeout, starts }) =>
`#!/usr/bin/env python3

from pathlib import Path
from subprocess import run
from sys import exit, stdin, stdout
from threading import Thread

import uno

class WindowClass:
    TOP = 0
    MODALTOP = 1
    CONTAINER = 2
    SIMPLE = 3

from com.sun.star.awt import Rectangle, WindowAttribute, WindowDescriptor
from com.sun.star.beans import PropertyValue
from com.sun.star.frame import FrameSearchFlag

URL = 'uno:socket,host=localhost,port=${port};urp;StarOffice.ServiceManager'

IN = ${quote(IN)}
OUT = ${quote(OUT)}

def read(keywords):
    for lines in stdin.readlines():
        line = lines.strip()

        if line not in keywords:
            keywords.append(line)

def getBookmark(keywords):
    return ', '.join(keywords)

def start(*args):
    run(args, capture_output=True)

def write():
    out = stdout
    if hasattr(out, 'buffer'):
        out = out.buffer

    with open(OUT, 'rb') as f:
        length = ${length.shift()}
        b = f.read(length)
        while len(b) > 0:
            out.write(b)
            b = f.read(length)

    stdout.flush()
    stdout.close()

def main(keywords, good):
    local_context = uno.getComponentContext()
    resolver = local_context.ServiceManager.createInstanceWithContext('com.sun.star.bridge.UnoUrlResolver', local_context)

    service_manager = resolver.resolve(URL)
    context = service_manager.DefaultContext
    desktop = service_manager.createInstanceWithContext('com.sun.star.frame.Desktop', context)

    a_descriptor = WindowDescriptor()
    a_descriptor.Type = WindowClass.TOP
    a_descriptor.WindowServiceName = 'window'
    a_descriptor.Parent = None
    a_descriptor.ParentIndex = -1
    a_descriptor.Bounds = Rectangle(0, 0, 0, 0)
    a_descriptor.WindowAttributes = (
        WindowAttribute.BORDER |
        WindowAttribute.CLOSEABLE |
        WindowAttribute.MOVEABLE |
        WindowAttribute.SIZEABLE
    )

    toolkit = service_manager.createInstanceWithContext('com.sun.star.awt.Toolkit', context)
    window = toolkit.createWindow(a_descriptor)
    frame = service_manager.createInstanceWithContext('com.sun.star.frame.Frame', context)
    frame.initialize(window)

    desktop.getFrames().append(frame)
    frame.setName('newly created 1')
    template_component = desktop.loadComponentFromURL(Path(IN).resolve().as_uri().replace('\\', '/'), 'newly created 1', FrameSearchFlag.CHILDREN, tuple())
    window.setVisible(0)

    named_bookmarks = template_component.getBookmarks()
    bookmark = named_bookmarks.getByName('Keywords')
    bookmark.getAnchor().setString(keywords)

    outURL = Path(OUT).resolve().as_uri().replace('\\', '/')
    property_value = (PropertyValue(), PropertyValue())
    property_value[0].Name = 'FilterName'
    property_value[0].Value = 'writer_pdf_Export'
    property_value[1].Name = 'URL'
    property_value[1].Value = outURL

    template_component.storeToURL(outURL, property_value)
    template_component.dispose()

    good(True)

if __name__ == '__main__':
    keywords = []
    read(keywords)

    good = []
    thread = Thread(target=main, args=(getBookmark(keywords), good.append), daemon=True)
    thread.start()
    thread.${join(timeout)}

    if good and not thread.is_alive():
        ${write(starts)}
        exit(0)
    else:
        exit(1)
`;

export const command = (cwd, searchprog, basename, join, file) =>
`export const COMMAND = '${searchprog('python3')}'
export const ARGS = ['${join(cwd, file)}']
export const OPTIONS = {
	cwd: '${cwd}',
}
`;
