const storyText = `It was a happy night. They danced under the stars. Love was in the air. Then it started to rain. But they smiled and kept singing.`;

let container = document.getElementById('animatedStoryContainer');
let scenes = [];
let currentSceneIndex = 0;
let timer = null;
let paused = false;

const backgrounds = ['#fff8f0', '#f0fff9', '#f5f5ff', '#fff0f5', '#f0faff'];

function getEmojiScene(sentence) {
  const mappings = [
    { keyword: 'love', emoji: '❤️' },
    { keyword: 'dance', emoji: '💃🕺' },
    { keyword: 'happy', emoji: '😊' },
    { keyword: 'sad', emoji: '😢' },
    { keyword: 'night', emoji: '🌙' },
    { keyword: 'sun', emoji: '☀️' },
    { keyword: 'rain', emoji: '🌧️' },
    { keyword: 'party', emoji: '🎉' },
    { keyword: 'music', emoji: '🎶' },
    { keyword: 'friend', emoji: '🧑‍🤝‍🧑' },
    { keyword: 'cry', emoji: '😭' },
    { keyword: 'smile', emoji: '😄' },
    { keyword: 'sing', emoji: '🎤' },
    { keyword: 'star', emoji: '⭐' },
    { keyword: 'dream', emoji: '💭' },
  ];

  let emojis = '';
  for (const map of mappings) {
    if (sentence.toLowerCase().includes(map.keyword)) {
      emojis += map.emoji;
    }
  }
  return emojis || '🎬';
}

function showScene(index) {
  if (index >= scenes.length || paused) return;

  const sentence = scenes[index];
  const emoji = getEmojiScene(sentence);

  container.style.backgroundColor = backgrounds[index % backgrounds.length];
  container.innerHTML = `
    <div class="animated-scene">
      <div class="scene-emoji">${emoji}</div>
      <div class="scene-text">${sentence}</div>
    </div>
  `;

  // Narration
  let utterance = new SpeechSynthesisUtterance(sentence);
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);

  currentSceneIndex++;
  if (currentSceneIndex < scenes.length && !paused) {
    timer = setTimeout(() => showScene(currentSceneIndex), 3000);
  }
}

function startStory() {
  if (!paused) {
    scenes = storyText.split(/[.!?]/).map(s => s.trim()).filter(Boolean);
    currentSceneIndex = 0;
  }
  paused = false;
  showScene(currentSceneIndex);
}

function pauseStory() {
  paused = true;
  clearTimeout(timer);
  speechSynthesis.cancel();
}

function restartStory() {
  pauseStory();
  currentSceneIndex = 0;
  startStory();
}
