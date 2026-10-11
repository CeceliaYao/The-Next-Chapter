/* =========================================================
   data.js — EVERYTHING the team will want to edit lives here.
   - chapter text, captions, mum's messages
   - which photo / video file plays for which object
   - where each object is allowed to go
   Coordinates are in a 1280 x 720 world.
   ========================================================= */
'use strict';

const MEMORY_BOX_SIZE = 3;          // how many things (besides Teddy) carry over between chapters
const IDLE_RESET_MS = 150000;       // exhibition: return to title after 2.5 min of no input

const CREDITS = [
  ['Qinxi (Cecelia) Yao', 'Main Coder'],
  ['Chloee Park', 'Design'],
  ['Isabella Kiosses', 'Film & Didactic'],
  ['Lyebin Cho', 'Film & Photo']
];

/* Surface tags an object can "fit" on:
   bed · shelf · desk · sill · table · floor · wall · hook · mobile · socket · lights
   bins (object disappears into them): door · toybox · basket · box               */
const CARRY_FITS = ['shelf', 'desk', 'bed', 'sill', 'floor'];

const ITEM_DEFS = {
  // 1 · nursery
  teddy:        { name: 'Teddy', w: 64, h: 72, fits: ['bed', 'shelf', 'desk', 'table', 'sill', 'floor'], hint: 'Teddy belongs somewhere cosy. Try the bed.' },
  blanket:      { name: 'Baby blanket', w: 110, h: 30, fits: ['bed'], hint: 'Blankets go in the cot.' },
  mobile:       { name: 'Star mobile', w: 110, h: 120, fits: ['mobile'], hint: 'The mobile hangs from the hook above the cot.' },
  snowglobe:    { name: 'Snow globe music box', w: 52, h: 60, fits: ['shelf', 'desk', 'sill'], hint: 'Somewhere up high: the shelf or the change table.' },
  rabbitbooks:  { name: 'Peter Rabbit books', w: 70, h: 56, fits: ['shelf', 'desk', 'sill'], hint: 'Books live on the shelf.' },
  nightlight:   { name: 'Night-light', w: 34, h: 40, fits: ['socket'], hint: 'Plug it into the wall socket next to the cot.' },
  rattle:       { name: 'Rattle', w: 50, h: 32, fits: ['bed', 'desk', 'shelf', 'floor'], hint: 'Rattles go in the cot.' },
  bottle:       { name: 'Bottle', w: 30, h: 56, fits: ['desk', 'shelf', 'sill'], hint: 'The bottle goes on the change table or a shelf.' },
  // 2 · childhood
  picturebooks: { name: 'Storybooks', w: 76, h: 60, fits: ['shelf', 'desk'], hint: 'Storybooks go on the bookshelf.' },
  teaset:       { name: 'Tea party set', w: 96, h: 46, fits: ['table'], hint: 'Tea parties happen at the little table.' },
  doll:         { name: 'Doll', w: 46, h: 74, fits: ['table', 'bed', 'shelf'], hint: 'Dolls sit at the tea table, on the bed or on a shelf.' },
  tutu:         { name: 'Tutu', w: 80, h: 56, fits: ['hook'], hint: 'Dress-ups hang on the hooks above the bed.' },
  wings:        { name: 'Fairy wings', w: 90, h: 70, fits: ['hook'], hint: 'Dress-ups hang on the hooks above the bed.' },
  drawing:      { name: 'Crayon drawing', w: 80, h: 64, fits: ['wall'], hint: 'Stick drawings on the wall. Any bare wall works!' },
  crayons:      { name: 'Crayons', w: 50, h: 26, fits: ['toybox'], hint: 'Crayons go back in the toy box.', keep: false },
  truck:        { name: "Brother's truck", w: 70, h: 40, fits: ['door'], hint: "That's your brother's! Take it to the door.", keep: false, owner: 'brother' },
  // 3 · tween
  backpack:     { name: 'School backpack', w: 70, h: 80, fits: ['floor'], hint: 'Just plonk it on the floor.' },
  skates:       { name: 'Roller skates', w: 84, h: 56, fits: ['floor'], hint: 'Skates go on the floor.' },
  artsupplies:  { name: 'Art supplies', w: 90, h: 40, fits: ['desk', 'shelf'], hint: 'Art supplies live on the desk.' },
  sketch:       { name: 'Anime sketch', w: 70, h: 86, fits: ['wall', 'desk'], hint: 'Pin it on the wall above the bed, or keep it on the desk.' },
  familyphoto:  { name: 'Family photo', w: 70, h: 60, fits: ['wall', 'shelf', 'desk'], hint: 'Frames go on a wall, shelf or desk.' },
  flipphone:    { name: 'Flip phone', w: 26, h: 44, fits: ['desk', 'bed', 'shelf', 'sill'], hint: 'Phone on the desk (or on the bed, honestly).' },
  discman:      { name: 'CD player', w: 54, h: 30, fits: ['desk', 'bed', 'shelf'], hint: 'The CD player goes on the desk, shelf or bed.' },
  controller:   { name: "Brother's controller", w: 60, h: 36, fits: ['door'], hint: "Not yours! Give it back. Drop it on the door.", keep: false, owner: 'brother' },
  // 4 · teen
  homework1:    { name: 'Maths homework', w: 70, h: 50, fits: ['desk'], hint: 'Homework goes on the desk.', keep: false },
  homework2:    { name: 'Mock exam', w: 70, h: 50, fits: ['desk'], hint: 'Homework goes on the desk.', keep: false },
  hoodie:       { name: 'Hoodie', w: 80, h: 56, fits: ['basket'], hint: 'Clothes go in the laundry basket.', keep: false },
  jeans:        { name: 'Jeans', w: 70, h: 56, fits: ['basket'], hint: 'Clothes go in the laundry basket.', keep: false },
  tee:          { name: 'T-shirt', w: 66, h: 50, fits: ['basket'], hint: 'Clothes go in the laundry basket.', keep: false },
  heels:        { name: "Mum's heels", w: 70, h: 40, fits: ['floor'], hint: 'Shoes go on the floor.' },
  posterband:   { name: 'Band poster', w: 100, h: 136, fits: ['wall'], hint: 'Posters go on the wall above the bed.' },
  postermovie:  { name: 'Movie poster', w: 100, h: 136, fits: ['wall'], hint: 'Posters go on the wall above the bed.' },
  trophy:       { name: 'Volleyball trophy', w: 46, h: 70, fits: ['shelf'], hint: 'Trophies go on the shelf above the desk.' },
  medal:        { name: 'Karate medal', w: 40, h: 60, fits: ['shelf', 'wall'], hint: 'Medals go on the shelf or the wall.' },
  award:        { name: 'Academic award', w: 54, h: 64, fits: ['shelf', 'desk'], hint: 'Awards go on the shelf above the desk.' },
  guitar:       { name: 'Guitar', w: 60, h: 150, fits: ['floor', 'bed'], hint: 'Lean the guitar on the floor or the bed.' },
  // 5 · young adult
  laptop:       { name: 'Laptop', w: 90, h: 56, fits: ['desk'], hint: 'The laptop goes on the desk.' },
  plant:        { name: 'Plant', w: 56, h: 70, fits: ['sill', 'shelf', 'desk', 'floor'], hint: 'Plants love the windowsill.' },
  fairylights:  { name: 'Fairy lights', w: 300, h: 40, fits: ['lights'], hint: 'Hang the fairy lights over the window.' },
  mug:          { name: 'Mug', w: 36, h: 40, fits: ['desk', 'sill', 'shelf'], hint: 'Mug on the desk or the windowsill.' },
  novel:        { name: 'Novel', w: 50, h: 60, fits: ['shelf', 'desk', 'bed'], hint: 'Books on the shelf, desk or bed.' },
  polaroids:    { name: 'Polaroids', w: 140, h: 70, fits: ['wall'], hint: 'Hang the polaroids on the wall above the bed.' },
  // 6 · moving out
  uniletter:    { name: 'Uni acceptance letter', w: 60, h: 44, fits: ['desk'], hint: '', keep: false },
  clothesstack: { name: 'Folded clothes', w: 80, h: 40, fits: ['bed'], hint: '', keep: false }
};

/* ---------- room layouts (shared with room.js) ---------- */
const DOOR_BIN = { id: 'door', tag: 'door', type: 'bin', x1: 1003, y1: 183, x2: 1102, y2: 420, label: 'give it back' };
const SILL = { id: 'sill', tag: 'sill', type: 'line', x1: 550, x2: 730, y: 270 };

const L_NURSERY = {
  cot: { x1: 200, x2: 470, top: 370, bottom: 476 },
  mobile: { x: 335, y: 178 },
  shelf: { x1: 800, x2: 1000, y: 210 },
  dresser: { x1: 790, x2: 1000, top: 335, bottom: 472 },
  socket: { x: 505, y: 384 }
};
const L_CHILD = {
  bed: { x1: 190, x2: 480, top: 372, bottom: 476 },
  hooks: { x1: 215, x2: 455, y: 132 },
  shelf: { x1: 790, x2: 990, top: 270, mid: 368, low: 462, bottom: 474 },
  table: { y: 478 },
  toybox: { x1: 46, y1: 470, x2: 176, y2: 556 }
};
const L_TWEEN = {
  bed: { x1: 180, x2: 490, top: 372, bottom: 476 },
  desk: { x1: 790, x2: 1000, top: 338, bottom: 474 },
  shelf: { x1: 800, x2: 990, y: 200 }
};
const L_TEEN = Object.assign({}, L_TWEEN, { basket: { x1: 500, y1: 452, x2: 590, y2: 540 } });
const L_YA = {
  bed: { x1: 170, x2: 500, top: 376, bottom: 476 },
  desk: { x1: 790, x2: 1000, top: 338, bottom: 474 },
  shelf: { x1: 800, x2: 990, y: 200 }
};

const YA_SURFACES = [
  { id: 'bed', tag: 'bed', type: 'line', x1: 190, x2: 486, y: 376 },
  { id: 'wall', tag: 'wall', type: 'wall', x1: 194, y1: 118, x2: 478, y2: 292 },
  { id: 'desk', tag: 'desk', type: 'line', x1: 796, x2: 958, y: 338 },
  { id: 'shelf', tag: 'shelf', type: 'line', x1: 806, x2: 984, y: 200 },
  SILL,
  { id: 'lights', tag: 'lights', type: 'spot', x: 640, y: 84, r: 110 }
];

/* ---------- the six chapters ---------- */
const CHAPTERS = [
  {
    id: 'nursery', kicker: 'Chapter 1', title: 'The Nursery', year: 2000, accent: '#ffcf5c',
    intro: 'A room painted the colour of butter. Someone very small is about to move in.',
    tip: 'Drag each thing from the box into the room. Glowing outlines show where it can go.',
    bg: bgNursery, layout: L_NURSERY,
    surfaces: [
      { id: 'cot', tag: 'bed', type: 'line', x1: 222, x2: 448, y: 370 },
      { id: 'mobile', tag: 'mobile', type: 'spot', x: 335, y: 178, r: 80 },
      { id: 'shelf', tag: 'shelf', type: 'line', x1: 806, x2: 994, y: 210 },
      { id: 'dresser', tag: 'desk', type: 'line', x1: 798, x2: 992, y: 335 },
      { id: 'socket', tag: 'socket', type: 'spot', x: 505, y: 384, r: 60 },
      SILL,
      { id: 'floor', tag: 'floor', type: 'area', x1: 60, x2: 1220, y1: 490, y2: 558 }
    ],
    tray: ['teddy', 'blanket', 'mobile', 'rabbitbooks', 'snowglobe', 'nightlight', 'rattle', 'bottle'],
    mess: [],
    memories: [
      { id: 'n-teddy', items: ['teddy'], type: 'photo', src: 'assets/photos/01-nursery-teddy.jpg', caption: 'Teddy, “resting” in bed.' },
      { id: 'n-globe', items: ['snowglobe'], type: 'video', src: 'assets/video/01-nursery-snowglobe.mp4', caption: '♪ ♫ ♪   watching the glitter fall' },
      { id: 'n-books', items: ['rabbitbooks'], type: 'photo', src: 'assets/photos/01-nursery-storybooks.jpg', caption: 'Peter Rabbit, chilling on a shelf.' }
    ],
    onStart: [{ do: 'wait', ms: 1600 }, { do: 'toast', from: 'Mum', text: 'Sweet dreams, little one ♥' }],
    onPlace: {},
    events: [],
    ambience: { root: 67, notes: [0, 4, 7, 12, 16, 19] }
  },
  {
    id: 'childhood', kicker: 'Chapter 2', title: 'Childhood', year: 2005, accent: '#ff7fc4',
    intro: 'The cot has been traded for a big-girl bed. Tea parties, tiaras, and only tiny messes.',
    tip: 'Tidy the little messes, and give your brother’s truck back (drop it on the door).',
    bg: bgChildhood, layout: L_CHILD,
    surfaces: [
      { id: 'bed', tag: 'bed', type: 'line', x1: 205, x2: 468, y: 372 },
      { id: 'hooks', tag: 'hook', type: 'hang', x1: 218, x2: 452, y: 132 },
      { id: 'wallR', tag: 'wall', type: 'wall', x1: 762, y1: 84, x2: 998, y2: 188 },
      { id: 'wallL', tag: 'wall', type: 'wall', x1: 232, y1: 210, x2: 474, y2: 330 },
      { id: 'shelfTop', tag: 'shelf', type: 'line', x1: 796, x2: 984, y: 266 },
      { id: 'shelfMid', tag: 'shelf', type: 'line', x1: 802, x2: 978, y: 368, maxH: 90 },
      { id: 'shelfLow', tag: 'shelf', type: 'line', x1: 802, x2: 978, y: 462, maxH: 82 },
      { id: 'table', tag: 'table', type: 'line', x1: 528, x2: 752, y: 476 },
      SILL,
      { id: 'toybox', tag: 'toybox', type: 'bin', x1: 46, y1: 430, x2: 176, y2: 556, label: 'toy box' },
      DOOR_BIN,
      { id: 'floorA', tag: 'floor', type: 'area', x1: 186, x2: 460, y1: 492, y2: 558 },
      { id: 'floorB', tag: 'floor', type: 'area', x1: 820, x2: 1222, y1: 492, y2: 558 },
      { id: 'floorC', tag: 'floor', type: 'area', x1: 460, x2: 820, y1: 548, y2: 558 }
    ],
    tray: ['picturebooks', 'teaset', 'doll', 'tutu', 'wings', 'drawing'],
    mess: [
      { id: 'crayons', x: 330, y: 535, rot: 0.2 },
      { id: 'truck', x: 880, y: 528, rot: -0.15 }
    ],
    memories: [
      { id: 'c-books', items: ['picturebooks'], type: 'photo', src: 'assets/photos/02-childhood-storybooks.jpg', caption: 'Read it again! Again!' },
      { id: 'c-tea', items: ['teaset'], type: 'video', src: 'assets/video/02-childhood-tea-party.mp4', caption: 'Tea party with the dolls and Teddy.' },
      { id: 'c-draw', items: ['drawing'], type: 'photo', src: 'assets/photos/02-childhood-drawings.jpg', caption: 'This is my family. Teddy is the biggest.' }
    ],
    onStart: [{ do: 'wait', ms: 1800 }, { do: 'toast', from: 'Mum', text: 'Tidy up before dinner, sweetheart ♥' }],
    onPlace: {
      truck: [{ do: 'toast', from: 'Little bro', text: 'HEY that’s MY truck!! …ok thanks' }],
      crayons: [{ do: 'toast', from: 'Mum', text: 'Good girl! No crayons on the carpet ♥' }]
    },
    events: [],
    ambience: { root: 69, notes: [0, 2, 4, 7, 9, 12] }
  },
  {
    id: 'tween', kicker: 'Chapter 3', title: 'Tween', year: 2010, accent: '#a98cff',
    intro: 'A heavier backpack. Brand-new skates. A brother who keeps “borrowing” things.',
    tip: 'Unpack your stuff. Something on your bed isn’t yours…',
    bg: bgTween, layout: L_TWEEN,
    surfaces: [
      { id: 'bed', tag: 'bed', type: 'line', x1: 200, x2: 476, y: 372 },
      { id: 'wall', tag: 'wall', type: 'wall', x1: 200, y1: 88, x2: 472, y2: 272 },
      { id: 'desk', tag: 'desk', type: 'line', x1: 796, x2: 958, y: 338 },
      { id: 'shelf', tag: 'shelf', type: 'line', x1: 806, x2: 984, y: 200 },
      SILL, DOOR_BIN,
      { id: 'floor', tag: 'floor', type: 'area', x1: 60, x2: 1220, y1: 492, y2: 558 }
    ],
    tray: ['backpack', 'skates', 'artsupplies', 'familyphoto', 'flipphone', 'discman'],
    mess: [
      { id: 'controller', x: 330, y: 354, rot: 0.2, surface: 'bed' },
      { id: 'sketch', x: 640, y: 518, rot: -0.35 }
    ],
    memories: [
      { id: 't-bag', items: ['backpack'], type: 'video', src: 'assets/video/03-tween-backpack.mp4', caption: '“too many textbooks to carry”' },
      { id: 't-skates', items: ['skates'], type: 'photo', src: 'assets/photos/03-tween-rollerskates.jpg', caption: '“I got these for my birthday! Now to learn how to brake”' },
      { id: 't-art', items: ['artsupplies'], type: 'photo', src: 'assets/photos/03-tween-drawing.jpg', caption: '“Drawing is hard, but fun!”' },
      { id: 't-family', items: ['familyphoto'], type: 'photo', src: 'assets/photos/03-tween-family-photo.jpg', caption: 'Family photo. Everybody say cheese.' }
    ],
    onStart: [{ do: 'wait', ms: 1800 }, { do: 'toast', from: 'Little bro', text: 'have u seen my controller??' }],
    onPlace: {
      controller: [{ do: 'toast', from: 'Little bro', text: 'FINALLY. thx' }]
    },
    events: [],
    ambience: { root: 65, notes: [0, 4, 7, 9, 12, 16] }
  },
  {
    id: 'teen', kicker: 'Chapter 4', title: 'Teen', year: 2014, accent: '#3fc9b8',
    intro: 'Mock exams, trophies, and a floor you can’t really see anymore. Mum has opinions.',
    tip: 'Mum says CLEAN YOUR ROOM. Clothes go in the basket, homework on the desk.',
    bg: bgTeen, layout: L_TEEN,
    surfaces: [
      { id: 'bed', tag: 'bed', type: 'line', x1: 200, x2: 476, y: 372 },
      { id: 'wall', tag: 'wall', type: 'wall', x1: 196, y1: 80, x2: 478, y2: 300 },
      { id: 'desk', tag: 'desk', type: 'line', x1: 796, x2: 958, y: 338 },
      { id: 'shelf', tag: 'shelf', type: 'line', x1: 806, x2: 984, y: 200 },
      SILL,
      { id: 'basket', tag: 'basket', type: 'bin', x1: 496, y1: 420, x2: 594, y2: 542, label: 'laundry' },
      DOOR_BIN,
      { id: 'floorA', tag: 'floor', type: 'area', x1: 60, x2: 494, y1: 492, y2: 558 },
      { id: 'floorB', tag: 'floor', type: 'area', x1: 596, x2: 1220, y1: 492, y2: 558 },
      { id: 'floorC', tag: 'floor', type: 'area', x1: 494, x2: 596, y1: 552, y2: 558 }
    ],
    tray: ['posterband', 'postermovie', 'trophy', 'medal', 'award', 'heels', 'guitar'],
    mess: [
      { id: 'hoodie', x: 300, y: 528, rot: -0.25 },
      { id: 'jeans', x: 410, y: 534, rot: 0.3 },
      { id: 'homework1', x: 700, y: 540, rot: 0.18 },
      { id: 'homework2', x: 860, y: 535, rot: -0.3 }
    ],
    memories: [
      { id: 'te-homework', items: ['homework1', 'homework2'], type: 'photo', src: 'assets/photos/04-teen-homework.jpg', caption: '“this is my life now.”' },
      { id: 'te-clothes', items: [], type: 'video', src: 'assets/video/04-teen-clothes-pile.mp4', caption: 'One more on the pile… “CLEAN. YOUR. ROOM.”' },
      { id: 'te-heels', items: ['heels'], type: 'photo', src: 'assets/photos/04-teen-high-heels.jpg', caption: '“stole these from mum”' },
      { id: 'te-posters', items: ['posterband', 'postermovie'], type: 'photo', src: 'assets/photos/04-teen-posters.jpg', caption: 'Walls = personality.' },
      { id: 'te-trophy', items: ['trophy', 'medal', 'award'], type: 'photo', src: 'assets/photos/04-teen-trophies.jpg', caption: 'Volleyball, karate, and one academic award.' }
    ],
    onStart: [{ do: 'wait', ms: 1500 }, { do: 'toast', from: 'Mum', text: 'This room is a DISASTER. Clean it before dinner!!', nudge: true }],
    onPlace: {
      heels: [{ do: 'toast', from: 'Mum', text: '…are those MY heels??', nudge: true }]
    },
    events: [
      {
        when: { type: 'binCount', surface: 'basket', count: 2 },
        actions: [
          { do: 'wait', ms: 500 },
          { do: 'memory', id: 'te-clothes' },
          { do: 'spawnMess', id: 'tee', x: 360, y: 530, rot: 0.45, fromX: 1050, fromY: 300 },
          { do: 'toast', from: 'Mum', text: 'I said ALL of them!!', nudge: true }
        ]
      }
    ],
    ambience: { root: 62, notes: [0, 3, 7, 10, 12, 15] }
  },
  {
    id: 'youngadult', kicker: 'Chapter 5', title: 'Young Adult', year: 2017, accent: '#c8a27a',
    intro: 'A more grown-up room. Most of the childhood things are gone now. Not all of them.',
    tip: 'Make the room yours. Fairy lights go over the window.',
    bg: bgYoungAdult, layout: L_YA,
    surfaces: YA_SURFACES.concat([{ id: 'floor', tag: 'floor', type: 'area', x1: 60, x2: 1220, y1: 492, y2: 558 }]),
    tray: ['laptop', 'fairylights', 'plant', 'mug', 'novel', 'polaroids'],
    mess: [],
    memories: [
      { id: 'y-polaroids', items: ['polaroids'], type: 'text', title: 'polaroids.txt', caption: 'Friends I hadn’t met yet when I was twelve.' },
      { id: 'y-lights', items: ['fairylights'], type: 'text', title: 'status.txt', caption: 'current mood: fairy lights & no curfew ✦' }
    ],
    onStart: [{ do: 'wait', ms: 1800 }, { do: 'toast', from: 'Mum', text: 'Your room looks so grown up :’)' }],
    onPlace: {},
    events: [],
    noKeep: true,
    ambience: { root: 64, notes: [0, 4, 7, 11, 14, 16] }
  },
  {
    id: 'movingout', kicker: 'Chapter 6', title: 'Moving Out', year: 2018, accent: '#ff9f6b',
    intro: 'A letter came in the mail. The car is in the driveway. Time to pack.',
    tip: 'Pack what you’ll take into the box. Teddy goes in last.',
    bg: bgMovingOut, layout: L_YA, moving: true,
    surfaces: YA_SURFACES.concat([
      { id: 'floor', tag: 'floor', type: 'area', x1: 60, x2: 1100, y1: 492, y2: 558 },
      { id: 'box', tag: 'box', type: 'bin', x1: 430, y1: 572, x2: 850, y2: 716, label: 'pack', capacity: 7 }
    ]),
    tray: [],
    extras: [
      { id: 'uniletter', surface: 'desk', x: 880 },
      { id: 'clothesstack', surface: 'bed', x: 320 }
    ],
    mess: [],
    memories: [
      {
        id: 'm-letter', items: ['uniletter'], type: 'letter', title: 'acceptance_letter.txt',
        caption: 'Dear student,\n\nCongratulations! We are delighted to offer you a place in our Bachelor of Design, commencing next semester.\n\nWelcome to your next chapter.\n\nOffice of Admissions'
      },
      { id: 'm-boxes', items: [], type: 'video', src: 'assets/video/06-moving-out-boxes.mp4', caption: 'Teddy, the family photo, and some clothes. That’s the important stuff.' }
    ],
    onStart: [{ do: 'wait', ms: 1500 }, { do: 'toast', from: 'Mum', text: 'There’s mail for you on your desk! The car’s packed, take your time x' }],
    onPlace: {},
    events: [
      {
        when: { type: 'binned', item: 'teddy', surface: 'box' },
        actions: [
          { do: 'closeBox' },
          { do: 'wait', ms: 700 },
          { do: 'memory', id: 'm-boxes' },
          { do: 'ending' }
        ]
      }
    ],
    ambience: { root: 60, notes: [0, 4, 7, 9, 12, 16] }
  }
];
