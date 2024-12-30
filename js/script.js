// Configuration Constants
const scalesChordsURL = 'data/scales_chords.csv';
const chordProgressionsURL = 'data/chord_progressions.csv';

// Musical constants
const musicalKeys = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
];

// Note simplification map
const noteSimplification = {
  "Dbb": "C", "B##": "C#", "Ebb": "D", "C##": "D",
  "Fbb": "Eb", "D##": "E", "Gbb": "F", "E##": "F#",
  "F##": "G#", "Abb": "G", "G##": "A", "Bbb": "A",
  "Cbb": "Bb", "A##": "B", "B#": "C", "E#": "F"
};

// Piano chord scheme
const chordScheme = {
  "5": [0, 7],
  "7": [0, 4, 7, 10],
  "7sus4": [0, 5, 7, 10],
  "aug": [0, 4, 8],
  "dim": [0, 3, 6],
  "dim7": [0, 3, 6, 9],
  "maj": [0, 4, 7],
  "m": [0, 3, 7],
  "maj7": [0, 4, 7, 11],
  "m7": [0, 3, 7, 10],
  "maj7#5": [0, 4, 8, 11],
  "m7#5": [0, 3, 8, 10],
  "maj7b5": [0, 4, 6, 11],
  "m7b5": [0, 3, 6, 10],
  "mmaj7": [0, 3, 7, 11],
  "sus2": [0, 2, 7],
  "sus4": [0, 5, 7],
};

// DOM Elements
const keyDropdown = document.getElementById('key');
const scaleDropdown = document.getElementById('scale');
const progressionDropdown = document.getElementById('progression');
const resultContainer = document.getElementById('result');
const chordChartContainer = document.getElementById('chord-chart');
const pianoChord0 = document.getElementById('chord0');
const pianoChord1 = document.getElementById('chord1');
const pianoChord2 = document.getElementById('chord2');
const pianoChord3 = document.getElementById('chord3');

// State Management
let scalesChordsData = [];
let chordProgressionsData = [];

// Initialize dropdowns
musicalKeys.forEach((key) => {
  const option = document.createElement('option');
  option.value = key;
  option.textContent = key;
  keyDropdown.appendChild(option);
});

// Data Loading Functions
async function loadAllData() {
  try {
    const [scalesData, progressionsData] = await Promise.all([
      fetch(scalesChordsURL).then(response => response.text()),
      fetch(chordProgressionsURL).then(response => response.text())
    ]);

    scalesChordsData = parseCSVData(scalesData);
    chordProgressionsData = parseCSVData(progressionsData);

    initializeScaleDropdown();
    initializeProgressionDropdown();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function parseCSVData(csvText) {
  const rows = csvText.split('\n').filter(row => row.trim());
  const headers = rows.shift().split(',').map(header => header.trim());

  return rows.map(row => {
    const fields = [];
    let currentField = '';
    let inQuotes = false;

    for (let char of row) {
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim());

    return headers.reduce((obj, header, index) => {
      obj[header] = fields[index] || '';
      return obj;
    }, {});
  });
}

function initializeScaleDropdown() {
  const uniqueScales = [...new Set(scalesChordsData.map(row => row.Scale))];
  uniqueScales.forEach(scale => {
    const option = document.createElement('option');
    option.value = scale;
    option.textContent = scale;
    scaleDropdown.appendChild(option);
  });
}

function initializeProgressionDropdown() {
  chordProgressionsData.forEach(row => {
    const progression = row.ChordProgressions.trim().replace(/^"|"$/g, '');
    const option = document.createElement('option');
    option.value = progression;
    option.textContent = progression;
    progressionDropdown.appendChild(option);
  });
}

// Scale Generation Function
function getScaleNotes(key, scaleName) {
  let scaleNameClean=scaleName.replace(/\s/g, '').toLowerCase();
  console.log(scaleNameClean);
  const scale = pianissimo.note(key).toScale(scaleNameClean).getNotesName();
  let notes = scale.map(note => note.replace(/[0-9]/g, ""));
  
  // Simplify any double sharps/flats
  notes = notes.map(note => noteSimplification[note] || note);
  
  return notes;
}

// Piano Functions
function showPianoChords() {
  document.getElementById('keyboards').classList.remove('piano-hidden');
}

function getNotesFromRoot(rootNote) {
  const notes = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];
  const slicePivot = notes.indexOf(rootNote.toLowerCase());
  if (slicePivot === -1) return [];

  const fromPivot = notes.slice(slicePivot);
  const toPivot = notes.slice(0, slicePivot);
  return [...fromPivot, ...toPivot];
}

function getPianoChord(rootNote, chordType) {
  const notesFromRoot = getNotesFromRoot(rootNote);
  if (notesFromRoot.length > 0 && chordScheme[chordType]) {
    return chordScheme[chordType].map(noteIndex => notesFromRoot[noteIndex]);
  }
  return [];
}

// Rendering Functions
function renderChord(container, chordName) {
  // Simplify any double sharps/flats in the chord name
  const simplifiedName = noteSimplification[chordName.replace(/m.*|dim.*|aug.*|sus.*|[0-9]/g, '')] || 
                        chordName.replace(/m.*|dim.*|aug.*|sus.*|[0-9]/g, '');
  const chordSuffix = chordName.replace(/[A-G][#b]*/g, '');
  const finalChordName = simplifiedName + chordSuffix;

  if (!CHORD_COLLECTION[finalChordName]) {
    const errorDiv = document.createElement('div');
    errorDiv.textContent = `Chord "${chordName}" not available.`;
    container.appendChild(errorDiv);
    return;
  }

  const chordData = CHORD_COLLECTION[finalChordName][0];
  const positions = chordData.positions.join('');
  const fingers = chordData.fingerings[0].join('').replace(/0/g, '-');

  const chordElement = document.createElement('chord');
  chordElement.setAttribute('name', chordName);
  chordElement.setAttribute('positions', positions);
  chordElement.setAttribute('fingers', fingers);
  chordElement.setAttribute('size', '3');
  container.appendChild(chordElement);

  chords.replace();
}

function setActivePianoKeys(chordNotes = [], keyboardDiv) {
  const pianoKeys = document.querySelectorAll(`${keyboardDiv} .key`);
  const pianoKeyNotes = Array.from(pianoKeys, pKey => pKey.dataset.note);
  const keyStartIndex = pianoKeyNotes.indexOf(chordNotes[0]);
  const tmpChordNotes = [...chordNotes];

  pianoKeys.forEach((pianoKey, i) => {
    if (tmpChordNotes.includes(pianoKeyNotes[i]) && i >= keyStartIndex) {
      pianoKey.classList.add("active");
      tmpChordNotes.splice(tmpChordNotes.indexOf(pianoKeyNotes[i]), 1);
    } else {
      pianoKey.classList.remove("active");
    }
  });
}

function renderChanges({ rootNote, chordType, keyboardDiv }) {
  if (rootNote && chordType) {
    const chordNotes = getPianoChord(rootNote, chordType);
    setActivePianoKeys(chordNotes, keyboardDiv);
    
  }
}

// Event Handlers
scaleDropdown.addEventListener('change', () => {
  const selectedScale = scaleDropdown.value;
  const scaleData = scalesChordsData.find(row => row.Scale === selectedScale);

  if (!scaleData) return;

  const scaleNotes = getScaleNotes(keyDropdown.value, selectedScale);
  const validProgressions = chordProgressionsData.filter(row => {
    const progressionSteps = row.ChordProgressions.split(',').map(x => parseInt(x.trim()));
    return progressionSteps.every(step => step >= 1 && step <= scaleNotes.length);
  });

  progressionDropdown.innerHTML = '';
  validProgressions.forEach(row => {
    const option = document.createElement('option');
    option.value = row.ChordProgressions.trim();
    option.textContent = row.ChordProgressions.trim();
    progressionDropdown.appendChild(option);
  });
});

document.getElementById('random').addEventListener('click', () => {
  // First update the key and scale
  const randomKey = musicalKeys[Math.floor(Math.random() * musicalKeys.length)];
  keyDropdown.value = randomKey;

  const scales = Array.from(scaleDropdown.options).map(option => option.value);
  const randomScaleIndex = Math.floor(Math.random() * scales.length);
  scaleDropdown.value = scales[randomScaleIndex];

  // Trigger scale change to update progressions
  scaleDropdown.dispatchEvent(new Event('change'));
  // Display Piano diagrams:
  showPianoChords();
  // Use Promise to ensure scale change is complete
  Promise.resolve().then(() => {
    // Then update progression and chord set
    const progressions = Array.from(progressionDropdown.options).map(option => option.value);
    progressionDropdown.value = progressions[Math.floor(Math.random() * progressions.length)];

    const chordSets = Array.from(document.getElementById('chord-set').options).map(option => option.value);
    document.getElementById('chord-set').value = chordSets[Math.floor(Math.random() * chordSets.length)];

    // Finally trigger generate to update display
    document.getElementById('generate').click();
  });
});

document.getElementById('generate').addEventListener('click', () => {
  const selectedKey = keyDropdown.value;
  const selectedScale = scaleDropdown.value;
  const selectedProgression = progressionDropdown.value.split(',').map(x => parseInt(x.trim()));
  const chordSet = document.getElementById('chord-set').value;

  const scaleData = scalesChordsData.find(
    row => row.Scale === selectedScale && row.ChordSetName.toLowerCase() === chordSet.toLowerCase()
  );

  if (!scaleData) {
    resultContainer.innerHTML = `<p><strong>Error:</strong> Scale data not found for the selected scale and chord set.</p>`;
    return;
  }
  // Display Piano diagrams:
  showPianoChords();

  const scaleNotes = getScaleNotes(selectedKey, selectedScale);
  const chordTypes = Array(7).fill('').map((_, i) => scaleData[i + 1] || '');

  const chords = selectedProgression.map(step => {
    const note = scaleNotes[step - 1];
    const chordType = chordTypes[step - 1];
    const chordName = chordType === 'maj' ? note : `${note}${chordType}`;

    return { 
      name: chordName, 
      note: note, 
      chordType: chordType 
    };
  });

  resultContainer.innerHTML = `
    <h2><strong>${selectedKey} ${selectedScale}</strong></h2>
    <div><strong>Scale Notes:</strong> ${scaleNotes.join(', ')}</div>
    <div><strong>Set:</strong> ${chordSet}</div>
    <div><strong>Progression:</strong> ${chords.map(chord => chord.name).join(' | ')}</div>
  `;

  // Render chord diagrams
  chordChartContainer.innerHTML = '';
  chords.forEach((chord, index) => {
    const container = document.createElement('div');
    container.style.margin = '4px';
    chordChartContainer.appendChild(container);
    renderChord(container, chord.name);
 
    // Handle piano chord display
    if (index === 0) {
      pianoChord0.innerHTML = chord.name;
      renderChanges({ rootNote: chord.note.toLowerCase(), chordType: chord.chordType, keyboardDiv: '#piano-keyboard0' });
    } else if (index === 1) {
      pianoChord1.innerHTML = chord.name;
      renderChanges({ rootNote: chord.note.toLowerCase(), chordType: chord.chordType, keyboardDiv: '#piano-keyboard1' });
    } else if (index === 2) {
      pianoChord2.innerHTML = chord.name;
      renderChanges({ rootNote: chord.note.toLowerCase(), chordType: chord.chordType, keyboardDiv: '#piano-keyboard2' });
    } else if (index === 3) {
      pianoChord3.innerHTML = chord.name;
      renderChanges({ rootNote: chord.note.toLowerCase(), chordType: chord.chordType, keyboardDiv: '#piano-keyboard3' });
    }
  });
  
  // Update guitar neck with new scale
  launch(selectedKey, selectedScale);
});

// Initialize data loading on script load
loadAllData();