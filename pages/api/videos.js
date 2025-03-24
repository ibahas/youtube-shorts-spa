import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'http://localhost:3000/api/auth/callback');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const cookies = req.headers.cookie?.split(';').reduce((acc, c) => {
    const [key, val] = c.trim().split('=');
    acc[key] = val;
    return acc;
  }, {});
  if (!cookies.tokens) return res.status(401).json({ success: false, error: 'Not authenticated' });

  try {
    oauth2Client.setCredentials(JSON.parse(cookies.tokens));
    const youtube = google.youtube('v3');
    const response = await youtube.videos.list({
      auth: oauth2Client,
      part: 'snippet,statistics',
      mine: true,
      maxResults: 10,
    });
    res.status(200).json({ success: true, videos: response.data.items });
  } catch (error) {
    console.error('Fetch videos failed:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch videos: ' + error.message });
  }
}