// Array storing all existing notes on the piano
const notes = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];

// Object storing chord types and its notes position
const chordScheme = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
};

// Function altering the notes array to change the root note
const getNotesFromRoot = (rootNote) => {
  let slicePivot = notes.indexOf(rootNote.toLowerCase()); // get the position of new root note
  if (slicePivot === -1) { // return empty array if root note doesn't exists
    return [];
  }

  const fromPivot = notes.slice(slicePivot, notes.length); // get part of array fom new root note to the end of array
  const toPivot = notes.slice(0, slicePivot); // get part of array fom beginning to new root note

  return [...fromPivot, ...toPivot]; // return new array combining fromPivot and toPivot together
};

// Function returning chord notes
const getChord = (rootNote, chordType) => {
  const notesFromRoot = getNotesFromRoot(rootNote); // get array of notes, beginning from the rootNote value

  if (notesFromRoot.length > 0 && chordScheme[chordType]) {
    return chordScheme[chordType].map((noteIndex) => notesFromRoot[noteIndex]); // map selected chord type array into array of note names 
  }

  return [];
};

const renderState = {
  _rootNote: "",
  _chordType: "",

  set rootNote(note) {
    this._rootNote = note;
    renderChanges({ rootNote: this.rootNote, chordType: this.chordType });
  },
  get rootNote() {
    return this._rootNote;
  },

  set chordType(type) {
    this._chordType = type;
    renderChanges({ rootNote: this.rootNote, chordType: this.chordType });
  },
  get chordType() {
    return this._chordType;
  },
};

// collect all buttons for selecting root note
const rootSelectBtns = document.querySelectorAll("#root-notes-group button");
// create onClick handler function
const onRootBtnClick = (event) => {
  renderState.rootNote = event.target.dataset.note;
};

// assign onClick handler to each button
for (let i = 0; i < rootSelectBtns.length; i++) {
  rootSelectBtns[i].addEventListener("click", onRootBtnClick);
}

// collect all buttons for selecting chord type
const chordTypeSelectBtns = document.querySelectorAll("#chord-types-group button");
// create onClick handler function
const onChordTypeBtnClick = (event) => {
  renderState.chordType = event.target.dataset.type;
};

// assign onClick handler to each button
for (let i = 0; i < chordTypeSelectBtns.length; i++) {
  chordTypeSelectBtns[i].addEventListener("click", onChordTypeBtnClick);
}

// function to set the specific root note selection button's classes
const setActiveRootBtn = (rootNote = "") => {
  for (let i = 0; i < rootSelectBtns.length; i++) {
    const rootSelectBtn = rootSelectBtns[i];
    if (rootSelectBtn.dataset.note === rootNote) {
      // add "active" class
      rootSelectBtn.classList.add("active");
    } else {
      // remove "active" class
      rootSelectBtn.classList.remove("active");
    }
  }
};

// function to set the specific chord type selection button's classes
const setActiveChordTypeBtn = (chordType = "") => {
  for (let i = 0; i < chordTypeSelectBtns.length; i++) {
    const chordTypeSelectBtn = chordTypeSelectBtns[i];
    if (chordTypeSelectBtn.dataset.type === chordType) {
      // add "active" class
      chordTypeSelectBtn.classList.add("active");
    } else {
      // remove "active" class
      chordTypeSelectBtn.classList.remove("active");
    }
  }
};

// function to set the div (piano key representation) elements "active" classes
const setActivePianoKeys = (chordNotes = []) => {
  const pianoKeys = document.querySelectorAll("#piano-keyboard .key"); // get html elements of piano keys
  const pianoKeyNotes = Array.prototype.map.call(
    pianoKeys,
    (pKey) => pKey.dataset.note
  ); // create the array of the piano keys notes values
  const keyStartIndex = pianoKeyNotes.indexOf(chordNotes[0]); // get the key from which the chord starts (we do not set every matching key as "active")
  const tmpChordNotes = [...chordNotes]; // temporary array of chord notes used when setting CSS classes

  // iteration through piano key divs
  for (let i = 0; i < pianoKeys.length; i++) {
    const pianoKey = pianoKeys[i];
    const pianoKeyNote = pianoKeyNotes[i];

    // set key to active if the piano note is in chord notes and it's index is greater than or equal starting index
    if (tmpChordNotes.indexOf(pianoKeyNote) > -1 && i >= keyStartIndex) {
      pianoKey.classList.add("active");
      tmpChordNotes.shift(); // remove the piano note that was already rendered
    } else {
      // remove the "active" class
      pianoKey.classList.remove("active");
    }
  }
};

const renderChanges = ({ rootNote, chordType }) => {
  if (rootNote) {
    setActiveRootBtn(rootNote);
  }

  if (chordType) {
    setActiveChordTypeBtn(chordType);
  }

  if (rootNote && chordType) {
    const chordNotes = getChord(rootNote, chordType);
    setActivePianoKeys(chordNotes);
  }
};