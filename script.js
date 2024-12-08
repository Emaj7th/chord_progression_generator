// URLs for the CSV files
const scalesChordsURL = 'scales_chords.csv';
const chordProgressionsURL = 'chord_progressions.csv';

// Select elements in the DOM
const keyDropdown = document.getElementById('key');
const scaleDropdown = document.getElementById('scale');
const progressionDropdown = document.getElementById('progression');
const resultContainer = document.getElementById('result');

// Initialize variables for storing parsed data
let scalesChordsData = [];
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

      // Process rows, correctly handling quoted fields
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

        // Map fields to headers
        return headers.reduce((obj, header, index) => {
          obj[header] = fields[index] || '';
          return obj;
        }, {});
      });

      callback(result);
    })
    .catch((error) => console.error(`Error loading CSV from ${url}:`, error));
}


// Populate "Select Scale" dropdown
parseCSV(scalesChordsURL, (data) => {
  scalesChordsData = data;

  // Extract unique scales from the "Scale" column
  const uniqueScales = [...new Set(scalesChordsData.map((row) => row.Scale))];
  uniqueScales.forEach((scale) => {
    const option = document.createElement('option');
    option.value = scale;
    option.textContent = scale;
    scaleDropdown.appendChild(option);
  });

  console.log("Available Scales:", uniqueScales);
});

// Populate "Select Progression" dropdown
parseCSV(chordProgressionsURL, (data) => {
  chordProgressionsData = data;

  // Ensure full progression strings are preserved
  chordProgressionsData.forEach((row) => {
    const progression = row.ChordProgressions.trim().replace(/^"|"$/g, ''); // Remove quotes
    const option = document.createElement('option');
    option.value = progression; // Use the full progression string
    option.textContent = progression; // Display the full progression string
    progressionDropdown.appendChild(option);
  });

  console.log("Chord Progressions:", chordProgressionsData.map((row) => row.ChordProgressions));
});

// Helper: Calculate notes in the scale
function getScaleNotes(key, scaleSteps) {
  const keyPreference = keyPreferences[key];
  if (!keyPreference) throw new Error(`Key "${key}" not found in preferences.`);

  // Find the index of the selected key
  const keyIndex = musicalKeys.indexOf(key);
  if (keyIndex === -1) throw new Error(`Key "${key}" not found in musical keys.`);

  // Calculate notes based on scaleSteps
  return scaleSteps.map((step) => {
    const noteIndex = (keyIndex + step) % musicalKeys.length; // Wrap around the array
    const note = musicalKeys[noteIndex];

    // Handle sharp/flat preference
    if (note.includes('#') && keyPreference === "flat") {
      return note.replace('#', 'b'); // Convert sharp to flat
    } else if (note.includes('b') && keyPreference === "sharp") {
      return note.replace('b', '#'); // Convert flat to sharp
    }

    return note; // Return note as-is if no conversion is needed
  });
}




// Generate Progression and Display Results
document.getElementById('generate').addEventListener('click', () => {
  const selectedKey = keyDropdown.value;
  const selectedScale = scaleDropdown.value;
  const selectedProgression = progressionDropdown.value.split(',').map((x) => parseInt(x.trim()));
  const chordSet = document.getElementById('chord-set').value;

  // Filter scale data based on Scale and ChordSetName
  const scaleData = scalesChordsData.find(
    (row) => row.Scale === selectedScale && row.ChordSetName.toLowerCase() === chordSet.toLowerCase()
  );

  if (!scaleData) {
    resultContainer.innerHTML = `<p><strong>Error:</strong> Scale data not found for the selected scale and chord set.</p>`;
    return;
  }

  // Parse ScaleSteps
  const scaleSteps = scaleData.ScaleSteps
    ? scaleData.ScaleSteps.replace(/^"|"$/g, '').split(',').map(Number)
    : [];
  if (scaleSteps.length === 0) {
    resultContainer.innerHTML = `<p><strong>Error:</strong> Invalid scale steps.</p>`;
    return;
  }

  // Generate Scale Notes
  const scaleNotes = getScaleNotes(selectedKey, scaleSteps);

  // Validation: Check if progression notes are within the scale
  const invalidNotes = selectedProgression.filter((step) => step < 1 || step > scaleSteps.length);
  if (invalidNotes.length > 0) {
    resultContainer.innerHTML = `
      <p><strong>Error:</strong> This progression includes notes outside of the selected scale.</p>
    `;
    console.log("Invalid Progression Notes:", invalidNotes);
    return;
  }

  // Get Chord Types for the Selected Chord Set
  const chordTypes = [];
  for (let i = 1; i <= 7; i++) {
    const chordType = scaleData[i]; // Fetch the chord type for each step
    chordTypes.push(chordType || ''); // Default to empty string if undefined
  }

  // Generate Progression
  const chords = selectedProgression.map((step) => {
    const note = scaleNotes[step - 1]; // Get the root note for the chord
    const chordType = chordTypes[step - 1]; // Get the chord type
    return `${note}${chordType}`;
  });

  // Output Results
  resultContainer.innerHTML = `
    <h3>Results</h3>
    <p><strong>Key:</strong> ${selectedKey}</p>
    <p><strong>Scale:</strong> ${scaleNotes.join(', ')}</p>
    <p><strong>Set:</strong> ${chordSet}</p>
    <p><strong>Progression:</strong> ${chords.join(' | ')}</p>
  `;
});



