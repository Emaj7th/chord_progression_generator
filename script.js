// URLs for the CSV files
const scalesChordsURL = 'scales_chords.csv';
const chordTypesURL = 'chord_types.csv';
const chordProgressionsURL = 'chord_progressions.csv';

// Select elements in the DOM
const keyDropdown = document.getElementById('key');
const scaleDropdown = document.getElementById('scale');
const progressionDropdown = document.getElementById('progression');
const resultContainer = document.getElementById('result');
const chordChartContainer = document.getElementById('chord-chart');

// Initialize variables for storing parsed data
let scalesChordsData = [];
let chordTypesData = [];
let chordProgressionsData = [];

// Predefined list of musical keys
const musicalKeys = [
  "C", "C#", "Db", "D", "Eb", "E", "F", "F#", "Gb",
  "G", "Ab", "A", "Bb", "B"
];

const keyPreferences = {
  "C": "sharp", "G": "sharp", "D": "sharp", "A": "sharp", "E": "sharp", "B": "sharp",
  "F#": "sharp", "C#": "sharp", "F": "flat", "Bb": "flat", "Eb": "flat",
  "Ab": "flat", "Db": "flat", "Gb": "flat", "Cb": "flat"
};

// Populate "Select Key" dropdown with all musical keys
musicalKeys.forEach((key) => {
  const option = document.createElement('option');
  option.value = key;
  option.textContent = key;
  keyDropdown.appendChild(option);
});

// Helper: Parse CSV to JSON
function parseCSV(url, callback) {
  fetch(url)
    .then((response) => response.text())
    .then((data) => {
      const rows = data.split('\n').filter((row) => row.trim() !== ''); // Remove empty rows
      const headers = rows.shift().split(',').map((header) => header.trim()); // Get headers

      const result = rows.map((row) => {
        const fields = [];
        let currentField = '';
        let inQuotes = false;

        for (let char of row) {
          if (char === '"' && !inQuotes) {
            inQuotes = true; // Start of quoted field
          } else if (char === '"' && inQuotes) {
            inQuotes = false; // End of quoted field
          } else if (char === ',' && !inQuotes) {
            fields.push(currentField.trim()); // Add field
            currentField = ''; // Reset field
          } else {
            currentField += char; // Append to field
          }
        }
        fields.push(currentField.trim()); // Add the last field

        return headers.reduce((obj, header, index) => {
          obj[header] = fields[index] || '';
          return obj;
        }, {});
      });

      callback(result);
    })
    .catch((error) => console.error(`Error loading CSV from ${url}:`, error));
}

// Load all CSV data
Promise.all([
  parseCSV(scalesChordsURL, (data) => scalesChordsData = data),
  parseCSV(chordTypesURL, (data) => chordTypesData = data),
  parseCSV(chordProgressionsURL, (data) => chordProgressionsData = data)
]);

// Populate "Select Scale" dropdown
parseCSV(scalesChordsURL, (data) => {
  scalesChordsData = data;
  const uniqueScales = [...new Set(scalesChordsData.map((row) => row.Scale))];
  uniqueScales.forEach((scale) => {
    const option = document.createElement('option');
    option.value = scale;
    option.textContent = scale;
    scaleDropdown.appendChild(option);
  });
});

// Populate "Select Progression" dropdown
parseCSV(chordProgressionsURL, (data) => {
  chordProgressionsData = data;
  chordProgressionsData.forEach((row) => {
    const progression = row.ChordProgressions.trim().replace(/^"|"$/g, '');
    const option = document.createElement('option');
    option.value = progression;
    option.textContent = progression;
    progressionDropdown.appendChild(option);
  });
});

scaleDropdown.addEventListener('change', () => {
  const selectedScale = scaleDropdown.value;
  const scaleData = scalesChordsData.find((row) => row.Scale === selectedScale);

  if (!scaleData) {
    console.error(`Scale data not found for scale: ${selectedScale}`);
    return;
  }

  // Parse ScaleSteps
  const scaleSteps = scaleData.ScaleSteps
    ? scaleData.ScaleSteps.replace(/^"|"$/g, '').split(',').map(Number)
    : [];
  if (scaleSteps.length === 0) {
    console.error(`Invalid scale steps for scale: ${selectedScale}`);
    return;
  }

  // Filter Progressions
  const validProgressions = chordProgressionsData.filter((row) => {
    const progressionSteps = row.ChordProgressions.split(',').map((x) => parseInt(x.trim()));
    return progressionSteps.every((step) => step >= 1 && step <= scaleSteps.length);
  });

  // Update Progression Dropdown
  progressionDropdown.innerHTML = ''; // Clear existing options
  validProgressions.forEach((row) => {
    const option = document.createElement('option');
    option.value = row.ChordProgressions.trim();
    option.textContent = row.ChordProgressions.trim();
    progressionDropdown.appendChild(option);
  });

  console.log("Filtered Progressions:", validProgressions.map((row) => row.ChordProgressions));
});


// Helper: Calculate notes in the scale
function getScaleNotes(key, scaleSteps) {
  const musicalKeysSimplified = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
  ]; // Simplified version for physical counting

  const keyPreference = keyPreferences[key]; // Determine preference (sharp/flat)
  const rootNoteIndex = musicalKeysSimplified.indexOf(key);

  if (rootNoteIndex === -1) {
    console.error(`Key "${key}" not found in musicalKeysSimplified.`);
    return [];
  }

  // Calculate notes of the scale using physical step progression
  const scaleNotes = scaleSteps.map((step) => {
    const noteIndex = (rootNoteIndex + step) % musicalKeysSimplified.length; // Wrap around
    return musicalKeysSimplified[noteIndex];
  });

  // Adjust notes based on preference (sharp or flat)
  return scaleNotes.map((note) => {
    if (keyPreference === "flat" && note.includes('#')) {
      // Convert sharp to flat using a mapping
      const sharpToFlat = {
        "C#": "Db", "D#": "Eb", "F#": "Gb", "G#": "Ab", "A#": "Bb"
      };
      return sharpToFlat[note] || note;
    } else if (keyPreference === "sharp" && note.includes('b')) {
      // Convert flat to sharp using a mapping
      const flatToSharp = {
        "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#"
      };
      return flatToSharp[note] || note;
    }
    return note; // Return note as-is if no conversion is needed
  });
}



// Helper: Calculate the note at a specific fret on a given string
function calculateNoteAtFret(stringNote, fret) {
  const allNotes = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
  ];
  const startIndex = allNotes.indexOf(stringNote);
  if (startIndex === -1) {
    console.error(`Invalid string note: ${stringNote}`);
    return null;
  }
  return allNotes[(startIndex + fret) % allNotes.length];
}



// Helper: Calculate chord positions dynamically
// All logic remains the same, focusing specifically on `calculateChordPositions` and related areas.
function calculateChordPositions(scaleNotes, rootNote, chordType) {
  const tuning = ["E", "A", "D", "G", "B", "E"]; // Standard guitar tuning
  const allNotes = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
  ];

  console.log(`Scale Notes: ${scaleNotes}, Root Note: ${rootNote}, Chord Type: ${chordType}`);

  const chordTypeData = chordTypesData.find(
    (row) => row.chord.trim().toLowerCase() === chordType.trim().toLowerCase()
  );

  if (!chordTypeData) {
    console.error(`Chord type "${chordType}" not found in chordTypesData.`);
    return [];
  }

  // Get the steps (intervals) for the chord type
  const steps = chordTypeData.chordNotes.split(',').map((step) => parseInt(step.trim()));
  console.log(`Steps for ${chordType}:`, steps);

  // Find the root note's index in `allNotes`
  const rootNoteIndex = allNotes.indexOf(rootNote);
  if (rootNoteIndex === -1) {
    console.error(`Root note "${rootNote}" not found in all notes.`);
    return [];
  }

  // Calculate the actual chord notes using physical counting from `allNotes`
// Calculate the actual chord notes using physical counting
const chordNotes = steps.map((step) => {
  const noteIndex = (rootNoteIndex + step) % allNotes.length; // Wrap around
  const note = allNotes[noteIndex];

  // Respect key preference
  if (note.includes('#') && keyPreferences[rootNote] === "flat") {
    return note.replace('#', 'b');
  } else if (note.includes('b') && keyPreferences[rootNote] === "sharp") {
    return note.replace('b', '#');
  }
  return note;
});

  console.log(`Chord notes for ${rootNote}${chordType}:`, chordNotes);

  // Generate positions for the chord notes on the guitar fretboard
  const positions = [];
  for (let stringIndex = 0; stringIndex < tuning.length; stringIndex++) {
    const stringNote = tuning[stringIndex];
    for (let fret = 0; fret <= 12; fret++) {
      const noteAtFret = calculateNoteAtFret(stringNote, fret);
      if (chordNotes.includes(noteAtFret)) {
        positions.push([fret, stringIndex + 1]); // [fret, string number]
        break; // Stop once we find the first matching note for this string
      }
    }
  }

  console.log(`Positions for ${rootNote}${chordType}:`, positions);
  return positions;
}



function renderChord(container, chordName, chordPositions) {
  console.log("Rendering chord:", chordName);
  console.log("Chord positions:", chordPositions);

  // Validate chordPositions
  if (!Array.isArray(chordPositions) || chordPositions.length === 0) {
    console.error(`Invalid chord positions for ${chordName}`);
    container.textContent = `Unable to render ${chordName}`;
    return;
  }

  // Filter and format the positions to match Svguitar requirements
  const validPositions = chordPositions.map(([fret, string]) => {
    return fret === 'x' ? [string, 'x'] : [string, fret];
  });

  const validFrets = validPositions
    .filter(([string, fret]) => typeof fret === 'number' && fret > 0)
    .map(([string, fret]) => fret);

  const startingFret = validFrets.length > 0 ? Math.min(...validFrets) : 1;

  try {
    const chart = new svguitar.SVGuitarChord(container)
      .configure({
        title: chordName,
        strings: 6,
        frets: 4,
        position: startingFret,
        orientation: 'vertical',
        style: 'normal',
      })
      .chord({
        fingers: validPositions,
      })
      .draw();
  } catch (err) {
    console.error(`Error rendering ${chordName}:`, err);
  }
}



// Generate Progression and Display Results
document.getElementById('generate').addEventListener('click', () => {
  const selectedKey = keyDropdown.value;
  const selectedScale = scaleDropdown.value;
  const selectedProgression = progressionDropdown.value.split(',').map((x) => parseInt(x.trim()));
  const chordSet = document.getElementById('chord-set').value;

  const scaleData = scalesChordsData.find(
    (row) => row.Scale === selectedScale && row.ChordSetName.toLowerCase() === chordSet.toLowerCase()
  );

  if (!scaleData) {
    resultContainer.innerHTML = `<p><strong>Error:</strong> Scale data not found for the selected scale and chord set.</p>`;
    return;
  }

  const scaleSteps = scaleData.ScaleSteps
    ? scaleData.ScaleSteps.replace(/^"|"$/g, '').split(',').map(Number)
    : [];
  const scaleNotes = getScaleNotes(selectedKey, scaleSteps);

  if (!scaleNotes || scaleNotes.length === 0) {
    resultContainer.innerHTML = `<p><strong>Error:</strong> Unable to generate scale notes.</p>`;
    console.error("Error: Scale notes not generated.");
    return;
  }

  const chordTypes = [];
  for (let i = 1; i <= 7; i++) {
    const chordType = scaleData[i];
    chordTypes.push(chordType || '');
  }

  const chords = selectedProgression.map((step) => {
    const note = scaleNotes[step - 1];
    const chordType = chordTypes[step - 1];
    return { name: `${note}${chordType}`, note, chordType };
  });

  resultContainer.innerHTML = `
    <h3>Results</h3>
    <p><strong>Key:</strong> ${selectedKey}</p>
    <p><strong>Scale:</strong> ${scaleNotes.join(', ')}</p>
    <p><strong>Set:</strong> ${chordSet}</p>
    <p><strong>Progression:</strong><br /> ${chords.map(chord => chord.name).join(' | ')}</p>
  `;
  /*
  chordChartContainer.innerHTML = '';

  chords.forEach((chord) => {
    const container = document.createElement('div');
    container.style.margin = '20px';
    chordChartContainer.appendChild(container);

    console.log(`Chord Note: ${chord.note}, Chord Type: ${chord.chordType}, Scale Notes:`, scaleNotes);

    const chordPositions = calculateChordPositions(scaleNotes, chord.note, chord.chordType);
    renderChord(container, chord.name, chordPositions);
  });
  */
});

/*

parseCSV('chord_types.csv', (data) => {
  chordTypesData = data;
  console.log('Parsed Chord Types Data:', chordTypesData);
});



const testContainer = document.createElement('div');
document.body.appendChild(testContainer);

const testChordPositions = [
  [3, 5], // Fret 3, String 5
  [2, 4], // Fret 2, String 4
  [1, 2], // Fret 1, String 2
  [0, 3], // Open String 3
  ['x', 6], // Muted String 6
];

renderChord(testContainer, "Cmaj", testChordPositions);
*/
