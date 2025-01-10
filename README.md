
# Modes and Progressions

A music jamming and practicing tool where you can:

- explore all possible four chord progerssions
- select a piano rhythm pattern
- set a drum beat
- adjust the BPM
- adjust the swing
- hit play and play along
- view diagrams for the chords and mode for the current progression

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

## Features

* guitar chord diagrams
* piano chord diagrams
* guitar scale diagram
* triad and seventh chords
* supports every possible 4 chord progression
* displays scale notes and chord progressions
* plays chord progression with a piano sound
* includes 13 piano rhythms
* reverb control for the piano
* highlights the current chord being played
* BPM setting
* once you are in play mode, all settings can be changed and apply without stopping.
* a settings section that collapses
* randomize settings option to limit what is randomized
* support for drum patterns
* created 7 patterns
* controls for swing settings


## Screenshots

Application currently playing a chord progression over a drum pattern with shuffle applied: 

![App Screenshot](https://github.com/Emaj7th/chord_progression_generator/screenshots/screenshot_1.png)

Same session, but now with the settings section displaying:

![App Screenshot](https://github.com/Emaj7th/chord_progression_generator/screenshots/screenshot_2.png)


## Tech Stack

**Audio Framework:**
Tone.js
https://github.com/Tonejs/Tone.js

**Guitar Neck Scale Diagrams:**
GuitarScales
https://github.com/dylanlegebokow/GuitarScales

**Guitar Chord Diagrams:**
ChordJS
https://github.com/acspike/ChordJS

**Guitar Chord Diagram Data:**
chord-collection
https://github.com/T-vK/chord-collection

**Piano Chord Visualizer:**
https://codepen.io/andyg901/full/GRLXovw

**Music Theory Helpers:**
Pianissimo
https://github.com/AtActionPark/Pianissimo

**=====================================**

The application currently uses jQuery and Bootstrap. I hope to remove these dependencies at a later date.


## Roadmap

- hopefully change the drum integration so the drum patterns are 4 measures of 16ths notes instead of 4 measures of quarter notes
- better piano sample set
- better drum sample set
- add more piano rhythms
- add more drum patterns
- chord progression edit - replace chords with other options for the current scale ane key
- maybe MIDI output
- maybe optional bass part - for example, it could just play root notes, or just roots and 5ths, edit/select bass rhythm


## Run Locally

Once you've downloaded and extracted the code, from your command line, navigating to that directory, and running: python -m http.server 8000

This assumes you have python installed. If you don't, I'm sure there is some other means to run a server. It won't work if you simply load the index.html file into your browser.

