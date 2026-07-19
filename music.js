// ============================================
// Sangeet — Music Player
// ============================================

const backBtn = document.getElementById("backbtn");
const forwardBtn = document.getElementById("forwardbtn");
const playbtn = document.getElementById("playbtn");
const playIcon = playbtn.querySelector("i");

const slider = document.getElementById("slider");
const currentTimeEl = document.getElementById("currenttime");
const durationEl = document.getElementById("duration");

const disc = document.getElementById("disc");
const tonearm = document.getElementById("tonearm");
const cover = document.getElementById("cover");
const songname = document.getElementById("songname");
const songmeta = document.getElementById("songmeta");
const errorEl = document.getElementById("playererror");

const volumeSlider = document.getElementById("volume");

// Raw playlist as authored.
const rawSongs = [
    { name: "Thinking Of You - AP Dhillon", file: "Thinking Of You.mp3", img: "cd6.webp" },
    { name: "Dooron Dooron - Paresh Pahuja", file: "Dooron Dooron.mp3", img: "cd6.webp" },
    { name: "Charmer - Diljit Dosanjh", file: "Charmer.mp3", img: "cd6.webp" },
    { name: "Ikko Mikke - Satinder Sartaaj", file: "Ikko Mikke.mp3", img: "cd6.webp" },
    { name: "Moonlight - Harnoor", file: "Moonlight.mp3", img: "cd6.jpg" },
    { name: "Boyfriend - Karan Aujla", file: "Boyfriend.mp3", img: "cd6.webp" },
    // NOTE: this was a SoundCloud web page link, not a direct audio file —
    // an <audio> element can't play it, so it's skipped from the playlist.
    // Swap in a direct .mp3 (or hosted stream URL) for "Aa Ja Diljaaniya" to bring it back.
    { name: "Aa Ja Diljaaniya - Amrinder Gill", file: "https://soundcloud.com/hustinder-423562794/aa-ja-diljaaniya", img: "cd6.webp" },
    { name: "Tera Hone Laga Hoon", file: "Tera Hone Laga Hoon.mp3", img: "cd6.webp" },
];

function isPlayableFile(file){
    return !/soundcloud\.com/i.test(file);
}

const songs = rawSongs.filter(song => isPlayableFile(song.file));

const audio = new Audio();
audio.volume = 0.8;

let index = 0;
let isDragging = false;

function formatTime(seconds){
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function setPlayingUI(playing){
    playIcon.classList.toggle("fa-play", !playing);
    playIcon.classList.toggle("fa-pause", playing);
    playbtn.setAttribute("aria-label", playing ? "Pause" : "Play");
    disc.classList.toggle("spinning", playing);
    tonearm.classList.toggle("playing", playing);
}

function showError(message){
    errorEl.textContent = message;
    errorEl.hidden = false;
}

function clearError(){
    errorEl.hidden = true;
    errorEl.textContent = "";
}

function loadSong(i, autoplay = false){
    if (songs.length === 0){
        songname.textContent = "No songs available";
        songmeta.textContent = "";
        return;
    }

    const song = songs[i];
    clearError();

    audio.src = song.file;
    audio.load();
    cover.src = song.img;
    cover.alt = `Cover art for ${song.name}`;
    songname.textContent = song.name;
    songmeta.textContent = `Track ${i + 1} of ${songs.length}`;
    slider.value = 0;
    currentTimeEl.textContent = "0:00";
    durationEl.textContent = "0:00";

    if (autoplay){
        playCurrent();
    } else {
        setPlayingUI(false);
    }
}

function playCurrent(){
    audio.play()
        .then(() => setPlayingUI(true))
        .catch(() => {
            setPlayingUI(false);
            showError("Couldn't play this track. Skipping to the next one…");
            setTimeout(goForward, 1200);
        });
}

function goForward(){
    if (songs.length === 0) return;
    index = (index + 1) % songs.length;
    loadSong(index, true);
}

function goBackward(){
    if (songs.length === 0) return;
    index = (index - 1 + songs.length) % songs.length;
    loadSong(index, true);
}

// --- Initial load ---
if (songs.length === 0){
    songname.textContent = "No songs available";
} else {
    loadSong(index);
}

// --- Controls ---
playbtn.addEventListener("click", () => {
    if (songs.length === 0) return;
    if (audio.paused){
        playCurrent();
    } else {
        audio.pause();
        setPlayingUI(false);
    }
});

forwardBtn.addEventListener("click", goForward);
backBtn.addEventListener("click", goBackward);

// Auto-advance when a track finishes.
audio.addEventListener("ended", goForward);

// Surface playback errors (e.g. missing/broken audio file) instead of failing silently.
audio.addEventListener("error", () => {
    if (!audio.src) return;
    setPlayingUI(false);
    showError(`Couldn't load "${songs[index]?.name}". Check the file is in the project folder.`);
});

// --- Progress / seeking ---
audio.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", () => {
    if (isDragging || !audio.duration) return;
    slider.value = (audio.currentTime / audio.duration) * 100;
    currentTimeEl.textContent = formatTime(audio.currentTime);
});

slider.addEventListener("pointerdown", () => { isDragging = true; });

slider.addEventListener("input", () => {
    if (audio.duration){
        currentTimeEl.textContent = formatTime((slider.value / 100) * audio.duration);
    }
});

function commitSeek(){
    if (isDragging && audio.duration){
        audio.currentTime = (slider.value / 100) * audio.duration;
    }
    isDragging = false;
}
slider.addEventListener("pointerup", commitSeek);
slider.addEventListener("change", commitSeek);

// --- Volume ---
volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value / 100;
});

// --- Keyboard shortcuts (space to play/pause, arrows to skip) ---
document.addEventListener("keydown", (e) => {
    const tag = document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (e.code === "Space"){
        e.preventDefault();
        playbtn.click();
    } else if (e.code === "ArrowRight"){
        goForward();
    } else if (e.code === "ArrowLeft"){
        goBackward();
    }
});

// --- Reset the request form after a fresh page load ---
window.addEventListener("load", () => {
    document.querySelector("form")?.reset();
});