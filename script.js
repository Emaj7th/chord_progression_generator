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

function getChordHtml(chordName,layout,size) {
  var size = size || 5
  var chordsHtmlArr = []   //example: <chord name="D" positions="xx0232" fingers="---132" size="3" ></chord>
  var chordVariations = []
  if (CHORD_COLLECTION[chordName]) {
      chordVariations = CHORD_COLLECTION[chordName]
  } else {
      chordVariations.push({positions:['x','x','x','x','x','x'],fingerings:[[0,0,0,0,0,0]]})
      chordName = chordName + ' (N/A)'
  }
  chordVariations.forEach(function(variation,i){
      var positionsStr = variation.positions.join('')
      variation.fingerings.forEach(function(fingering,i){
          var fingeringStr = fingering.join('').replace(/0/g,'-')
          if (positionsStr.length===6 && fingeringStr.length===6 && positionsStr !== 'xxxxxx') {
              var chordHtml = '<chord name="' + chordName  + '" positions="' + positionsStr + '" fingers="' + fingeringStr + '" size="' + size + '" layout="' + layout + '" strings="EADGBe"></chord>'
              chordsHtmlArr.push(chordHtml)
          }
      })
  })
  return chordsHtmlArr
}

// Render chord diagrams using chords.js and CHORD_COLLECTION
function renderChord(container, chordName) {
  console.log(`Rendering chord: ${chordName}`);

  // Check if the chord exists in CHORD_COLLECTION
  if (!CHORD_COLLECTION[chordName]) {
      console.error(`Chord "${chordName}" not found in CHORD_COLLECTION.`);
      const errorDiv = document.createElement('div');
      errorDiv.textContent = `Chord "${chordName}" not available.`;
      container.appendChild(errorDiv);
      return;
  }

  // Get the first variation of the chord
  const chordData = CHORD_COLLECTION[chordName][0];
  const positions = chordData.positions.join('');
  const fingers = chordData.fingerings[0].join('').replace(/0/g, '-');

  console.log(`Chord data for ${chordName}:`, { positions, fingers });

  // Create a <chord> element
  const chordElement = document.createElement('chord');
  chordElement.setAttribute('name', chordName);
  chordElement.setAttribute('positions', positions);
  chordElement.setAttribute('fingers', fingers);
  chordElement.setAttribute('size', '3'); // Size of the chord diagram
  container.appendChild(chordElement);

  // Call chords.replace() to render the chord
  chords.replace();
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

  const invalidNotes = selectedProgression.filter((step) => step < 1 || step > scaleSteps.length);
  if (invalidNotes.length > 0) {
      resultContainer.innerHTML = `<p><strong>Error:</strong> This progression includes notes outside of the selected scale.</p>`;
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
      if (chordType === 'maj') {
          return { name: `${note}`, note, chordType };
      } else {
          return { name: `${note}${chordType}`, note, chordType };
      }
  });

  // Output results
  resultContainer.innerHTML = `
      <div><strong>Key:</strong> ${selectedKey}</div>
      <div><strong>Scale:</strong> ${selectedScale}</div>
      <div><strong>Scale Notes:</strong> ${scaleNotes.join(', ')}</div>
      <div><strong>Set:</strong> ${chordSet}</div>
      <div><strong>Progression:</strong> ${chords.map(chord => chord.name).join(' | ')}</div>
  `;

  // Render chord diagrams
  const chordChartContainer = document.getElementById('chord-chart');
  chordChartContainer.innerHTML = ''; // Clear previous diagrams

  chords.forEach((chord) => {
      const container = document.createElement('div');
      container.style.margin = '4px';
      chordChartContainer.appendChild(container);

      // Render each chord
      renderChord(container, chord.name);
  });
});
