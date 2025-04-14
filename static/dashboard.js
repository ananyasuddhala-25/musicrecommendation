// --- MusicRec Dashboard JS ---
// Navigation and Section Switching

document.addEventListener('DOMContentLoaded', () => {
    const sections = ['dashboard', 'favorites', 'moodbot', 'story'];
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('href').substring(1);
            sections.forEach(s => {
                document.getElementById(s + '-section').classList.toggle('d-none', s !== section);
            });
            if (section === 'favorites') loadFavorites();
            if (section === 'dashboard') loadSongs();
        });
    });

    // Logout
    document.getElementById('logoutBtn').onclick = () => {
        fetch('/api/auth/logout', {method: 'POST'})
            .then(() => window.location = '/');
    };

    // Initial load
    loadSongs();
});

// --- SONGS ---
function loadSongs() {
    fetch('/api/songs/all')
        .then(res => res.json())
        .then(data => renderSongs(data.songs));
}

function renderSongs(songs) {
    const list = document.getElementById('songs-list');
    list.innerHTML = '';
    songs.forEach(song => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-3';
        col.innerHTML = `
            <div class="card p-2">
                <b>${song.title}</b> <span class="badge bg-secondary">${song.language}</span><br>
                ${song.artist}<br>
                <audio controls src="${song.audio_url}"></audio><br>
                <button class="btn btn-outline-danger btn-sm mt-2" onclick="addFavorite('${song.id}')">❤ Favorite</button>
                <button class="btn btn-outline-info btn-sm mt-2" onclick="addSongToStory('${song.id}')">➕ Story</button>
            </div>
        `;
        list.appendChild(col);
    });
}

// --- FAVORITES ---
function loadFavorites() {
    fetch('/api/songs/favorites')
        .then(res => res.json())
        .then(data => renderFavorites(data.favorites));
}

function renderFavorites(favorites) {
    const list = document.getElementById('favorites-list');
    list.innerHTML = '';
    if (!favorites.length) {
        list.innerHTML = '<div class="col">No favorite songs yet.</div>';
        return;
    }
    favorites.forEach(song => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-3';
        col.innerHTML = `
            <div class="card p-2">
                <b>${song.title}</b> <span class="badge bg-secondary">${song.language}</span><br>
                ${song.artist}<br>
                <audio controls src="${song.audio_url}"></audio>
            </div>
        `;
        list.appendChild(col);
    });
}

function addFavorite(songId) {
    fetch('/api/songs/favorite', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({song_id: songId})
    }).then(() => loadFavorites());
}

// --- MOODBOT ---
document.addEventListener('DOMContentLoaded', () => {
    const moodForm = document.getElementById('moodbot-form');
    const moodInput = document.getElementById('moodbot-input');
    const moodChat = document.getElementById('moodbot-chat');
    const moodRecs = document.getElementById('moodbot-recommendations');

    moodForm.onsubmit = function(e) {
        e.preventDefault();
        const msg = moodInput.value.trim();
        if (!msg) return;
        moodChat.innerHTML += `<div><b>You:</b> ${msg}</div>`;
        fetch('/api/moodbot/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({message: msg})
        })
        .then(res => res.json())
        .then(data => {
            moodChat.innerHTML += `<div><b>MoodBot:</b> ${data.response}</div>`;
            moodRecs.innerHTML = '';
            (data.recommendations || []).forEach(song => {
                const col = document.createElement('div');
                col.className = 'col-md-4 mb-2';
                col.innerHTML = `
                    <div class="card p-2">
                        <b>${song.title}</b> <span class="badge bg-secondary">${song.language}</span><br>
                        ${song.artist}<br>
                        <audio controls src="${song.audio_url}"></audio><br>
                        <button class="btn btn-outline-danger btn-sm mt-2" onclick="addFavorite('${song.id}')">❤ Favorite</button>
                        <button class="btn btn-outline-info btn-sm mt-2" onclick="addSongToStory('${song.id}')">➕ Story</button>
                    </div>
                `;
                moodRecs.appendChild(col);
            });
        });
        moodInput.value = '';
    };
});

// --- STORY ENGINE ---
let selectedSongsForStory = [];
function addSongToStory(songId) {
    if (!selectedSongsForStory.includes(songId)) {
        selectedSongsForStory.push(songId);
        updateStorySongList();
    }
}
function updateStorySongList() {
    const list = document.getElementById('story-song-list');
    list.innerHTML = '';
    selectedSongsForStory.forEach(id => {
        // Find song details from loaded songs (assume already loaded)
        fetch('/api/songs/all')
            .then(res => res.json())
            .then(data => {
                const song = data.songs.find(s => s.id === id);
                if (song) {
                    const div = document.createElement('div');
                    div.className = 'mb-2';
                    div.innerHTML = `<b>${song.title}</b> (${song.language}) <button class="btn btn-sm btn-danger ms-2" onclick="removeSongFromStory('${song.id}')">Remove</button>`;
                    list.appendChild(div);
                }
            });
    });
}
function removeSongFromStory(songId) {
    selectedSongsForStory = selectedSongsForStory.filter(id => id !== songId);
    updateStorySongList();
}
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('generate-story-btn').onclick = function() {
        if (!selectedSongsForStory.length) {
            alert('Please select some songs for your story first!');
            return;
        }
        fetch('/api/story/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({songs: selectedSongsForStory})
        })
        .then(res => res.json())
        .then(data => {
            document.getElementById('story-output').innerHTML = data.story;
            if (window.animateStory) animateStory(data.story, 'story-output');
        });
    };
});
