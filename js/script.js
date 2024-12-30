// Configuration Constants
const scalesChordsURL = 'data/scales_chords.csv';
const chordProgressionsURL = 'data/chord_progressions.csv';
const keyboardRhythmsURL = 'data/keyboard_rhythms.csv';
let keyboardRhythmsData = [];

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
    const [scalesData, progressionsData, rhythmsData] = await Promise.all([
      fetch(scalesChordsURL).then(response => response.text()),
      fetch(chordProgressionsURL).then(response => response.text()),
      fetch(keyboardRhythmsURL).then(response => response.text())
    ]);

    scalesChordsData = parseCSVData(scalesData);
    chordProgressionsData = parseCSVData(progressionsData);
    keyboardRhythmsData = parseCSVData(rhythmsData);

    initializeScaleDropdown();
    initializeProgressionDropdown();
    initializeRhythmDropdown();
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

// Add this function for rhythm dropdown initialization
function initializeRhythmDropdown() {
  const rhythmSelect = document.createElement('select');
  rhythmSelect.id = 'rhythm-select';
  rhythmSelect.className = 'rhythm-select';
  const optionnote = document.createElement('option');
  optionnote.textContent = 'Click to Select a Rhythm';
  rhythmSelect.appendChild(optionnote);
  keyboardRhythmsData.forEach(rhythm => {
    const option = document.createElement('option');
    option.value = rhythm.name;
    option.textContent = rhythm.name;
    rhythmSelect.appendChild(option);
  });

  return rhythmSelect;
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
  // Convert flats to sharps for lookup
  const flatToSharp = {
    'db': 'c#', 'eb': 'd#', 'gb': 'f#', 'ab': 'g#', 'bb': 'a#'
  };
  const normalizedRoot = rootNote.toLowerCase();
  const lookupNote = flatToSharp[normalizedRoot] || normalizedRoot;
  
  const slicePivot = notes.indexOf(lookupNote);
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

  if (window.chords && window.chords.replace) {
    window.chords.replace();
  }
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

// Add Tone.js initialization and control
const sampler = new Tone.Sampler({
  urls: {
    A0: "A0.mp3",
    C1: "C1.mp3",
    "D#1": "Ds1.mp3",
    "F#1": "Fs1.mp3",
    A1: "A1.mp3",
    C2: "C2.mp3",
    "D#2": "Ds2.mp3",
    "F#2": "Fs2.mp3",
    A2: "A2.mp3",
    C3: "C3.mp3",
    "D#3": "Ds3.mp3",
    "F#3": "Fs3.mp3",
    A3: "A3.mp3",
    C4: "C4.mp3",
    "D#4": "Ds4.mp3",
    "F#4": "Fs4.mp3",
    A4: "A4.mp3",
    C5: "C5.mp3",
    "D#5": "Ds5.mp3",
    "F#5": "Fs5.mp3",
    A5: "A5.mp3",
    C6: "C6.mp3",
    "D#6": "Ds6.mp3",
    "F#6": "Fs6.mp3",
    A6: "A6.mp3",
    C7: "C7.mp3",
    "D#7": "Ds7.mp3",
    "F#7": "Fs7.mp3",
    A7: "A7.mp3",
    C8: "C8.mp3",
  },
  release: 1,
  baseUrl: "https://tonejs.github.io/audio/salamander/",
}).toDestination();

// Progression Looper class
class ProgressionLooper {
  constructor() {
    this.isPlaying = false;
    this.currentBPM = 120;
    this.currentVolume = -12;
    this.leftOctave = 3;
    this.rightOctave = 5;
    this.currentChords = [];
    this.currentRhythm = null;
    this.loop = null;
  }

  createControls() {
    const container = document.createElement('div');
    container.className = 'progression-looper';
    
    const title = document.createElement('h3');
    title.textContent = 'Progression Looper';
    
    // Transport controls
    const controls = document.createElement('div');
    controls.className = 'transport-controls';
    
    const playButton = document.createElement('button');
    playButton.innerHTML = '▶';
    playButton.id ='playButton'
    // Bind the click handler to maintain 'this' context
    playButton.addEventListener('click', () => {
      console.log('Play button clicked');
      console.log('Current state:', {
          rhythm: this.currentRhythm,
          chords: this.currentChords,
          isPlaying: this.isPlaying
      });
      this.startLoop();
    });

    const stopButton = document.createElement('button');
    stopButton.innerHTML = '⏹';
    stopButton.id = 'stopButton';
    stopButton.addEventListener('click', () => {
        console.log('Stop button clicked');
        this.stopLoop();
    });
    
    // BPM control
    const bpmSelect = document.createElement('select');
    for (let bpm = 60; bpm <= 200; bpm += 10) {
      const option = document.createElement('option');
      option.value = bpm;
      option.textContent = `${bpm} BPM`;
      if (bpm === 120) option.selected = true;
      bpmSelect.appendChild(option);
    }
    bpmSelect.onchange = (e) => {
      this.currentBPM = parseInt(e.target.value);
      if (this.isPlaying) {
        Tone.Transport.bpm.value = this.currentBPM;
      }
    };

    // Volume slider
    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = -60;
    volumeSlider.max = 0;
    volumeSlider.value = this.currentVolume;
    volumeSlider.className = 'volume-slider';
    volumeSlider.oninput = (e) => {
      this.currentVolume = parseInt(e.target.value);
      sampler.volume.value = this.currentVolume;
    };

    const rhythmTitle = document.createElement('div');
    rhythmTitle.textContent = 'Keyboard Rhythms';

    // Rhythm selector
    const rhythmSelect = initializeRhythmDropdown();
    rhythmSelect.onchange = (e) => {
      this.currentRhythm = keyboardRhythmsData.find(r => r.name === e.target.value);
      if (this.isPlaying) {
        this.restartLoop();
      }
    };

    // Assemble controls
    controls.appendChild(playButton);
    controls.appendChild(stopButton);
    controls.appendChild(bpmSelect);
    controls.appendChild(volumeSlider);
    
    container.appendChild(title);
    container.appendChild(controls);
    container.appendChild(rhythmTitle);
    container.appendChild(rhythmSelect);

    return container;
  }

  setChords(chords) {
    this.currentChords = chords;
  }

  createChordNotes(chord, octave) {
    console.log('Creating chord notes:', {
      chord,
      octave,
      chordType: chord.chordType
    });
    // Convert chord to array of notes with octave
    const baseNote = chord.note;
    const chordType = chord.chordType;
    
    // Use existing chordScheme
    const scheme = chordScheme[chordType] || chordScheme['maj'];
    return scheme.map(interval => {
        const note = Tone.Frequency(baseNote + octave).transpose(interval);
        return note.toNote();
    });
  }

  parseNoteValue(noteType) {
    const noteValues = {
      'W': '1n',    // whole note
      'H': '2n',    // half note
      'Q': '4n',    // quarter note
      'E': '8n',    // eighth note
      'dH': '2n.',  // dotted half note
      'dQ': '4n.',  // dotted quarter note
      'dE': '8n.'   // dotted eighth note
    };
    return noteValues[noteType] || '4n';
  }

  startLoop() {
    console.log('StartLoop called', {
      hasRhythm: !!this.currentRhythm,
      chordCount: this.currentChords.length,
      rhythm: this.currentRhythm
    });
    if (!this.currentRhythm || this.currentChords.length === 0) return;
    
    this.isPlaying = true;
    Tone.Transport.bpm.value = this.currentBPM;

    // Create left and right hand patterns
    const leftHandPattern = [
      this.currentRhythm.left1.split(','),
      this.currentRhythm.left2.split(','),
      this.currentRhythm.left3.split(','),
      this.currentRhythm.left4.split(',')
    ];
    console.log('Left hand pattern:', leftHandPattern);
    const rightHandPattern = [
      this.currentRhythm.right1.split(','),
      this.currentRhythm.right2.split(','),
      this.currentRhythm.right3.split(','),
      this.currentRhythm.right4.split(',')
    ];
    console.log('Right hand pattern:', rightHandPattern);
    let currentBeat = 0;
    const totalBeats = 16; // 4 chords * 4 beats each

    this.loop = new Tone.Loop((time) => {
      console.log('Loop iteration:', {
        currentBeat,
        chordIndex: Math.floor(currentBeat / 4),
        beatInChord: currentBeat % 4
      });
      const chordIndex = Math.floor(currentBeat / 4);
      const beatInChord = currentBeat % 4;
      
      // Process left hand
      const leftBeat = leftHandPattern[chordIndex][beatInChord];
      if (leftBeat.startsWith('1')) {
        const noteType = leftBeat.substring(1);
        const duration = this.parseNoteValue(noteType);
        const notes = this.createChordNotes(this.currentChords[chordIndex], this.leftOctave);
        console.log('Playing left hand:', {
          notes,
          duration,
          time
        });
        sampler.triggerAttackRelease(notes, duration, time);
      }

      // Process right hand
      const rightBeat = rightHandPattern[chordIndex][beatInChord];
      if (rightBeat.startsWith('1')) {
        const noteType = rightBeat.substring(1);
        const duration = this.parseNoteValue(noteType);
        const notes = this.createChordNotes(this.currentChords[chordIndex], this.rightOctave);
        console.log('Playing right hand:', {
          notes,
          duration,
          time
        });
        sampler.triggerAttackRelease(notes, duration, time);
      }

      currentBeat = (currentBeat + 1) % totalBeats;
    }, "4n").start(0);

    Tone.Transport.start();
  }

  stopLoop() {
    this.isPlaying = false;
    if (this.loop) {
      this.loop.stop();
      this.loop.dispose();
    }
    Tone.Transport.stop();
  }

  restartLoop() {
    this.stopLoop();
    this.startLoop();
  }
}

// Instance of the Progression Looper
const progressionLooper = new ProgressionLooper();

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
  progressionLooper.setChords(chords);
  resultContainer.innerHTML = `
    <div class="scale-info"><h2><strong>${selectedKey} ${selectedScale}</strong></h2>
    <div><strong>Scale Notes:</strong> ${scaleNotes.join(', ')}</div>
    <div><strong>Set:</strong> ${chordSet}</div>
    <div><strong>Progression:</strong> ${chords.map(chord => chord.name).join(' | ')}</div></div>
    <div class="progression-looper-container"></div><br clear="ALL" />
  `;

  // Set the chords before creating controls
  progressionLooper.setChords(chords);

  // Append the controls to the container instead of using innerHTML
  const looperContainer = resultContainer.querySelector('.progression-looper-container');
  looperContainer.appendChild(progressionLooper.createControls());

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