class MusicStoryEngine {
    constructor() {
        this.selectedSongs = [];
        this.storyText = '';
        this.currentVisuals = [];
        this.soundEffects = [];
        this.isPlaying = false;
        this.currentSong = null;

        this.searchInput = document.getElementById('songSearch');
        this.searchBtn = document.getElementById('searchBtn');
        this.recommendationsDiv = document.getElementById('recommendations');
        this.audioPlayer = document.getElementById('player');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('addSong').addEventListener('click', () => this.addSong());
        document.getElementById('generateStory').addEventListener('click', () => this.generateStory());
        document.getElementById('playPause').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('reset').addEventListener('click', () => this.resetStory());

        this.searchBtn.addEventListener('click', async () => {
            const query = this.searchInput.value.trim();
            if (!query) return;

            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                this.displayRecommendations(data.recommendations);
            } catch (error) {
                console.error('Error searching:', error);
                alert('Error searching for songs. Please try again.');
            }
        });

        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchBtn.click();
            }
        });
    }

    async addSong() {
        const songInput = document.getElementById('songSearch');
        const songName = songInput.value.trim();
        
        if (songName) {
            // Here you would typically make an API call to a music service
            this.selectedSongs.push({
                title: songName,
                artist: 'Unknown', // This would come from the API
                mood: this.analyzeMood(songName)
            });
            
            this.updateSelectedSongsDisplay();
            songInput.value = '';
        }
    }

    analyzeMood(songName) {
        // This would be replaced with actual mood analysis
        const moods = ['happy', 'melancholic', 'energetic', 'romantic'];
        return moods[Math.floor(Math.random() * moods.length)];
    }

    updateSelectedSongsDisplay() {
        const container = document.querySelector('.selected-songs');
        container.innerHTML = this.selectedSongs
            .map(song => `<div class="song-item">${song.title} - ${song.mood}</div>`)
            .join('');
    }

    async generateStory() {
        if (this.selectedSongs.length === 0) {
            alert('Please add some songs first!');
            return;
        }

        try {
            // Create a story context from the songs
            const storyContext = this.createStoryContext();
            
            // Generate story using AI (simulated for now)
            this.storyText = await this.generateAIStory(storyContext);
            
            // Generate matching visuals and sound effects
            this.currentVisuals = await this.generateVisuals(this.storyText);
            this.soundEffects = await this.generateSoundEffects(this.storyText);
            
            this.updateStoryDisplay();
            this.updateVisualsDisplay();
        } catch (error) {
            console.error('Story generation failed:', error);
            alert('Failed to generate story. Please try again.');
        }
    }

    createStoryContext() {
        const songMoods = this.selectedSongs.map(song => song.mood);
        const dominantMood = this.getDominantMood(songMoods);
        
        return {
            songs: this.selectedSongs,
            dominantMood: dominantMood,
            themes: this.generateThemes(dominantMood),
            setting: this.generateSetting(dominantMood)
        };
    }

    getDominantMood(moods) {
        const moodCount = moods.reduce((acc, mood) => {
            acc[mood] = (acc[mood] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(moodCount)
            .sort(([,a], [,b]) => b - a)[0][0];
    }

    generateThemes(mood) {
        const themeMap = {
            happy: ['celebration', 'friendship', 'achievement'],
            melancholic: ['reflection', 'growth', 'healing'],
            energetic: ['adventure', 'challenge', 'discovery'],
            romantic: ['love', 'connection', 'destiny']
        };
        return themeMap[mood] || ['journey', 'discovery'];
    }

    generateSetting(mood) {
        const settingMap = {
            happy: 'sun-filled meadow',
            melancholic: 'quiet forest at dusk',
            energetic: 'bustling cityscape',
            romantic: 'starlit beach'
        };
        return settingMap[mood] || 'mysterious landscape';
    }

    async generateAIStory(context) {
        // Simulate AI story generation
        const { songs, dominantMood, themes, setting } = context;
        const songTitles = songs.map(song => song.title).join(', ');
        
        return `In a ${setting}, where the atmosphere was filled with ${dominantMood} energy,
                our story begins. The melody of ${songTitles} painted a vivid picture of
                ${themes.join(' and ')}. As the music played, the world transformed...
                [Story continues with more dynamic content based on songs and mood]`;
    }

    async generateVisuals(storyText) {
        // Placeholder for AI visual generation
        return ['background-image-1.jpg', 'scene-1.jpg'];
    }

    async generateSoundEffects(storyText) {
        // Placeholder for AI sound effect generation
        return ['ambient-1.mp3', 'effect-1.mp3'];
    }

    updateVisualsDisplay() {
        const visualsContainer = document.querySelector('.story-visuals');
        visualsContainer.innerHTML = this.currentVisuals
            .map(visual => `<div class="visual" style="background-image: url(${visual})"></div>`)
            .join('');
    }

    updateStoryDisplay() {
        const storyContainer = document.querySelector('.story-text');
        storyContainer.innerHTML = this.storyText;
    }

    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        const button = document.getElementById('playPause');
        button.textContent = this.isPlaying ? 'Pause' : 'Play';
        
        if (this.isPlaying) {
            this.playStory();
        } else {
            this.pauseStory();
        }
    }

    playStory() {
        // Implement story playback logic
    }

    pauseStory() {
        // Implement pause logic
    }

    resetStory() {
        this.selectedSongs = [];
        this.storyText = '';
        this.currentVisuals = [];
        this.soundEffects = [];
        this.isPlaying = false;
        
        this.updateSelectedSongsDisplay();
        this.updateStoryDisplay();
        document.getElementById('playPause').textContent = 'Play';
    }

    displayRecommendations(recommendations) {
        this.recommendationsDiv.innerHTML = '';
        recommendations.forEach(song => {
            const songElement = document.createElement('a');
            songElement.className = 'list-group-item list-group-item-action';
            songElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${song.title}</h6>
                        <small>${song.artist}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-primary play-btn">Play</button>
                </div>
            `;

            songElement.querySelector('.play-btn').addEventListener('click', () => {
                this.playSong(song);
            });

            this.recommendationsDiv.appendChild(songElement);
        });
    }

    playSong(song) {
        this.currentSong = song;
        this.audioPlayer.src = song.preview_url;
        this.audioPlayer.play();
    }
}

class MusicStoryPlayer {
    constructor() {
        this.selectedSongs = [];
        this.currentSongIndex = -1;
        this.audio = new Audio();
        this.isPlaying = false;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Mood selection
        document.getElementById('moodSelect').addEventListener('change', (e) => this.handleMoodChange(e));
        
        // Song search
        document.getElementById('searchBtn').addEventListener('click', () => this.handleSearch());
        document.getElementById('songSearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        // Story generation
        document.getElementById('generateStoryBtn').addEventListener('click', () => this.generateStory());
        
        // Music player controls
        document.getElementById('playPauseBtn').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('prevBtn').addEventListener('click', () => this.playPrevious());
        document.getElementById('nextBtn').addEventListener('click', () => this.playNext());
        
        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.playNext());
    }

    async handleMoodChange(event) {
        const mood = event.target.value;
        if (!mood) return;
        
        try {
            const response = await fetch(`/api/search?mood=${mood}`);
            const data = await response.json();
            
            if (data.recommendations) {
                this.selectedSongs = data.recommendations;
                this.updateSelectedSongsList();
            }
        } catch (error) {
            console.error('Error fetching mood-based recommendations:', error);
            alert('Failed to get recommendations. Please try again.');
        }
    }

    async handleSearch() {
        const query = document.getElementById('songSearch').value.trim();
        if (!query) return;
        
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.recommendations) {
                this.selectedSongs = data.recommendations;
                this.updateSelectedSongsList();
            }
        } catch (error) {
            console.error('Error searching songs:', error);
            alert('Failed to search songs. Please try again.');
        }
    }

    updateSelectedSongsList() {
        const container = document.getElementById('selectedSongs');
        container.innerHTML = '';
        
        this.selectedSongs.forEach((song, index) => {
            const songElement = document.createElement('div');
            songElement.className = 'song-item p-2 border-bottom';
            songElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <span>${song.title} - ${song.artist}</span>
                    <button class="btn btn-sm btn-outline-primary play-btn" data-index="${index}">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            `;
            
            songElement.querySelector('.play-btn').addEventListener('click', () => this.playSong(index));
            container.appendChild(songElement);
        });
    }

    async generateStory() {
        if (this.selectedSongs.length === 0) {
            alert('Please select some songs first!');
            return;
        }

        const mood = document.getElementById('moodSelect').value;
        const songTitles = this.selectedSongs.map(song => song.title);
        
        try {
            const response = await fetch('/api/generate-story', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mood: mood,
                    songs: songTitles
                })
            });
            
            const data = await response.json();
            if (data.story) {
                document.getElementById('storyContent').innerHTML = data.story;
                this.playSong(0); // Start playing the first song
            }
        } catch (error) {
            console.error('Error generating story:', error);
            alert('Failed to generate story. Please try again.');
        }
    }

    async playSong(index) {
        if (index < 0 || index >= this.selectedSongs.length) return;
        
        try {
            const song = this.selectedSongs[index];
            const response = await fetch(`/api/play/${song.id}`);
            const data = await response.json();
            
            if (data.url) {
                this.currentSongIndex = index;
                this.audio.src = data.url;
                this.audio.play();
                this.isPlaying = true;
                this.updatePlayPauseButton();
                this.updateNowPlaying();
            }
        } catch (error) {
            console.error('Error playing song:', error);
            alert('Failed to play song. Please try again.');
        }
    }

    togglePlayPause() {
        if (this.audio.src) {
            if (this.isPlaying) {
                this.audio.pause();
            } else {
                this.audio.play();
            }
            this.isPlaying = !this.isPlaying;
            this.updatePlayPauseButton();
        }
    }

    playPrevious() {
        if (this.currentSongIndex > 0) {
            this.playSong(this.currentSongIndex - 1);
        }
    }

    playNext() {
        if (this.currentSongIndex < this.selectedSongs.length - 1) {
            this.playSong(this.currentSongIndex + 1);
        }
    }

    updateProgress() {
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        document.querySelector('.progress-bar').style.width = `${progress}%`;
    }

    updatePlayPauseButton() {
        const button = document.getElementById('playPauseBtn');
        button.innerHTML = `<i class="fas fa-${this.isPlaying ? 'pause' : 'play'}"></i>`;
    }

    updateNowPlaying() {
        const song = this.selectedSongs[this.currentSongIndex];
        document.getElementById('nowPlaying').textContent = `${song.title} - ${song.artist}`;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new MusicStoryEngine();
    window.musicStoryPlayer = new MusicStoryPlayer();
});
