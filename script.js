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
  "C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb",
  "G", "G#/Ab", "A", "A#/Bb", "B"
];

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
  const keyIndex = musicalKeys.findIndex((k) => k === key || k.includes(key));
  if (keyIndex === -1) throw new Error(`Key "${key}" not found in musical keys.`);

  // Calculate notes based on scaleSteps
  return scaleSteps.map((step) => {
    const noteIndex = (keyIndex + step) % musicalKeys.length; // Wrap around the array
    return musicalKeys[noteIndex];
  });
}

// Generate Progression and Display Results
document.getElementById('generate').addEventListener('click', () => {
  const selectedKey = keyDropdown.value;
  const selectedScale = scaleDropdown.value;

  // Get scale steps from scalesChordsData
  const scaleData = scalesChordsData.find((row) => row.Scale === selectedScale);
  console.log("Scale Data for Selected Scale:", scaleData);

  if (!scaleData) {
    console.error(`Scale data not found for scale: ${selectedScale}`);
    resultContainer.innerHTML = `<p><strong>Error:</strong> Scale data not found.</p>`;
    return;
  }

  // Parse ScaleSteps with quotes removed
  const scaleSteps = scaleData.ScaleSteps
    ? scaleData.ScaleSteps.replace(/^"|"$/g, '').split(',').map(Number)
    : [];
  console.log("ScaleSteps Raw:", scaleData.ScaleSteps);
  console.log("ScaleSteps Processed:", scaleSteps);

  if (scaleSteps.length === 0) {
    console.error(`ScaleSteps is empty or invalid for scale: ${selectedScale}`);
    resultContainer.innerHTML = `<p><strong>Error:</strong> Invalid ScaleSteps data.</p>`;
    return;
  }

  // Generate Scale Notes
  const scaleNotes = getScaleNotes(selectedKey, scaleSteps);
  console.log("Scale Notes:", scaleNotes);

  // Output Results
  resultContainer.innerHTML = `
    <h3>Results</h3>
    <p><strong>Key:</strong> ${selectedKey}</p>
    <p><strong>Scale:</strong> ${scaleNotes.join(', ')}</p>
  `;
});
