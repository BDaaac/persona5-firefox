# Audio sources

## Menu and title music

- `menu-select.mp3`: unchanged `sound/select.mp3` from [Hum2a's Persona 5 Royal browser mod](https://github.com/Hum2a/Persona-5-Royal-Main-Menu-Opera-GX-Mod/blob/master/sound/select.mp3). 13,691 bytes, 0.316675 s. SHA-256: `3f7bcac47b8525ad5793e237bef1cabae9ee87bd88b4031b910d423ad2460904`. This is a community-labelled Persona 5 selection effect; its precise original game bank ID is not established.
- `title-phantom.ogg`: **Phantom**, disc 1 track 2 of Persona 5 Original Soundtrack, sourced from [the soundtrack album](https://downloads.khinsider.com/game-soundtracks/album/persona-5). Full track, 137.84 s, 2,083,336 bytes. Playback copy encoded from the album MP3 with `ffmpeg -i phantom-source.mp3 -map_metadata -1 -vn -c:a libvorbis -q:a 4 title-phantom.ogg`. SHA-256: `8910a19e2da3495e666be3c26a8745c7444134f9e0e58170cd68f668afde4f28`. Standard full-track repeat, including the recording's ending, not a reconstructed game loop.

Game music/effects belong to their respective owners (Atlus/Sega); these source links do not imply an open-content license. Sources are bundled locally; playback makes no third-party network requests.

Additional records, from the same Persona 5 Original Soundtrack album:

- `beneath-the-mask.ogg`: [Beneath the Mask — instrumental version](https://downloads.khinsider.com/game-soundtracks/album/persona-5/1-09.%2520Beneath%2520the%2520Mask%2520-instrumental%2520version-.mp3), disc 1, track 9.
- `layer-cake.ogg`: [Layer Cake](https://downloads.khinsider.com/game-soundtracks/album/persona-5/1-23.%2520Layer%2520Cake.mp3), disc 1, track 23.
- `tokyo-daylight.ogg`: [Tokyo Daylight](https://downloads.khinsider.com/game-soundtracks/album/persona-5/2-01.%2520Tokyo%2520Daylight.mp3), disc 2, track 1.

Each full album track is encoded from its source MP3 with `ffmpeg -i source.mp3 -map_metadata -1 -vn -c:a libvorbis -q:a 4 destination.ogg`. These retain the album endings. Only the selected track loads, on playback. One reusable music element replaces its source when changing records; old pending play promises cannot overwrite the latest selection. Choosing a record while OFF saves the choice without downloading or playing it. The `trackId` preference is added to the existing settings key; old settings keep Phantom selected. Only the currently playing record animates, and the animation is removed when paused or the Config sheet leaves.

Navigation reuses one audio element, restarting it only on an actual section change. Music is opt-in at 30% volume and lazy-loaded. Settings persist in `phantom-music-v1`. Hidden pages and the calendar pause music; it resumes afterward. Browser autoplay denial offers PLAY and retries on a real gesture. Test state transitions with `node review/menu-audio.test.cjs`.

## Calendar

Source: [Persona 5 Royal — General Sound Effects](https://sounds.spriters-resource.com/playstation_4/persona5royal/asset/449176/), uploaded by Flandre9999vr. Game audio belongs to its respective owners (Atlus/Sega). These are extracted game effects, not synthesized approximations.

Original WAV files are preserved unchanged:

- `calendar-change.wav`: `General Sound Effects/SYSTEM#37 (calendar_change).wav`, 0.69875 s, stereo 48 kHz. SHA-256: `d9a0ef5332593febde5e19babf1a202b76479560b029bde0f1d3f4e742c9ee90`.
- `calendar-knife.wav`: `General Sound Effects/SYSTEM#82 (stab_knife).wav`, 1.40385 s, mono 44.1 kHz. SHA-256: `129d215fd34d5d07e8e43d1c89ee37ad6eafb9a327dfd11493733e340fc9f5f6`.

The browser loads only `calendar-transition.ogg` (52,390 bytes). This compact playback copy aligns the first cue to the date movement at 600 ms, and the knife cue's approximately 90 ms lead-in to the visual impact at 1850 ms. No pitch or playback-speed changes. Vorbis encoding is lossy; the source WAVs remain available above.

Rebuild with FFmpeg:

```sh
ffmpeg -i assets/audio/calendar-change.wav -i assets/audio/calendar-knife.wav -filter_complex "[0:a]adelay=600:all=1[a];[1:a]adelay=1760:all=1[b];[a][b]amix=inputs=2:normalize=0" -ar 48000 -c:a libvorbis -q:a 7 assets/audio/calendar-transition.ogg
```

One reusable HTML audio element plays at 75% volume. Skip, replay, and hiding the document stop it. Stale play promises cannot change a newer run. If autoplay is blocked, the intro offers a user-activated replay, and Config includes a replay button; browser autoplay permissions are not modified.

Additional playback file checksums:

- `beneath-the-mask.ogg`: 281.813333 s, 4,138,847 bytes, SHA-256 `245ec74d26a27eb6a36c25068fbd55c39cd590072bb91391dbfc570bda237b28`.
- `layer-cake.ogg`: 147.893333 s, 2,187,875 bytes, SHA-256 `e1f613085ffcf92b01a217df79bc8b85cfb00ddc101e3a94e32aaa90843f938e`.
- `tokyo-daylight.ogg`: 124.146667 s, 2,034,053 bytes, SHA-256 `3f1d16074411658b4e45260273afd11f9fdb7d87d00e2733065590f1f4da107a`.
