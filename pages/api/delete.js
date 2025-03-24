import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'http://localhost:3000/api/auth/callback');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ success: false, error: 'Video ID required' });

  const cookies = req.headers.cookie?.split(';').reduce((acc, c) => {
    const [key, val] = c.trim().split('=');
    acc[key] = val;
    return acc;
  }, {});
  if (!cookies.tokens) return res.status(401).json({ success: false, error: 'Not authenticated' });

  try {
    oauth2Client.setCredentials(JSON.parse(cookies.tokens));
    const youtube = google.youtube('v3');
    await youtube.videos.delete({
      auth: oauth2Client,
      id: videoId,
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete video failed:', error);
    res.status(500).json({ success: false, error: 'Failed to delete video: ' + error.message });
  }
}