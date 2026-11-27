// sanNchari Bharat — all-India destination dataset.
// Row format: [name, stateCode, lat, lng, categories, bestMonths, access, note, gem]
//  categories: D devotional · H heritage · C chill-out · B bike ride · F family hangout
//              W wildlife/nature · S beach · M hills/mountains · A adventure
//  bestMonths: "start-end" month range (wraps over the year end), e.g. "10-3" = Oct to Mar
//  access:     e = easy (fine for elders and a baby) · m = moderate walking/roads · t = tough / high altitude
//  gem:        1 = lesser-visited place near a bigger hub
// Coordinates are approximate (town / site centre). Verify before printing them anywhere.
import { SOUTH } from "./places/south.js";
import { WEST } from "./places/west.js";
import { NORTH } from "./places/north.js";
import { CENTRAL_EAST } from "./places/central-east.js";
import { NORTHEAST } from "./places/northeast.js";

const RAW = [
  // ── Karnataka ──
  ["Mysuru Palace", "KA", 12.3052, 76.6552, "HFD", "10-3", "e", "Royal palace lit by 97,000 bulbs on Sundays and during Dasara"],
  ["Hampi", "KA", 15.335, 76.46, "HDB", "10-2", "m", "Vijayanagara ruins among boulders; UNESCO site"],
  ["Coorg (Madikeri)", "KA", 12.4244, 75.7382, "MCBF", "10-5", "m", "Coffee estates, Abbey Falls, Raja's Seat sunsets"],
  ["Chikkamagaluru", "KA", 13.3161, 75.772, "MCB", "9-5", "m", "Mullayanagiri peak and coffee country rides"],
  ["Gokarna", "KA", 14.5479, 74.3188, "SDC", "10-3", "m", "Om Beach cliffs and the Mahabaleshwar temple"],
  ["Udupi Sri Krishna Matha", "KA", 13.3409, 74.7519, "DF", "1-12", "e", "Kanakana kindi darshan and famous Udupi meals"],
  ["Badami", "KA", 15.9186, 75.6761, "HD", "10-3", "m", "Red sandstone cave temples of the Chalukyas"],
  ["Pattadakal", "KA", 15.9485, 75.8164, "HD", "10-3", "e", "UNESCO cluster of Chalukyan temples", 1],
  ["Aihole", "KA", 16.0194, 75.882, "H", "10-3", "e", "Cradle of Indian temple architecture", 1],
  ["Belur & Halebidu", "KA", 13.1625, 75.8653, "HD", "9-3", "e", "Hoysala stone carving at its finest"],
  ["Shravanabelagola", "KA", 12.8586, 76.4842, "DH", "10-3", "m", "57-ft Gommateshwara monolith; 600+ steps"],
  ["Jog Falls", "KA", 14.2294, 74.8125, "WFB", "7-10", "e", "India's second-highest plunge waterfall"],
  ["Bandipur National Park", "KA", 11.6667, 76.6333, "WF", "10-5", "e", "Tiger and elephant safaris"],
  ["Kabini", "KA", 11.9, 76.35, "WC", "10-5", "e", "Riverside safaris; black panther country"],
  ["Murudeshwar", "KA", 14.0942, 74.4847, "DSF", "10-3", "e", "Giant Shiva statue on the sea"],
  ["Dandeli", "KA", 15.25, 74.6167, "AW", "10-5", "m", "White-water rafting on the Kali"],
  ["Chitradurga Fort", "KA", 14.2251, 76.3984, "HB", "10-3", "m", "Seven-ringed fort of Onake Obavva"],
  ["Chandravalli Caves", "KA", 14.2167, 76.3833, "H", "10-3", "m", "Prehistoric cave site near Chitradurga", 1],
  ["Vani Vilas Sagara", "KA", 13.9167, 76.4, "CB", "8-2", "e", "Old dam near Hiriyur, quiet evenings", 1],
  ["Nandi Hills", "KA", 13.37, 77.6835, "BCM", "9-3", "e", "Sunrise above the clouds near Bengaluru"],
  ["Bijapur (Vijayapura) Gol Gumbaz", "KA", 16.8302, 75.736, "HF", "10-2", "e", "Whispering gallery under a giant dome"],
  ["Melukote", "KA", 12.6624, 76.6496, "DH", "10-3", "m", "Hill-top Cheluvanarayana temple", 1],
  ["Kudremukh", "KA", 13.2253, 75.2539, "MAW", "10-4", "t", "Grassland trek in the Western Ghats"],

  // ── Kerala ──
  ["Munnar", "KL", 10.0889, 77.0595, "MCBF", "9-5", "m", "Rolling tea gardens and Eravikulam"],
  ["Alleppey Backwaters", "KL", 9.4981, 76.3388, "CF", "9-3", "e", "Houseboat nights on Vembanad"],
  ["Kochi (Fort Kochi)", "KL", 9.9658, 76.2421, "HCF", "10-3", "e", "Chinese nets, Jew Town, Biennale art"],
  ["Varkala", "KL", 8.7379, 76.7163, "SC", "10-3", "m", "Cliff-top beach cafés"],
  ["Thekkady (Periyar)", "KL", 9.6031, 77.1615, "WF", "10-5", "e", "Spice gardens and lake boat safari"],
  ["Wayanad", "KL", 11.6854, 76.132, "MWB", "9-5", "m", "Edakkal caves and Chembra peak"],
  ["Sabarimala", "KL", 9.4344, 77.0806, "D", "11-1", "t", "Ayyappa pilgrimage; Mandala season"],
  ["Guruvayur", "KL", 10.5946, 76.0411, "D", "1-12", "e", "Krishna temple and elephant sanctuary"],
  ["Kovalam", "KL", 8.4004, 76.9787, "SF", "10-3", "e", "Lighthouse beach near Thiruvananthapuram"],
  ["Padmanabhaswamy Temple", "KL", 8.4828, 76.9436, "DH", "1-12", "e", "Reclining Vishnu; strict dress code"],
  ["Bekal Fort", "KL", 12.3927, 75.0326, "HSB", "10-3", "e", "Keyhole-shaped sea fort in the north", 1],
  ["Vagamon", "KL", 9.6862, 76.9052, "MCB", "9-5", "m", "Pine forest and paragliding meadows", 1],

  // ── Tamil Nadu ──
  ["Madurai Meenakshi Temple", "TN", 9.9195, 78.1193, "DH", "10-3", "e", "Towering gopurams and night ceremony"],
  ["Mahabalipuram", "TN", 12.6208, 80.1945, "HSF", "11-2", "e", "Shore Temple and rock-cut rathas"],
  ["Thanjavur Brihadeeswara", "TN", 10.7828, 79.1318, "DH", "10-3", "e", "Chola masterpiece, 1,000+ years old"],
  ["Ooty", "TN", 11.4102, 76.695, "MF", "3-6", "e", "Toy train and the Nilgiri hills"],
  ["Kodaikanal", "TN", 10.2381, 77.4892, "MCB", "3-6", "m", "Lake town above the Palani hills"],
  ["Rameswaram", "TN", 9.2876, 79.3129, "DS", "10-4", "e", "Pamban bridge and the long corridors"],
  ["Dhanushkodi", "TN", 9.1519, 79.4458, "SB", "10-3", "m", "Ghost town at land's end", 1],
  ["Kanyakumari", "TN", 8.0883, 77.5385, "DSF", "10-3", "e", "Sunrise where three seas meet"],
  ["Chidambaram Nataraja", "TN", 11.3993, 79.6936, "DH", "10-3", "e", "Temple of the cosmic dancer"],
  ["Chettinad (Karaikudi)", "TN", 10.0735, 78.7732, "HC", "10-3", "e", "Mansions and spicy cuisine", 1],
  ["Yercaud", "TN", 11.7748, 78.2093, "MBC", "10-6", "m", "Quiet hill station near Salem", 1],
  ["Tiruvannamalai", "TN", 12.2253, 79.0747, "D", "10-3", "m", "Arunachala hill and Girivalam walk"],
  ["Valparai", "TN", 10.3268, 76.9554, "MBW", "9-5", "m", "40 hairpin bends through tea", 1],

  // ── Puducherry ──
  ["Puducherry White Town", "PY", 11.9334, 79.8352, "HCSF", "10-3", "e", "French quarter promenade"],
  ["Auroville", "PY", 12.0068, 79.8106, "CD", "10-3", "e", "Matrimandir and experimental township"],

  // ── Andhra Pradesh ──
  ["Tirumala Tirupati", "AP", 13.6833, 79.3474, "DF", "1-12", "e", "Sri Venkateswara; book darshan ahead"],
  ["Araku Valley", "AP", 18.3273, 82.8775, "MBC", "10-3", "m", "Coffee hills and Borra caves"],
  ["Gandikota", "AP", 14.8155, 78.2856, "HAB", "10-2", "m", "India's Grand Canyon on the Pennar"],
  ["Lepakshi", "AP", 13.8034, 77.6067, "HD", "10-3", "e", "Hanging pillar and giant Nandi", 1],
  ["Srisailam", "AP", 16.0739, 78.8681, "DWB", "10-3", "m", "Jyotirlinga above the Krishna gorge"],
  ["Visakhapatnam", "AP", 17.6868, 83.2185, "SF", "10-3", "e", "RK beach and submarine museum"],
  ["Amaravati Stupa", "AP", 16.5753, 80.3578, "HD", "10-3", "e", "Ancient Buddhist centre", 1],

  // ── Telangana ──
  ["Hyderabad Charminar & Golconda", "TS", 17.3616, 78.4747, "HF", "10-3", "e", "Old city lanes and the great fort"],
  ["Ramappa Temple", "TS", 18.2592, 79.9431, "HD", "10-3", "e", "UNESCO Kakatiya temple", 1],
  ["Warangal Fort", "TS", 17.9578, 79.6136, "H", "10-3", "e", "Kakatiya stone gateways"],
  ["Bhadrachalam", "TS", 17.6688, 80.8936, "D", "10-3", "e", "Sita Ramachandra Swamy on the Godavari"],

  // ── Andaman & Nicobar ──
  ["Havelock (Swaraj Dweep)", "AN", 11.9761, 92.9876, "SCA", "11-4", "m", "Radhanagar beach and diving"],
  ["Port Blair Cellular Jail", "AN", 11.6727, 92.7478, "HF", "11-4", "e", "Freedom struggle memorial and light show"],
  ["Neil Island (Shaheed Dweep)", "AN", 11.8325, 93.0476, "SC", "11-4", "e", "Natural bridge and calm beaches", 1],

  // ── Lakshadweep ──
  ["Agatti & Bangaram", "LD", 10.8573, 72.1866, "SCA", "10-4", "m", "Lagoons; entry permit required"],

  // ── Goa ──
  ["North Goa beaches", "GA", 15.5527, 73.7517, "SCB", "11-3", "e", "Baga, Anjuna, Vagator"],
  ["South Goa (Palolem)", "GA", 15.01, 74.0232, "SCF", "11-3", "e", "Quiet crescent beach"],
  ["Old Goa churches", "GA", 15.5009, 73.9116, "HD", "11-3", "e", "Basilica of Bom Jesus"],
  ["Dudhsagar Falls", "GA", 15.3144, 74.3143, "WAB", "6-10", "m", "Milky four-tier falls on the rail line"],

  // ── Maharashtra ──
  ["Ajanta Caves", "MH", 20.5519, 75.7033, "HD", "10-3", "m", "Buddhist murals, 2nd century BCE onward"],
  ["Ellora Caves", "MH", 20.0268, 75.1771, "HD", "10-3", "e", "Kailasa temple carved from one rock"],
  ["Mumbai Gateway & Marine Drive", "MH", 18.922, 72.8347, "HFC", "10-3", "e", "Queen's Necklace by night"],
  ["Lonavala", "MH", 18.7546, 73.4062, "MBF", "6-9", "e", "Monsoon ghats and chikki"],
  ["Mahabaleshwar", "MH", 17.9237, 73.6586, "MFC", "10-6", "e", "Strawberries and viewpoints"],
  ["Shirdi", "MH", 19.7645, 74.4762, "D", "1-12", "e", "Sai Baba samadhi"],
  ["Nashik & Trimbakeshwar", "MH", 19.9322, 73.5307, "D", "10-3", "e", "Jyotirlinga and vineyards"],
  ["Raigad Fort", "MH", 18.2335, 73.4407, "HAB", "10-2", "m", "Shivaji Maharaj's capital"],
  ["Kaas Plateau", "MH", 17.72, 73.8228, "WB", "8-10", "m", "Valley of flowers of Maharashtra", 1],
  ["Tadoba Tiger Reserve", "MH", 20.25, 79.3333, "WF", "10-5", "e", "Best tiger sightings in the state"],
  ["Lonar Crater", "MH", 19.9768, 76.5083, "WH", "10-2", "m", "Meteorite crater lake", 1],
  ["Pandharpur", "MH", 17.6792, 75.3311, "D", "6-7", "e", "Vitthal temple; Ashadhi Wari"],

  // ── Gujarat ──
  ["Rann of Kutch", "GJ", 23.8, 69.8, "CHF", "11-2", "e", "White desert under full moon"],
  ["Gir National Park", "GJ", 21.1243, 70.8242, "WF", "12-3", "e", "Only wild Asiatic lions"],
  ["Somnath", "GJ", 20.888, 70.4012, "DS", "10-3", "e", "First Jyotirlinga by the sea"],
  ["Dwarka", "GJ", 22.2376, 68.9674, "DS", "10-3", "e", "Dwarkadhish temple and Bet Dwarka"],
  ["Statue of Unity", "GJ", 21.838, 73.7191, "FH", "10-3", "e", "World's tallest statue"],
  ["Rani ki Vav, Patan", "GJ", 23.8589, 72.1013, "H", "10-3", "e", "Stepwell sculpted like an inverted temple", 1],
  ["Modhera Sun Temple", "GJ", 23.5835, 72.1328, "HD", "10-3", "e", "Solanki sun temple", 1],
  ["Ahmedabad Old City", "GJ", 23.0258, 72.5873, "HF", "11-2", "e", "Pols, Sabarmati Ashram"],
  ["Saputara", "GJ", 20.5793, 73.7493, "MF", "7-10", "e", "Gujarat's only hill station", 1],

  // ── Dadra & Nagar Haveli and Daman & Diu ──
  ["Diu", "DN", 20.7141, 70.9822, "SHC", "10-4", "e", "Portuguese fort and quiet beaches"],
  ["Daman", "DN", 20.4283, 72.8397, "SF", "10-4", "e", "Devka beach and Moti Daman fort"],

  // ── Rajasthan ──
  ["Jaipur", "RJ", 26.9124, 75.7873, "HF", "10-3", "e", "Amber Fort, Hawa Mahal, bazaars"],
  ["Udaipur", "RJ", 24.5854, 73.7125, "HCF", "9-3", "e", "City of lakes and palaces"],
  ["Jaisalmer", "RJ", 26.9157, 70.9083, "HAC", "10-3", "m", "Living fort and Sam dunes camps"],
  ["Jodhpur", "RJ", 26.2389, 73.0243, "HF", "10-3", "e", "Mehrangarh above the blue city"],
  ["Pushkar", "RJ", 26.4897, 74.5511, "DC", "10-3", "e", "Holy lake and Brahma temple"],
  ["Ranthambore", "RJ", 26.0173, 76.5026, "WHF", "10-4", "e", "Tigers among fort ruins"],
  ["Mount Abu & Dilwara", "RJ", 24.5926, 72.7156, "MDF", "10-6", "e", "Marble Jain temples"],
  ["Chittorgarh", "RJ", 24.8887, 74.6269, "HB", "10-3", "m", "Largest fort in India"],
  ["Kumbhalgarh", "RJ", 25.1528, 73.587, "HB", "10-3", "m", "Second-longest wall in the world", 1],
  ["Bundi", "RJ", 25.4305, 75.6499, "HC", "10-3", "m", "Stepwells and murals", 1],
  ["Bikaner & Karni Mata", "RJ", 28.0229, 73.3119, "HD", "10-3", "e", "Junagarh fort and rat temple"],
  ["Mandawa (Shekhawati)", "RJ", 28.0554, 75.1414, "H", "10-3", "e", "Painted havelis", 1],

  // ── Madhya Pradesh ──
  ["Khajuraho", "MP", 24.8318, 79.9199, "HD", "10-3", "e", "Chandela temple sculpture"],
  ["Kanha National Park", "MP", 22.3345, 80.6115, "WF", "10-6", "e", "Barasingha meadows and tigers"],
  ["Bandhavgarh", "MP", 23.7, 81.0333, "W", "10-6", "e", "High tiger density"],
  ["Ujjain Mahakaleshwar", "MP", 23.1828, 75.7682, "D", "10-3", "e", "Bhasma aarti at dawn"],
  ["Omkareshwar", "MP", 22.2453, 76.1513, "D", "10-3", "e", "Om-shaped island Jyotirlinga"],
  ["Sanchi Stupa", "MP", 23.4794, 77.7399, "HD", "10-3", "e", "Ashoka's great stupa"],
  ["Orchha", "MP", 25.3518, 78.6406, "HC", "10-3", "e", "Cenotaphs on the Betwa", 1],
  ["Pachmarhi", "MP", 22.4674, 78.4346, "MWB", "10-6", "m", "Satpura's queen hill"],
  ["Mandu", "MP", 22.3664, 75.3956, "HB", "7-3", "e", "Jahaz Mahal and Baz Bahadur", 1],
  ["Bhimbetka", "MP", 22.9387, 77.6131, "H", "10-3", "e", "Prehistoric rock shelters", 1],
  ["Gwalior Fort", "MP", 26.2306, 78.169, "H", "10-3", "e", "Man Singh palace"],
  ["Bhedaghat Marble Rocks", "MP", 23.1309, 79.8007, "WF", "10-3", "e", "Boat ride by moonlight"],

  // ── Chhattisgarh ──
  ["Chitrakote Falls", "CG", 19.2069, 81.6992, "WB", "7-12", "e", "India's widest waterfall"],
  ["Bastar (Jagdalpur)", "CG", 19.0748, 82.0349, "HW", "10-3", "m", "Tribal haats and Dussehra"],
  ["Sirpur", "CG", 21.3452, 82.1883, "HD", "10-3", "e", "Laxman temple in brick", 1],
  ["Mainpat", "CG", 22.8169, 83.2981, "MC", "10-3", "m", "Tibetan settlement plateau", 1],

  // ── Uttar Pradesh ──
  ["Taj Mahal, Agra", "UP", 27.1751, 78.0421, "HF", "10-3", "e", "Sunrise is the best light"],
  ["Fatehpur Sikri", "UP", 27.0945, 77.6679, "H", "10-3", "e", "Akbar's red sandstone capital"],
  ["Varanasi Ghats", "UP", 25.3176, 83.0104, "DH", "10-3", "m", "Ganga aarti at Dashashwamedh"],
  ["Sarnath", "UP", 25.3762, 83.0227, "DH", "10-3", "e", "Buddha's first sermon"],
  ["Ayodhya", "UP", 26.7922, 82.1998, "D", "10-3", "e", "Ram Janmabhoomi temple"],
  ["Mathura & Vrindavan", "UP", 27.5806, 77.7006, "D", "10-3", "e", "Krishna's land; Holi capital"],
  ["Prayagraj Sangam", "UP", 25.4243, 81.8846, "D", "12-2", "e", "Confluence; Magh Mela"],
  ["Lucknow", "UP", 26.8467, 80.9462, "HF", "10-3", "e", "Imambaras and kebabs"],
  ["Dudhwa National Park", "UP", 28.5, 80.6333, "W", "11-6", "e", "Swamp deer and rhinos", 1],
  ["Chunar Fort", "UP", 25.1253, 82.8794, "H", "10-3", "e", "Ganga fort near Varanasi", 1],

  // ── Uttarakhand ──
  ["Rishikesh", "UK", 30.0869, 78.2676, "DAC", "9-5", "m", "Rafting, yoga, Ganga aarti"],
  ["Haridwar", "UK", 29.9457, 78.1642, "D", "10-4", "e", "Har Ki Pauri evening aarti"],
  ["Kedarnath", "UK", 30.7346, 79.0669, "DMA", "5-10", "t", "16-km trek to the Jyotirlinga"],
  ["Badrinath", "UK", 30.7433, 79.4938, "DM", "5-10", "m", "Char Dham shrine on the Alaknanda"],
  ["Nainital", "UK", 29.3803, 79.4636, "MFC", "3-6", "e", "Lake town of Kumaon"],
  ["Mussoorie", "UK", 30.4598, 78.0644, "MFC", "3-6", "e", "Mall road and Kempty falls"],
  ["Jim Corbett National Park", "UK", 29.53, 78.7747, "WF", "11-6", "e", "India's oldest national park"],
  ["Valley of Flowers", "UK", 30.7283, 79.6053, "WAM", "7-9", "t", "Monsoon alpine blooms"],
  ["Auli", "UK", 30.5285, 79.5664, "MA", "12-3", "m", "Skiing with Nanda Devi views"],
  ["Chopta & Tungnath", "UK", 30.4882, 79.2153, "MBD", "4-11", "t", "Highest Shiva temple trek", 1],
  ["Munsiyari", "UK", 30.0675, 80.2381, "MB", "3-6", "m", "Panchachuli peaks", 1],
  ["Jageshwar", "UK", 29.6372, 79.8549, "DH", "3-11", "e", "124 stone temples in deodars", 1],

  // ── Himachal Pradesh ──
  ["Manali", "HP", 32.2432, 77.1892, "MBAF", "3-6", "m", "Solang valley and Old Manali"],
  ["Shimla", "HP", 31.1048, 77.1734, "MFH", "3-6", "e", "Ridge, Mall and the toy train"],
  ["Dharamshala & McLeodganj", "HP", 32.219, 76.3234, "MDC", "3-6", "m", "Tibetan culture and Triund"],
  ["Spiti Valley (Kaza)", "HP", 32.2276, 78.0726, "MBAH", "6-9", "t", "Key monastery and cold desert"],
  ["Kasol", "HP", 32.0099, 77.3149, "MCB", "3-6", "m", "Parvati valley cafés"],
  ["Dalhousie & Khajjiar", "HP", 32.5387, 75.9711, "MF", "3-6", "e", "Mini Switzerland meadow"],
  ["Bir Billing", "HP", 32.0444, 76.7234, "AM", "10-11", "m", "Paragliding capital of India"],
  ["Chitkul", "HP", 31.352, 78.4366, "MB", "5-10", "m", "Last village near Tibet border", 1],
  ["Tirthan Valley", "HP", 31.6402, 77.4559, "MC", "3-6", "m", "Trout streams and Great Himalayan NP", 1],
  ["Masroor Rock Temple", "HP", 32.0727, 76.1385, "HD", "10-4", "e", "Monolithic rock-cut temples", 1],

  // ── Punjab / Chandigarh / Haryana ──
  ["Golden Temple, Amritsar", "PB", 31.62, 74.8765, "DF", "10-3", "e", "Langar for all, day and night"],
  ["Wagah-Attari Border", "PB", 31.6047, 74.5731, "F", "10-3", "e", "Beating Retreat ceremony"],
  ["Anandpur Sahib", "PB", 31.2357, 76.5005, "DH", "10-3", "e", "Hola Mohalla birthplace"],
  ["Patiala", "PB", 30.3398, 76.3869, "HF", "10-3", "e", "Qila Mubarak and Patiala food", 1],
  ["Chandigarh Rock Garden", "CH", 30.7525, 76.8101, "FC", "10-3", "e", "Nek Chand's recycled art garden"],
  ["Kurukshetra", "HR", 29.9695, 76.8783, "DH", "10-3", "e", "Brahma Sarovar and Gita Jayanti"],
  ["Morni Hills", "HR", 30.6969, 77.0806, "MB", "9-3", "m", "Haryana's only hill station", 1],
  ["Pinjore Gardens", "HR", 30.7963, 76.9169, "FC", "10-3", "e", "Mughal terraced gardens", 1],

  // ── Delhi ──
  ["Red Fort & Chandni Chowk", "DL", 28.6562, 77.241, "HF", "10-3", "e", "Mughal fort and street food"],
  ["Qutub Minar", "DL", 28.5245, 77.1855, "H", "10-3", "e", "73-m victory tower"],
  ["Humayun's Tomb", "DL", 28.5933, 77.2507, "H", "10-3", "e", "Garden tomb that inspired the Taj"],
  ["Akshardham Delhi", "DL", 28.6127, 77.2773, "DF", "10-3", "e", "Carved temple complex"],

  // ── Jammu & Kashmir ──
  ["Srinagar & Dal Lake", "JK", 34.0837, 74.7973, "CFH", "4-10", "e", "Shikara rides and Mughal gardens"],
  ["Gulmarg", "JK", 34.0484, 74.3805, "MAF", "12-3", "m", "Gondola and skiing"],
  ["Pahalgam", "JK", 34.0161, 75.315, "MCB", "4-10", "m", "Betaab and Aru valleys"],
  ["Sonamarg", "JK", 34.3036, 75.2932, "MB", "5-10", "m", "Thajiwas glacier"],
  ["Vaishno Devi", "JK", 33.0308, 74.9497, "D", "3-10", "m", "13-km trek; helicopter available"],
  ["Gurez Valley", "JK", 34.6333, 74.8333, "MB", "5-10", "t", "Remote valley on the Kishanganga", 1],

  // ── Ladakh ──
  ["Leh", "LA", 34.1526, 77.5771, "MBH", "5-9", "t", "Acclimatise 48 h; Shanti Stupa"],
  ["Pangong Tso", "LA", 33.758, 78.6676, "MBC", "5-9", "t", "Colour-shifting high lake"],
  ["Nubra Valley", "LA", 34.6863, 77.567, "MBA", "5-9", "t", "Khardung La and double-hump camels"],
  ["Hemis & Thiksey Monasteries", "LA", 33.9124, 77.7035, "DH", "5-9", "m", "Masked dance festival"],
  ["Tso Moriri", "LA", 32.9, 78.3167, "MB", "6-9", "t", "Quieter Changthang lake", 1],

  // ── Bihar ──
  ["Bodh Gaya", "BR", 24.6961, 84.9911, "DH", "10-3", "e", "Mahabodhi tree of enlightenment"],
  ["Nalanda Ruins", "BR", 25.1357, 85.4433, "H", "10-3", "e", "Ancient university"],
  ["Rajgir", "BR", 25.0283, 85.4209, "DHF", "10-3", "e", "Glass skywalk and peace pagoda"],
  ["Vaishali", "BR", 25.9897, 85.1278, "HD", "10-3", "e", "Ashokan pillar", 1],
  ["Patna Sahib", "BR", 25.5958, 85.2309, "D", "10-3", "e", "Birthplace of Guru Gobind Singh"],

  // ── Jharkhand ──
  ["Ranchi Waterfalls", "JH", 23.3441, 85.3096, "WB", "7-11", "m", "Hundru, Dassam and Jonha falls"],
  ["Netarhat", "JH", 23.4833, 84.2667, "MC", "10-3", "m", "Queen of Chotanagpur sunsets", 1],
  ["Deoghar Baidyanath", "JH", 24.4924, 86.6996, "D", "7-8", "e", "Shravani mela Jyotirlinga"],
  ["Betla National Park", "JH", 23.8833, 84.1833, "W", "11-4", "e", "Elephants and old forts", 1],

  // ── West Bengal ──
  ["Darjeeling", "WB", 27.041, 88.2663, "MFH", "3-5", "m", "Tiger Hill sunrise and toy train"],
  ["Kolkata", "WB", 22.5726, 88.3639, "HF", "10-3", "e", "Victoria Memorial and Durga Puja"],
  ["Sundarbans", "WB", 21.9497, 88.8792, "W", "11-3", "m", "Mangrove tigers by boat"],
  ["Shantiniketan", "WB", 23.6815, 87.6855, "HC", "11-3", "e", "Tagore's university town"],
  ["Bishnupur", "WB", 23.0715, 87.3168, "HD", "10-3", "e", "Terracotta temples", 1],
  ["Kalimpong", "WB", 27.06, 88.4699, "MC", "3-5", "m", "Nurseries and monasteries", 1],
  ["Mandarmani", "WB", 21.6681, 87.7042, "SF", "10-3", "e", "Drive-on beach", 1],
  ["Murshidabad", "WB", 24.1856, 88.2685, "H", "10-3", "e", "Hazarduari palace", 1],

  // ── Odisha ──
  ["Puri Jagannath", "OD", 19.8048, 85.8179, "DSF", "10-3", "e", "Rath Yatra in June/July"],
  ["Konark Sun Temple", "OD", 19.8876, 86.0945, "HD", "10-3", "e", "Stone chariot of the sun"],
  ["Bhubaneswar temples", "OD", 20.2367, 85.8337, "DH", "10-3", "e", "Lingaraj and Mukteswar"],
  ["Chilika Lake", "OD", 19.7167, 85.3167, "WC", "11-2", "e", "Irrawaddy dolphins and flamingos"],
  ["Simlipal", "OD", 21.8333, 86.3333, "WB", "11-6", "m", "Barehipani falls", 1],
  ["Raghurajpur", "OD", 19.8833, 85.8167, "H", "10-3", "e", "Pattachitra artists' village", 1],
  ["Daringbadi", "OD", 19.9, 84.13, "MB", "10-2", "m", "Kashmir of Odisha", 1],

  // ── Sikkim ──
  ["Gangtok", "SK", 27.3389, 88.6065, "MFC", "3-5", "m", "MG Marg and Rumtek"],
  ["Tsomgo Lake & Nathu La", "SK", 27.3742, 88.7638, "MB", "4-6", "t", "Permit needed; border pass"],
  ["Pelling", "SK", 27.3, 88.2333, "MD", "3-5", "m", "Kanchenjunga and Pemayangtse"],
  ["Yumthang Valley", "SK", 27.8264, 88.6957, "MW", "4-6", "t", "Rhododendron valley", 1],

  // ── Assam ──
  ["Kaziranga", "AS", 26.5775, 93.1711, "WF", "11-4", "e", "One-horned rhinos by jeep"],
  ["Kamakhya Temple", "AS", 26.1664, 91.7055, "D", "10-4", "e", "Shakti peetha on Nilachal hill"],
  ["Majuli", "AS", 26.95, 94.1667, "CH", "10-3", "m", "River island of satras", 1],
  ["Sivasagar", "AS", 26.9826, 94.6425, "H", "10-4", "e", "Ahom Rang Ghar amphitheatre", 1],
  ["Manas National Park", "AS", 26.7167, 90.9333, "W", "11-4", "m", "Golden langurs", 1],

  // ── Meghalaya ──
  ["Shillong", "ML", 25.5788, 91.8933, "MCF", "10-5", "e", "Ward's lake and cafés"],
  ["Cherrapunji (Sohra)", "ML", 25.2702, 91.7323, "MWA", "10-5", "m", "Double-decker root bridge"],
  ["Dawki & Mawlynnong", "ML", 25.1844, 92.0257, "CW", "11-4", "e", "Glass-clear river and clean village"],
  ["Laitlum Canyons", "ML", 25.4692, 91.9811, "MB", "10-5", "m", "Edge-of-the-world views", 1],

  // ── Arunachal Pradesh ──
  ["Tawang", "AR", 27.5861, 91.8594, "DMB", "3-10", "t", "Grand monastery; ILP needed"],
  ["Ziro Valley", "AR", 27.5449, 93.8197, "MCH", "3-10", "m", "Apatani villages; Ziro music fest"],
  ["Sela Pass", "AR", 27.5047, 92.1056, "MB", "4-10", "t", "13,700-ft lake pass"],
  ["Mechuka", "AR", 28.6, 94.1333, "MB", "10-4", "t", "Remote valley near the border", 1],

  // ── Nagaland ──
  ["Kohima & Kisama", "NL", 25.6751, 94.1086, "HM", "10-5", "m", "Hornbill festival in December"],
  ["Dzukou Valley", "NL", 25.5546, 94.0846, "MA", "6-9", "t", "Lily-covered trek valley"],
  ["Khonoma", "NL", 25.65, 94.0167, "HC", "10-5", "m", "India's first green village", 1],

  // ── Manipur ──
  ["Loktak Lake", "MN", 24.55, 93.7833, "WC", "10-3", "e", "Floating phumdis and sangai deer"],
  ["Imphal", "MN", 24.817, 93.9368, "HF", "10-4", "e", "Ima market run by women"],

  // ── Mizoram ──
  ["Aizawl", "MZ", 23.7271, 92.7176, "MC", "10-3", "m", "Ridge city of churches"],
  ["Reiek", "MZ", 23.69, 92.6, "MB", "10-3", "m", "Traditional Mizo village and views", 1],

  // ── Tripura ──
  ["Ujjayanta Palace", "TR", 23.8361, 91.2828, "HF", "10-3", "e", "Royal palace in Agartala"],
  ["Unakoti", "TR", 24.3196, 92.0647, "HD", "10-3", "m", "Giant rock-cut Shiva faces", 1],
  ["Neermahal", "TR", 23.4833, 91.3167, "HC", "10-3", "e", "Water palace on Rudrasagar", 1],
];

export const CATEGORIES = {
  D: { en: "Devotional", kn: "ಭಕ್ತಿ", hi: "भक्ति", icon: "🛕" },
  H: { en: "Heritage", kn: "ಪರಂಪರೆ", hi: "विरासत", icon: "🏛️" },
  C: { en: "Chill-out", kn: "ವಿರಾಮ", hi: "सुकून", icon: "🌅" },
  B: { en: "Bike ride", kn: "ಬೈಕ್ ಸವಾರಿ", hi: "बाइक राइड", icon: "🏍️" },
  F: { en: "Family hangout", kn: "ಕುಟುಂಬ ವಿಹಾರ", hi: "परिवार", icon: "👨‍👩‍👧" },
  W: { en: "Wildlife & nature", kn: "ವನ್ಯಜೀವಿ", hi: "वन्यजीव", icon: "🐅" },
  S: { en: "Beach", kn: "ಕಡಲತೀರ", hi: "समुद्र तट", icon: "🏖️" },
  M: { en: "Hills", kn: "ಬೆಟ್ಟಗಳು", hi: "पहाड़", icon: "⛰️" },
  A: { en: "Adventure", kn: "ಸಾಹಸ", hi: "रोमांच", icon: "🧗" },
};

// Traveller groups and how they map onto categories / access level.
export const GROUPS = {
  soloBiker:  { en: "Solo biker", kn: "ಒಬ್ಬ ಬೈಕರ್", hi: "अकेला बाइकर", cats: "BMAC", maxAccess: "t" },
  bikerGroup: { en: "Biker group", kn: "ಬೈಕರ್ ತಂಡ", hi: "बाइकर ग्रुप", cats: "BMAH", maxAccess: "t" },
  family:     { en: "Family", kn: "ಕುಟುಂಬ", hi: "परिवार", cats: "FDHWS", maxAccess: "m" },
  couple:     { en: "Couple", kn: "ದಂಪತಿ", hi: "युगल", cats: "CSMH", maxAccess: "t" },
  girlsGang:  { en: "Girls' gang", kn: "ಹುಡುಗಿಯರ ಗುಂಪು", hi: "गर्ल्स गैंग", cats: "CSHAM", maxAccess: "t" },
  boysGang:   { en: "Boys' gang", kn: "ಹುಡುಗರ ಗುಂಪು", hi: "बॉयज़ गैंग", cats: "ABMSC", maxAccess: "t" },
  youngGroup: { en: "Young group", kn: "ಯುವ ತಂಡ", hi: "युवा ग्रुप", cats: "ACMSB", maxAccess: "t" },
  elders:     { en: "Elders", kn: "ಹಿರಿಯರು", hi: "बुज़ुर्ग", cats: "DHFC", maxAccess: "e" },
  baby:       { en: "With a feeding baby", kn: "ಹಾಲುಣಿಸುವ ಮಗುವಿನೊಂದಿಗೆ", hi: "दूध पीते शिशु के साथ", cats: "FCDHS", maxAccess: "e" },
};

// New batches are appended after the original rows so existing place numbers never change.
export const DESTINATIONS = [...RAW, ...SOUTH, ...WEST, ...NORTH, ...CENTRAL_EAST, ...NORTHEAST].map((r, i) => ({
  id: i,
  name: r[0],
  state: r[1],
  lat: r[2],
  lng: r[3],
  cats: r[4].split(""),
  months: parseMonths(r[5]),
  monthsRaw: r[5],
  access: r[6],
  note: r[7],
  gem: r[8] === 1,
}));

function parseMonths(s) {
  const [a, b] = s.split("-").map(Number);
  const out = [];
  let m = a;
  for (let i = 0; i < 12; i++) {
    out.push(m);
    if (m === b) break;
    m = (m % 12) + 1;
  }
  return out;
}
