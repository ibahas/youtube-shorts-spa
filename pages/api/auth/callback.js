import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'http://localhost:3000/api/auth/callback');

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ success: false, error: 'No authorization code provided' });

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.setHeader('Set-Cookie', `tokens=${JSON.stringify(tokens)}; Path=/; HttpOnly`);
    res.redirect('/');
  } catch (error) {
    console.error('Token retrieval failed:', error);
    res.status(500).json({ success: false, error: 'Authentication failed: ' + error.message });
  }
}