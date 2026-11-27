// Batch 4 · North-East India and the Andaman & Nicobar Islands. Same row format as
// data/destinations.js: [name, stateCode, lat, lng, categories, bestMonths, access, note, gem]
// Sources: the official tourism sites (tourism.assam.gov.in, arunachaltourism.com,
// megtourism.gov.in, tourism.nagaland.gov.in, manipurtourism.gov.in, tourism.mizoram.gov.in,
// tripuratourism.gov.in, sikkimtourism.gov.in, andamantourism.gov.in) plus local favourites.
// Inner Line Permits are needed for Arunachal, Nagaland, Mizoram and Manipur.
// Rows are only ever appended (never reordered) so trip links that store place numbers keep working.
export const NORTHEAST = [
  // ── Assam ──
  ["Umananda Island", "AS", 26.1956, 91.7461, "DC", "10-4", "e", "Tiny river-island temple in the Brahmaputra"],
  ["Pobitora Sanctuary", "AS", 26.2333, 92.05, "W", "11-4", "e", "Dense rhino population near Guwahati"],
  ["Hajo", "AS", 26.2456, 91.5272, "D", "10-4", "e", "Hill shrines sacred to three faiths", 1],
  ["Sualkuchi", "AS", 26.17, 91.57, "H", "10-4", "e", "Muga and pat silk weaving village", 1],
  ["Madan Kamdev", "AS", 26.315, 91.86, "H", "10-4", "e", "Ruined temples hidden in the forest", 1],
  ["Haflong", "AS", 25.17, 93.0167, "MC", "10-4", "m", "Assam's only hill station, Dima Hasao", 1],
  ["Nameri National Park", "AS", 26.95, 92.85, "WA", "11-4", "m", "Rafting the Jia Bhoroli, birding", 1],
  ["Dibru-Saikhowa", "AS", 27.6, 95.4, "W", "11-4", "m", "Feral horses on river islands", 1],
  ["Tezpur Agnigarh", "AS", 26.6167, 92.8, "H", "10-4", "e", "Hill of the Usha–Aniruddha legend"],
  ["Hoollongapar Gibbon Sanctuary", "AS", 26.7, 94.37, "W", "11-4", "e", "India's only apes, the hoolock gibbons", 1],
  ["Jorhat Tea Estates", "AS", 26.75, 94.2167, "CF", "10-4", "e", "Stays in old tea bungalows"],
  ["Sibsagar Rang Ghar", "AS", 26.9786, 94.6264, "H", "10-4", "e", "Ahom-era amphitheatre"],
  ["Charaideo Maidams", "AS", 26.95, 94.85, "H", "10-4", "e", "UNESCO burial mounds of Ahom kings", 1],
  ["Dehing Patkai National Park", "AS", 27.3, 95.6, "W", "11-4", "m", "Assam's rainforest", 1],
  ["Digboi War Cemetery & Oil Museum", "AS", 27.39, 95.62, "H", "10-4", "e", "Asia's oldest refinery town", 1],
  ["Barpeta Satra", "AS", 26.32, 91.0, "DH", "10-4", "e", "Vaishnavite monastery and Holi", 1],
  ["Orang National Park", "AS", 26.55, 92.32, "W", "11-4", "m", "'Mini Kaziranga' on the north bank", 1],

  // ── Arunachal Pradesh ──
  ["Bomdila", "AR", 27.2645, 92.4159, "MD", "3-6", "m", "Monasteries on the road to Tawang"],
  ["Dirang", "AR", 27.3583, 92.24, "MC", "3-11", "m", "Hot springs and kiwi orchards"],
  ["Madhuri (Sangetsar) Lake", "AR", 27.69, 91.89, "MC", "4-10", "t", "High lake with drowned tree stumps", 1],
  ["Bum La Pass", "AR", 27.75, 91.92, "AB", "4-10", "t", "Border pass at 4,600 m, permit only", 1],
  ["Tawang War Memorial", "AR", 27.585, 91.865, "H", "3-10", "m", "Memorial to the 1962 war"],
  ["Namdapha National Park", "AR", 27.5, 96.4, "WA", "10-4", "t", "Four big cats in one rainforest", 1],
  ["Pasighat", "AR", 28.0667, 95.3333, "CA", "10-4", "m", "Oldest town, the Siang river rapids"],
  ["Dong (first sunrise)", "AR", 28.18, 97.07, "AM", "10-3", "t", "Village of India's first sunrise", 1],
  ["Parshuram Kund", "AR", 27.88, 96.36, "D", "11-3", "m", "Holy dip in the Lohit, biggest at Makar Sankranti", 1],
  ["Itanagar Ita Fort", "AR", 27.09, 93.62, "H", "10-4", "e", "Brick fort ruins in the capital"],
  ["Daporijo & Siang valley", "AR", 27.98, 94.22, "CB", "10-4", "t", "Remote river roads of upper Subansiri", 1],
  ["Pakke Tiger Reserve", "AR", 27.05, 92.9, "W", "10-4", "m", "Hornbill nest adoption programme", 1],
  ["Anini", "AR", 28.8, 95.9, "AM", "10-3", "t", "Remote Dibang valley of the Idu Mishmi", 1],

  // ── Meghalaya ──
  ["Mawsynram", "ML", 25.3, 91.583, "WM", "6-9", "m", "Among the wettest places on Earth", 1],
  ["Nohkalikai Falls", "ML", 25.2756, 91.6867, "W", "6-11", "e", "India's tallest plunge falls"],
  ["Double-Decker Root Bridge (Nongriat)", "ML", 25.2477, 91.6728, "A", "10-5", "t", "3,500 steps to living root bridges"],
  ["Mawlyngbna", "ML", 25.19, 91.68, "AC", "10-5", "m", "Fossil rocks and kayaking", 1],
  ["Krang Suri Falls", "ML", 25.39, 92.13, "WC", "10-5", "e", "Turquoise pool below the falls", 1],
  ["Shnongpdeng", "ML", 25.19, 92.02, "AC", "11-4", "e", "Clear Umngot river, boating and cliff jumps", 1],
  ["Nartiang Monoliths", "ML", 25.58, 92.21, "H", "10-5", "e", "Garden of Jaintia standing stones", 1],
  ["Umiam Lake", "ML", 25.66, 91.89, "CA", "10-5", "e", "Barapani lake below Shillong"],
  ["Mawphlang Sacred Forest", "ML", 25.45, 91.75, "WH", "10-5", "e", "Khasi sacred grove walk", 1],
  ["Siju Caves", "ML", 25.35, 90.68, "AW", "10-4", "m", "Bat caves in the Garo Hills", 1],
  ["Nokrek National Park", "ML", 25.68, 90.33, "W", "11-4", "t", "Wild citrus and red pandas of Garo Hills", 1],
  ["Elephant Falls", "ML", 25.536, 91.83, "WF", "6-11", "e", "Three-step falls near Shillong"],

  // ── Nagaland ──
  ["Kisama Hornbill Festival", "NL", 25.62, 94.12, "H", "12-12", "e", "Festival of all Naga tribes, 1–10 Dec"],
  ["Kohima War Cemetery", "NL", 25.6667, 94.1, "H", "10-5", "e", "1944 battle memorial on Garrison Hill"],
  ["Japfu Peak", "NL", 25.59, 94.06, "A", "10-5", "t", "Trek past the world's tallest rhododendron", 1],
  ["Mokokchung", "NL", 26.3243, 94.5139, "HC", "10-5", "m", "Ao Naga heartland", 1],
  ["Longwa (Mon)", "NL", 26.65, 95.2, "HC", "10-4", "t", "Village split by the Myanmar border", 1],
  ["Dimapur Kachari Ruins", "NL", 25.9, 93.73, "H", "10-4", "e", "Mushroom-shaped monoliths"],
  ["Shilloi Lake", "NL", 25.69, 94.92, "C", "10-5", "t", "Foot-shaped lake in Phek", 1],
  ["Pfutsero", "NL", 25.57, 94.29, "MC", "10-5", "m", "Highest town in Nagaland", 1],

  // ── Manipur ──
  ["Sendra Island & Keibul Lamjao", "MN", 24.5, 93.8, "WC", "10-4", "m", "Floating phumdis, home of the sangai deer"],
  ["Shri Govindajee Temple", "MN", 24.8104, 93.9399, "D", "1-12", "e", "Vaishnav temple by the Kangla palace"],
  ["Kangla Fort", "MN", 24.8079, 93.9446, "H", "10-4", "e", "Ancient seat of Manipur's kings"],
  ["Ima Keithel", "MN", 24.8095, 93.9384, "HF", "1-12", "e", "Women-run market in Imphal"],
  ["Moirang INA Memorial", "MN", 24.5, 93.77, "H", "10-4", "e", "Where the INA flag was first raised"],
  ["Ukhrul", "MN", 25.1, 94.36, "MC", "4-6", "m", "Shirui lily hills of the Tangkhul Nagas", 1],
  ["Dzuko (Manipur side)", "MN", 25.55, 94.0, "A", "6-9", "t", "Lily-filled valley on the border", 1],
  ["Andro Village", "MN", 24.75, 94.05, "HC", "10-4", "e", "Pottery village and folk museum", 1],
  ["Khongjom War Memorial", "MN", 24.48, 94.0, "H", "10-4", "e", "1891 Anglo-Manipur war site", 1],

  // ── Mizoram ──
  ["Champhai", "MZ", 23.4667, 93.3333, "MC", "10-4", "m", "Vineyards and the Rih Dil lake beyond", 1],
  ["Phawngpui (Blue Mountain)", "MZ", 22.6333, 93.0333, "AM", "10-4", "t", "Mizoram's highest peak", 1],
  ["Vantawng Falls", "MZ", 23.08, 92.75, "W", "8-12", "m", "Tallest falls in Mizoram", 1],
  ["Dampa Tiger Reserve", "MZ", 23.6, 92.4, "W", "11-4", "m", "Remote forest on the Bangladesh border", 1],
  ["Tamdil Lake", "MZ", 23.73, 92.95, "C", "10-4", "e", "Forest lake east of Aizawl", 1],
  ["Lunglei", "MZ", 22.88, 92.73, "MC", "10-4", "m", "Town on a ridge 'like a bridge of rock'", 1],
  ["Solomon's Temple, Aizawl", "MZ", 23.69, 92.73, "D", "1-12", "e", "Large church on the Aizawl hills"],

  // ── Tripura ──
  ["Tripura Sundari Temple", "TR", 23.509, 91.497, "D", "1-12", "e", "Matabari Shakti Peetha in Udaipur"],
  ["Jampui Hills", "TR", 23.95, 92.28, "MC", "10-12", "m", "Orange orchards and Mizo villages", 1],
  ["Sepahijala Sanctuary", "TR", 23.65, 91.33, "W", "10-4", "e", "Clouded leopards and spectacled monkeys", 1],
  ["Pilak", "TR", 23.23, 91.62, "H", "10-4", "e", "Buddhist and Hindu terracotta ruins", 1],
  ["Dumboor Lake", "TR", 23.8, 91.85, "C", "10-3", "m", "Lake of many islands at Tirthamukh", 1],
  ["Chabimura", "TR", 23.55, 91.65, "HC", "10-3", "m", "Goddess reliefs on a river cliff", 1],
  ["Heritage Park, Agartala", "TR", 23.83, 91.28, "F", "10-3", "e", "Miniature Tripura in a park"],

  // ── Sikkim ──
  ["Rumtek Monastery", "SK", 27.2883, 88.5617, "DH", "3-5", "e", "Seat of the Karmapa"],
  ["Enchey Monastery", "SK", 27.3359, 88.6189, "D", "3-5", "e", "Hill gompa above Gangtok"],
  ["Hanuman Tok & Ganesh Tok", "SK", 27.35, 88.63, "DM", "3-5", "e", "Viewpoints over Kanchenjunga"],
  ["Lachung", "SK", 27.69, 88.74, "MC", "3-6", "m", "Village gateway to Yumthang"],
  ["Gurudongmar Lake", "SK", 28.0247, 88.709, "MA", "4-6", "t", "Sacred lake at 5,430 m, permit only"],
  ["Lachen", "SK", 27.7167, 88.55, "MC", "3-6", "m", "Village on the road to Gurudongmar", 1],
  ["Zuluk (Silk Route)", "SK", 27.25, 88.78, "BM", "3-5", "t", "Zigzag road of the old Silk Route", 1],
  ["Ravangla Buddha Park", "SK", 27.3, 88.36, "DF", "3-5", "e", "Great Buddha statue and views"],
  ["Namchi Char Dham", "SK", 27.17, 88.36, "DF", "3-5", "e", "Hill-top Shiva statue and temples"],
  ["Yuksom", "SK", 27.37, 88.22, "HA", "3-5", "m", "Sikkim's first capital, Goecha La trailhead"],
  ["Khecheopalri Lake", "SK", 27.35, 88.19, "D", "3-5", "m", "Wishing lake kept leaf-free by birds", 1],
  ["Dzongu", "SK", 27.55, 88.5, "HC", "10-5", "m", "Lepcha reserve with river homestays", 1],

  // ── Andaman & Nicobar Islands ──
  ["Radhanagar Beach", "AN", 11.9833, 92.95, "S", "11-4", "e", "Famous white beach on Havelock"],
  ["Elephant Beach", "AN", 12.03, 92.97, "SA", "11-4", "m", "Snorkelling reef on Havelock"],
  ["Ross Island (Netaji Subhas Chandra Bose Dweep)", "AN", 11.676, 92.763, "H", "11-4", "e", "British-era ruins overtaken by trees"],
  ["North Bay Island", "AN", 11.704, 92.762, "SA", "11-4", "e", "Coral reef and glass-bottom boats"],
  ["Chidiya Tapu", "AN", 11.49, 92.71, "WS", "11-4", "e", "Sunset point and bird forest"],
  ["Wandoor & Jolly Buoy", "AN", 11.6, 92.6, "SA", "11-4", "m", "Marine national park reefs"],
  ["Baratang Limestone Caves", "AN", 12.12, 92.78, "AW", "11-4", "m", "Mangrove creeks to limestone caves", 1],
  ["Mud Volcano, Baratang", "AN", 12.07, 92.75, "A", "11-4", "m", "Bubbling mud vents", 1],
  ["Long Island", "AN", 12.38, 92.93, "S", "11-4", "m", "Quiet island, Lalaji Bay beach", 1],
  ["Ross & Smith Islands", "AN", 13.31, 93.07, "S", "11-4", "m", "Twin islands joined by a sand bar", 1],
  ["Saddle Peak", "AN", 13.17, 93.0, "AW", "11-4", "t", "Highest point of the islands", 1],
  ["Little Andaman (Butler Bay)", "AN", 10.69, 92.56, "SA", "11-4", "t", "Surfing, waterfalls and elephants", 1],
];
