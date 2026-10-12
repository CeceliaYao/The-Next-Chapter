# The Next Chapter

*one room, from nursery to moving out: what we keep up, carry on, and leave behind*

**KKB385 · A3.** An interactive, pixel-art Y2K game display about *upkeep*: the slow, never-finished job of looking after a room, and the things in it, while you grow up.

The visitor tends one bedroom across six chapters of a suburban girl's life, from the nursery to the day she moves out. Each chapter, she unpacks, tidies and decides what to carry into the next one. Teddy comes along every time. The game is inspired by *Unpacking*, but the twist is upkeep. Mess comes back, Mum nags, and the memory box only has room for so much.

**▶ Play it online:** https://ceceliayao.github.io/The-Next-Chapter/

> Built with [p5.js](https://p5js.org/), plain HTML/CSS and Web Audio. No install, no internet needed.
> Everything is real pixel art: the room is drawn on a 320 × 180 pixel canvas and scaled up 4× with no blur.

---

## Run it

**Online:** open https://ceceliayao.github.io/The-Next-Chapter/ in Chrome. It is the same game, served by GitHub Pages. Every push to `main` is copied to the `gh-pages` branch by `.github/workflows/publish.yml`, and the site updates within a minute or two.

**On the exhibition computer (recommended for the show, no Wi-Fi needed):**

1. Copy the whole folder onto the machine (USB is fine).
2. Open `index.html` in **Google Chrome** (double-click it, or drag it into a Chrome window).
3. Press **F** for fullscreen. Turn the sound on.

**While developing** (optional; any static server works):

```bash
npx serve .        # then open the printed localhost address
```

### Controls

| Action | How |
| --- | --- |
| Move things | Click and drag |
| Move a window | Drag it by its coloured title bar |
| Replay a memory | Click a placed object that shows a ▶ / ! badge |
| Menu (restart chapter, chapter select) | **Esc** or the ★ menu button |
| Sound on/off | **M** or the ♪ button |
| Fullscreen | **F** |
| Skip the current chapter (for testing) | **Shift + N** |

**Exhibition mode is built in.** After 2.5 minutes with no input, the game returns to the title screen for the next visitor (`IDLE_RESET_MS` in `js/data.js`). The game opens on a closed bedroom door with the logo and our names on it (after Chloee's laptop mock-up). Click the door (or press Enter) and it swings open onto the title screen; the door comes back after an idle reset, so every new visitor gets to open it. On the title screen, **START** begins the game and the six discs jump straight to any chapter (handy for the demo).

---

## How it plays

1. **Unpack.** Things arrive in the box at the bottom. Drag each one into the room. While you drag, the places it can go flash with blue pixel dashes, and a dithered ghost shows exactly where it will land.
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

Until a file exists, the game shows something in its place, so nothing looks broken: a pixel stand-in for the teen posters, the photo with a slow camcorder zoom for the snow globe and moving-out videos, or the object itself bobbing in a little scene. Open the game with `?dev` on the end of the address (e.g. `index.html?dev`) to see which filename each one is waiting for. To add footage, **save it with exactly these names**. Files marked ✅ are already in the game (from the team's photos):

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
| `assets/photos/04-teen-posters.jpg` (pixel stand-in for now) | First poster goes up | Walls = personality. |
| ✅ `assets/photos/04-teen-trophies.jpg` | First trophy is shelved | Solo dance: 2nd, 2nd… then 1st! (Still learning to brake.) |
| ✅ `assets/photos/05-youngadult-teddy.webp` (cut-out) | Teddy is put down in the young adult room | Still here. A bit faded, a lot loved. |
| `assets/video/06-moving-out-boxes.mp4` (✅ still: `assets/photos/06-moving-out-boxes.jpg`) | Teddy is packed (the finale) | Teddy, the family photo, and some clothes. |

**Formats**

- **Photos:** `.jpg` (or `.png` / `.webp` for cut-outs with a transparent background; change the extension in `js/data.js`). About 1600 px on the long side is plenty. Portrait or landscape both work: the photo frame takes the shape of the photo, nothing is cropped. Strip location data (phone photos carry GPS) by exporting a copy rather than using the original.
- **Videos:** **MP4, H.264**. Phone footage is often HEVC `.mov`, which many browsers can't play. In Premiere: *Export → H.264 → Match Source*. Keep clips short (5–20 s) and landscape 16:9. The player closes itself shortly after a video ends.
- **Pixel filter:** off by default (`MEDIA_PIXEL = 0` in `js/data.js`), so footage is shown as filmed. Set it to `3` if you ever want the chunky pixel look on photos and videos too.
- **Stills for videos:** a video memory can have a `still` photo and a `focus` point (e.g. `focus: [0.2, 0.76]` = 20% across, 76% down). Until the video file exists, the still plays with a slow camcorder zoom towards that point.
- Captions, filenames, Mum's messages and chapter text all live in **`js/data.js`**. Change them freely; it's plain text.

---

## Brand

The look follows the team's identity board and our colour decision: **orange (two shades) + off-white as the base**, with black and white, and **pink and blue as the cooler accents**. The rooms are warm and muted (like *Unpacking*) and shift colour from stage to stage; the interface is a Windows 98-style desktop where the windows can be dragged around.

| Colour | Hex | Used for |
| --- | --- | --- |
| Orange | `#ff5400` | title bars, main buttons, counters (base) |
| Light orange | `#ff8f3a` | title bar band, MEM tag (base) |
| Off-white | `#fff6ea` | windows, HUD, background (base) |
| Ink | `#221a13` | outlines, text |
| Blue | `#00b5ff` | accent: drop guides, second buttons, messages |
| Pink | `#ff84e4` | accent: hearts, Mum's messages |
| Yellow / Lime | `#ffc700` / `#8de328` | the logo, chapter titles, UPKEEP meter |

The logo files in `assets/brand/` are the team's original artwork (transparent PNGs, never pixelated): `logo-main.png` on the title screen, `logo-stacked.png` on the door, `logo-liner.png` on the ending. To use a new logo, replace those files and keep the same names.

**Rule for the team's own images:** logos, photos and videos are always shown as the originals (cut out where needed), never pixelated. Only the game's drawn objects and rooms are pixel art.

---

## Project structure

```
index.html        page shell + HUD
style.css         the pixel Y2K skin (pixel windows, bevelled buttons, messenger pop-ups)
js/data.js        ← edit me: chapters, objects, where things go, captions, file names, Teddy's ages
js/memory-art.js  pixel stand-in for the posters until their photo is taken
js/pixel.js       the pixel engine: palette, crisp shapes, outlines, dithering, pixel text
js/sprites.js     every object as pixel art (grids of palette letters, or pixel shapes)
js/room.js        the bedroom for each chapter as pixel art (walls, window, furniture)
js/game.js        game logic: drag & drop, placement rules, memory box, feedback
js/ui.js          screens: title, chapter cards, memory player, keep box, thank-you note, ending
js/audio.js       synthesised sound effects + music-box ambience (no audio files)
lib/p5.min.js     p5.js 1.11 (bundled so it works offline)
fonts/            Pixelify Sans, Silkscreen, VT323 (bundled, SIL Open Font License)
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

Third-party: [p5.js](https://github.com/processing/p5.js) (LGPL-2.1, see `lib/p5-LICENSE.txt`); fonts [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans), [Silkscreen](https://fonts.google.com/specimen/Silkscreen) and [VT323](https://fonts.google.com/specimen/VT323) (SIL OFL 1.1, see `fonts/`).
