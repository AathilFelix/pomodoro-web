let player;

// This function will be called by YouTube API when it's ready
function onYouTubeIframeAPIReady() {
    if (window.pomodoroTimer) {
        window.pomodoroTimer.initializeYouTubePlayer();
    }
}

class PomodoroTimer {
    constructor() {
        this.timeLeft = 25 * 60; // 25 minutes in seconds
        this.initialTime = 25 * 60;
        this.isRunning = false;
        this.timerInterval = null;
        this.sessionsCompleted = 0;
        this.currentMode = 'pomodoro';
        this.isMusicPlaying = false;
        
        // DOM Elements
        this.timeDisplay = document.querySelector('.time');
        this.startBtn = document.getElementById('startBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.progressRing = document.querySelector('.progress-ring-circle');
        this.modeBtns = document.querySelectorAll('.mode-btn');
        this.sessionsCount = document.getElementById('sessionsCount');
        this.shareBtn = document.getElementById('shareBtn');
        this.darkModeToggle = document.getElementById('darkModeToggle');
        this.timerComplete = document.getElementById('timerComplete');
        
        // Music Elements
        this.toggleMusicBtn = document.getElementById('toggleMusic');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.musicTrackSelect = document.getElementById('musicTrack');
        this.youtubePlayerElement = document.getElementById('youtubePlayer');
        
        // YouTube player
        this.player = null;
        window.pomodoroTimer = this;

        // Calculate circle properties
        const circle = this.progressRing;
        const radius = circle.r.baseVal.value;
        this.circumference = radius * 2 * Math.PI;
        circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
        circle.style.strokeDashoffset = 0;

        this.initializeEventListeners();
        this.updateDisplay();
    }

    initializeEventListeners() {
        this.startBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        
        this.modeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
        });

        this.shareBtn.addEventListener('click', () => this.shareProgress());
        this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());

        // Music controls
        this.toggleMusicBtn.addEventListener('click', () => this.toggleMusic());
        this.volumeSlider.addEventListener('input', () => this.updateVolume());
        this.musicTrackSelect.addEventListener('change', () => this.changeMusicTrack());

        // Load dark mode preference
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.setAttribute('data-theme', 'dark');
            this.darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }

        // Initialize music
        this.backgroundMusic.volume = this.volumeSlider.value / 100;
        this.changeMusicTrack();
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
            this.startBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            this.startTimer();
            this.startBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
        this.isRunning = !this.isRunning;
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();

            if (this.timeLeft <= 0) {
                this.completeTimer();
            }
        }, 1000);
    }

    pauseTimer() {
        clearInterval(this.timerInterval);
    }

    resetTimer() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.timeLeft = this.initialTime;
        this.startBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.updateDisplay();
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update progress ring
        const progress = (this.timeLeft / this.initialTime) * this.circumference;
        this.progressRing.style.strokeDashoffset = this.circumference - progress;
    }

    completeTimer() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.timerComplete.play();
        
        if (this.currentMode === 'pomodoro') {
            this.sessionsCompleted++;
            this.sessionsCount.textContent = this.sessionsCompleted;
            
            // Switch to break after completing a pomodoro
            if (this.sessionsCompleted % 4 === 0) {
                this.switchMode('longBreak');
            } else {
                this.switchMode('shortBreak');
            }
        } else {
            this.switchMode('pomodoro');
        }
    }

    switchMode(mode) {
        this.currentMode = mode;
        this.modeBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });

        switch (mode) {
            case 'pomodoro':
                this.initialTime = 25 * 60;
                break;
            case 'shortBreak':
                this.initialTime = 5 * 60;
                break;
            case 'longBreak':
                this.initialTime = 15 * 60;
                break;
        }

        this.resetTimer();
    }

    shareProgress() {
        const text = `I've completed ${this.sessionsCompleted} Pomodoro sessions today! 🍅 #ProductivityBoost`;
        // Create modal
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.5)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '9999';

        const box = document.createElement('div');
        box.style.background = '#fff';
        box.style.padding = '2rem';
        box.style.borderRadius = '12px';
        box.style.textAlign = 'center';
        box.style.minWidth = '250px';
        box.innerHTML = `<h3>Share Your Streak</h3><p style='margin-bottom:1rem;'>${text}</p>`;

        // X (Twitter) share
        const xBtn = document.createElement('button');
        xBtn.innerHTML = '<i class="fab fa-x-twitter"></i> Share on X';
        xBtn.style.margin = '0.5rem';
        xBtn.style.padding = '0.5rem 1rem';
        xBtn.style.borderRadius = '8px';
        xBtn.style.border = 'none';
        xBtn.style.background = '#000';
        xBtn.style.color = '#fff';
        xBtn.style.cursor = 'pointer';
        xBtn.onclick = () => {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,'_blank');
            document.body.removeChild(modal);
        };

        // Instagram share (screenshot of page up to share button)
        const instaBtn = document.createElement('button');
        instaBtn.innerHTML = '<i class="fab fa-instagram"></i> Share on Instagram';
        instaBtn.style.margin = '0.5rem';
        instaBtn.style.padding = '0.5rem 1rem';
        instaBtn.style.borderRadius = '8px';
        instaBtn.style.border = 'none';
        instaBtn.style.background = 'linear-gradient(45deg,#fd1d1d,#fcb045,#833ab4)';
        instaBtn.style.color = '#fff';
        instaBtn.style.cursor = 'pointer';
        instaBtn.onclick = async () => {
            // Screenshot the timer-container (excluding share button)
            const timerContainer = document.querySelector('.timer-container');
            // Temporarily hide share-container
            const shareContainer = document.querySelector('.share-container');
            shareContainer.style.display = 'none';
            await html2canvas(timerContainer, {backgroundColor: null}).then(async canvas => {
                shareContainer.style.display = '';
                const imgData = canvas.toDataURL('image/png');
                // Try to copy to clipboard
                if (navigator.clipboard && window.ClipboardItem) {
                    fetch(imgData)
                        .then(res => res.blob())
                        .then(blob => {
                            const item = new ClipboardItem({ 'image/png': blob });
                            navigator.clipboard.write([item]).then(() => {
                                window.open('https://www.instagram.com/', '_blank');
                                alert('Screenshot copied! Paste it in your Instagram story or post.');
                                document.body.removeChild(modal);
                            }).catch(() => {
                                // Fallback to download
                                const downloadLink = document.createElement('a');
                                downloadLink.href = imgData;
                                downloadLink.download = 'pomodoro_streak.png';
                                downloadLink.textContent = 'Download Screenshot for Instagram';
                                downloadLink.style.display = 'block';
                                downloadLink.style.margin = '1rem auto';
                                box.appendChild(downloadLink);
                                window.open('https://www.instagram.com/', '_blank');
                                alert('Could not copy to clipboard. Download and upload to Instagram.');
                            });
                        });
                } else {
                    // Fallback to download
                    const downloadLink = document.createElement('a');
                    downloadLink.href = imgData;
                    downloadLink.download = 'pomodoro_streak.png';
                    downloadLink.textContent = 'Download Screenshot for Instagram';
                    downloadLink.style.display = 'block';
                    downloadLink.style.margin = '1rem auto';
                    box.appendChild(downloadLink);
                    window.open('https://www.instagram.com/', '_blank');
                    alert('Could not copy to clipboard. Download and upload to Instagram.');
                }
            });
        };

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Cancel';
        closeBtn.style.margin = '0.5rem';
        closeBtn.style.padding = '0.5rem 1rem';
        closeBtn.style.borderRadius = '8px';
        closeBtn.style.border = 'none';
        closeBtn.style.background = '#eee';
        closeBtn.style.color = '#333';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => {
            document.body.removeChild(modal);
        };

        box.appendChild(xBtn);
        box.appendChild(instaBtn);
        box.appendChild(closeBtn);
        modal.appendChild(box);
        document.body.appendChild(modal);
    }

    toggleDarkMode() {
        const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
        if (isDarkMode) {
            document.body.removeAttribute('data-theme');
            this.darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('darkMode', 'false');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            this.darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('darkMode', 'true');
        }
    }

    initializeYouTubePlayer() {
        const videoId = this.musicTrackSelect.value;
        this.player = new YT.Player('youtubePlayer', {
            height: '80',
            width: '100%',
            videoId: videoId,
            playerVars: {
                'playsinline': 1,
                'controls': 0,
                'showinfo': 0,
                'rel': 0,
                'modestbranding': 1
            },
            events: {
                'onStateChange': (event) => {
                    if (event.data === YT.PlayerState.ENDED) {
                        // Restart the video when it ends
                        event.target.playVideo();
                    }
                }
            }
        });
        this.youtubePlayerElement.style.display = 'block';
    }

    toggleMusic() {
        if (!this.player) {
            this.initializeYouTubePlayer();
            this.isMusicPlaying = true;
            this.toggleMusicBtn.innerHTML = '<i class="fas fa-pause"></i>';
            return;
        }

        if (this.isMusicPlaying) {
            this.player.pauseVideo();
            this.toggleMusicBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            this.player.playVideo();
            this.toggleMusicBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
        this.isMusicPlaying = !this.isMusicPlaying;
    }

    updateVolume() {
        if (this.player) {
            this.player.setVolume(this.volumeSlider.value);
        }
    }

    changeMusicTrack() {
        const videoId = this.musicTrackSelect.value;
        if (this.player) {
            this.player.loadVideoById(videoId);
            if (!this.isMusicPlaying) {
                this.player.pauseVideo();
            }
        } else {
            this.initializeYouTubePlayer();
        }
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});
