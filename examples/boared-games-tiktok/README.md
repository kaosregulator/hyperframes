# Boared Games TikTok series

Seven vertical (1080×1920) promo videos for [Boared Games Beta](https://github.com/kaosregulator/Boared-games-beta), the 90s bedroom you play in the browser, made with HyperFrames.

| Video                | Spec                    | Length | Music                                        |
| -------------------- | ----------------------- | ------ | -------------------------------------------- |
| Showcase sample      | `showcase/index.html`   | 30 s   | "Brahe", Punch Deck (CC BY 4.0)              |
| Monopoly             | `specs/monopoly.json`   | 58 s   | "Brahe", Punch Deck (CC BY 4.0)              |
| Wizard Chess         | `specs/chess.json`      | 55.5 s | "Brahe", Punch Deck (CC BY 4.0)              |
| Battleship           | `specs/battleship.json` | 58 s   | "Brahe", Punch Deck (CC BY 4.0)              |
| Clue                 | `specs/clue.json`       | 57 s   | "To See The Past", Hayden Folker (CC BY 3.0) |
| Army Men             | `specs/army.json`       | 56 s   | "Brahe", Punch Deck (CC BY 4.0)              |
| The room (nostalgia) | `specs/room.json`       | 60 s   | "Growing Up", Scott Buckley                  |

Every video uses the room's own footage and gameplay: the menu trailer (`public/menu/reel.mp4` in the game repo) and stills captured from the running game in `stills/`.

## The look

- A VHS layer: `▶ PLAY`, a blinking `● REC`, a date stamp, scanlines and a vignette.
- Archivo Black titles with a pink and cyan chromatic split, and one accent colour per game.
- Camera moves on every shot: pans, push-ins and punch-ins on the stills and footage.
- Transitions: whip pans with motion blur, a zoom-through with a flash, an iris, dip cuts, and vertical whips.
- Motion graphics: slot-machine reels (pick your piece, call your shot), rolling digit counters, stickers, polaroids and a per-letter end card.
- The first frame is always the hook. Text stays inside TikTok's safe band (168 to 1330 px). Each video ends on a comment question and the "PLAY IT IN YOUR BROWSER" card.

## Build and render

```bash
# 1. once: grade the trailer, vendor GSAP, make the blurred card backgrounds
BOARED=/path/to/Boared-games-beta ./prepare.sh

# 2. build a project from a spec, then check and render it
node gen/build.mjs specs/clue.json out/clue
cd out/clue && npx hyperframes lint && npx hyperframes render -o clue.mp4
```

`gen/build.mjs` turns a spec into a HyperFrames project. A spec lists:

- **shots**, played back to back. `kind` is `reel` (the trailer at `ms` seconds) or `still`, with `layout` set to `bleed` (full frame), `card` (the frame in a glowing card over a blurred copy) or `poster` (box art). `x0/x1`, `y0/y1` and `s0/s1` set the camera move, and `tr` sets the transition in: `whip`, `vwhip`, `zoom`, `iris`, `flash`, `dip`, `punch` or `cut`.
- **texts**, placed at absolute times. `kind` is `big`, `mid`, `sub`, `sticker`, `slot`, `counter`, `polaroids` or `endcard`. Words between `*` take the accent colour.

Every exit tween is a `fromTo` with `immediateRender: false`. A plain `to` records its start value the first time a render worker reaches it, so on parallel renders it can freeze mid-blur.

The showcase is hand-written. To render it, copy `work/reel.mp4`, `work/gsap.min.js`, the game's `public/room/brahe-punch-deck.mp3` (as `music.mp3`) and the box art from `public/cards/` into `showcase/assets/`.

## Capturing new stills

`capture/shoot.cjs` drives the game in headless Chromium against its dev server (`npm run dev` in the game repo) and saves a still every few seconds. Two of every three stills hide the UI. It clicks buttons in `PRI` order, runs a `HOOK` script in the page, and can hold `KEYS`:

```bash
node capture/shoot.cjs monopoly stills/monopoly 12
SLOW=25 PRI="Continue" HOOK="$(cat capture/hook-chess.js)" GAP=8000 node capture/shoot.cjs chess stills/chess4 12
SLOW=25 PRI="Start battle|New battle|Random fleet" HOOK="$(cat capture/hook-bs.js)" node capture/shoot.cjs battleship stills/battleship 14
PRI="Play as|Suggest in|Skip the suggestion|Continue|Roll the dice|Into the|No moves" node capture/shoot.cjs clue stills/clue 14
URL="http://127.0.0.1:3000/?army=1&armyCam=chase&dpr=1" WAITMS=150000 KEYS="w,w+d,Space,w+a,Space,w" node capture/shoot.cjs army stills/army 12
```

The hooks use the game's dev-only capture handles: `__chessTable` (plays a scholar's mate and orbits `__tableCam`) and `__battleship` (fires on their ships). Software WebGL is slow, at 30 s to 3 min a frame, so a dozen stills takes a while.
