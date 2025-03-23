import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

ffmpeg.setFfmpegPath(ffmpegPath);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const { images, title, duration } = req.body;
  if (!Array.isArray(images) || images.length === 0) return res.status(400).json({ success: false, error: 'At least one image required' });
  if (!title || typeof title !== 'string') return res.status(400).json({ success: false, error: 'Valid title required' });
  if (!duration || typeof duration !== 'number') return res.status(400).json({ success: false, error: 'Valid duration required' });

  const outputPath = path.join(process.cwd(), 'public', `${title}-${Date.now()}.mp4`);

  try {
    await new Promise((resolve, reject) => {
      const command = ffmpeg();
      images.forEach(img => {
        const imgPath = path.join(process.cwd(), 'public', img.path);
        if (!fs.existsSync(imgPath)) return reject(new Error(`Image not found: ${img.path}`));
        command.input(imgPath).duration(duration / images.length);
      });
      command
        .outputOptions(['-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30'])
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
    res.status(200).json({ success: true, videoUrl: `/${path.basename(outputPath)}` });
  } catch (error) {
    console.error('Video creation failed:', error);
    res.status(500).json({ success: false, error: 'Failed to create video: ' + error.message });
  }
}