// index.js - Electron main process
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const fs = require('fs');

// OAuth2 credentials setup
const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URL = 'http://localhost/oauth2callback';
const oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.on('closed', () => mainWindow = null);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Handle YouTube authentication
ipcMain.handle('youtube-auth', async () => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload']
  });
  
  // Open auth URL and get token
  mainWindow.loadURL(authUrl);
  
  return new Promise((resolve) => {
    app.on('open-url', (event, url) => {
      const code = new URL(url).searchParams.get('code');
      oauth2Client.getToken(code, (err, tokens) => {
        if (err) {
          console.error('Error getting OAuth tokens', err);
          resolve({ success: false, error: err });
          return;
        }
        
        oauth2Client.setCredentials(tokens);
        resolve({ success: true, channelInfo: 'Channel authenticated' });
      });
    });
  });
});

// Handle video upload to YouTube
ipcMain.handle('upload-video', async (event, { videoPath, title, description, tags }) => {
  const youtube = google.youtube('v3');
  
  try {
    const fileSize = fs.statSync(videoPath).size;
    let uploadedBytes = 0;
    
    const res = await youtube.videos.insert({
      auth: oauth2Client,
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title,
          description,
          tags,
          categoryId: '22' // People & Blogs category
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        body: fs.createReadStream(videoPath)
      }
    }, {
      onUploadProgress: (evt) => {
        uploadedBytes = evt.bytesRead;
        const progress = (uploadedBytes / fileSize) * 100;
        event.sender.send('upload-progress', progress);
      }
    });
    
    return { success: true, videoId: res.data.id };
  } catch (error) {
    console.error('Error uploading video:', error);
    return { success: false, error: error.message };
  }
});

// Handle video creation from images
ipcMain.handle('create-video', async (event, { images, title, duration }) => {
  // Here we would use ffmpeg to create a video from images
  // This is a simplified implementation
  
  const outputPath = path.join(app.getPath('temp'), `${Date.now()}.mp4`);
  
  // Simulate video creation with progress updates
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      event.sender.send('creation-progress', progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        resolve({ success: true, videoPath: outputPath });
      }
    }, 500);
  });
});

// Handle image search/generation
ipcMain.handle('search-images', async (event, { query }) => {
  // This would connect to an image search API or AI image generation API
  // Returning mock data for example
  return {
    success: true,
    images: [
      { id: 1, url: 'path/to/image1.jpg', thumbnail: 'path/to/thumbnail1.jpg' },
      { id: 2, url: 'path/to/image2.jpg', thumbnail: 'path/to/thumbnail2.jpg' },
      { id: 3, url: 'path/to/image3.jpg', thumbnail: 'path/to/thumbnail3.jpg' }
    ]
  };
});