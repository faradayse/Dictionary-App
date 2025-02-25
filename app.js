// app.js
const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const definitionDiv = document.getElementById("definition");
const recentSearchesDiv = document.getElementById("recent-searches");
const wordInput = document.getElementById("word-input");

// Load recent searches from localStorage
function loadRecentSearches() {
    return JSON.parse(localStorage.getItem("recentSearches")) || [];
}

// Save recent searches to localStorage
function saveRecentSearches(searches, word) {
    searches.unshift(word); // Add new word to the start
    searches = [...new Set(searches)].slice(0, 5); // Unique, max 5
    localStorage.setItem("recentSearches", JSON.stringify(searches));
    updateRecentSearchesDisplay(searches);
}

// Update the recent searches display
function updateRecentSearchesDisplay(searches) {
    recentSearchesDiv.textContent = searches.length
        ? `Recent Searches: ${searches.join(", ")}`
        : "Recent Searches: None";
}

// Clear recent searches
function clearRecentSearches() {
    localStorage.removeItem("recentSearches");
    updateRecentSearchesDisplay([]);
}

// Fetch word definition from API
async function fetchDefinition(word) {
    try {
        const response = await fetch(`${API_URL}${word}`);
        if (!response.ok) {
            definitionDiv.textContent = response.status === 404 
                ? "Word not found in dictionary." 
                : "API error occurred.";
            return null;
        }
        const data = await response.json();
        return data[0]; // First entry
    } catch (error) {
        definitionDiv.textContent = "Network error. Please check your connection.";
        return null;
    }
}

// Display the definition
function displayDefinition(wordData) {
    definitionDiv.innerHTML = ""; // Clear previous content
    if (!wordData) return;

    const wordTitle = document.createElement("h2");
    wordTitle.textContent = wordData.word;
    definitionDiv.appendChild(wordTitle);

    // Add pronunciation if available
    const phonetic = wordData.phonetics.find(p => p.audio);
    if (phonetic && phonetic.audio) {
        const audioUrl = phonetic.audio.startsWith("http") ? phonetic.audio : `https:${phonetic.audio}`;
        const audio = document.createElement("audio");
        audio.src = audioUrl;
        audio.controls = true;
        audio.onerror = () => {
            definitionDiv.appendChild(document.createTextNode(" (Audio unavailable)"));
        };
        definitionDiv.appendChild(audio);
        // Debug: Log the audio URL
        console.log("Audio URL:", audioUrl);
    }

    wordData.meanings.forEach(meaning => {
        const part = document.createElement("p");
        part.innerHTML = `<strong>${meaning.partOfSpeech}</strong>`;
        definitionDiv.appendChild(part);

        meaning.definitions.forEach(def => {
            const defItem = document.createElement("p");
            defItem.textContent = `- ${def.definition}`;
            definitionDiv.appendChild(defItem);
        });
    });
}

// Handle search button click or Enter key
async function searchWord() {
    const word = wordInput.value.trim().toLowerCase();
    if (!word || !/^[a-z]+$/i.test(word)) {
        definitionDiv.textContent = "Please enter a valid word (letters only).";
        return;
    }

    definitionDiv.innerHTML = "<p>Loading...</p>";
    const wordData = await fetchDefinition(word);
    displayDefinition(wordData);

    // Only save to recent searches if valid data is returned
    if (wordData && wordData.word) {
        const recentSearches = loadRecentSearches();
        saveRecentSearches(recentSearches, word);
    }

    wordInput.value = ""; // Clear input
}

// Add Enter key support
wordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchWord();
});

// Initialize recent searches on page load
document.addEventListener("DOMContentLoaded", () => {
    const recentSearches = loadRecentSearches();
    updateRecentSearchesDisplay(recentSearches);
});