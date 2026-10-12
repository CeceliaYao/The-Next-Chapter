# The Next Chapter

**KKB385 · A3.** An interactive, pixel-art Y2K game display about *upkeep*: the slow, never-finished job of looking after a room, and the things in it, while you grow up.

The visitor tends one bedroom across six chapters of a suburban girl's life, from the nursery to the day she moves out. Each chapter, she unpacks, tidies and decides what to carry into the next one. Teddy comes along every time. The game is inspired by *Unpacking*, but the twist is upkeep. Mess comes back, Mum nags, and the memory box only has room for so much.

**▶ Play it online:** https://ceceliayao.github.io/The-Next-Chapter/

> Built with [p5.js](https://p5js.org/), plain HTML/CSS and Web Audio. No install, no internet needed.
> Everything is real pixel art: the room is drawn on a 320 × 180 pixel canvas and scaled up 4× with no blur.

---

## Run it

**Online:** open https://ceceliayao.github.io/The-Next-Chapter/ in Chrome. It is the same game, served by GitHub Pages straight from the `main` branch, so every push updates it within a minute or two.

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

**Exhibition mode is built in.** After 2.5 minutes with no input, the game returns to the title screen for the next visitor (`IDLE_RESET_MS` in `js/data.js`). The title screen has six "discs" so visitors, or the team during the demo, can jump straight to any chapter.

---

## How it plays

1. **Unpack.** Things arrive in the box at the bottom. Drag each one into the room. While you drag, the places it can go flash with blue pixel dashes, and a dithered ghost shows exactly where it will land.
2. **Upkeep.** Some chapters start messy (crayons, clothes, homework). The **UPKEEP** meter fills as the room gets tidy. In the teen room, Mum throws another shirt on the pile after you've cleaned up.
3. **Memories.** Putting certain objects away plays a photo or a video (the team's footage) in a Y2K "Memory Player" with a camcorder date stamp. Photos and videos get a pixel filter so they match the game (see *Formats* below to turn it off).
4. **Siblings.** Your little brother's things turn up in your room. Drop them on the **door** to give them back.
5. **Memory box.** Between chapters you choose what to carry forward. Teddy always comes, plus 3 more things. Anything you drop is "let go" and listed on the ending screen.
6. **Moving out.** The box at the bottom flips around. Now you *pack* the room into it. Read the uni letter, then pack Teddy last.

| # | Chapter | Year | What happens | Memories (from the shot list) |
| --- | --- | --- | --- | --- |
| 1 | The Nursery | 2000 | Cot, mobile, night-light, snow globe | Teddy resting in bed (photo), snow globe (video), Peter Rabbit books (photo) |
| 2 | Childhood | 2005 | Tea party, dress-ups, tiny messes, brother's truck | Storybooks (photo), tea party (video), drawings (photo) |
| 3 | Tween | 2010 | Backpack, skates, art, brother's controller | Backpack plonk (video), roller skates (photo), drawing (photo), family photo (photo) |
| 4 | Teen | 2014 | Mess everywhere, posters, trophies, Mum nagging | Homework (photo), clothes pile + Mum (video), heels (photo), posters (photo), trophies (photo) |
| 5 | Young Adult | 2017 | More grown-up room; fairy lights, laptop | Text notes |
| 6 | Moving Out | 2018 | Pack the box, uni acceptance letter | Letter (text), boxes with Teddy / family photo / clothes (video) |

---

## Adding the real photos & videos

Until a file exists, the game shows a styled placeholder with the filename it is waiting for, so nothing looks broken. To add footage, **save it with exactly these names**:

| File | Plays when… | Caption on screen |
| --- | --- | --- |
| `assets/photos/01-nursery-teddy.jpg` | Teddy is put in the cot | Teddy, "resting" in bed. |
| `assets/video/01-nursery-snowglobe.mp4` | Snow globe is put away | ♪ ♫ ♪ watching the glitter fall |
| `assets/photos/01-nursery-storybooks.jpg` | Peter Rabbit books are shelved | Peter Rabbit, chilling on a shelf. |
| `assets/photos/02-childhood-storybooks.jpg` | Storybooks are shelved | Read it again! Again! |
| `assets/video/02-childhood-tea-party.mp4` | Tea set goes on the tea table | Tea party with the dolls and Teddy. |
| `assets/photos/02-childhood-drawings.jpg` | Drawing goes on the wall | This is my family. Teddy is the biggest. |
| `assets/video/03-tween-backpack.mp4` | Backpack is put down | "too many textbooks to carry" |
| `assets/photos/03-tween-rollerskates.jpg` | Skates are put down | "I got these for my birthday! Now to learn how to brake" |
| `assets/photos/03-tween-drawing.jpg` | Art supplies go on the desk | "Drawing is hard, but fun!" |
| `assets/photos/03-tween-family-photo.jpg` | Family photo is placed (use light glare to hide faces) | Family photo. Everybody say cheese. |
| `assets/photos/04-teen-homework.jpg` | Homework goes on the desk | "this is my life now." |
| `assets/video/04-teen-clothes-pile.mp4` | Both clothes go in the basket (then Mum scolds) | One more on the pile… "CLEAN. YOUR. ROOM." |
| `assets/photos/04-teen-high-heels.jpg` | Heels are put down | "stole these from mum" |
| `assets/photos/04-teen-posters.jpg` | First poster goes up | Walls = personality. |
| `assets/photos/04-teen-trophies.jpg` | First trophy / medal / award is shelved | Volleyball, karate, and one academic award. |
| `assets/video/06-moving-out-boxes.mp4` | Teddy is packed (the finale) | Teddy, the family photo, and some clothes. |

**Formats**

- **Photos:** `.jpg` (or `.png`, but then change the extension in `js/data.js`). Landscape, about 1200 × 730 px; the frame crops to fill.
- **Videos:** **MP4, H.264**. Phone footage is often HEVC `.mov`, which many browsers can't play. In Premiere: *Export → H.264 → Match Source*. Keep clips short (5–20 s) and landscape 16:9. The player closes itself shortly after a video ends.
- **Pixel filter:** `MEDIA_PIXEL` in `js/data.js` sets how chunky the photos and videos look (3 by default). Set it to `0` to show them exactly as filmed.
- Captions, filenames, Mum's messages and chapter text all live in **`js/data.js`**. Change them freely; it's plain text.

---

## Brand

The look follows the team's identity board: the *The Next Chapter* logo and its six colours, warm muted rooms (like *Unpacking*), and bright "point colours" on the frames, buttons and title bars, in a Windows 98-style desktop where the windows can be dragged around.

| Colour | Hex | Used for |
| --- | --- | --- |
| Ink | `#221a13` | outlines, text |
| Blue | `#00b5ff` | drop guides, second buttons, title bars |
| Orange | `#ff5400` | main buttons, counters |
| Pink | `#ff84e4` | hearts, Mum's messages, title bars |
| Yellow | `#ffc700` | MEM tag, title bars |
| Lime | `#8de328` | UPKEEP meter, title bars |
| Cream | `#f6e680` | window bevels, paper |

The logo files are in `assets/brand/`. `logo-main.png` is the original; the `-pixel` versions were redrawn on a pixel grid in the brand colours so they match the game. To use a new logo, replace those files and keep the same names.

---

## Project structure

```
index.html        page shell + HUD
style.css         the pixel Y2K skin (pixel windows, bevelled buttons, messenger pop-ups)
js/data.js        ← edit me: chapters, objects, where things go, captions, file names
js/pixel.js       the pixel engine: palette, crisp shapes, outlines, dithering, pixel text
js/sprites.js     every object as pixel art (grids of palette letters, or pixel shapes)
js/room.js        the bedroom for each chapter as pixel art (walls, window, furniture)
js/game.js        game logic: drag & drop, placement rules, memory box, feedback
js/ui.js          screens: title, chapter cards, memory player, keep box, ending
js/audio.js       synthesised sound effects + music-box ambience (no audio files)
lib/p5.min.js     p5.js 1.11 (bundled so it works offline)
fonts/            Pixelify Sans, Silkscreen, VT323 (bundled, SIL Open Font License)
assets/brand/     team logo (original + pixel versions) and favicon
assets/photos/    ← put photos here
assets/video/     ← put videos here
```

**Editing the pixel art:** in `js/sprites.js` many objects are little grids of letters, one letter per pixel (`.` is see-through). The letters are colours from `PALETTE` in `js/pixel.js`, e.g. `u` teddy brown, `h` hot pink, `w` white, and `1`–`6` the brand colours (blue, orange, pink, yellow, lime, cream). Change a letter, refresh, and the pixel changes. The dark outline is added automatically.

**Changing where things can go:** each object in `ITEM_DEFS` has a `fits` list (e.g. `['shelf', 'desk']`), and each chapter has `surfaces` with a matching `tag`. If every spot an object fits is full, the game lets it go on any shelf, desk, bed or the floor, so a visitor can never get stuck.

---

## Credits

**The Next Chapter** by

- **Qinxi (Cecelia) Yao**: Main Coder
- **Chloee Park**: Design
- **Isabella Kiosses**: Film & Didactic
- **Lyebin Cho**: Film & Photo

Film inspiration: *Teddy Bear* (Sophie Holloway, 2019), *Belongings* (Alex Coppola).

Third-party: [p5.js](https://github.com/processing/p5.js) (LGPL-2.1, see `lib/p5-LICENSE.txt`); fonts [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans), [Silkscreen](https://fonts.google.com/specimen/Silkscreen) and [VT323](https://fonts.google.com/specimen/VT323) (SIL OFL 1.1, see `fonts/`).
