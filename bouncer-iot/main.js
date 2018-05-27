const electron = require('electron')
const http = require('http')
const EthCrypto = require('eth-crypto');
const {ipcMain} = require('electron')

const BrowserWindow = electron.BrowserWindow
const app = electron.app

var express = require('express');
var bodyParser = require("body-parser");
var expressApp = express();
expressApp.use(bodyParser.urlencoded({ extended: false }));
expressApp.use(bodyParser.json());

let mainWindow

function initApp() {
  initHttpApp()
  createWindow()
}

function initHttpApp() {
  let appStatus

  expressApp.post('/', function (req, res) {
    let signature = req.body.signature
    let address = req.body.address
    let message = req.body.message

    const signer = EthCrypto.recover(
      signature,
      EthCrypto.hash.keccak256(message)
    );

    if (signer == address) {
      // validated signature matched
      // ask smart contract for access permissions
      console.log("Signature validated!")
      appStatus = {
        allowed: true,
        msg: 'Allowed'
      }
    } else {
      // signature validation failed
      appStatus = {
        allowed: false,
        msg: 'Signature validation failed'
      }
    }
    res.send('Ok');
  });

  expressApp.listen(8888, function () {
    console.log('Example app listening on port 8888!');
  });

  ipcMain.on('asynchronous-message', (event, arg) => {
    if (appStatus !== undefined) {
      event.sender.send('asynchronous-reply', appStatus)
    }
  })
}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    mainWindow = null
  })

  // Open the DevTools.
  mainWindow.webContents.openDevTools()
}

app.on('ready', initApp)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
