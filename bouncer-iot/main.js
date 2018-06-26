const electron = require('electron')
const http = require('http')
const EthCrypto = require('eth-crypto');
const {ipcMain} = require('electron')
var config= require('./config');

const BrowserWindow = electron.BrowserWindow
const app = electron.app


var accessService = require('./providers/accessService');


var myWeb3= require('./providers/myWeb3');
myWeb3.init(config.CONTRACT_ADDR,config.NODE_ADDR);

let mainWindow;
let appStatus;

function initApp() {
  initScanningService()
  createWindow()
}

function initScanningService() {
  ipcMain.on("scan-initiated", (event, arg) => {
    // we're receiving it in format "ethereum:0xED0...5F41e"
    let address = arg.split(":")[1];
    accessService
      .checkAccess(address)
      .then(data => {
        console.log("acess ok", data);
        if (data) {
          appStatus = {
            allowed: true,
            msg: "Allowed"
          };
          event.sender.send("asynchronous-reply", appStatus);
        } else {
          appStatus = {
            allowed: false,
            msg: "Denied"
          };
          event.sender.send("asynchronous-reply", appStatus);
        }
      })
      .catch(err => {
        console.log("access err", err);
        appStatus = {
          allowed: false,
          msg: "Denied"
        };
        event.sender.send("asynchronous-reply", appStatus);
      });
  });

  ipcMain.on('asynchronous-message', (event, arg) => {
    if (appStatus !== undefined) {
      console.log('responding message appStatus:',appStatus);
      event.sender.send('asynchronous-reply', appStatus)
      appStatus = undefined;
    }
  })
}


function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600})

  mainWindow.setFullScreen(true);
  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    mainWindow = null
  })

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
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
