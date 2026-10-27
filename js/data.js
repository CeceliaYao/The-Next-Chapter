/* =========================================================
   data.js: EVERYTHING the team will want to edit lives here.
   - chapter text, captions, mum's messages
   - which photo / video file plays for which object
   - where each object is allowed to go
   Coordinates are in a 1280 x 720 world.
   ========================================================= */
'use strict';

// Change this (and the ?v= on the files in index.html) with every update, so browsers fetch the new
// photos, videos and code together instead of mixing new files with old ones from their cache.
const VERSION = '20261024n';

const MEMORY_BOX_SIZE = 3;          // how many things (besides Teddy) carry over between chapters
const IDLE_RESET_MS = 150000;       // exhibition: return to title after 2.5 min of no input

// The note the player reads after the last box is packed, before the summary.
const ENDING_NOTE = {
  title: 'Thank you for playing this far.',
  lines: [
    'In one small room, you just read the first eighteen years of a girl’s life. She never said much. You got to know her through what she kept, what she outgrew, and what she couldn’t quite let go.',
    'That’s upkeep: the quiet, everyday care of the things we live with. A bed made. A trophy dusted. A worn-out bear carried into one more room. Objects can’t remember for us, but they hold on to who we were.',
    'Now the room is empty. She’s off to study a Bachelor of Creative Industries, to make new things, and new memories, of her own.'
  ],
  sign: 'Here’s to her next chapter.\nAnd to yours.'
};

// [full name, role, short name]: this order is used on the door, the title screen and the ending
const CREDITS = [
  ['Chloee Park', 'Design', 'Chloee'],
  ['Isabella Kiosses', 'Film & Didactic', 'Isabella'],
  ['Lyebin Cho', 'Film & Photo', 'Lyebin'],
  ['Qinxi "Cecelia" Yao', 'Main Coder', 'Cecelia']
];

// The Credits folder on the "What You Packed" screen opens these as a notepad: [role, name(s)]
const CREDITS_ROLL = [
  ['Directed by', 'Isabella Kiosses'],
  ['Story by', 'Isabella Kiosses & Lyebin Cho'],
  ['Cinematography', 'Lyebin Cho'],
  ['Production', 'Isabella Kiosses'],
  ['Photography by', 'Chloee Park'],
  ['Edited by', 'Lyebin Cho'],
  ['Art Direction', 'Chloee Park'],
  ['Identity & Graphic Design', 'Chloee Park'],
  ['Interaction Design', 'Qinxi Yao'],
  ['Web Design & Development', 'Qinxi Yao']
];
// The Follow Us folder on the same screen opens this note: [name, Instagram handle without the @]
const SOCIALS_LEAD = 'Follow us for behind the scenes. ✦';
const SOCIALS = [
  ['Chloee Park', 'larchivedeclo'],
  ['Isabella Kiosses', 'isafish_films'],
  ['Lyebin Cho', 'lyebin_work'],
  ['Qinxi Yao', 'ceceliayao.design']
];

/* Teddy gets a little older every chapter (the sprite changes too, see sprites.js). */
const TEDDY_AGES = [
  'Brand New, Bow and All',
  'Well Hugged',
  'One Ear Sewn Back On',
  'Patched Up, Bow Gone Floppy',
  'Lost the Bow, and an Eye (Button Now)',
  'Faded, Floppy, Still Here'
];

/* Surface tags an object can "fit" on:
   bed · shelf · desk · sill · table · floor · wall · hook · mobile · socket
   bins (object disappears into them): door · toybox · basket · underbed · box    */
const CARRY_FITS = ['shelf', 'desk', 'bed', 'sill', 'floor'];

/* Each object's size comes from its pixel sprite in sprites.js. */
const ITEM_DEFS = {
  // 1 · nursery
  teddy:        { name: 'Teddy', fits: ['bed', 'shelf', 'desk', 'table', 'sill', 'floor'], hint: 'Teddy belongs somewhere cozy. Try the bed.' },
  blanket:      { name: 'Baby Blanket', fits: ['bed'], hint: 'Blankets go in the cot.' },
  mobile:       { name: 'Star Mobile', fits: ['mobile'], hint: 'The mobile hangs from the hook above the cot.' },
  snowglobe:    { name: 'Snow Globe Music Box', fits: ['shelf', 'desk', 'sill'], hint: 'Somewhere up high: the shelf or the change table.' },
  rabbit:       { name: 'Peter Rabbit', fits: ['shelf', 'desk', 'sill', 'bed'], hint: 'Peter Rabbit likes chilling on a shelf.' },
  rabbitbooks:  { name: 'Board Books', fits: ['shelf', 'desk', 'sill'], hint: 'Books live on the shelf.' },
  nightlight:   { name: 'Nightlight', fits: ['socket'], hint: 'Plug it into the wall socket next to the cot.' },
  rattle:       { name: 'Rattle', fits: ['bed', 'desk', 'shelf', 'floor'], hint: 'Rattles go in the cot.' },
  bottle:       { name: 'Bottle', fits: ['desk', 'shelf', 'sill'], hint: 'The bottle goes on the change table or a shelf.' },
  // 2 · childhood
  picturebooks: { name: 'Storybooks', fits: ['shelf', 'desk'], hint: 'Storybooks go on the bookshelf.' },
  teaset:       { name: 'Tea Party Set', fits: ['table'], hint: 'Tea parties happen at the little table.' },
  doll:         { name: 'Dolls', fits: ['table', 'bed', 'shelf'], hint: 'Dolls sit at the tea table, on the bed or on a shelf.' },
  tutu:         { name: 'Tutu', fits: ['hook'], hint: 'Dress-ups hang on the hooks above the bed.' },
  wings:        { name: 'Fairy Wings', fits: ['hook'], hint: 'Dress-ups hang on the hooks above the bed.' },
  tiara:        { name: 'Tiara', fits: ['hook', 'shelf', 'bed'], hint: 'Dress-ups hang on the hooks above the bed.' },
  drawing:      { name: 'Crayon Drawings', fits: ['wall'], hint: 'Stick drawings on the wall. Any bare wall works!' },
  crayons:      { name: 'Crayons', fits: ['toybox'], hint: 'Crayons go back in the toy box.', keep: false },
  truck:        { name: "Brother's Truck", fits: ['door'], hint: "That's your brother's! Take it to the door.", keep: false, owner: 'brother' },
  // 3 · tween
  backpack:     { name: 'School Backpack', fits: ['floor'], hint: 'Just plonk it on the floor.' },
  skates:       { name: 'Roller Skates', fits: ['floor', 'underbed'], hint: 'Skates go on the floor (or under the bed).' },
  artsupplies:  { name: 'Art Supplies', fits: ['desk', 'shelf'], hint: 'Art supplies live on the desk.' },
  sketch:       { name: 'Anime Sketch', fits: ['wall', 'desk'], hint: 'Pin it on the wall above the bed, or keep it on the desk.' },
  familyphoto:  { name: 'Family Photo', fits: ['wall', 'shelf', 'desk'], hint: 'Frames go on a wall, shelf or desk.' },
  flipphone:    { name: 'Flip Phone', fits: ['desk', 'bed', 'shelf', 'sill'], hint: 'Phone on the desk (or on the bed, honestly).' },
  discman:      { name: 'CD Player', fits: ['desk', 'bed', 'shelf'], hint: 'The CD player goes on the desk, shelf or bed.' },
  controller:   { name: "Brother's Controller", fits: ['door'], hint: "Not yours! Give it back. Drop it on the door.", keep: false, owner: 'brother' },
  // 4 · teen
  homework1:    { name: 'History Homework', fits: ['desk'], hint: 'Homework goes on the desk.', keep: false },
  homework2:    { name: 'Mock Exam', fits: ['desk'], hint: 'Homework goes on the desk.', keep: false },
  hoodie:       { name: 'Hoodie', fits: ['basket'], hint: 'Clothes go in the laundry basket.', keep: false },
  jeans:        { name: 'Jeans', fits: ['basket'], hint: 'Clothes go in the laundry basket.', keep: false },
  tee:          { name: 'T-shirt', fits: ['basket'], hint: 'Clothes go in the laundry basket.', keep: false },
  heels:        { name: "Mum's Heels", fits: ['floor'], hint: 'Shoes go on the floor.' },
  sneakers:     { name: 'Old Sneakers', fits: ['underbed'], hint: 'Kick them under the bed. Out of sight, out of mind.', keep: false },
  posterband:   { name: 'Posters', fits: ['wall'], hint: 'Posters go on the wall above the bed.' },
  postermovie:  { name: 'Posters', fits: ['wall'], hint: 'Posters go on the wall above the bed.' },
  trophy:       { name: 'Trophies', fits: ['shelf', 'desk'], hint: 'Trophies go on the shelf above the desk.' },
  medal:        { name: 'Trophies', fits: ['shelf', 'desk'], hint: 'Trophies go on the shelf above the desk.' },
  award:        { name: 'Trophies', fits: ['shelf', 'desk'], hint: 'Trophies go on the shelf above the desk.' },
  guitar:       { name: 'Guitar', fits: ['floor', 'bed'], hint: 'Lean the guitar on the floor or the bed.' },
  // 5 · young adult
  laptop:       { name: 'Laptop', fits: ['desk'], hint: 'The laptop goes on the desk.' },
  plant:        { name: 'Plant', fits: ['sill', 'shelf', 'desk', 'floor'], hint: 'Plants love the windowsill.' },
  painting:     { name: 'Flower Painting', fits: ['wall', 'desk'], hint: 'Hang your painting on the wall above the bed (or lean it on the desk).' },
  mug:          { name: 'Mug', fits: ['desk', 'sill', 'shelf'], hint: 'Mug on the desk or the windowsill.' },
  novel:        { name: 'Novel', fits: ['shelf', 'desk', 'bed'], hint: 'Books on the shelf, desk or bed.' },
  polaroids:    { name: 'Polaroids', fits: ['wall'], hint: 'Hang the polaroids on the wall above the bed.' },
  cosmetics:    { name: 'Cosmetics', fits: ['desk', 'shelf', 'sill'], hint: 'Makeup goes on the desk, shelf or windowsill.' },
  digicam:      { name: 'Digicam', fits: ['desk', 'shelf', 'sill', 'bed'], hint: 'The camera goes on the desk, shelf or bed.' },
  // 6 · moving out
  uniletter:    { name: 'Acceptance Letter', fits: ['desk'], hint: '', keep: false },
  clothesstack: { name: 'Folded Clothes', fits: ['bed'], hint: '', keep: false }
};

/* ---------- room layouts (shared with room.js) ---------- */
const DOOR_BIN = { id: 'door', tag: 'door', type: 'bin', x1: 1003, y1: 183, x2: 1102, y2: 420, label: 'Give It Back' };
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
  SILL
];

/* ---------- the six chapters ---------- */
const CHAPTERS = [
  {
    id: 'nursery', kicker: 'Chapter 1', title: 'The Nursery', year: 2000, accent: '#ffc700',
    intro: 'My story begins in a butter colored room. Someone very small is about to arrive.',
    tip: 'Drag each thing from the box into the room.\nBlue dotted lines show where it can go.',
    bg: bgNursery, layout: L_NURSERY,
    surfaces: [
      { id: 'cot', tag: 'bed', type: 'line', x1: 210, x2: 462, y: 370 },
      { id: 'mobile', tag: 'mobile', type: 'spot', x: 335, y: 178, r: 80 },
      { id: 'shelf', tag: 'shelf', type: 'line', x1: 806, x2: 994, y: 210 },
      { id: 'dresser', tag: 'desk', type: 'line', x1: 798, x2: 992, y: 335 },
      { id: 'socket', tag: 'socket', type: 'spot', x: 505, y: 384, r: 60 },
      SILL,
      { id: 'floor', tag: 'floor', type: 'area', x1: 60, x2: 1220, y1: 490, y2: 558 }
    ],
    tray: ['teddy', 'blanket', 'mobile', 'rabbit', 'rabbitbooks', 'snowglobe', 'nightlight', 'rattle', 'bottle'],
    mess: [],
    memories: [
      { id: 'n-teddy', items: ['teddy'], type: 'video', src: 'assets/video/01-nursery-teddy.mp4', still: 'assets/photos/01-nursery-teddy.webp', focus: [0.5, 0.45], caption: 'Teddy resting in bed.' },
      { id: 'n-globe', items: ['snowglobe'], type: 'video', src: 'assets/video/01-nursery-snowglobe.mp4', still: 'assets/photos/01-nursery-snowglobe.webp', focus: [0.2, 0.76], caption: '♪ ♫ ♪\u00a0\u00a0Watching the glitter fall.\u00a0\u00a0♪ ♫ ♪' },
      { id: 'n-rabbit', items: ['rabbit'], type: 'photo', src: 'assets/photos/01-nursery-peter-rabbit.webp', caption: 'Peter Rabbit, chilling on a shelf.' }
    ],
    onStart: [{ do: 'wait', ms: 1600 }, { do: 'toast', from: 'Mum', text: 'Sweet dreams, little one. ♥' }],
    onPlace: {},
    events: [],
    ambience: { root: 67, notes: [0, 4, 7, 12, 16, 19] }
  },
  {
    id: 'childhood', kicker: 'Chapter 2', title: 'Childhood', year: 2005, accent: '#ff84e4',
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
      { id: 'toybox', tag: 'toybox', type: 'bin', x1: 46, y1: 430, x2: 176, y2: 556, label: 'Toy Box' },
      DOOR_BIN,
      { id: 'floorA', tag: 'floor', type: 'area', x1: 186, x2: 460, y1: 492, y2: 558 },
      { id: 'floorB', tag: 'floor', type: 'area', x1: 820, x2: 1222, y1: 492, y2: 558 },
      { id: 'floorC', tag: 'floor', type: 'area', x1: 460, x2: 820, y1: 548, y2: 558 }
    ],
    tray: ['picturebooks', 'teaset', 'doll', 'tutu', 'wings', 'tiara', 'drawing'],
    mess: [
      { id: 'crayons', x: 330, y: 535, rot: 0.2 },
      { id: 'truck', x: 880, y: 528, rot: -0.15 }
    ],
    memories: [
      { id: 'c-tea', items: ['teaset'], type: 'video', src: 'assets/video/02-childhood-tea-party.mp4', still: 'assets/photos/02-childhood-tea-party.webp', focus: [0.5, 0.5], caption: 'Tea party with the dolls and the teddy.' },
      { id: 'c-doll', items: ['doll'], type: 'photo', src: 'assets/photos/02-childhood-dolls.webp', caption: 'Yay! Everyone’s here!' },
      { id: 'c-draw', items: ['drawing'], type: 'text', title: 'my_family.txt', caption: 'MY FAMILY, by me (age 5)\n\nMum. Dad. Me. My little brother.\nAnd teddy.' }
    ],
    onStart: [{ do: 'wait', ms: 1800 }, { do: 'toast', from: 'Mum', text: 'Tidy up before dinner, sweetheart. ♥' }],
    onPlace: {
      truck: [{ do: 'toast', from: 'Little bro', text: 'HEY that’s MY truck!! …Ok thanks.' }],
      crayons: [{ do: 'toast', from: 'Mum', text: 'Good girl! No crayons on the carpet. ♥' }]
    },
    events: [],
    ambience: { root: 69, notes: [0, 2, 4, 7, 9, 12] }
  },
  {
    id: 'tween', kicker: 'Chapter 3', title: 'Tween', year: 2010, accent: '#00b5ff',
    intro: 'Not a little kid, but not quite a teenager. Dealing with a heavier backpack, brand-new skates, and the same old sibling drama.',
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
      { id: 't-bag', items: ['backpack'], type: 'video', src: 'assets/video/03-tween-backpack.mp4', still: 'assets/photos/03-tween-backpack.webp', focus: [0.55, 0.5], caption: 'Too many textbooks to carry.' },
      { id: 't-skates', items: ['skates'], type: 'photo', src: 'assets/photos/03-tween-rollerskates.webp', caption: 'I got these for my birthday! Now to learn how to brake.' },
      { id: 't-art', items: ['artsupplies'], type: 'photo', src: 'assets/photos/03-tween-art-supplies.webp', caption: 'Drawing is hard, but fun!' },
      { id: 't-sketch', items: ['sketch'], type: 'photo', src: 'assets/photos/03-tween-drawing.webp', caption: 'Don’t look at my sketches!' },
      { id: 't-cd', items: ['discman'], type: 'photo', src: 'assets/photos/03-tween-cd-player.webp', caption: 'Mum says I listen to this too much. She doesn’t get it.' },
      { id: 't-family', items: ['familyphoto'], type: 'text', title: 'family_photo.txt', caption: 'Family photo day.\n\n“Everybody say cheese!”' }
    ],
    onStart: [{ do: 'wait', ms: 1800 }, { do: 'toast', from: 'Little bro', text: 'Have you seen my controller??' }],
    onPlace: {
      controller: [{ do: 'toast', from: 'Little bro', text: 'FINALLY. Thx.' }]
    },
    events: [],
    ambience: { root: 65, notes: [0, 4, 7, 9, 12, 16] }
  },
  {
    id: 'teen', kicker: 'Chapter 4', title: 'Teen', year: 2014, accent: '#8de328',
    intro: 'School’s getting serious with big exams, bigger mess, same old Mum.',
    tip: 'Mum says CLEAN YOUR ROOM. Clothes go in the basket, homework on the desk.',
    bg: bgTeen, layout: L_TEEN,
    surfaces: [
      { id: 'bed', tag: 'bed', type: 'line', x1: 200, x2: 476, y: 372 },
      { id: 'wall', tag: 'wall', type: 'wall', x1: 196, y1: 80, x2: 478, y2: 300 },
      { id: 'desk', tag: 'desk', type: 'line', x1: 796, x2: 958, y: 338 },
      { id: 'shelf', tag: 'shelf', type: 'line', x1: 806, x2: 984, y: 200 },
      SILL,
      { id: 'basket', tag: 'basket', type: 'bin', x1: 496, y1: 420, x2: 594, y2: 542, label: 'Laundry' },
      { id: 'underbed', tag: 'underbed', type: 'bin', x1: 210, y1: 392, x2: 470, y2: 472, label: 'Under the Bed' },
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
      { id: 'homework2', x: 860, y: 535, rot: -0.3 },
      { id: 'sneakers', x: 1080, y: 540, rot: 0.12 }
    ],
    memories: [
      { id: 'te-homework', items: ['homework1'], type: 'photo', src: 'assets/photos/04-teen-homework.webp', caption: 'This is my life now.' },
      { id: 'te-mock', items: ['homework2'], type: 'photo', src: 'assets/photos/04-teen-mock-exam.webp', caption: 'Please let me PASS...' },
      { id: 'te-clothes', items: [], type: 'video', src: 'assets/video/04-teen-clothes-pile.mp4', still: 'assets/photos/04-teen-clothes.webp', focus: [0.5, 0.5], caption: 'One more on the pile… “CLEAN. YOUR. ROOM.”' },
      { id: 'te-heels', items: ['heels'], type: 'photo', src: 'assets/photos/04-teen-high-heels.webp', caption: 'Stole these from mum.' },
      { id: 'te-trophy', items: ['trophy', 'medal', 'award'], type: 'photo', src: 'assets/photos/04-teen-trophies.webp', caption: 'Solo dance: 2nd, 2nd… then 1st! (Still learning to brake.)' }
    ],
    onStart: [{ do: 'wait', ms: 1500 }, { do: 'toast', from: 'Mum', text: 'This room is a DISASTER. Clean it before dinner!!', nudge: true }],
    onPlace: {
      heels: [{ do: 'toast', from: 'Mum', text: '…Are those MY heels??', nudge: true }]
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
    id: 'youngadult', kicker: 'Chapter 5', title: 'Young Adult', year: 2017, accent: '#ff5400',
    intro: 'The room has grown up. Most of the childhood things are gone. Not all of them.',
    tip: 'Make the room yours. Hang your painting on the wall above the bed.',
    bg: bgYoungAdult, layout: L_YA,
    surfaces: YA_SURFACES.concat([{ id: 'floor', tag: 'floor', type: 'area', x1: 60, x2: 1220, y1: 492, y2: 558 }]),
    tray: ['laptop', 'painting', 'plant', 'mug', 'novel', 'polaroids', 'cosmetics', 'digicam'],
    mess: [],
    memories: [
      { id: 'y-teddy', items: ['teddy'], type: 'photo', src: 'assets/photos/05-youngadult-teddy.webp', caption: 'Still here. A bit faded, a lot loved.' },
      { id: 'y-novel', items: ['novel'], type: 'photo', src: 'assets/photos/05-youngadult-novel.webp', caption: 'Getting ready for uni, one chapter at a time.' },
      { id: 'y-cosmetics', items: ['cosmetics'], type: 'photo', src: 'assets/photos/05-youngadult-cosmetics.webp', caption: 'Too many blushes? No such thing.' },
      { id: 'y-digicam', items: ['digicam'], type: 'photo', src: 'assets/photos/05-youngadult-digicam.webp', caption: 'If it’s not on the digicam, it didn’t happen.' },
      { id: 'y-polaroids', items: ['polaroids'], type: 'text', title: 'polaroids.txt', caption: 'Friends I hadn’t met yet when I was twelve.' },
      { id: 'y-painting', items: ['painting'], type: 'video', src: 'assets/video/05-youngadult-painting.mp4', caption: 'Painting just for me again.' },
      /* EASTER EGG: put the laptop on the desk and it opens up full screen and plays our exhibition ad.
         secret: true = no ! badge and it doesn't count towards "Memories x/y", so it stays a surprise.
         Video: MP4 / H.264, same 1.414 : 1 shape as the poster (e.g. 1920 x 1358). Until it exists, the poster plays with a slow zoom.
         skipAfter = seconds before "Skip ad" can be pressed. channel = the little TV channel number (29 Oct). */
      { id: 'y-laptop', items: ['laptop'], type: 'ad', secret: true, src: 'assets/video/05-youngadult-laptop-ad.mp4', still: 'assets/photos/05-youngadult-laptop-ad.webp', ratio: 3508 / 2480, skipAfter: 5, stillSecs: 12, channel: 'CH 29' }
    ],
    onStart: [{ do: 'wait', ms: 1800 }, { do: 'toast', from: 'Mum', text: 'Your room looks so grown up. :’)' }],
    onPlace: { laptop: [{ do: 'wait', ms: 400 }, { do: 'toast', from: 'Little bro', text: 'Wait was that an ad for an EXHIBITION?? Thu 29 oct… Ok i’m going.' }] },
    events: [],
    noKeep: true,
    ambience: { root: 64, notes: [0, 4, 7, 11, 14, 16] }
  },
  {
    id: 'movingout', kicker: 'Chapter 6', title: 'Moving Out', year: 2018, accent: '#ff84e4',
    intro: 'Pack your things. Carry your memories.',
    tip: 'Pack what you’ll take into the box. Teddy goes in last.',
    bg: bgMovingOut, layout: L_YA, moving: true,
    surfaces: YA_SURFACES.concat([
      { id: 'floor', tag: 'floor', type: 'area', x1: 60, x2: 1100, y1: 492, y2: 558 },
      { id: 'box', tag: 'box', type: 'bin', x1: 430, y1: 572, x2: 850, y2: 716, label: 'Pack', capacity: 7 }
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
        caption: 'Dear {name},\n\nCongratulations! We are delighted to offer you a place in our Bachelor of Creative Industries, commencing next semester.\n\nWelcome to your next chapter.\n\nOffice of Admissions'
      },
      { id: 'm-boxes', items: [], type: 'video', src: 'assets/video/06-moving-out-boxes.mp4', still: 'assets/photos/06-moving-out-boxes.webp', focus: [0.5, 0.45], caption: 'Teddy, the family photo, and some clothes. That’s the important stuff.' }
    ],
    onStart: [{ do: 'wait', ms: 1500 }, { do: 'toast', from: 'Mum', text: 'There’s mail for you on your desk! The car’s packed, take your time. x' }],
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
