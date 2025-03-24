import axios from 'axios';
import path from 'path';
import fs from 'fs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const { query } = req.body;
  if (!query || typeof query !== 'string') return res.status(400).json({ success: false, error: 'Valid search query required' });

  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, per_page: 5, orientation: 'portrait' },
      headers: { Authorization: `Client-ID ${process.env.NEXT_PUBLIC_UNSPLASH_API_KEY}` },
    });
    const images = await Promise.all(
      response.data.results.map(async (result, i) => {
        const { data } = await axios.get(result.urls.full, { responseType: 'arraybuffer' });
        const filePath = path.join(process.cwd(), 'public', `temp-${i}.jpg`);
        fs.writeFileSync(filePath, Buffer.from(data));
        return { path: `/temp-${i}.jpg` };
      })
    );
    res.status(200).json({ success: true, images });
  } catch (error) {
    console.error('Search failed:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch images: ' + error.message });
  }
}