# P'S Delicacies — café & restaurant website

A static marketing site for P'S Delicacies, a pure-vegetarian Italian-style pizza kitchen
in Bardoli (since 2013) and Vesu, Surat. Plain HTML, CSS and JavaScript — no build step,
no framework, no server. Open `index.html` through any static server and it runs.

## Pages

| File | What's on it |
| --- | --- |
| `index.html` | Hero with a procedural 3D pizza, the story in brief, a pinned horizontal signature-dish rail, photo strip, reviews, section tiles |
| `menu.html` | All 143 menu items, searchable, filterable by Jain / spicy, with all four sizes priced |
| `builder.html` | Build-your-own pizza: size, crust and 36 toppings, live price, order handoff to WhatsApp |
| `story.html` | How the kitchen started, a timeline, what happens behind the pass, an Instagram wall |
| `visit.html` | Both locations with switchable maps and directions, contact details, FAQ |

## Layout

```
assets/brand/    logo, mark and wordmark as SVG
assets/img/      food photography (WebP, full size + -sm variants) and concrete textures
assets/ig/       Instagram tiles
css/style.css    the whole stylesheet
js/main.js       shared behaviour: nav, drawer, scroll animation, page transitions, locations
js/menu-data.js  the menu as data (143 items, four sizes, Jain and spicy flags)
js/menu.js       builds and filters the menu page
js/builder.js    the pizza builder and its drawn pizza
js/pizza3d.js    the home hero's 3D pizza, built in code with three.js
_research/       source material the site was built from
```

## How it's put together

- **No build.** Every dependency loads from a CDN: GSAP 3.12.5 with ScrollTrigger, Lenis 1.1.13
  for smooth scrolling, and three.js 0.160.0 through an import map on the home page only.
- **It degrades.** If GSAP, Lenis or WebGL fail to load, `has-motion` comes off the `<html>`
  element and every page stays fully readable and usable. The 3D pizza falls back to a photo.
- **The 3D pizza is procedural.** No model files: the dough, crust, cheese, wooden peel and
  nine kinds of topping are generated in `js/pizza3d.js`, including the canvas textures. Scroll
  pulls one slice out with the cheese still attached, the way the slice sits in the logo; drag
  spins it.
- **The menu is data.** Prices live in `js/menu-data.js`; the menu page, the builder and the
  home page's signature cards all read from it, so a price change happens in one place.
- **Motion respects `prefers-reduced-motion`** and the pinned and horizontal sections fall back
  to native swiping on small screens.

## Running it locally

```bash
python -m http.server 5186
```

Then open <http://localhost:5186>. (`.claude/launch.json` holds the same command.)

## Content notes

Facts on the site — addresses, phone numbers, the 2013 founding, the menu and its prices — come
from the client's own site, their IndiaMART listing and their Instagram bio. Opening hours are
deliberately not published anywhere on the site: no reliable source for them exists, so every
page sends people to the phone instead.
