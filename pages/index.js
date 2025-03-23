import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
Modal.setAppElement('#__next');

export default function Home() {
    const [title, setTitle] = useState('');
    const [query, setQuery] = useState('');
    const [images, setImages] = useState([]);
    const [videoUrl, setVideoUrl] = useState(null);
    const [progress, setProgress] = useState(0);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);

    useEffect(() => {
        const cookies = document.cookie.split(';').reduce((acc, c) => {
            const [key, val] = c.trim().split('=');
            acc[key] = val;
            return acc;
        }, {});
        if (cookies.tokens) {
            setIsAuthenticated(true);
            fetchVideos();
        }
    }, []);

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    const authenticate = () => window.location.href = '/api/auth';

    const fetchVideos = async () => {
        try {
            const res = await axios.get('/api/videos');
            if (res.data.success) setVideos(res.data.videos);
            else showMessage(res.data.error, 'error');
        } catch (err) {
            showMessage('Failed to fetch videos: ' + err.message, 'error');
        }
    };

    const searchImages = async () => {
        try {
            const res = await axios.post('/api/search', { query });
            if (res.data.success) setImages(res.data.images);
            else showMessage(res.data.error, 'error');
        } catch (err) {
            showMessage('Failed to search images: ' + err.message, 'error');
        }
    };

    const createVideo = async () => {
        try {
            const res = await axios.post('/api/create', { images, title, duration: 60 });
            if (res.data.success) setVideoUrl(res.data.videoUrl);
            else showMessage(res.data.error, 'error');
        } catch (err) {
            showMessage('Failed to create video: ' + err.message, 'error');
        }
    };

    const uploadVideo = async () => {
        try {
            const res = await axios.post('/api/upload', { videoUrl, title }, {
                onUploadProgress: (event) => setProgress(Math.round((event.loaded * 100) / event.total)),
            });
            if (res.data.success) {
                showMessage(`Video uploaded! ID: ${res.data.videoId}`, 'success');
                fetchVideos(); // Refresh video list
            } else showMessage(res.data.error, 'error');
        } catch (err) {
            showMessage('Failed to upload video: ' + err.message, 'error');
        }
    };

    const deleteVideo = async (videoId) => {
        try {
            const res = await axios.post('/api/delete', { videoId });
            if (res.data.success) {
                setVideos(videos.filter(v => v.id !== videoId));
                showMessage('Video deleted successfully', 'success');
            } else showMessage(res.data.error, 'error');
        } catch (err) {
            showMessage('Failed to delete video: ' + err.message, 'error');
        }
    };

    const chartData = {
        labels: videos.map(v => v.snippet.title.slice(0, 20) + '...'),
        datasets: [
            { label: 'Views', data: videos.map(v => v.statistics.viewCount), backgroundColor: '#3b82f6' },
            { label: 'Likes', data: videos.map(v => v.statistics.likeCount), backgroundColor: '#10b981' },
            { label: 'Comments', data: videos.map(v => v.statistics.commentCount), backgroundColor: '#ef4444' },
        ],
    };

    return (
        <div className="p-5 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">YouTube Shorts Dashboard</h1>
            {message.text && (
                <div className={`p-2 mb-4 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message.text}
                </div>
            )}
            {!isAuthenticated ? (
                <button onClick={authenticate} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Login with YouTube</button>
            ) : (
                <>
                    {/* Video Creation Section */}
                    <div className="mb-6">
                        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Video Title" className="border p-2 mb-2 w-full rounded" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Images" className="border p-2 mb-2 w-full rounded" />
                        <button onClick={searchImages} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Search</button>
                        <div className="flex gap-2 flex-wrap my-4">
                            {images.map((img, i) => <img key={i} src={img.path} alt="" className="w-24 h-24 object-cover" />)}
                        </div>
                        <button onClick={createVideo} disabled={!images.length} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-300">Create Video</button>
                        {videoUrl && (
                            <div className="mt-4">
                                <video src={videoUrl} controls className="w-full max-w-md" />
                                <button onClick={uploadVideo} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2">Upload</button>
                                <progress value={progress} max="100" className="w-full mt-2" />
                            </div>
                        )}
                    </div>

                    {/* Dashboard Section */}
                    <h2 className="text-xl font-semibold mb-4">Your Videos</h2>
                    <div className="mb-6">
                        <Bar data={chartData} options={{ responsive: true, scales: { y: { beginAtZero: true } } }} />
                    </div>
                    <div className="grid gap-4">
                        {videos.map(video => (
                            <div key={video.id} className="border p-4 rounded flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{video.snippet.title}</p>
                                    <p className="text-sm text-gray-600">Views: {video.statistics.viewCount} | Likes: {video.statistics.likeCount} | Comments: {video.statistics.commentCount}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setSelectedVideo(video)} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Preview</button>
                                    <button onClick={() => deleteVideo(video.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Video Preview Modal */}
                    <Modal isOpen={!!selectedVideo} onRequestClose={() => setSelectedVideo(null)} className="p-4 bg-white rounded max-w-lg mx-auto mt-20" overlayClassName="fixed inset-0 bg-black bg-opacity-50">
                        {selectedVideo && (
                            <>
                                <h2 className="text-lg font-bold mb-2">{selectedVideo.snippet.title}</h2>
                                <iframe
                                    width="100%"
                                    height="315"
                                    src={`https://www.youtube.com/embed/${selectedVideo.id}`}
                                    frameBorder="0"
                                    allow="autoplay; encrypted-media"
                                    allowFullScreen
                                />
                                <button onClick={() => setSelectedVideo(null)} className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Close</button>
                            </>
                        )}
                    </Modal>
                </>
            )}
        </div>
    );
}