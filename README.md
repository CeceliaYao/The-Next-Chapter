# The Next Chapter

*one room, from nursery to moving out: what we keep up, carry on, and leave behind*

**KKB385 · A3.** An interactive Y2K game display about *upkeep*: the slow, never-finished job of looking after a room, and the things in it, while you grow up.

The visitor tends one bedroom across six chapters of a suburban girl's life, from the nursery to the day she moves out. Each chapter, she unpacks, tidies and decides what to carry into the next one. Teddy comes along every time. The game is inspired by *Unpacking*, but the twist is upkeep. Mess comes back, Mum nags, and the memory box only has room for so much.

**▶ Play it online:** https://ceceliayao.github.io/The-Next-Chapter/

> Built with [p5.js](https://p5js.org/), plain HTML/CSS and Web Audio. No install, no internet needed.
> The look is the early-2000s web: glossy buttons, rounded windows, messenger pop-ups. Only the room and its things are pixel drawings (320 × 180 pixels, scaled up 4× with no blur); every word uses normal, readable fonts.
> The page is **4:3** (1280 × 960, scaled to fit). On a wide screen it sits in the middle with black either side, so the eye stays on the game.

---

## Run it

**Online:** open https://ceceliayao.github.io/The-Next-Chapter/ in Chrome. It is the same game, served by GitHub Pages. Every push to `main` is copied to the `gh-pages` branch by `.github/workflows/publish.yml`, and the site updates within a minute or two. With every update, change the version in `index.html` (`?v=` on the files) and `VERSION` in `js/data.js`, so browsers load the new code, photos and videos together; a browser that opened the site in the last 10 minutes may still need a reload.

**On the exhibition computer (recommended for the show, no Wi-Fi needed):**

1. Copy the whole folder onto the machine (USB is fine).
2. Open `index.html` in **Google Chrome** (double-click it, or drag it into a Chrome window).
3. Put Chrome in fullscreen from its own menu (or F11 / Ctrl+Cmd+F) if you like. Turn the sound on.

**While developing** (optional; any static server works):

```bash
npx serve .        # then open the printed localhost address
```

### Controls

| Action | How |
| --- | --- |
| Move things | Click and drag |
| Move a window | Drag it by its coloured title bar |
| Replay a memory | Click a placed object that shows a ! badge (or hover it: “click to replay”) |
| Menu (restart chapter, chapter select) | **Esc** or the Menu button |
| Sound on/off | **M** or the speaker button (it shows a crossed-out speaker when the sound is off) |
| Skip the current chapter (for testing) | **Shift + N** |

**Exhibition mode is built in.** After 2.5 minutes with no input, the game returns to the title screen for the next visitor (`IDLE_RESET_MS` in `js/data.js`). The game opens on a closed bedroom door with the logo and "Click to Start" (after Chloee's laptop mock-up). Click it (or press Enter) and a sign-in window appears: type a name and press **Sign In** (or Enter), the door swings open onto the chapter select, and a messenger note says the name has just signed in. The door comes back after an idle reset, so every new visitor gets to open it. On the chapter select (a pixel hill wallpaper with a Welcome window, the Start window and a Tip), **Start** begins the game and the six discs along the bottom jump straight to any chapter (handy for the demo). The game fills 90% of the window, with even margins all round.

**Layout while playing:** the top bar shows the chapter, year, UPKEEP meter and memories found. The room sits in the middle. Underneath, Teddy gives the chapter's tip (and short hints as you play), and Mum's and little bro's messages pop up beside it, so nothing covers the room. Memories open as windows: just the photo or video and its caption (no file names), with all text shown at once, no typing effect.

---

## How it plays

1. **Unpack.** Things arrive in the box at the bottom. Drag each one into the room. While you drag, the places it can go light up with blue dotted lines, and a faint ghost shows exactly where it will land.
2. **Upkeep.** Some chapters start messy (crayons, clothes, homework). The **UPKEEP** meter fills as the room gets tidy. In the teen room, Mum throws another shirt on the pile after you've cleaned up.
3. **Memories.** Putting certain objects away plays a photo or a video (the team's footage) in a Y2K "Video Player" / "Image Viewer" with a camcorder date stamp. The team's photos and videos are shown exactly as shot: no filter, no cropping (portrait photos get a tall frame).
4. **Siblings.** Your little brother's things turn up in your room. Drop them on the **door** to give them back.
5. **Memory box.** Between chapters you choose what to carry forward. Teddy always comes, plus 3 more things. Anything you drop is "let go" and listed on the ending screen.
   **Teddy gets older.** Each chapter Teddy looks a little more worn: brand new with his organza bow (2000), well hugged, an ear sewn back on, a gingham patch and a limp bow, the bow lost and a button for an eye, then faded and floppy but still here (2018). The chapter card, the memory box and the ending ("Teddy through the years") all show it. The wording lives in `TEDDY_AGES` in `js/data.js`; the drawing is `teddy` in `js/sprites.js`.
6. **Moving out.** The box at the bottom flips around. Now you *pack* the room into it. Read the uni letter (a place in the Bachelor of Creative Industries), then pack Teddy last.
7. **Thank you.** A short note fades in, line by line: thanks for playing, and a few words on upkeep, memory and objects. Click to show it all at once, then *What she packed >* opens the summary. The wording lives in `ENDING_NOTE` in `js/data.js`.

| # | Chapter | Year | What happens | Memories (from the shot list) |
| --- | --- | --- | --- | --- |
| 1 | The Nursery | 2000 | Cot, mobile, night-light, snow globe, Peter Rabbit | Teddy resting in bed (video), snow globe (video), Peter Rabbit on the books (photo) |
| 2 | Childhood | 2005 | Tea party, dress-ups (tutu, wings, tiara), tiny messes, brother's truck | Tea party (video), dolls (photo), drawings (note) |
| 3 | Tween | 2010 | Backpack, skates, art, brother's controller | Backpack plonk (video), roller skates, art supplies, anime sketch, CD player (photos), family photo (note) |
| 4 | Teen | 2014 | Mess everywhere, posters, skating trophies, Mum nagging, old sneakers kicked under the bed | Homework, mock exam, heels, posters, trophies (photos), clothes pile + Mum (video) |
| 5 | Young Adult | 2017 | More grown-up room; flower painting, laptop | Faded Teddy (photo), painting (video), novel, cosmetics, digicam (photos), polaroids (note), laptop ad (easter egg) |
| 6 | Moving Out | 2018 | Pack the box, uni acceptance letter | Letter (text), boxes with Teddy / family photo / clothes (video) |

---

## Adding the real photos & videos

Until a file exists, its frame simply stays empty (the caption still shows). A video with a still photo shows the photo with a slow camcorder zoom if the clip can't play. Open the game with `?dev` on the end of the address (e.g. `index.html?dev`) to see which filename each one is waiting for. To add footage, **save it with exactly these names**. Files marked ✅ are already in the game (from the team's photos):

| File | Plays when… | Caption on screen |
| --- | --- | --- |
| ✅ `assets/video/01-nursery-teddy.mp4` (still: `assets/photos/01-nursery-teddy.webp`) | Teddy is put in the cot | Teddy resting in bed. |
| ✅ `assets/video/01-nursery-snowglobe.mp4` (still: `assets/photos/01-nursery-snowglobe.jpg`) | Snow globe is put away | ♪ ♫ ♪  Watching the glitter fall.  ♪ ♫ ♪ |
| ✅ `assets/photos/01-nursery-peter-rabbit.webp` | Peter Rabbit is put down | Peter Rabbit, chilling on a shelf. |
| ✅ `assets/video/02-childhood-tea-party.mp4` (still: `assets/photos/02-childhood-tea-party.webp`) | Tea set goes on the tea table | Tea party with the dolls and the teddy. |
| ✅ `assets/photos/02-childhood-dolls.webp` | Dolls are put down | Yay! Everyone’s here! |
| no picture, just a note: `my_family.txt` | Drawing goes on the wall | MY FAMILY, by me (age 5) … And teddy. |
| ✅ `assets/video/03-tween-backpack.mp4` (still: `assets/photos/03-tween-backpack.webp`) | Backpack is put down | Too many textbooks to carry. |
| ✅ `assets/photos/03-tween-rollerskates.webp` | Skates are put down | I got these for my birthday! Now to learn how to brake. |
| ✅ `assets/photos/03-tween-art-supplies.webp` | Art supplies go on the desk | Drawing is hard, but fun! |
| ✅ `assets/photos/03-tween-drawing.webp` | Anime sketch is put up (or on the desk) | Don’t look at my sketches! |
| ✅ `assets/photos/03-tween-cd-player.webp` | CD player is put down | Mum says I listen to this too much. She doesn’t get it. |
| no picture, just a note: `family_photo.txt` | Family photo is placed | Family photo day. "Everybody say cheese!" |
| ✅ `assets/photos/04-teen-homework.webp` | History homework goes on the desk | This is my life now. |
| ✅ `assets/photos/04-teen-mock-exam.webp` | Mock exam goes on the desk | Please let me PASS... |
| ✅ `assets/video/04-teen-clothes-pile.mp4` (still: `assets/photos/04-teen-clothes.webp`) | Both clothes go in the basket (then Mum scolds) | One more on the pile… "CLEAN. YOUR. ROOM." |
| ✅ `assets/photos/04-teen-high-heels.webp` | Heels are put down | Stole these from mum. |
| `assets/photos/04-teen-posters.webp` | First poster goes up | Walls = personality. |
| ✅ `assets/photos/04-teen-trophies.webp` | First trophy is shelved | Solo dance: 2nd, 2nd… then 1st! (Still learning to brake.) |
| ✅ `assets/photos/05-youngadult-teddy.webp` (cut-out) | Teddy is put down in the young adult room | Still here. A bit faded, a lot loved. |
| ✅ `assets/photos/05-youngadult-novel.webp` | Novel is put down | Getting ready for uni, one chapter at a time. |
| ✅ `assets/photos/05-youngadult-cosmetics.webp` | Cosmetics are put down | Too many blushes? No such thing. |
| ✅ `assets/photos/05-youngadult-digicam.webp` | Digicam is put down | If it’s not on the digicam, it didn’t happen. |
| ✅ `assets/video/05-youngadult-painting.mp4` | Flower painting goes on the wall (or the desk) | Painting just for me again. |
| 🥚 ✅ `assets/video/05-youngadult-laptop-ad.mp4` (still: `assets/photos/05-youngadult-laptop-ad.webp`, the poster) | **Easter egg:** the laptop goes on the desk (or is clicked). The laptop opens full screen and plays our exhibition ad, with an "Ad" tag and "Skip ad" after 5 s. No ! badge, not counted in Memories. Shape **1.414 : 1** like the poster (e.g. 1920 × 1358); keep the bottom-right corner and bottom edge free of key text. | (none: it's an ad) |
| ✅ `assets/video/06-moving-out-boxes.mp4` (still: `assets/photos/06-moving-out-boxes.jpg`) | Teddy is packed (the finale) | Teddy, the family photo, and some clothes. |

**Formats**

- **Photos:** `.jpg` (or `.png` / `.webp` for cut-outs with a transparent background; change the extension in `js/data.js`). About 1600 px on the long side is plenty. Portrait or landscape both work: the photo frame takes the shape of the photo, nothing is cropped. Strip location data (phone photos carry GPS) by exporting a copy rather than using the original.
- **Videos:** **MP4, H.264**. Phone footage is often HEVC `.mov`, which many browsers can't play. In Premiere: *Export → H.264 → Match Source*. Keep clips short (5–20 s), landscape 4:3 or 16:9 (the player takes the shape of the clip). The player closes itself shortly after a video ends.
- **Stills for videos:** a video memory can have a `still` photo and a `focus` point (e.g. `focus: [0.2, 0.76]` = 20% across, 76% down). Until the video file exists, the still plays with a slow camcorder zoom towards that point.
- Captions, filenames, Mum's messages and chapter text all live in **`js/data.js`**. Change them freely; it's plain text.

---

## Brand

The look follows the team's identity board and our colour decision: **orange (two shades) + off-white as the base**, with black and white, and **pink and blue as the cooler accents**. The rooms are warm and muted (like *Unpacking*) and shift colour from stage to stage; the interface is an early-2000s desktop (glossy Windows XP / Frutiger Aero buttons and title bars, MSN-style messages, iridescent CD chapter discs) where the windows can be dragged around.

| Colour | Hex | Used for |
| --- | --- | --- |
| Orange | `#ff5400` | title bars, main buttons, counters (base) |
| Light orange | `#ff8f3a` | title bar shine, glossy buttons (base) |
| Off-white | `#fff6ea` | windows, HUD, background (base) |
| Ink | `#221a13` | outlines, text |
| Blue | `#00b5ff` | accent: drop guides, second buttons, messages |
| Pink | `#ff84e4` | accent: hearts, Mum's messages |
| Yellow / Lime | `#ffc700` / `#8de328` | the logo, chapter titles, UPKEEP meter |

The logo files in `assets/brand/` are Chloee's original vector artwork (SVG: sharp at any size and small to load; no pixels, no drop shadow): `logo-sign.svg` on the door and in the Welcome window. A picture for the sign-in window can be added as `assets/brand/profile.webp`; until then it shows a silhouette. To use a new logo, replace those files and keep the same names.

**Fonts** (all free for any use, including portfolios: SIL Open Font License):

| Font | Used for |
| --- | --- |
| [Special Gothic](https://fonts.google.com/specimen/Special+Gothic) (narrow width) | all text: title bars, buttons, labels, body text, captions |
| [Caveat](https://fonts.google.com/specimen/Caveat) | handwriting in the Notepad memories |
| [VT323](https://fonts.google.com/specimen/VT323) | only the camcorder date stamp and the year display |

Special Gothic and Caveat load from Google Fonts (see `index.html`), so they need an internet connection; offline, the game falls back to Jost and Archivo Narrow (bundled in `fonts/` with VT323). Fonts and weights are set in one place, at the top of `style.css` (`--font-ui`, `--font-body`, `--font-note`, `--w-text`, `--w-strong`); the words drawn on the game screen read them from there. Letter spacing is set there too, one value per text style (`--ls-title`, `--ls-ui`, `--ls-body`, `--ls-note`, `--ls-lcd`): never wider than the font's own spacing (0), only ever tighter.

**Writing rules** (from the team's ideation doc):

- Sentences: sentence case, always ending with `.` `!` or `?` (e.g. *Teddy resting in bed.*).
- Labels, short phrases and names of things: Title Case, no full stop; short words (a, an, the, and, or, to, of, in, on, for) stay lower case unless they come first (e.g. *Click to Start*, *Teddy: Brand New, Bow and All*).
- ALL CAPS only for chapter names (*CHAPTER 1*, *THE NURSERY*) and decorations with no reading meaning (*BOX 7 LEFT*).
- Mum's and little bro's messages can stay casual, but still start with a capital and end with punctuation.
- An icon next to words gets two non-breaking spaces between them (`Start&nbsp;&nbsp;▶︎`, `↺&nbsp;&nbsp;Play Again`).


**Rule for the team's own images:** logos, photos and videos are always shown as the originals (cut out where needed), never pixelated. Only the game's drawn objects and rooms are pixel art.

---

## Project structure

```
index.html        page shell: top bar, game screen, Teddy's tips + messages
style.css         the early-2000s skin (4:3 page, glossy buttons, rounded windows, messenger pop-ups)
js/data.js        ← edit me: chapters, objects, where things go, captions, file names, Teddy's ages
js/pixel.js       the pixel engine: palette, crisp shapes, outlines, dithering
js/sprites.js     every object as pixel art (grids of palette letters, or pixel shapes)
js/room.js        the bedroom for each chapter as pixel art (walls, window, furniture)
js/game.js        game logic: drag & drop, placement rules, memory box, feedback
js/ui.js          screens: title, chapter cards, memory player, keep box, thank-you note, ending
js/audio.js       synthesised sound effects + music-box ambience (no audio files)
lib/p5.min.js     p5.js 1.11 (bundled so it works offline)
fonts/            Jost, Archivo Narrow, VT323 (bundled, SIL Open Font License)
assets/brand/     team logos (original artwork) and favicon
assets/photos/    ← put photos here
assets/video/     ← put videos here
```

**Editing the pixel art:** in `js/sprites.js` many objects are little grids of letters, one letter per pixel (`.` is see-through). The letters are colours from `PALETTE` in `js/pixel.js`, e.g. `u` teddy brown, `h` hot pink, `w` white, and `1`–`6` the brand colours (blue, orange, pink, yellow, lime, cream). Change a letter, refresh, and the pixel changes. The dark outline is added automatically.

**Changing where things can go:** each object in `ITEM_DEFS` has a `fits` list (e.g. `['shelf', 'desk']`), and each chapter has `surfaces` with a matching `tag`. If every spot an object fits is full, the game lets it go on any shelf, desk, bed or the floor, so a visitor can never get stuck.

---

## Credits

**The Next Chapter** by

- **Chloee Park**: Design
- **Isabella Kiosses**: Film & Didactic
- **Lyebin Cho**: Film & Photo
- **Qinxi "Cecelia" Yao**: Main Coder

Film inspiration: *Teddy Bear* (Sophie Holloway, 2019), *Belongings* (Alex Coppola).

Third-party: [p5.js](https://github.com/processing/p5.js) (LGPL-2.1, see `lib/p5-LICENSE.txt`); fonts [Special Gothic](https://fonts.google.com/specimen/Special+Gothic), [Caveat](https://fonts.google.com/specimen/Caveat), [Jost](https://fonts.google.com/specimen/Jost), [Archivo Narrow](https://fonts.google.com/specimen/Archivo+Narrow) and [VT323](https://fonts.google.com/specimen/VT323) (SIL OFL 1.1).
