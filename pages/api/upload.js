import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'http://localhost:3000/api/auth/callback');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const { videoUrl, title } = req.body;
  if (!videoUrl || !title) return res.status(400).json({ success: false, error: 'Video URL and title required' });

  const cookies = req.headers.cookie?.split(';').reduce((acc, c) => {
    const [key, val] = c.trim().split('=');
    acc[key] = val;
    return acc;
  }, {});
  if (!cookies.tokens) return res.status(401).json({ success: false, error: 'Not authenticated' });

  try {
    oauth2Client.setCredentials(JSON.parse(cookies.tokens));
    const youtube = google.youtube('v3');
    const videoPath = path.join(process.cwd(), 'public', videoUrl.slice(1));
    if (!fs.existsSync(videoPath)) return res.status(400).json({ success: false, error: 'Video file not found' });

    const response = await youtube.videos.insert({
      auth: oauth2Client,
      part: 'snippet,status',
      requestBody: {
        snippet: { title, categoryId: '22' },
        status: { privacyStatus: 'public' },
      },
      media: { body: fs.createReadStream(videoPath) },
    });
    fs.unlinkSync(videoPath); // Clean up after upload
    res.status(200).json({ success: true, videoId: response.data.id });
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({ success: false, error: 'Failed to upload video: ' + error.message });
  }
}