import * as path from 'path'
import * as fs from 'fs'
import { inspect } from 'util'

import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import * as protobufjs from 'protobufjs'

import Electron, { app, BrowserWindow, ipcMain } from 'electron'
import log, { info } from 'electron-log'

declare const MAIN_WINDOW_WEBPACK_ENTRY: string
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string

const isDevelopment = process.env.NODE_ENV !== 'production'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup') === undefined) { // eslint-disable-line global-require
  app.quit()
}

// TODO: https://stackoverflow.com/questions/52236641/electron-ipc-and-nodeintegration
const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    minHeight: 800,
    minWidth: 1200,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY
    }
  })

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)
    .then(w => {
      // Open the DevTools.
      if (isDevelopment) {
        mainWindow.webContents.openDevTools()
      }
    })
    .catch(console.error)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Absolute path for configs on windows-> /AppData/Roaming/omniconfig
const CONFIG_DIR = isDevelopment ? path.join(__dirname, '../../config') : path.join(app.getPath('appData'), 'omniconfig')
const config = JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, 'config.json'), 'utf-8'))
config.left.config = JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, config.left.configPath), 'utf-8'))
config.right.config = JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, config.right.configPath), 'utf-8'))

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
const PROTO_DIR = isDevelopment ? path.join(__dirname, '../../protos') : path.join(__dirname, '../../../protos')
const PROTO_FILES = ['bridge.proto', 'device.proto', 'platform/summit.proto'].map(f => path.join(PROTO_DIR, f))

// TODO: Configure to make enums strings
const packageDefinition = protoLoader.loadSync(PROTO_FILES, { includeDirs: [PROTO_DIR] })
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition).openmind
const protobuf = protobufjs.loadSync(PROTO_FILES)

const bridgeClient = new (protoDescriptor as any).BridgeManagerService(config.serverAddress, grpc.credentials.createInsecure())
const deviceClient = new (protoDescriptor as any).DeviceManagerService(config.serverAddress, grpc.credentials.createInsecure())

const parseAny = (message: any) => {
  if (message === undefined || message === null) { return undefined }
  if (message.type_url === undefined || message.value === undefined) { throw new Error('No type found') }

  const [_, typeUrl] = message.type_url.split('/')
  const protobufType = protobuf.lookupType(typeUrl)

  // TODO: Make this recursively parse enums (do I even need that?)
  return protobufType.decode(message.value)
}

ipcMain.handle('get-bridges', (event, request: any) => {
  const logScope = log.scope('get-bridges')
  logScope.info('recieved get-bridges')
  logScope.info(`request ${inspect(request)}`)
  const leftBridge = config.left.name.split("/device")[0]
  const leftSampleRate = config.left.config.Sense.TDSampleRate
  const rightBridge = config.right.name.split("/device")[0]
  const rightSampleRate = config.right.config.Sense.TDSampleRate
  return {left: leftBridge, leftSampleRate: leftSampleRate, right: rightBridge, rightSampleRate: rightSampleRate}
})


ipcMain.on('stream-timedomains', async (event, request) => {
  const logScope = log.scope('stream-timedomains')
  logScope.info('recieved steam-timedomains')
  logScope.info(`request ${inspect(request)}`)
  console.log(request)
  const call = deviceClient.TimeDomainStream({name: request.name, enableStream: request.enableStream})
  console.log('stream')
  call.on('data', (resp: any) => {
    logScope.info(' received data')
    logScope.info(`stream data ${inspect(resp)}`)
    event.reply('stream-update', resp)
  })

  call.on('status', (status: any) => {
    logScope.info(`status ${inspect(status)}`)
  })

  call.on('end', () => {
    logScope.info('received end')
    call.removeAllListeners('data')
  })

  call.on('error', (err: Error) => {
    // TODO (BNR): How do we handle errors at this level?
    logScope.error(`error: ${err}`)
    call.removeAllListeners('data')
    
  })
})
