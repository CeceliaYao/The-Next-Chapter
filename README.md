# The Next Chapter

*one room, from nursery to moving out: what we keep up, carry on, and leave behind*

**KKB385 · A3.** An interactive Y2K game display about *upkeep*: the slow, never-finished job of looking after a room, and the things in it, while you grow up.

The visitor tends one bedroom across six chapters of a suburban girl's life, from the nursery to the day she moves out. Each chapter, she unpacks, tidies and decides what to carry into the next one. Teddy comes along every time. The game is inspired by *Unpacking*, but the twist is upkeep. Mess comes back, Mum nags, and the memory box only has room for so much.

**▶ Play it online:** https://ceceliayao.github.io/The-Next-Chapter/

> Built with [p5.js](https://p5js.org/), plain HTML/CSS and Web Audio. No install, no internet needed.
> The look is the early-2000s web game: soft pastel colour-block windows with plum outlines, candy gel buttons that change colour on hover, messenger pop-ups (Windows 98 / XP only as a loose reference). Only the room and its things are pixel drawings (320 × 180 pixels, scaled up 4× with no blur); every word uses normal, readable fonts.
> The page is **4:3** (1280 × 960, scaled to fit). On a wide screen it sits in the middle with black either side, so the eye stays on the game.

---

## Run it

**Online:** open https://ceceliayao.github.io/The-Next-Chapter/ in Chrome. It is the same game, served by GitHub Pages. Every push to `main` is copied to the `gh-pages` branch by `.github/workflows/publish.yml`, and the site updates within a minute or two.

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
| Menu (restart chapter, chapter select, back to the door) | **Esc** or the Menu button |
| Sound on/off | **M** or the speaker button (it shows a crossed-out speaker when the sound is off) |
| Skip the current chapter (for testing) | **Shift + N** |

**Exhibition mode is built in.** After 2.5 minutes with no input, the game returns to the title screen for the next visitor (`IDLE_RESET_MS` in `js/data.js`). The game opens on a closed bedroom door with the logo and our names on it (after Chloee's laptop mock-up). Click the door (or press Enter) and it swings open onto the title screen; the door comes back after an idle reset, so every new visitor gets to open it. On the title screen, **START** begins the game and the six discs jump straight to any chapter (handy for the demo).

**Layout while playing:** the top bar shows the chapter, year, UPKEEP meter and memories found. The room sits in the middle. Underneath, Teddy gives the chapter's tip (and short hints as you play), and Mum's and little bro's messages pop up beside it, so nothing covers the room. Memories open as windows: just the photo or video and its caption (no file names), with all text shown at once, no typing effect.

---

## How it plays

1. **Unpack.** Things arrive in the box at the bottom. Drag each one into the room. While you drag, the places it can go light up with blue dotted lines, and a faint ghost shows exactly where it will land.
2. **Upkeep.** Some chapters start messy (crayons, clothes, homework). The **UPKEEP** meter fills as the room gets tidy. In the teen room, Mum throws another shirt on the pile after you've cleaned up.
3. **Memories.** Putting certain objects away plays a photo or a video (the team's footage) in a Y2K "Memory Player" with a camcorder date stamp. The team's photos and videos are shown exactly as shot: no filter, no cropping (portrait photos get a tall frame).
4. **Siblings.** Your little brother's things turn up in your room. Drop them on the **door** to give them back.
5. **Memory box.** Between chapters you choose what to carry forward. Teddy always comes, plus 3 more things. Anything you drop is "let go" and listed on the ending screen.
   **Teddy gets older.** Each chapter Teddy looks a little more worn: brand new with his organza bow (2000), well hugged, an ear sewn back on, a gingham patch and a limp bow, the bow lost and a button for an eye, then faded and floppy but still here (2018). The chapter card, the memory box and the ending ("Teddy through the years") all show it. The wording lives in `TEDDY_AGES` in `js/data.js`; the drawing is `teddy` in `js/sprites.js`.
6. **Moving out.** The box at the bottom flips around. Now you *pack* the room into it. Read the uni letter (a place in the Bachelor of Creative Industries), then pack Teddy last.
7. **Thank you.** A short note fades in, line by line: thanks for playing, and a few words on upkeep, memory and objects. Click to show it all at once, then *What she packed >* opens the summary. The wording lives in `ENDING_NOTE` in `js/data.js`.

| # | Chapter | Year | What happens | Memories (from the shot list) |
| --- | --- | --- | --- | --- |
| 1 | The Nursery | 2000 | Cot, mobile, night-light, snow globe, Peter Rabbit | Teddy resting in bed (photo), snow globe (video), Peter Rabbit on the books (photo) |
| 2 | Childhood | 2005 | Tea party, dress-ups (tutu, wings, tiara), tiny messes, brother's truck | Tea party (video), drawings (photo) |
| 3 | Tween | 2010 | Backpack, skates, art, brother's controller | Backpack plonk (video), roller skates (photo), drawing (photo), family photo (photo) |
| 4 | Teen | 2014 | Mess everywhere, posters, skating trophies, Mum nagging, old sneakers kicked under the bed | Homework (photo), clothes pile + Mum (video), heels (photo), posters (photo), trophies (photo) |
| 5 | Young Adult | 2017 | More grown-up room; fairy lights, laptop | Faded Teddy (photo), text notes |
| 6 | Moving Out | 2018 | Pack the box, uni acceptance letter | Letter (text), boxes with Teddy / family photo / clothes (video) |

---

## Adding the real photos & videos

Until a file exists, its frame simply stays empty (the caption still shows). The snow globe and moving-out videos use the team's photo with a slow camcorder zoom until the clips arrive. Open the game with `?dev` on the end of the address (e.g. `index.html?dev`) to see which filename each one is waiting for. To add footage, **save it with exactly these names**. Files marked ✅ are already in the game (from the team's photos):

| File | Plays when… | Caption on screen |
| --- | --- | --- |
| ✅ `assets/photos/01-nursery-teddy.webp` (cut-out) | Teddy is put in the cot | Teddy, "resting" in bed. |
| `assets/video/01-nursery-snowglobe.mp4` (✅ still: `assets/photos/01-nursery-snowglobe.jpg`) | Snow globe is put away | ♪ ♫ ♪ watching the glitter fall |
| ✅ `assets/photos/01-nursery-peter-rabbit.jpg` | Peter Rabbit is put down | Peter Rabbit, chilling on a shelf. |
| `assets/video/02-childhood-tea-party.mp4` | Tea set goes on the tea table | Tea party with the dolls and Teddy. |
| no picture, just a note: `my_family.txt` | Drawing goes on the wall | MY FAMILY, by me (age 5) … Teddy is the biggest. |
| ✅ `assets/video/03-tween-backpack.mp4` (from IMG_2448) | Backpack is put down | "too many textbooks to carry" |
| ✅ `assets/photos/03-tween-rollerskates.jpg` | Skates are put down | "I got these for my birthday! Now to learn how to brake" |
| ✅ `assets/photos/03-tween-drawing.jpg` | Art supplies go on the desk | "Drawing is hard, but fun!" |
| no picture, just a note: `family_photo.txt` | Family photo is placed | Family photo day. "Everybody say cheese!" |
| `assets/photos/04-teen-homework.jpg` | Homework goes on the desk | "this is my life now." |
| `assets/video/04-teen-clothes-pile.mp4` | Both clothes go in the basket (then Mum scolds) | One more on the pile… "CLEAN. YOUR. ROOM." |
| `assets/photos/04-teen-high-heels.jpg` | Heels are put down | "stole these from mum" |
| `assets/photos/04-teen-posters.jpg` | First poster goes up | Walls = personality. |
| ✅ `assets/photos/04-teen-trophies.jpg` | First trophy is shelved | Solo dance: 2nd, 2nd… then 1st! (Still learning to brake.) |
| ✅ `assets/photos/05-youngadult-teddy.webp` (cut-out) | Teddy is put down in the young adult room | Still here. A bit faded, a lot loved. |
| `assets/video/06-moving-out-boxes.mp4` (✅ still: `assets/photos/06-moving-out-boxes.jpg`) | Teddy is packed (the finale) | Teddy, the family photo, and some clothes. |

**Formats**

- **Photos:** `.jpg` (or `.png` / `.webp` for cut-outs with a transparent background; change the extension in `js/data.js`). About 1600 px on the long side is plenty. Portrait or landscape both work: the photo frame takes the shape of the photo, nothing is cropped. Strip location data (phone photos carry GPS) by exporting a copy rather than using the original.
- **Videos:** **MP4, H.264**. Phone footage is often HEVC `.mov`, which many browsers can't play. In Premiere: *Export → H.264 → Match Source*. Keep clips short (5–20 s) and landscape 16:9. The player closes itself shortly after a video ends.
- **Stills for videos:** a video memory can have a `still` photo and a `focus` point (e.g. `focus: [0.2, 0.76]` = 20% across, 76% down). Until the video file exists, the still plays with a slow camcorder zoom towards that point.
- Captions, filenames, Mum's messages and chapter text all live in **`js/data.js`**. Change them freely; it's plain text.

---

## Brand

The look follows Chloee's **TNC Identity Guideline** and moodboard, and keeps **the room and the frame apart**:

- **Inside the room**: colours and style from the moodboard (its swatches, the Cyworld / My Scene rooms) and a pastel pixel-room reference: soft two-tone striped wallpaper, a wallpaper border under the ceiling, panelling below a white rail, and pastel plaid carpets for the younger rooms (lemon + baby blue, pink + lilac, lilac + mint); the teen teal on wood; pale blue with white panelling on honey wood for the older rooms. Outlines are a soft plum instead of black, with smooth light, gloss and sparkles on top. Messes show an orange "!" badge; things that hold a memory twinkle.
- **Outside the room (the frame)**: a Y2K web-game window built from soft colour blocks (after the pastel pixel-room reference's panel, with Windows 98 / XP only as a loose reference): plum outlines, each window with its own pastel title bar and three little colour chips, candy "gel" buttons, nested boxes and a faint grid. Windows can be dragged around (like Teleport), and buttons change colour on hover (like Yrs Truly).

| Colour block | Light / deep | Used for |
| --- | --- | --- |
| Plum | `#3d2c4a` | outlines and text (the same ink as the room's outlines) |
| Lilac | `#eadcfd` / `#c7a3f3` | the game window, menu, chapter cards, secondary buttons |
| Butter | `#fff1b8` / `#ffd24d` | Teddy's tips, the thank-you note, the memory box |
| Pink | `#ffdcef` / `#f5a3d2` | the start window, memory viewer, Mum's messages, Memories, hover |
| Sky | `#d8edff` / `#96c9f2` | little bro's messages, saving the memory box, hover on lilac buttons |
| Mint | `#ddf5cd` / `#a2d98a` | "Room tidy!" |
| Peach | `#ffe2c9` / `#ffb27a` | progress blocks, packed tags |
| Orange / Amber | `#f09000` / `#ffc700` | vivid points from the guideline: main buttons, the LCD year |

The start page keeps its soft pastel background with stars, hearts and bubbles floating up.

The logo files in `assets/brand/` are Chloee's original vector artwork (SVG: sharp at any size and small to load; no pixels, no drop shadow): `logo-main.svg` on the title screen, `logo-stacked.svg` on the door, `logo-liner.svg` on the ending. To use a new logo, replace those files and keep the same names.

**Fonts** (all free for any use, including portfolios: SIL Open Font License, licence files in `fonts/`):

| Font | Like | Used for |
| --- | --- | --- |
| [Jost](https://fonts.google.com/specimen/Jost) | Futura | body text, captions, Teddy's tips, the letter |
| [Archivo Narrow](https://fonts.google.com/specimen/Archivo+Narrow) | Arial Narrow | title bars, buttons, the top bar, labels |
| [VT323](https://fonts.google.com/specimen/VT323) | camcorder / LCD | only the camcorder date stamp and the year display |

To try other fonts, change `--font-body` and `--font-ui` at the top of `style.css` (and `FONT_BODY` / `FONT_UI` in `js/game.js` for the words drawn on the game screen).

**Rule for the team's own images:** logos, photos and videos are always shown as the originals (cut out where needed), never pixelated. Only the game's drawn objects and rooms are pixel art.

---

## Project structure

```
index.html        page shell: top bar, game screen, Teddy's tips + messages
style.css         the Y2K frame (4:3 page, colour-block windows, gel buttons, messenger pop-ups)
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

- **Isabella Kiosses**: Film & Didactic
- **Lyebin Cho**: Film & Photo
- **Chloee Park**: Design
- **Qinxi (Cecelia) Yao**: Main Coder

Film inspiration: *Teddy Bear* (Sophie Holloway, 2019), *Belongings* (Alex Coppola).

Third-party: [p5.js](https://github.com/processing/p5.js) (LGPL-2.1, see `lib/p5-LICENSE.txt`); fonts [Jost](https://fonts.google.com/specimen/Jost), [Archivo Narrow](https://fonts.google.com/specimen/Archivo+Narrow) and [VT323](https://fonts.google.com/specimen/VT323) (SIL OFL 1.1, see `fonts/`).
