# Credits

The code in this repository is MIT-licensed (see `LICENSE`). The media listed here is **not** covered by the MIT licence. It stays with its owners under the terms below.

The raw downloads are not committed (`media-src/` is gitignored). `scripts/fetch-media.sh` downloads the footage and music again, and `scripts/encode-clips.sh` rebuilds the clips and stills from them. Both scripts expect macOS: they use curl, ffmpeg and ffprobe built with libx264 (`brew install ffmpeg`), and `sips`, which ships with macOS.

## Design artwork

Nine of the ten series posters (the first, Verbotene Liebe, doubles as the Home hero art) and the avatar in `assets/posters/` come from TargetVideo's design file `FLASH.svg`, which is not committed. The tenth, `blutige-rosen.jpg`, is a stand-in (see below). They are embedded in it as PNG images, and `scripts/extract-posters.mjs` cut them out: cropped to the picture's box in the design, scaled down to display size where the source was larger, and saved as JPEG. Nothing was retouched. The gradients and tint the design lays over the hero are drawn by the app, not baked into the file.

They belong to TargetVideo or to their creators. This repository grants no licence for them, and they are here only to prototype TargetVideo's design for TargetVideo.

| File | Image in FLASH.svg | Source (px) | File (px) |
| --- | --- | --- | --- |
| `verbotene-liebe.jpg` | `image26_0_1` | 864x1184 | 864x1152 |
| `avatar.jpg` | `image27_0_1` | 1024x1024 | 120x120 |
| `der-ceo-und-ich.jpg` | `image17_0_1` | 832x1248 | 390x585 |
| `mein-geheimes-leben.jpg` | `image18_0_1` | 832x1248 | 390x585 |
| `liebe-auf-umwegen.jpg` | `image19_0_1` | 832x1248 | 390x585 |
| `blutige-rosen.jpg` | not used, see below | | 390x585 |
| `schattenkuss.jpg` | `image21_0_1` | 832x1248 | 390x585 |
| `dunkle-begierde.jpg` | `image22_0_1` | 832x1248 | 390x585 |
| `racheengel.jpg` | `image23_0_1` | 832x1248 | 390x585 |
| `schicksalsband.jpg` | `image24_0_1` | 832x1248 | 390x585 |
| `zweite-chance.jpg` | `image25_0_1` | 832x1248 | 390x585 |

Observation, not a fact: the ten images used are 832x1248, 864x1184 or 1024x1024 px. All their sides are multiples of 32, as with SDXL-style image generators, so they may be AI-generated. The PNGs carry no metadata that names a generator, and how TargetVideo made them is unknown.

### Blutige Rosen stand-in

The design's Blutige Rosen poster (`image20_0_1`) is a 940x627 landscape image that looks like a photograph, and the design shows a 2:3 slice of it. Its origin and licence are unknown, so it isn't included. `blutige-rosen.jpg` is a title card made for this prototype instead: CSS gradients, a simple SVG rose and the series title set in Playfair Display and Inter (see below), rendered with headless Chrome and saved as JPEG. It contains no third-party imagery. `scripts/extract-posters.mjs` skips this poster, so re-running it doesn't bring the original back; using the original would need TargetVideo to confirm where it comes from.

## Episode footage

Each clip is two shots joined with a hard cut, and episode 1 then cuts to one second of black. The source files have no sound, so the soundtrack is the music below. The posters and thumbnails of episodes 1 and 2 are stills of the finished clips. Episode 3 has no clip, so its poster and thumbnail are one frame of the first source below.

### Man in Black Suit Walking to the Elevator

- Creator: cottonbro studio
- Page: https://www.pexels.com/video/man-in-black-suit-walking-to-the-elevator-7599305/
- Licence: Pexels License, https://www.pexels.com/license/
- Accessed: 2026-10-29
- Used in: `vl-ep1.mp4` (source 3.6 s to 14.6 s), and the `vl-ep3` poster and thumbnail (frame at 30.2 s)
- Changes: cut, cropped from 1080x2048 to a 9:16 window (1080x1920, 64 px from the top) and scaled to 720x1280, 25 fps converted to 24 fps, joined with other footage, re-encoded as H.264. For episode 3, one frame was cut out unscaled as a 720x1280 window (x 330, y 300), and its thumbnail is a 16:9 band of that scaled to 480x270.

### A Person Holding a Pen

- Creator: Ron Lach
- Page: https://www.pexels.com/video/a-person-holding-a-pen-9870659/
- Licence: Pexels License, https://www.pexels.com/license/
- Accessed: 2026-10-29
- Used in: `vl-ep2.mp4` (source 3.0 s to 17.0 s)
- Changes: cut, cropped from 1080x2048 to a 9:16 window (1080x1920, from the top edge) and scaled to 720x1280, 25 fps converted to 24 fps, joined with other footage, re-encoded as H.264.

### A worried woman walking through her livingroom apartment at night

- Creator: Mixkit (the page names no individual creator)
- Page: https://mixkit.co/free-stock-video/a-worried-woman-walking-through-her-livingroom-apartment-at-night-51404/
- Licence: Mixkit License (Stock Video Free License), https://mixkit.co/license/#videoFree
- Accessed: 2026-10-29
- Used in: `vl-ep1.mp4` (source 6.0 s to 14.0 s)
- Changes: cut, scaled from 1080x1920 to 720x1280, 23.976 fps converted to 24 fps, joined after the Pexels shot and followed by one second of black, re-encoded as H.264.

### Night walk through the streets of a big city

- Creator: Mixkit (the page names no individual creator)
- Page: https://mixkit.co/free-stock-video/night-walk-through-the-streets-of-a-big-city-40746/
- Licence: Mixkit License (Stock Video Free License), https://mixkit.co/license/#videoFree
- Accessed: 2026-10-29
- Used in: `vl-ep2.mp4` (source 2.9 s to 10.9 s)
- Changes: cut, scaled from 1080x1920 to 720x1280, 23.976 fps converted to 24 fps, joined after the Pexels shot, re-encoded as H.264.

## Music

### Dark Fog

- Creator: Kevin MacLeod (incompetech.com)
- Page: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1300031
- Licence: Creative Commons: By Attribution 4.0 (CC BY 4.0), https://creativecommons.org/licenses/by/4.0/
- Accessed: 2026-10-29
- Used in: the soundtrack of `vl-ep1.mp4` (from 1.2 s into the track) and `vl-ep2.mp4` (from 27.9 s)
- Changes: excerpted, 0.3 s fade-in, 2 dB quieter, converted to AAC at 48 kHz. Episode 1 stops at its cut to black, and episode 2 ends with a 1.5 s fade-out.

Attribution code, as shown on the track page:

```
"Dark Fog" Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0 License
http://creativecommons.org/licenses/by/4.0/
```

The app's Profile screen shows a short version of this credit.

## Fonts and icons

- Playfair Display: Copyright 2017 The Playfair Display Project Authors (https://github.com/clauseggers/Playfair-Display), with Reserved Font Name "Playfair Display". SIL Open Font License 1.1, https://openfontlicense.org/open-font-license-official-text/. Used through `@expo-google-fonts/playfair-display`.
- Inter: Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter). SIL Open Font License 1.1, https://openfontlicense.org/open-font-license-official-text/. Used through `@expo-google-fonts/inter`.
- Lucide icons, through `lucide-react-native`: ISC licence, Copyright (c) 2026 Lucide Icons and Contributors, https://lucide.dev/license. Some of the icons (for example `chevron-left`, `lock`, `search` and `x`) derive from Feather, which is MIT-licensed, Copyright (c) 2013-present Cole Bemis.
- The app icon, splash icon, Android adaptive icon and favicon in `assets/images/` show Lucide's `heart` in black on the design's cyan (#64EDF7).

Other npm packages keep their own licences.
