// Configuration Constants
const scalesChordsURL = 'data/scales_chords.csv';
const chordProgressionsURL = 'data/chord_progressions.csv';
const bassPatternsURL = 'data/bass_patterns.csv';
const keyboardRhythmsURL = 'data/keyboard_rhythms.csv';
let keyboardRhythmsData = [];
const drumPatternsURL = 'data/drum_patterns.json';
let drumPatternsData = [];

// Musical constants
const musicalKeys = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
];

// Note simplification map
const noteSimplification = {
  "Dbb": "C", "B##": "C#", "Ebb": "D", "C##": "D",
  "Fbb": "Eb", "D##": "E", "Gbb": "F", "E##": "F#",
  "F##": "G#", "Abb": "G", "G##": "A", "Bbb": "A",
  "Cbb": "Bb", "A##": "B", "B#": "C", "E#": "F","Cb": "B"
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
const looperContainer = document.getElementById('looper');
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
    const [scalesData, progressionsData, rhythmsData, drumsData] = await Promise.all([
      fetch(scalesChordsURL).then(response => response.text()),
      fetch(chordProgressionsURL).then(response => response.text()),
      fetch(keyboardRhythmsURL).then(response => response.text()),
      fetch(drumPatternsURL).then(response => response.json())
    ]);

    scalesChordsData = parseCSVData(scalesData);
    chordProgressionsData = parseCSVData(progressionsData);
    keyboardRhythmsData = parseCSVData(rhythmsData);
    drumPatternsData = drumsData.drumPatterns;

    initializeScaleDropdown();
    initializeProgressionDropdown();
    initializeRhythmDropdown();
    initializeDrumPatternDropdown();
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

// Add new function for drum pattern dropdown
function initializeDrumPatternDropdown() {
    const drumSelect = document.createElement('select');
    drumSelect.id = 'drum-select';
    drumSelect.className = 'drum-select';

    // Add "None" option
    const noneOption = document.createElement('option');
    noneOption.value = '';
    noneOption.textContent = 'No Drums';
    drumSelect.appendChild(noneOption);
    
    // Add patterns
    drumPatternsData.forEach(pattern => {
        const option = document.createElement('option');
        option.value = pattern.patternName;
        option.textContent = pattern.patternName;
        drumSelect.appendChild(option);
    });

    return drumSelect;
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

var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.display === "block") {
      content.style.display = "none";
    } else {
      content.style.display = "block";
    }
  });
}

// Add Tone.js initialization and control
const reverb = new Tone.Reverb({
  decay: 3,     // Reverb tail length in seconds
  preDelay: 0.02, // Slight delay before reverb starts
  wet: 0.5        // Mix between dry (0) and wet (1) signal
}).toDestination();

 
const sampler = new Tone.Sampler({
  urls: {
    A1: "A1.mp3",
    B1: "B1.mp3",
    Db2: "Db2.mp3",
    Eb2: "Eb2.mp3",
    F2: "F2.mp3",
    Ab2: "Ab2.mp3",
    Bb2: "Bb2.mp3",
    C3: "C3.mp3",
    D3: "D3.mp3",
    F3: "F3.mp3",
    A3: "A3.mp3",
    C4: "C4.mp3",
    D4: "D4.mp3",
    E4: "E4.mp3",
    Gb4: "Gb4.mp3",
    A4: "A4.mp3",
    B4: "B4.mp3",
    D5: "D5.mp3",
    Gb5: "Gb5.mp3",
    A5: "A5.mp3",
    B5: "B5.mp3",
    D6: "D6.mp3",
    E6: "E6.mp3",
    Ab6: "Ab6.mp3",
    B6: "B6.mp3",
    D7: "D7.mp3",
    F7: "F7.mp3",
    G7: "G7.mp3",
    A7: "A7.mp3",
    B7: "B7.mp3"
  },
  release: 1,
  baseUrl: "../samples/piano/",
}).connect(reverb);  // Connect to reverb instead of toDestination()

// Add after piano sampler setup
const drumKit = new Tone.Sampler({
    urls: {
        'C1': 'kick.mp3',
        'D1': 'snare.mp3',
        'E1': 'hatopen.mp3',
        'F1': 'hatclosed.mp3',
        'G1': 'ride.mp3',
        'A1': 'stick.mp3'
    },
    baseUrl: 'samples/drum/',
    release: 1,
}).toDestination();

// Drum note mapping
const drumNoteMap = {
    'kick': 'C1',
    'snare': 'D1',
    'hatopen': 'E1',
    'hatclosed': 'F1',
    'ride': 'G1',
    'stick': 'A1'
};

// Progression Looper class
class ProgressionLooper {
  constructor() {
    this.isPlaying = false;
    this.currentBPM = 50;
    this.currentVolume = -5;
    this.leftOctave = 3;    //defines where the left hand's chords start
    this.rightOctave = 5;   //defines where the right hand's chords start
    this.currentChords = [];
    this.currentRhythm = null;
    this.loop = null;
    this.currentDrumPattern = null;
    this.drumVolume = -12;
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
    for (let bpm = 30; bpm <= 140; bpm += 10) {
      const option = document.createElement('option');
      option.value = bpm/2;
      option.textContent = `${bpm} BPM`;
      if (bpm === 100) option.selected = true;
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

    // Reverb control
    const reverbSlider = document.createElement('input');
    reverbSlider.type = 'range';
    reverbSlider.min = 0;
    reverbSlider.max = 100;
    reverbSlider.value = 25;  // Default 25% wet signal
    reverbSlider.className = 'reverb-slider';
    reverbSlider.oninput = (e) => {
        const wetness = parseInt(e.target.value) / 100;
        reverb.wet.value = wetness;
    };

    // Add label for reverb
    const reverbLabel = document.createElement('div');
    reverbLabel.textContent = 'Reverb';
    reverbLabel.className = 'control-label';
    
    // Create container for swing controls
    const swingControls = document.createElement('div');
    swingControls.className = 'swing-controls';
    
    // Swing Amount dropdown
    const swingSelect = document.createElement('select');
    swingSelect.className = 'swing-select';
    [0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6].forEach(amount => {
        const option = document.createElement('option');
        option.value = amount;
        option.textContent = `${amount * 100}%`;
        if (amount === 0.0) option.selected = true;  // Default value OFF
        swingSelect.appendChild(option);
    });
    swingSelect.onchange = (e) => {
        Tone.Transport.swing = parseFloat(e.target.value);
        console.log('swingSelect:', e.target.value);
    };

    // Swing Subdivision dropdown
    const subdivisionSelect = document.createElement('select');
    subdivisionSelect.className = 'subdivision-select';
    ['4n', '8n', '16n'].forEach(subdivision => {
        const option = document.createElement('option');
        option.value = subdivision;
        option.textContent = subdivision;
        if (subdivision === '16n') option.selected = true;  // Default value
        subdivisionSelect.appendChild(option);
    });
    subdivisionSelect.onchange = (e) => {
        Tone.Transport.swingSubdivision = e.target.value;
    };    

    // Add labels and combine controls for Swing and Sub Divisions
    const swingLabel = document.createElement('span');
    swingLabel.textContent = 'Swing: ';
    const subdivisionLabel = document.createElement('span');
    subdivisionLabel.textContent = ' Sub: ';
    const rhythmTitle = document.createElement('div');
    rhythmTitle.textContent = 'Piano:';

    // Rhythm selector
    const rhythmSelect = initializeRhythmDropdown();
    rhythmSelect.onchange = (e) => {
      this.currentRhythm = keyboardRhythmsData.find(r => r.name === e.target.value);
      if (this.isPlaying) {
        this.restartLoop();
      }
    };

    // Add drum pattern selector and volume
    const drumControls = document.createElement('div');
    drumControls.className = 'drum-controls';
    
    const drumLabel = document.createElement('div');
    drumLabel.textContent = 'Drums:';
    
    const drumSelect = initializeDrumPatternDropdown();
    drumSelect.onchange = (e) => {
        this.currentDrumPattern = drumPatternsData.find(p => p.patternName === e.target.value);
    };

    const drumVolumeSlider = document.createElement('input');
    drumVolumeSlider.type = 'range';
    drumVolumeSlider.min = -60;
    drumVolumeSlider.max = 0;
    drumVolumeSlider.value = this.drumVolume;
    drumVolumeSlider.className = 'volume-slider';
    drumVolumeSlider.oninput = (e) => {
        this.drumVolume = parseInt(e.target.value);
        drumKit.volume.value = this.drumVolume;
    };

    // Assemble controls
    controls.appendChild(playButton);
    controls.appendChild(stopButton);
    controls.appendChild(bpmSelect);
    

    swingControls.appendChild(swingLabel);
    swingControls.appendChild(swingSelect);
    swingControls.appendChild(subdivisionLabel);
    swingControls.appendChild(subdivisionSelect);  
    
    drumControls.appendChild(drumLabel);
    drumControls.appendChild(drumSelect);
    drumControls.appendChild(drumVolumeSlider);
    
    container.appendChild(title);
    container.appendChild(controls);
    container.appendChild(rhythmTitle);
    container.appendChild(rhythmSelect);
    container.appendChild(volumeSlider);
    container.appendChild(drumControls);
    container.appendChild(swingControls);
    container.appendChild(reverbLabel);
    container.appendChild(reverbSlider);

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

    processDrumPattern(time, currentBeat) {
        if (!this.currentDrumPattern) return;

        const measureIndex = Math.floor(currentBeat / 16);
        const eighthNote = currentBeat % 16;

        Object.entries(this.currentDrumPattern).forEach(([drum, pattern]) => {
            if (drum === 'patternName') return;

            const patterns = pattern.split(',');
            const currentPattern = patterns[measureIndex];
            
            if (currentPattern[eighthNote] === '1') {
                // Randomize velocity between 0.7 and 1.0
                const velocity = 0.7 + Math.random() * 0.3;
                const note = drumNoteMap[drum];
                if (note) {
                    drumKit.triggerAttackRelease(note, '16n', time, velocity);
                }
            }
        });
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
    Tone.Transport.swing = parseFloat(document.querySelector('.swing-select').value);
    Tone.Transport.swingSubdivision = document.querySelector('.subdivision-select').value;

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
      //const eighthNoteIndex = currentBeat * 2;  // Convert quarter notes to eighth notes?
      const sixteenthNoteIndex = currentBeat * 4; 
      // Process drum pattern
      this.processDrumPattern(time, sixteenthNoteIndex);

      // Clear previous highlight
      for (let i = 0; i < 4; i++) {
        const container = document.getElementById(`chord-container-${i}`);
        if (container) {
          container.style.backgroundColor = '';
        }
      } 
  
      // Highlight current chord
      const currentContainer = document.getElementById(`chord-container-${chordIndex}`);
      if (currentContainer) {
          currentContainer.style.backgroundColor = '#FFA500';  // Orange highlight
      }

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
    }, "16n").start(0);

    Tone.Transport.start('+1');
  }

  stopLoop() {
    this.isPlaying = false;
    if (this.loop) {
      this.loop.stop();
      this.loop.dispose();
    }
    Tone.Transport.stop();
    // Clear any remaining highlights
    for (let i = 0; i < 4; i++) {
      const container = document.getElementById(`chord-container-${i}`);
      if (container) {
          container.style.backgroundColor = '';
      }
    }
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
  // Check which settings should be randomized
  const randomizeKey = document.getElementById('randomKey').checked;
  const randomizeScale = document.getElementById('randomScale').checked;
  const randomizeChordSet = document.getElementById('randomChordSet').checked;
  const randomizeProgression = document.getElementById('randomProgression').checked;

  // Only randomize key if checkbox is checked
  if (randomizeKey) {
    const randomKey = musicalKeys[Math.floor(Math.random() * musicalKeys.length)];
    keyDropdown.value = randomKey;
  }

  // Only randomize scale if checkbox is checked
  if (randomizeScale) {
    const scales = Array.from(scaleDropdown.options).map(option => option.value);
    const randomScaleIndex = Math.floor(Math.random() * scales.length);
    scaleDropdown.value = scales[randomScaleIndex];
  }

  // Trigger scale change to update progressions
  scaleDropdown.dispatchEvent(new Event('change'));
  
  // Display Piano diagrams
  showPianoChords();

  Promise.resolve().then(() => {
    // Only randomize progression if checkbox is checked
    if (randomizeProgression) {
      const progressions = Array.from(progressionDropdown.options).map(option => option.value);
      progressionDropdown.value = progressions[Math.floor(Math.random() * progressions.length)];
    }

    // Only randomize chord set if checkbox is checked
    if (randomizeChordSet) {
      const chordSets = Array.from(document.getElementById('chord-set').options).map(option => option.value);
      document.getElementById('chord-set').value = chordSets[Math.floor(Math.random() * chordSets.length)];
    }

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
    <div><strong>Scale Chords:</strong> ${scaleNotes.map((note, index) => {
        const chordType = chordTypes[index];
        return chordType === 'maj' ? note : `${note}${chordType}`;
    }).join(' | ')}</div>
    <div><strong>Set:</strong> ${chordSet}</div>
    <div><strong>Progression:</strong> ${chords.map(chord => chord.name).join(' | ')}</div></div>
  `;

  // Set the chords before creating controls
  progressionLooper.setChords(chords);

  // Append the controls to the container instead of using innerHTML
  const lContainer = looperContainer.querySelector('.progression-looper-container');
  lContainer.innerHTML = "";
  lContainer.appendChild(progressionLooper.createControls());

  // Render chord diagrams
  chordChartContainer.innerHTML = '';
  chords.forEach((chord, index) => {
    const container = document.createElement('div');
    container.id = `chord-container-${index}`;
    container.style.padding = '4px';  // Changed from margin to padding
    container.style.transition = 'background-color 0.3s';  // Smooth transition for highlight
    chordChartContainer.appendChild(container);
    renderChord(container, chord.name);;
 
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