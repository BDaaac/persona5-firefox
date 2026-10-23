"""Files needed by both the standalone website and the Firefox package."""

RUNTIME_FILES = ["index.html"]
RUNTIME_FILES += [f"assets/{name}" for name in (
    "phantom-core.js", "phantom-audio.js", "phantom-v4.js", "phantom-daily.js",
    "phantom-menu.css", "phantom-paper.css", "phantom-daily.css",
    "phantom-art.png", "grey-stars.svg", "daily-city-night.png",
    "daily-dagger-ink.png",
)]
RUNTIME_FILES += [f"assets/menu-{name}.png" for name in (
    "joker", "ann", "futaba", "makoto", "ryuji", "akechi", "yusuke",
)]
RUNTIME_FILES += [f"assets/audio/{name}" for name in (
    "title-phantom.ogg", "beneath-the-mask.ogg", "layer-cake.ogg",
    "tokyo-daylight.ogg", "menu-select.mp3", "calendar-transition.ogg", "README.md",
)]
