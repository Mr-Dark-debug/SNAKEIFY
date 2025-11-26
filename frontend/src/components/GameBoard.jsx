import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useSwipeable } from 'react-swipeable';
import ColorThief from 'colorthief';

const GRID_SIZE = 20;
const CELL_SIZE = 20;

const GameBoard = () => {
    const canvasRef = useRef(null);
    const {
        gameState, isPaused, snakeBody, food, direction, score, currentTrack, nextTrack, songs,
        setGameState, setSnakeBody, setFood, setDirection, incrementScore,
        setCurrentTrack, setNextTrack, resetGame, user, eatenSongs, addEatenSong
    } = useGameStore();

    const [audio, setAudio] = useState(new Audio());
    const [nextAudio, setNextAudio] = useState(new Audio());
    const [bgColor, setBgColor] = useState('#f0f0f0');

    // Initialize Audio
    useEffect(() => {
        if (songs.length > 0 && !currentTrack && !nextTrack) {
            const firstTrack = songs[0];
            setNextTrack(firstTrack);

            if (firstTrack.preview_url) {
                const firstAudio = new Audio(firstTrack.preview_url);
                firstAudio.preload = 'auto';
                setNextAudio(firstAudio);
            }
        }
    }, [songs]);

    // Handle Pause/Resume Audio
    useEffect(() => {
        if (isPaused) {
            audio.pause();
        } else if (gameState === 'PLAYING' && currentTrack && currentTrack.preview_url) {
            audio.play().catch(e => console.log("Audio play prevented", e));
        }
    }, [isPaused, gameState, currentTrack]);

    // Extract Color from Album Art
    useEffect(() => {
        if (currentTrack && currentTrack.album.images.length > 0) {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = currentTrack.album.images[0].url;
            img.onload = () => {
                const colorThief = new ColorThief();
                try {
                    const color = colorThief.getColor(img);
                    const rgb = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                    setBgColor(rgb);
                    document.body.style.backgroundColor = rgb;
                } catch (e) {
                    console.warn("ColorThief failed", e);
                }
            };
        }
    }, [currentTrack]);

    // Spawn Food with Preloaded Image
    const spawnFood = () => {
        let newFood;
        while (true) {
            const x = Math.floor(Math.random() * GRID_SIZE);
            const y = Math.floor(Math.random() * GRID_SIZE);
            if (!snakeBody.some(s => s.x === x && s.y === y)) {
                const track = nextTrack || songs[0];
                newFood = { x, y, track };

                // Preload Image
                if (track && track.album.images && track.album.images.length > 0) {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous'; // Needed for ColorThief later if we use food for color
                    img.src = track.album.images[track.album.images.length - 1].url;
                    newFood.imageElement = img;
                }
                break;
            }
        }
        setFood(newFood);
    };

    // Initial Spawn
    useEffect(() => {
        if (gameState === 'PLAYING' && songs.length > 0 && !food) {
            spawnFood();
        }
    }, [gameState, songs]);

    const playNextSong = () => {
        if (!nextTrack) return;

        audio.pause();

        const newAudio = nextAudio;
        newAudio.loop = true;
        newAudio.play().catch(e => console.error("Audio play failed", e));
        setAudio(newAudio);
        setCurrentTrack(nextTrack);

        // Prepare next-next song
        let upcomingIndex = Math.floor(Math.random() * songs.length);
        let upcomingTrack = songs[upcomingIndex];

        if (upcomingTrack.id === nextTrack.id && songs.length > 1) {
            upcomingIndex = (upcomingIndex + 1) % songs.length;
            upcomingTrack = songs[upcomingIndex];
        }

        setNextTrack(upcomingTrack);
        if (upcomingTrack.preview_url) {
            const upcomingAudio = new Audio(upcomingTrack.preview_url);
            upcomingAudio.preload = 'auto';
            setNextAudio(upcomingAudio);
        } else {
            setNextAudio(new Audio());
        }
    };

    const gameOver = () => {
        setGameState('GAME_OVER');
        audio.pause();

        if (user && user.id) {
            // Format eaten songs for backend
            const formattedSongs = eatenSongs.map((s, index) => ({
                order: index + 1,
                title: s.track.name,
                artist: s.track.artists[0].name,
                cover_url: s.imgUrl,
                preview_url: s.track.preview_url,
                spotify_uri: s.track.uri
            }));

            // Log the eaten songs for debugging
            console.log("Eaten songs count:", formattedSongs.length);
            console.log("Eaten songs:", formattedSongs);

            fetch(`${import.meta.env.VITE_API_URL}/score?user_id=${user.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    score: score,
                    eaten_songs: formattedSongs
                })
            }).catch(e => console.error("Failed to submit score", e));
        }
    };

    // Game Loop
    useEffect(() => {
        if (gameState !== 'PLAYING' || isPaused) return;

        const moveSnake = () => {
            const newHead = {
                x: snakeBody[0].x + direction.x,
                y: snakeBody[0].y + direction.y,
                imgUrl: null,
                track: null,
                imageElement: null
            };

            // Wrap-around Logic
            if (newHead.x < 0) newHead.x = GRID_SIZE - 1;
            if (newHead.x >= GRID_SIZE) newHead.x = 0;
            if (newHead.y < 0) newHead.y = GRID_SIZE - 1;
            if (newHead.y >= GRID_SIZE) newHead.y = 0;

            // Self Collision
            if (snakeBody.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
                gameOver();
                return;
            }

            const newBody = [newHead, ...snakeBody];

            // Eat Food
            if (food && newHead.x === food.x && newHead.y === food.y) {
                incrementScore();

                // Assign image to the NEW HEAD segment
                if (food.imageElement) {
                    newBody[0].imageElement = food.imageElement;
                } else if (food.track && food.track.album.images.length > 0) {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.src = food.track.album.images[food.track.album.images.length - 1].url;
                    newBody[0].imageElement = img;
                }

                newBody[0].imgUrl = food.track.album.images[food.track.album.images.length - 1]?.url;
                newBody[0].track = food.track;

                // Add to history
                addEatenSong({
                    track: food.track,
                    imgUrl: newBody[0].imgUrl
                });

                playNextSong();
                spawnFood();
            } else {
                // When not eating, preserve track info from previous head
                if (snakeBody.length > 0) {
                    newBody[0].track = snakeBody[0].track;
                    newBody[0].imgUrl = snakeBody[0].imgUrl;
                    newBody[0].imageElement = snakeBody[0].imageElement;
                }
                newBody.pop();
            }

            setSnakeBody(newBody);
        };

        const gameInterval = setInterval(moveSnake, 150);
        return () => clearInterval(gameInterval);
    }, [gameState, isPaused, snakeBody, direction, food]);

    // Canvas Rendering
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Grid (Subtle)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * CELL_SIZE, 0);
            ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * CELL_SIZE);
            ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
            ctx.stroke();
        }

        // Draw Snake
        [...snakeBody].reverse().forEach((segment, i) => {
            const index = snakeBody.length - 1 - i;

            if (index === 0) {
                // Draw Triangle Head
                ctx.fillStyle = '#000000'; // Black Head

                const x = segment.x * CELL_SIZE;
                const y = segment.y * CELL_SIZE;
                const size = CELL_SIZE;
                const half = size / 2;

                ctx.beginPath();
                if (direction.x === 1) { // Right
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + size, y + half);
                    ctx.lineTo(x, y + size);
                } else if (direction.x === -1) { // Left
                    ctx.moveTo(x + size, y);
                    ctx.lineTo(x, y + half);
                    ctx.lineTo(x + size, y + size);
                } else if (direction.y === 1) { // Down
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + half, y + size);
                    ctx.lineTo(x + size, y);
                } else if (direction.y === -1) { // Up
                    ctx.moveTo(x, y + size);
                    ctx.lineTo(x + half, y);
                    ctx.lineTo(x + size, y + size);
                } else {
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + size, y + half);
                    ctx.lineTo(x, y + size);
                }
                ctx.closePath();
                ctx.fill();

            } else if (segment.imageElement) {
                // Draw Album Art Body
                try {
                    ctx.save();
                    ctx.drawImage(segment.imageElement, segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

                    // Thick Black Border for Neo-Brutalism
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                    ctx.restore();
                } catch (e) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                    ctx.strokeRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
            } else {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.strokeRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        });

        // Draw Food
        if (food) {
            if (food.imageElement) {
                ctx.save();
                try {
                    ctx.drawImage(food.imageElement, food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                    // Food Border
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                } catch (e) {
                    ctx.fillStyle = '#FFDE00';
                    ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
                ctx.restore();
            } else {
                ctx.fillStyle = '#FFDE00';
                ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.strokeRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }, [snakeBody, food, direction]);

    const handleKeyDown = (e) => {
        switch (e.key) {
            case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
            case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
            case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
            case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [direction]);

    const handlers = useSwipeable({
        onSwipedUp: () => direction.y === 0 && setDirection({ x: 0, y: -1 }),
        onSwipedDown: () => direction.y === 0 && setDirection({ x: 0, y: 1 }),
        onSwipedLeft: () => direction.x === 0 && setDirection({ x: -1, y: 0 }),
        onSwipedRight: () => direction.x === 0 && setDirection({ x: 1, y: 0 }),
        preventScrollOnSwipe: true,
        trackMouse: false
    });

    const getSarcasticMessage = (score) => {
        if (score === 0) return "MY GRANDMA PLAYS BETTER 👵";
        if (score < 10) return "ARE YOU EVEN TRYING? 🥱";
        if (score < 30) return "NOT BAD, BUT NOT GREAT 🤷";
        if (score < 50) return "GETTING THERE... SLOWLY 🐢";
        if (score < 100) return "DJ SNAKE IN THE HOUSE! 🎧";
        return "GODLIKE STATUS 🏆";
    };

    return (
        <div {...handlers} className="flex flex-col items-center justify-center h-screen touch-none w-full">
            <canvas
                ref={canvasRef}
                width={GRID_SIZE * CELL_SIZE}
                height={GRID_SIZE * CELL_SIZE}
                className="neo-box bg-white/50 backdrop-blur-sm"
            />
            {gameState === 'GAME_OVER' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
                    <div className="neo-box-yellow p-8 text-center max-w-md w-full mx-4 transform rotate-1">
                        <h2 className="text-5xl font-bold mb-4 font-pixel text-black">GAME OVER</h2>
                        <p className="text-xl mb-6 font-bold uppercase">"{getSarcasticMessage(score)}"</p>

                        <div className="mb-8 p-4 bg-white border-4 border-black">
                            <p className="text-sm uppercase font-bold tracking-widest">Final Score</p>
                            <p className="text-5xl font-black font-pixel">{score}</p>
                        </div>

                        <button
                            onClick={resetGame}
                            className="neo-button bg-black text-white hover:bg-gray-900 w-full"
                        >
                            PLAY AGAIN 🔄
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameBoard;
