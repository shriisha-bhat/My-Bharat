# sanNchari Bharat 🇮🇳

**ಬನ್ನಿ, ಭಾರತ ನೋಡೋಣ — Come, let's see Bharat.**

The all-India edition of [sanNchari](https://www.sannchari.com): a 3D travel globe covering all 28 states and 8 union territories, with a long-trip planner for journeys from a weekend up to three months.

## Features

- **3D globe** (MapLibre GL, globe projection) with satellite, map and night looks, plus an optional **3D terrain** mode
- **sanNchari 3D view** (default): a painted globe opens on India; tap any state to raise it, tap again or press Explore to dive into a relief map of that state with a landmark model for every place, district names, TURN / TOP / RESET / GLOBE controls and a 1–100x zoom. The relief is built in the browser from Terrarium elevation tiles with simulated colours (forest, farmland, desert, snow, coast). Switch to **Satellite** for the MapLibre map, which also draws trip routes
- **3D state map** (satellite view): every state and UT is a raised block on official (Survey of India based) boundaries. Hover for its name and place count; click to raise it, outline it, tilt into it and filter the list. Toggle it in the panel footer
- **Destinations across India**: famous hubs plus 💎 *hidden gems* (lesser-visited places near each hub)
- **Categories**: devotional, heritage, chill-out, bike ride, family hangout, wildlife, beach, hills, adventure
- **Traveller groups** (multi-select): solo biker, biker group, family, couple, girls' gang, boys' gang, young group, elders, travelling with a feeding baby. Elders and baby filters hide high-altitude or tough-access places
- **Travel month** filter that shows what is in season
- **Distance-wise suggestions** from 39 cities or your own location (location stays in the browser)
- **Nearby places** inside every destination card
- **Long-trip planner**: start city, 2–90 days, start date, pace, regions, must-visit stops. It builds a day-by-day route with travel days, checks the season at each stop's arrival date, draws the route on the globe, and gives you copy, print and share-link buttons
- **Festivals & special days** by month across every state
- **Art-form themes**: Yakshagana, Kathakali, Kolam, Kalamkari, Warli, Bandhani, Gond, Chikankari, Aipan, Phulkari, Madhubani, Pattachitra, Muga/Bihu. *Follow the state* switches the theme to match whichever state you open
- **Three languages**: English, ಕನ್ನಡ, हिंदी
- **Ads only** as income. Slots open the advertiser's website or WhatsApp directly, and empty slots show *Advertise here*
- **Privacy**: no sign-up, cookies, analytics or storage. Shared trips live only in the URL hash

## Project layout

```
index.html            page shell
css/style.css         layout, themes, print styles
js/app.js             map, filters, popups, tabs, ads
js/planner.js         long-trip routing logic
js/themes.js          art-form palettes and motifs
js/i18n.js            EN / KN / HI strings
data/states.js        36 states & UTs (names in 3 languages, region, centre, theme)
data/destinations.js  original destination dataset (one row per place, format documented at the top)
data/places/*.js      added places in regional batches (south.js, west.js, …), appended after the original rows
data/india-states.js  simplified state & UT boundaries
data/districts/*.json district boundaries per state (loaded when that state opens)
data/world.json       world outlines for the globe (Natural Earth)
js/map3d/             the 3D view, ported from sanNchari (three.js r128 in vendor/three/)
data/festivals.js     festivals by month
data/cities.js        starting cities
data/ads.js           ad slots, edit this to sell ads
vendor/               MapLibre GL JS 5.24.1 (bundled, no CDN needed)
```

No build step: it is plain static HTML, CSS and ES modules.

## Run locally

ES modules need an HTTP server (opening the file directly will not work):

```bash
npx serve .
# or
python3 -m http.server 8080
```

## Deploy on Vercel

1. Import `shriisha-bhat/My-Bharat` in Vercel
2. Framework preset: **Other**. Leave the build command empty and set the output directory to `.`
3. Deploy. `vercel.json` already sets cache headers

## Add or edit places

Add a row to the batch file for the place's region in `data/places/` (or `data/destinations.js`). Always add at the end of a list: trip share links store place numbers, so never reorder or delete rows in the middle.


```js
["Place name", "KA", 12.97, 77.59, "HDF", "10-3", "e", "One-line note", 1],
//  name        state lat   lng   cats   months access note        gem
```

## Add an ad

Edit `data/ads.js`:

```js
{ title: "Hampi Heritage Homestay", text: "2 km from Virupaksha", link: "https://wa.me/91XXXXXXXXXX", states: ["KA"], cats: ["H"] }
```

## Map data credits

Imagery © Esri, Maxar, Earthstar Geographics · Map tiles © OpenStreetMap contributors © CARTO · Terrain: Mapzen / AWS Open Data · Fonts: OpenFreeMap.

Contact for ads and suggestions: **contact.sannchari@gmail.com**

## Data coverage

Places are being added region by region from the official state tourism websites plus local favourites and hidden gems. Every coordinate is checked against the state boundary and against OpenStreetMap.

| Batch | States | Places added | Status |
|---|---|---|---|
| 1 | South (KA, KL, TN, AP, TS, PY, LD) and West (GA, MH, GJ, RJ, DN) | ~400 | done |
| 2 | North (UP, UK, HP, PB, HR, CH, DL, JK, LA) | ~180 | done |
| 3 | Central & East (MP, CG, BR, JH, WB, OD) | ~120 | done |
| 4 | North-East & Islands (AS, AR, NL, MN, MZ, TR, ML, SK, AN) | ~95 | done |
| 5 | Official listings from the owner's reference doc: UNESCO, National Parks, ASI-protected monuments, Swadesh Darshan 1.0/2.0, PRASHAD (all states) | 847 | done |

1,867 places in all. Batch 5 rows carry a source link, shown on the place card. Coordinates are checked against the state boundary, OpenStreetMap (batch 1, partly)
and Wikipedia; places Wikipedia does not know are boundary-checked only, so report any pin that looks off.

Boundaries: datta07/INDIAN-SHAPEFILES (Survey of India based).
