import React, { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { Trophy, Music, Play, Pause, User, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const Leaderboard = () => {
    useGameStore(); // Keep store connection
    const [leaders, setLeaders] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [history, setHistory] = useState([]);
    const [playingPreview, setPlayingPreview] = useState(null);
    const [audio, setAudio] = useState(new Audio());

    const fetchLeaderboard = useCallback(async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/leaderboard?limit=10`);
            const data = await res.json();
            return data;
        } catch (e) {
            console.error("Failed to fetch leaderboard", e);
            return [];
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        fetchLeaderboard().then(data => {
            if (isMounted) setLeaders(data);
        });
        return () => { isMounted = false; };
    }, [fetchLeaderboard]);

    const fetchHistory = async (sessionId) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/history/${sessionId}`);
            const data = await res.json();
            console.log("Fetched history for session", sessionId, "with", data.length, "songs");
            console.log("History data:", data);
            setHistory(data);
            setSelectedSession(sessionId);
        } catch (e) {
            console.error("Failed to fetch history", e);
        }
    };

    const playPreview = (url) => {
        if (playingPreview === url) {
            audio.pause();
            setPlayingPreview(null);
        } else {
            audio.pause();
            const newAudio = new Audio(url);
            newAudio.play();
            setAudio(newAudio);
            setPlayingPreview(url);
        }
    };

    const closeModal = () => {
        setSelectedSession(null);
        audio.pause();
        setPlayingPreview(null);
    };

    return (
        <div className="neo-box-pink p-8 w-full">
            <div className="flex items-center justify-between mb-8 border-b-4 border-black pb-4">
                <h2 className="text-3xl md:text-4xl font-black flex items-center gap-3 font-pixel uppercase">
                    <Trophy className="text-black w-8 h-8" />
                    GLOBAL RANKINGS
                </h2>
                <button onClick={() => fetchLeaderboard().then(setLeaders)} className="neo-button bg-[#23A6F0] text-black flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    REFRESH
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Leaderboard List */}
                <div className="space-y-4">
                    {leaders.map((entry, index) => (
                        <div
                            key={entry.id}
                            onClick={() => fetchHistory(entry.id)}
                            className={`p-4 border-4 border-black flex items-center justify-between cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_black] ${selectedSession === entry.id ? 'bg-[#FFDE00]' : 'bg-white'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 flex items-center justify-center font-bold border-2 border-black ${index === 0 ? 'bg-[#FFDE00] text-black' : index === 1 ? 'bg-gray-300 text-black' : index === 2 ? 'bg-[#FF90E8] text-black' : 'bg-white text-black'}`}>
                                    {index + 1}
                                </div>
                                <div className="flex items-center gap-3">
                                    {entry.user?.profile_image ? (
                                        <img src={entry.user.profile_image} className="w-10 h-10 border-2 border-black" />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-200 border-2 border-black flex items-center justify-center">
                                            <User className="w-5 h-5 text-black" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-bold text-sm uppercase truncate max-w-[120px]">{entry.user?.display_name || 'Anonymous'}</p>
                                        <p className="text-xs text-gray-500 font-mono">{new Date(entry.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-xl font-black font-pixel">
                                {entry.score}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Session Details Placeholder or Info - Changed background to white */}
                <div className="hidden md:flex flex-col items-center justify-center text-center p-8 border-4 border-black border-dashed bg-white">
                    <Trophy className="w-24 h-24 mb-4 text-gray-400" />
                    <p className="text-xl font-bold uppercase text-black">Select a score to view the songs played!</p>
                </div>
            </div>

            {/* Modal for Session History */}
            <AnimatePresence>
                {selectedSession && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20, rotate: -2 }}
                            animate={{ scale: 1, y: 0, rotate: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="neo-box-pink w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
                                <h3 className="text-2xl font-bold uppercase font-pixel">Session History</h3>
                                <button onClick={closeModal} className="text-4xl hover:scale-110 transition-transform">×</button>
                            </div>

                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                {history.map((song, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-3 bg-white border-4 border-black hover:shadow-[4px_4px_0px_0px_black] transition-all">
                                        <img src={song.cover_url} alt={song.title} className="w-12 h-12 border-2 border-black" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold truncate text-lg uppercase">{song.title}</p>
                                            <p className="text-sm truncate font-mono">{song.artist}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {song.preview_url && (
                                                <button
                                                    onClick={() => playPreview(song.preview_url)}
                                                    className={`p-2 border-2 border-black ${playingPreview === song.preview_url ? 'bg-[#FFDE00]' : 'bg-white hover:bg-gray-100'} transition`}
                                                    title="Play Preview"
                                                >
                                                    {playingPreview === song.preview_url ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    // Save functionality would go here
                                                    console.log("Save song:", song);
                                                }}
                                                className="p-2 border-2 border-black bg-white hover:bg-gray-100 transition"
                                                title="Save Song"
                                            >
                                                <Music className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Leaderboard;