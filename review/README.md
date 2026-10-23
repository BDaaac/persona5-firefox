# Calendar transition, 23 October 2026

The supplied night-city screenshot is the visual reference. Dates are live HTML,
not baked into the background. Five dates remain visible after the transition;
one additional old date exits off the left edge during the change.

## Sequence

- 0–600 ms: yesterday is the large central date. No knife.
- 600–1400 ms: dates move along the city arc; today grows into the central slot.
- 1400–1650 ms: today is stationary. No knife.
- 1650–1850 ms: knife enters from the upper right.
- 1850 ms: contact, numeral recoil and small impact accent begin together.
- 2100 ms: settled hold. At 3900 ms, exit starts; Search / Joker opens after 280 ms, with the search input focused.

Quick fix v9.2: at the user's explicit request the intro always animates,
including when the OS requests reduced motion. The INTRO MOTION switch was
removed. The dagger renders in front of the numeral instead of behind it.
The stored daily marker, links and note use their existing storage keys.

## Review and regression checks

Serve the project root locally and open `review/motion.html`. The review page
loads the real HTML/CSS/JS into an iframe, substitutes an in-memory storage object
and test clock, and offers frame seeking and a Run checks button. It does not
clear or modify the browser's real localStorage. The test clock and media-query
stub affect only the test document.

Checks cover yesterday-before-today, knife visibility before/after the change,
New Year and leap-day rollover, skip-to-hub, preservation of a pre-existing note,
the daily marker, replay during exit, always-on intro motion and dagger layering. Visual review covers
the initial frame, settled date, impact, final frame, and a 390 px viewport.

Browser verification: Chromium. Native Firefox has not been re-tested because
the available browser control does not support it. The supplied reference is a
still image; timings are designed for this implementation, not measured from
original gameplay video.

## Image assets

Generated with the built-in image_gen tool from the user's reference screenshot:

- `assets/daily-city-night.png`: clean city background.
- `assets/daily-dagger-ink.png`: transparent, flat black/white dagger sprite.

Prompts used:

> Edit this reference screenshot into a clean background asset for the user's personal Persona 5 calendar UI. Remove ALL foreground UI: all date numerals 16 17 18 19 20 21, weekdays, top-left year/month lettering, and the dagger. Reconstruct the city naturally behind their removed silhouettes. Preserve the original composition, dramatic curved wide-angle Tokyo skyline, giant angular black building silhouettes framing foreground left/right, central downward city street perspective, flat medium grey building planes, small white windows, charcoal blue-grey NIGHT sky, tiny red/orange roof aviation lights. Faithfully preserve the bold crude black ink contour / cel shaded graphic game-art appearance; NOT photorealistic, no shading gradients, no daylight blue sky, no clouds. Full bleed 16:9 landscape. No letters, no numbers, no UI, no weapon, no watermark. The only change from reference is removal of overlays and filling missing city detail.

> Extract/recreate ONLY the small illustrated dagger from the reference screenshot as a clean standalone sprite on a genuinely TRANSPARENT background. Faithfully reproduce its flat black and white Persona 5 calendar graphic shape: simple black blade with narrow white edge and white central slash, curled white/black ornate crossguard, black grip wrapped in bold white diagonal bands and rounded black pommel. Diagonal orientation exactly like reference: sharp tip at bottom-left, handle at upper-right, overall axis about 37 degrees clockwise from vertical. Whole dagger visible, tip included. NOT photorealistic, NOT metallic render, NOT grey shading. Pure black and white ink only. No city, no text, no numbers, no drop shadow, no white rectangular background. Close crop with small even transparent margin.

Original intro sources and index are retained in `review/before-v8/`.
