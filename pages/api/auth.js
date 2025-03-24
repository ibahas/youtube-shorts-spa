import { google } from 'googleapis';

const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URL = 'http://localhost:3000/api/auth/callback';
const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'http://localhost:3000/api/auth/callback');

export default function handler(req, res) {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/youtube.upload'],
    });
    res.redirect(authUrl);
  } catch (error) {
    console.error('Auth URL generation failed:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate authentication' });
  }
}