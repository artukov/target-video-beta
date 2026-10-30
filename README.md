# DramaFlash — beta app prototype

A clickable prototype of the DramaFlash beta app, built from the supplied screen design (`FLASH.svg`). It covers one journey end to end: the Home feed, a real video player, the lock after the cliffhanger, and a coin unlock that continues straight into the next episode. Everything else in the design is either wired minimally or labelled as not part of the prototype, except sign-in (frame 6) and the player's comment button, which are left out.

Walkthrough video: _link to be added_

## Run it

Requirements: Node 22.13+ or 24.3+ (tested with Node 24.7) and Expo Go for SDK 58.

```sh
npm ci
npx expo start
```

- iOS Simulator: press `i` (needs Xcode). The Expo CLI installs the matching Expo Go.
- iPhone: install Expo Go, join the same Wi-Fi as the computer and scan the QR code with the Camera app. Expo Go may ask you to sign in to an Expo account first.
- Android: scan the QR code from Expo Go. If the Play Store version isn't the SDK 58 one, install it from [expo.dev/go](https://expo.dev/go).
- Expo Go puts a floating gear button in the top-right corner, right over the player's mute button. Drag it down the edge, or tap it and switch off **Tools button** (shake the phone to get the menu back).

## Two-minute walkthrough

1. **Home** → **Jetzt ansehen** plays Episode 1 of *Verbotene Liebe* (free).
2. Episode 1 ends on a cliffhanger: the narration reveals that Mia has read the contract Alex never meant her to see. Episode 2 is locked: the sheet shows the price (10 coins) and the balance after unlocking (15 → 5).
3. **Unlock for 10 coins** → a toast confirms it and Episode 2 starts on the same screen.
4. Partway through Episode 2, force-quit Expo Go (swipe it away in the app switcher), open Expo Go again and tap DramaFlash under recently opened projects (on the Simulator, press `i` in the terminal again). Balance, unlock and progress are kept, and Home offers **Weiterschauen · Ep 2**, picking up a second before where you stopped.
5. Let Episode 2 finish → Episode 3's sheet shows the 5-coin shortfall with the button disabled. That's where the demo ends: Episode 3 has no video, so the sheet says more coins wouldn't unlock it, and there are no top-ups.

**Maybe Later** keeps the lock screen with *Unlock Episode 2* and *Replay Episode 1*.

**Demo controls** live in the **Profile** tab: start Episode 1 four seconds before the cliffhanger, set the balance to 0, simulate a playback error (Retry recovers), and reset the demo to 15 coins.

## What is real and what is simulated

| Real | Simulated or out of scope |
| --- | --- |
| Video playback (expo-video, H.264 clips with a music bed) | Coins are demo coins: no payments, no wallet server |
| The lock is triggered by the player's end-of-episode event, and the narration follows the playback position | The story is on-screen narration written for the demo; the stock footage has no dialogue |
| One unlock = one charge, saved immediately; a double tap can't charge twice | Catalogue and artwork are local; only *Verbotene Liebe* plays (Episodes 1–2 have video, Episode 3 stays locked and can't be bought) |
| Progress, unlocks and balance survive a relaunch; resume picks up a second before where you stopped | Discover, Romance, notifications and "See all" are placeholders; Library lists saved series |
| A failed save or unreadable storage is shown in the player and on the Profile tab | Like and Share on the player are local only (Share opens the system sheet) |

Ads, subscriptions, the season pass, real purchases and sign-in are out of scope: the brief asks for one unlock flow, and the coin unlock is it.

Entitlements stored on the device are a convenience for the prototype, not content protection. In production the server decides access and hands out short-lived playback URLs.

## Design decisions

- **Source of truth:** the eight dark DramaFlash frames. The white wireframe only fills gaps (spacing, structure).
- **Prices from the design:** the unlock modal says 10 coins per episode and the recharge screen shows a balance of 15, so the demo starts with 15. That allows exactly one unlock and then shows the shortfall. Both numbers are single constants: `EPISODE_PRICE` in `src/catalog/catalog.ts` and `SEED_COINS` in `src/session/snapshot.ts`.
- **Episodes unlock in order**, so coins can't be spent on an episode the viewer can't reach yet.
- **Unlock sheet:** the design's card (frame 7) with only the per-episode coin option, plus the balance row from the recharge screen. Season pass and Premium were left out rather than shown as options that do nothing.
- **Player:** one episode at a time, full screen, extending the episode feed frame. Switching episodes happens on the same screen, so the player is never duplicated. A locked episode keeps its series title and episode chip, dimmed, like the locked episodes in that frame.
- **The cliffhanger:** the clips are stock footage without dialogue, so the story is told in short on-screen narration timed to the shots, ending on *To be continued…* just before the lock. It is set in italic serif so it reads as narration, not as subtitles of spoken lines.
- **Designed here, because the frames have none:** player controls (seek bar, mute, close), the loading spinner, the error panel with Retry, the not-enough-coins state, *You're all caught up* after the last episode, and the *Replay Episode 1* link under the lock card.
- **Copy** is taken from the design as it is: German on Home, English on the other screens.
- **Small adjustments:** the poster rails start at the 16 pt page margin instead of the screen edge; fonts are Playfair Display and Inter, inferred from the outlined text in the design.
- **Inherited from the design and left as is:** the posters' baked-in titles differ from the UI titles (the *Verbotene Liebe* art says *Echoes of Eternity*). The detail and episode-feed frames show series that aren't on Home, so the prototype uses Home's *Verbotene Liebe* throughout. The recharge screen's 85-coin price, € coin packs and $ membership aren't used.
- **Artwork** (posters, hero, avatar) is extracted from the design file with the design's own framing, except *Blutige Rosen*: its picture in the design has no known source, so it's replaced by a title card made for this prototype. Episode footage is licensed stock footage, cut to a short cliffhanger with a music bed (see `CREDITS.md`).

## How it's built

- Expo SDK 58 with Expo Router, TypeScript and the React Compiler. No UI kit and no state library.
- `src/session/` holds the rules as pure functions — `entitlements.ts` (who can play what, the unlock transition), `resume.ts` (where "continue" goes), `snapshot.ts` (validating what was saved) — and `SessionProvider.tsx`, the only place that changes coins, unlocks and progress. It applies each action to the latest state synchronously, writes once per change, writes in order and always the newest state, writes nothing before the saved state has loaded, and reports a failed read or write instead of only logging it.
- `src/player/` (`useEpisodePlayer.ts` and the `EpisodeVideo` view it feeds) is the only code that talks to expo-video. The screens depend only on what the hook returns (phase, position, end of episode, retry), which keeps a player swap contained but doesn't make it a drop-in: TargetVideo's SDK would have to be mapped onto that contract, and its ad breaks, HLS renditions and own lifecycle events change what "ended" and "error" mean. The episode's first frame is shown as a poster until the video's first frame is on screen; every load gets its own state object, so late events and async results from a previous episode are ignored; the lock fires once per playthrough; playback pauses when the screen loses focus, the app goes to the background or the unlock sheet opens; progress is saved every 5 seconds and on pause or close.
- **Why expo-video and not TargetVideo's SDK:** the prototype runs in Expo Go, so `npx expo start` is all a reviewer needs. TargetVideo's player SDK is the production choice, but it needs credentials and a native build that Expo Go can't load. expo-video ships in Expo Go and covers the journey: `replaceAsync` switches episodes on one player, `onFirstFrameRender` ends the poster, and `playToEnd` drives the lock. The cost: progressive MP4 from the development server instead of HLS, and no ads.
- Tests (`npm test`, 53 tests): the unlock rules, resume logic and snapshot validation; the provider's guarantees (double tap, write order, nothing saved before loading, failed reads and writes); and the player journey against a fake player — narration and cliffhanger to unlock, Episode 3's shortfall, resume, background and foreground, errors and retries, the save-failure notice. The fake player imitates expo-video's events, so these tests can't prove native playback or touch handling.

## What was checked

Each line says how it was checked. "Native taps" means touches synthesized by XCUITest on the iOS Simulator: real iOS touch events, but no person and no audible sound.

- **Automated, on the final source:** `npm run typecheck`, `npm run lint`, `npm test` (53 tests in 5 suites), `npx expo-doctor` (20/20 checks) and `npx expo export -p ios -p android` all pass. They pass again in a clean copy built from the ignore rules and installed with `npm ci`, also on a case-sensitive disk, and that copy runs in Expo Go with `npx expo start`.
- **Native taps, iOS Simulator** (iPhone 16 Pro and iPhone SE 3rd generation, iOS 18.3, Expo Go 58.0.7): reset from Profile, **Jetzt ansehen**, Episode 1 to its natural end with the narration following the position, exactly one sheet, Maybe Later, a tap outside the sheet, Replay, a double tap on **Unlock for 10 coins** (one charge, 15 → 5, Episode 2 from 0:00 on the same screen), pause, mute, seek taps and drags, a tap on the knob, background and foreground, a kill right after the unlock and a relaunch, resume a second early, and Episode 3's shortfall. Every entry path: the series rows and direct links to free, locked, unlocked, clip-less and unknown episodes.
- **Failures, forced natively:** a local proxy in front of the development server failed, delayed or stalled the real episode file. The error panel and Retry recovered from an HTTP failure, the spinner and poster cleared after slow loads, a 24-second stall (and a 24-second pause) never opened the lock, and closing the player during a slow load or Retry never restarted playback (checked in the system media log). A read-only storage folder showed the save-failure notice and left the saved file untouched.
- **Screens:** Home, the sheet, the player and the lock against the dark frames, and the SE at Accessibility Large text.
- **Tests against a fake player:** the same flows in the journey tests, including taps in the same frame. They check the app's logic, not native touch handling.
- **Not checked yet:** sound and the silent switch on a real iPhone (and the recording), audio interruptions, VoiceOver gestures, Reduce Motion on a device, Android at runtime (only its export was built) and a standalone build. The sheet, toast and narration animations use Reanimated's defaults, which follow the system Reduce Motion setting.
- **Deep links** were checked with the app running. On a cold launch Expo Go doesn't pass the link's path to the app, so the app opens on Home.

## Limitations

- In Expo Go the clips are served by the development server on the computer, so the phone needs it running. Offline playback needs a standalone build.
- The catalogue, prices and balance are local constants; nothing talks to a backend.
- If saving fails (for example, the phone is out of storage), a notice in the player and on the Profile tab says so, and the latest change lasts only until the app closes. If the device storage can't be read at launch, the saved session is left untouched, and the app runs on the demo defaults, says so, and saves nothing that run. A saved session that is corrupt or from another version is replaced by the demo defaults at the first change.
- Progress is saved every 5 seconds and when the viewer pauses, the app goes to the background or the player closes, so a crash can lose the last few seconds of position.
- A link to another episode that arrives while the player is already open doesn't switch episodes; close the player first.
- The seek bar jumps to where the finger lifts; it doesn't preview the position while dragging.

## Next steps for production

- Plug in TargetVideo's player SDK (HLS/DASH, VAST/VPAID/IMA ads) behind `src/player/`, and load the catalogue from the CMS.
- Move the wallet and entitlements to the server with idempotent unlocks (one request ID per tap), and sell coin packs through StoreKit and Google Play Billing with server-side receipt checks.
- Protect paid episodes with signed, short-lived playback URLs or DRM.
- Measure what matters for the paywall: time to first frame, rebuffering, episode completion, unlock conversion at the cliffhanger, and how many viewers keep watching after unlocking. Add crash reporting.

## Credits and licence

Code is MIT-licensed (`LICENSE`). The artwork, footage and music are not; see `CREDITS.md` for owners, licences and changes.
