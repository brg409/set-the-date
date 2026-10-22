// Which outing types each venue fits: Dinner, Drinks, Coffee, Dessert, Activity.
//
// This is the ONE place to edit classifications. To add a type to a venue,
// add `<type>: "why"` to its line; to remove one, delete it. The text is a
// plain-language reason and is not used by the app, so write whatever
// explains the call. By convention it starts with:
//   "data: ..."      the venue's own record (category, price, stay, tags) shows it
//   "reviewed: ..."  a person read the record and decided
// A venue can have several types, or none (see ANYTHING_ONLY).
//
// A type means the place is a good answer when someone picks that mood, i.e.
// it is a primary reason to go, not merely something the venue also serves.
// (A gelato shop that also pours coffee is Dessert, not Coffee.) Real overlaps
// are welcome, e.g. a coffee house that is also a gelateria.
//
// Every venue is always found by "Anything" (the default). These types only
// matter when someone picks a specific mood on the Find page. Nothing here
// changes the venue database or how places are ranked. Tests check that
// every id exists and that every venue is either listed here or in
// ANYTHING_ONLY.
//
// Lunch and Brunch are deliberately not here: the data has no hours or
// meal-service facts yet.

import type { OutingType } from "@/lib/types";

export const OUTING_CLASSIFICATION: Record<string, Partial<Record<OutingType, string>>> = {
  // 1 Tippling Place
  "one-tippling-place": { drinks: "data: Cocktail Lounge: serves alcohol, drinks are a listed draw" },
  // The Franklin Mortgage & Investment Company
  "franklin-mortgage-investment-co": { drinks: "data: Speakeasy: serves alcohol, drinks are a listed draw" },
  // Parc
  "parc": { dinner: "data: restaurant; 1.5h+ stay" },
  // Lacroix
  "lacroix": { dinner: "data: restaurant; 1.5h+ stay" },
  // Village Whiskey
  "village-whiskey": { dinner: "reviewed: sit-down burger-and-whiskey restaurant; casual", drinks: "reviewed: 'a small, lively whiskey bar'; 200+ whiskeys" },
  // La Colombe Coffee Roasters
  "la-colombe-rittenhouse": { coffee: "data: café whose record centers on coffee" },
  // Vita
  // Coffee reviewed and removed: coffee is one of three items at the counter; the reason to go is the gelato and pastry.
  "vita-gelato": { dessert: "data: dessert/bakery shop" },
  // Escape The Room Philadelphia
  "escape-the-room-rittenhouse": { activity: "data: activity venue; the experience is the draw" },
  // Tria Cafe Rittenhouse
  "tria-rittenhouse": { drinks: "data: Wine Bar: serves alcohol, drinks are a listed draw" },
  // a.bar
  "a-bar": { drinks: "data: Cocktail Bar: serves alcohol, drinks are a listed draw" },
  // Library Bar
  "library-bar": { drinks: "data: Hotel Bar: serves alcohol, drinks are a listed draw" },
  // Midnight & The Wicked
  "midnight-and-the-wicked": { drinks: "data: Speakeasy Lounge: serves alcohol, drinks are a listed draw" },
  // The Ranstead Room
  "ranstead-room": { drinks: "data: Speakeasy: serves alcohol, drinks are a listed draw" },
  // The Elephant
  "the-elephant-espresso-martini-bar": { drinks: "data: Espresso Martini Bar: serves alcohol, drinks are a listed draw" },
  // Enswell
  "enswell": { drinks: "data: Cafe & Cocktail Bar: serves alcohol, drinks are a listed draw", coffee: "reviewed: tag: 'coffee shop by day, cocktail bar by night'" },
  // Garage Rittenhouse
  "garage-rittenhouse": { drinks: "data: Sports Bar: serves alcohol, drinks are a listed draw" },
  // Bonner's Irish Pub
  "bonners-irish-pub": { drinks: "reviewed: Irish pub with a full bar; a pub is a legitimate drinks outing" },
  // Bar Cicci
  "bar-cicci": { drinks: "data: Italian Aperitivo Bar: serves alcohol, drinks are a listed draw" },
  // Monk's Cafe
  "monks-cafe": { drinks: "data: Belgian Beer Bar: serves alcohol, drinks are a listed draw" },
  // Good Dog Bar
  "good-dog-bar": { dinner: "data: restaurant; 1.5h+ stay" },
  // Rouge
  "rouge": { dinner: "data: restaurant; 1.5h+ stay", drinks: "reviewed: described as having an extensive bar and cocktail program" },
  // Dancerobot
  "dancerobot": { drinks: "data: Izakaya Bar: serves alcohol, drinks are a listed draw" },
  // Superfolie
  "superfolie": { drinks: "data: Wine Bar: serves alcohol, drinks are a listed draw" },
  // WineDive Rittenhouse
  "winedive-rittenhouse": { drinks: "data: Wine Bar: serves alcohol, drinks are a listed draw" },
  // Little Water
  "little-water": { dinner: "data: restaurant; 1.5h+ stay" },
  // La Jefa
  "la-jefa": { dinner: "reviewed: sit-down cafe-restaurant that turns cocktail-forward at night", drinks: "reviewed: cocktail-forward at night with a back lounge" },
  // Friday Saturday Sunday
  "friday-saturday-sunday": { dinner: "data: restaurant; 1.5h+ stay" },
  // Her Place Supper Club
  "her-place-supper-club": { dinner: "data: restaurant; 1.5h+ stay" },
  // My Loup
  "my-loup": { dinner: "data: restaurant; 1.5h+ stay" },
  // Vernick Food & Drink
  "vernick-food-and-drink": { dinner: "data: restaurant; 1.5h+ stay" },
  // Butcher & Singer
  "butcher-and-singer": { dinner: "data: restaurant; 1.5h+ stay" },
  // JJ Thai Cuisine
  "jj-thai-cuisine": { dinner: "reviewed: casual sit-down Thai dining room (BYOB)" },
  // a.kitchen
  "a-kitchen": { dinner: "data: restaurant; 1.5h+ stay" },
  // Zama
  "zama": { dinner: "data: restaurant; 1.5h+ stay" },
  // Barclay Prime
  "barclay-prime": { dinner: "data: restaurant; 1.5h+ stay" },
  // Wilder
  "wilder": { dinner: "data: restaurant; 1.5h+ stay" },
  // Via Locusta
  "via-locusta": { dinner: "data: restaurant; 1.5h+ stay" },
  // Bolo
  "bolo": { dinner: "data: restaurant; 1.5h+ stay", drinks: "reviewed: dedicated rum bar on the first floor" },
  // DanDan
  "dandan": { dinner: "reviewed: full-service Sichuan/Taiwanese restaurant with cocktails and wine" },
  // Mission Taqueria
  "mission-taqueria": { dinner: "data: restaurant; 1.5h+ stay" },
  // El Rey
  "el-rey": { dinner: "data: restaurant; 1.5h+ stay", drinks: "reviewed: dedicated mezcal and tequila bar" },
  // Rittenhouse Grill
  "rittenhouse-grill": { dinner: "data: restaurant; 1.5h+ stay" },
  // Oyster House
  "oyster-house": { dinner: "data: restaurant; 1.5h+ stay" },
  // Bluestone Lane
  "bluestone-lane": { coffee: "data: café whose record centers on coffee" },
  // Weckerly's Ice Cream
  // Coffee reviewed and removed: it serves coffee, but the reason to go is the small-batch ice cream.
  "weckerlys-ice-cream": { dessert: "data: dessert/bakery shop" },
  // Malai
  "malai": { dessert: "data: dessert/bakery shop" },
  // The Bakeshop on Twentieth
  "bakeshop-on-twentieth": { dessert: "data: dessert/bakery shop" },
  // Five Iron Golf
  "five-iron-golf-rittenhouse": { activity: "data: activity venue; the experience is the draw" },
  // Puttshack Philadelphia
  "puttshack-philadelphia": { activity: "data: activity venue; the experience is the draw" },
  // SPIN Philadelphia
  "spin-philadelphia": { activity: "data: activity venue; the experience is the draw" },
  // Harp & Crown
  "harp-and-crown": { dinner: "data: restaurant; 1.5h+ stay", activity: "reviewed: hidden speakeasy bowling alley is in its name and a main draw" },
  // Helium Comedy Club
  "helium-comedy-club": { activity: "data: activity venue; the experience is the draw" },
  // Vedge
  "vedge": { dinner: "data: restaurant; 1.5h+ stay" },
  // Vetri Cucina
  "vetri-cucina": { dinner: "data: restaurant; 1.5h+ stay" },
  // Talula's Garden
  "talulas-garden": { dinner: "data: restaurant; 1.5h+ stay" },
  // Barbuzzo
  "barbuzzo": { dinner: "data: restaurant; 1.5h+ stay" },
  // El Vez
  "el-vez": { dinner: "data: restaurant; 1.5h+ stay" },
  // Double Knot
  "double-knot": { dinner: "data: restaurant; 1.5h+ stay", drinks: "reviewed: upstairs lounge plus a full cocktail program" },
  // Bud & Marilyn's
  "bud-and-marilyns": { dinner: "data: restaurant; 1.5h+ stay" },
  // Alpen Rose
  "alpen-rose": { dinner: "data: restaurant; 1.5h+ stay" },
  // Sampan
  "sampan-center-city": { dinner: "data: restaurant; 1.5h+ stay", drinks: "reviewed: three bars on premises, including the hidden outdoor 'Graffiti Bar'" },
  // Kiddo
  "kiddo": { dinner: "data: restaurant; 1.5h+ stay" },
  // Mercato
  "mercato-byob": { dinner: "data: restaurant; 1.5h+ stay" },
  // Vintage Wine Bar & Bistro
  "vintage-wine-bar": { drinks: "data: Wine Bar: serves alcohol, drinks are a listed draw" },
  // Tavern on Camac
  "tavern-on-camac": { dinner: "reviewed: description: combines a restaurant, a piano bar and a nightclub", drinks: "data: Piano Bar: serves alcohol, drinks are a listed draw" },
  // Franky Bradley's
  "franky-bradleys": { dinner: "reviewed: 'bar and restaurant'; 'calmer for an early dinner'", drinks: "data: LGBTQ+ Bar & Music Venue: serves alcohol, drinks are a listed draw" },
  // Writer's Block Rehab
  "writers-block-rehab": { drinks: "data: Literary-Themed Lounge: serves alcohol, drinks are a listed draw" },
  // McGillin's Olde Ale House
  "mcgillins-olde-ale-house": { drinks: "data: Historic Ale House: serves alcohol, drinks are a listed draw" },
  // Brü Craft & Wurst
  "bru-craft-and-wurst": { dinner: "reviewed: beer hall serving sausages and pretzels; food listed first", drinks: "data: German Beer Hall: serves alcohol, drinks are a listed draw" },
  // Iron Hill Brewery & Restaurant
  "iron-hill-brewery-center-city": { dinner: "reviewed: brewpub restaurant with an open kitchen", drinks: "data: Brewpub: serves alcohol, drinks are a listed draw" },
  // Jiggy Coffee
  "jiggy-coffee": { coffee: "data: café whose record centers on coffee" },
  // Habitat Coffee House
  "habitat-coffee-house": { coffee: "data: café whose record centers on coffee" },
  // J'aime French Bakery
  "jaime-french-bakery": { dessert: "data: dessert/bakery shop" },
  // Sweet Box Bakeshop
  "sweet-box-bakeshop": { dessert: "data: dessert/bakery shop" },
  // Insomnia Cookies Flagship Bakery
  "insomnia-cookies-flagship": { dessert: "data: dessert/bakery shop" },
  // Academy of Music
  "academy-of-music": { activity: "data: activity venue; the experience is the draw" },
  // The Wilma Theater
  "wilma-theater": { activity: "data: activity venue; the experience is the draw" },
  // Walnut Street Theatre
  "walnut-street-theatre": { activity: "data: activity venue; the experience is the draw" },
  // Chris' Jazz Cafe
  "chris-jazz-cafe": { activity: "data: activity venue; the experience is the draw" },
  // Pennsylvania Academy of the Fine Arts
  "pafa": { activity: "data: activity venue; the experience is the draw" },
  // Locks Gallery
  "locks-gallery": { activity: "data: activity venue; the experience is the draw" },
  // F1 Arcade Philadelphia
  "f1-arcade-philadelphia": { activity: "data: activity venue; the experience is the draw" },
  // Lucky Strike Philadelphia
  "lucky-strike-philadelphia": { activity: "data: activity venue; the experience is the draw" },
  // Fork
  "fork": { dinner: "data: restaurant; 1.5h+ stay" },
  // Buddakan
  "buddakan": { dinner: "data: restaurant; 1.5h+ stay" },
  // Amada
  "amada": { dinner: "data: restaurant; 1.5h+ stay" },
  // Royal Boucherie
  "royal-boucherie": { dinner: "data: restaurant; 1.5h+ stay" },
  // Red Owl Tavern
  "red-owl-tavern": { dinner: "data: restaurant; 1.5h+ stay" },
  // Cuba Libre Restaurant & Rum Bar
  "cuba-libre": { dinner: "data: restaurant; 1.5h+ stay", drinks: "reviewed: 'Rum Bar' in its name; rum bar specialty (mojitos, caipirinhas)" },
  // Forsythia
  "forsythia": { dinner: "data: restaurant; 1.5h+ stay" },
  // Positano Coast
  "positano-coast": { dinner: "data: restaurant; 1.5h+ stay" },
  // Revolution House
  "revolution-house": { dinner: "data: restaurant; 1.5h+ stay" },
  // Panorama
  "panorama": { dinner: "data: restaurant; 1.5h+ stay" },
  // Vista Peru
  "vista-peru": { dinner: "data: restaurant; 1.5h+ stay" },
  // Almanac
  "almanac": { drinks: "data: Cocktail Bar: serves alcohol, drinks are a listed draw" },
  // 48 Record Bar
  "48-record-bar": { drinks: "data: Vinyl Listening Bar: serves alcohol, drinks are a listed draw" },
  // Calandrino's Old City Vino
  "calandrinos-old-city-vino": { drinks: "data: Wine Bar: serves alcohol, drinks are a listed draw" },
  // Khyber Pass Pub
  "khyber-pass-pub": { dinner: "reviewed: gastropub with a Cajun/Creole food menu", drinks: "data: Gastropub: serves alcohol, drinks are a listed draw" },
  // Sassafras Bar
  "sassafras-bar": { drinks: "data: Neighborhood Bar: serves alcohol, drinks are a listed draw" },
  // National Mechanics
  "national-mechanics": { dinner: "reviewed: 'pub and restaurant' in its description", drinks: "data: Historic Pub: serves alcohol, drinks are a listed draw" },
  // The Plough and the Stars
  "plough-and-the-stars": { drinks: "data: Irish Pub: serves alcohol, drinks are a listed draw" },
  // Old City Coffee
  "old-city-coffee": { coffee: "data: café whose record centers on coffee" },
  // Menagerie Coffee
  "menagerie-coffee-old-city": { coffee: "data: café whose record centers on coffee" },
  // The Franklin Fountain
  "franklin-fountain": { dessert: "data: dessert/bakery shop" },
  // Shane Confectionery
  "shane-confectionery": { dessert: "data: dessert/bakery shop" },
  // Museum of the American Revolution
  "museum-of-the-american-revolution": { activity: "data: activity venue; the experience is the draw" },
  // The Betsy Ross House
  "betsy-ross-house": { activity: "data: activity venue; the experience is the draw" },
  // Fireman's Hall Museum
  "firemans-hall-museum": { activity: "data: activity venue; the experience is the draw" },
  // Elfreth's Alley Museum
  "elfreths-alley-museum": { activity: "reviewed: historic street and museum: visiting it is the outing" },
  // Christ Church
  "christ-church-old-city": { activity: "data: activity venue; the experience is the draw" },
  // Muse Gallery
  "muse-gallery": { activity: "reviewed: art gallery: browsing it is the outing" },
  // Philly Improv Theater
  "philly-improv-theater": { activity: "data: activity venue; the experience is the draw" },
  // Suraya
  "suraya": { dinner: "data: restaurant; 1.5h+ stay" },
  // Elwood
  "elwood": { dinner: "data: restaurant; 1.5h+ stay" },
  // Kalaya
  "kalaya": { dinner: "data: restaurant; 1.5h+ stay" },
  // Wm. Mulherin's Sons
  "wm-mulherins-sons": { dinner: "data: restaurant; 1.5h+ stay" },
  // Pizzeria Beddia
  "pizzeria-beddia": { dinner: "reviewed: dining room with a full bar; reservations open 30 days out" },
  // Loco Pez
  "loco-pez-fishtown": { dinner: "reviewed: casual taqueria with late kitchen (to 1am), tequila cocktails and patio" },
  // Fette Sau
  "fette-sau": { dinner: "reviewed: sit-down BBQ dining room" },
  // Middle Child Clubhouse
  "middle-child-clubhouse": { dinner: "data: restaurant; 1.5h+ stay" },
  // R&D
  "rd-cocktail-bar": { drinks: "data: Cocktail Bar: serves alcohol, drinks are a listed draw" },
  // Next of Kin
  "next-of-kin": { drinks: "data: Cocktail Bar: serves alcohol, drinks are a listed draw" },
  // Caletta
  "caletta": { drinks: "data: Piano Bar & Lounge: serves alcohol, drinks are a listed draw" },
  // Lloyd Whiskey Bar
  "lloyd-whiskey-bar": { drinks: "data: Whiskey Bar: serves alcohol, drinks are a listed draw" },
  // Fishtown Social
  "fishtown-social": { drinks: "data: Wine Bar: serves alcohol, drinks are a listed draw" },
  // Frankford Hall
  "frankford-hall": { drinks: "data: German Biergarten: serves alcohol, drinks are a listed draw" },
  // Johnny Brenda's
  "johnny-brendas": { drinks: "data: Bar & Live Music Venue: serves alcohol, drinks are a listed draw", activity: "reviewed: independent concert venue upstairs is a major reason to go" },
  // Fishtown Tavern
  "fishtown-tavern": { drinks: "data: Neighborhood Dive Bar: serves alcohol, drinks are a listed draw" },
  // Cedar Point Bar & Kitchen
  "cedar-point-bar-and-kitchen": { dinner: "reviewed: 'Bar & Kitchen' gastropub; food listed first", drinks: "data: Gastropub: serves alcohol, drinks are a listed draw" },
  // Evil Genius Beer Company
  "evil-genius-beer-company": { drinks: "data: Production Brewery & Taproom: serves alcohol, drinks are a listed draw" },
  // La Colombe Coffee Roasters
  "la-colombe-fishtown": { coffee: "data: café whose record centers on coffee" },
  // ReAnimator Coffee
  "reanimator-coffee": { coffee: "data: café whose record centers on coffee" },
  // Gilda Café & Market
  // Coffee reviewed and removed: the record never mentions coffee; it is known for pastéis de nata and sandwiches.
  "gilda-cafe-and-market": { dessert: "reviewed: known for pastéis de nata" },
  // Cake Life Bake Shop
  "cake-life-bake-shop": { dessert: "data: dessert/bakery shop" },
  // Weckerly's Ice Cream
  "weckerlys-fishtown": { dessert: "data: dessert/bakery shop" },
  // Kung Fu Necktie
  "kung-fu-necktie": { activity: "data: activity venue; the experience is the draw" },
  // The Fillmore Philadelphia
  "the-fillmore-philadelphia": { activity: "data: activity venue; the experience is the draw" },
  // Barcade
  "barcade-fishtown": { drinks: "reviewed: 'Arcade Bar'; American craft beer list is half the pitch", activity: "data: activity venue; the experience is the draw" },
  // Louie Louie
  "louie-louie": { dinner: "data: restaurant; 1.5h+ stay", drinks: "reviewed: striking bar and lounge; extensive wine and cocktail program" },
  // White Dog Cafe
  "white-dog-cafe-university-city": { dinner: "data: restaurant; 1.5h+ stay" },
  // LaScala's Fire
  "lascalas-fire-university-city": { dinner: "reviewed: Italian-American dining room built around a wood-fired oven" },
  // Han Dynasty
  "han-dynasty-university-city": { dinner: "reviewed: full-service Szechuan dining room" },
  // New Delhi Indian Restaurant
  "new-delhi-indian": { dinner: "data: restaurant; priced $$$+" },
  // Aksum
  "aksum": { dinner: "data: restaurant; 1.5h+ stay" },
  // Hadramout
  "hadramout": { dinner: "data: restaurant; priced $$$+" },
  // Dim Sum House by Jane G's
  "dim-sum-house-university-city": { dinner: "data: restaurant; 1.5h+ stay", drinks: "reviewed: late-night cocktail lounge ('Cocktail Lounge' in its label)" },
  // Loco Pez
  "loco-pez-west-philly": { dinner: "reviewed: casual taqueria; happy hour and karaoke nights point to evenings" },
  // Green Line Cafe
  "green-line-cafe": { coffee: "data: café whose record centers on coffee" },
  // Haraz Coffee House
  "haraz-coffee-house": { coffee: "data: café whose record centers on coffee" },
  // Knockbox Cafe
  "knockbox-cafe": { coffee: "data: café whose record centers on coffee" },
  // Soyu Coffee Shop
  "soyu-coffee-shop": { coffee: "data: café whose record centers on coffee" },
  // Surreal Creamery
  "surreal-creamery": { dessert: "data: dessert/bakery shop" },
  // Coco's Cookies & Creamery
  "cocos-cookies-and-creamery": { dessert: "data: dessert/bakery shop" },
  // New Deck Tavern
  "new-deck-tavern": { drinks: "data: Neighborhood Tavern: serves alcohol, drinks are a listed draw" },
  // Local 44
  "local-44": { drinks: "data: Craft Beer Bar: serves alcohol, drinks are a listed draw" },
  // Upstairs at Abyssinia
  "upstairs-at-abyssinia": { drinks: "data: Hidden Cocktail Bar: serves alcohol, drinks are a listed draw" },
  // Copabanana
  "copabanana-university-city": { dinner: "reviewed: Mexican-American bar & grill with a full menu", drinks: "reviewed: known for flavored margaritas; bar & grill" },
  // Two Locals Brewing Company
  "two-locals-brewing": { drinks: "data: Brewery & Taproom: serves alcohol, drinks are a listed draw" },
  // The Board and Brew
  "the-board-and-brew": { activity: "data: activity venue; the experience is the draw" },
  // The Post
  "the-post-university-city": { drinks: "reviewed: 'Beer Hall & Arcade'; full beer, wine and cocktail list", activity: "data: activity venue; the experience is the draw" },
  // Le Virtù
  "le-virtu": { dinner: "data: restaurant; 1.5h+ stay" },
  // Stateside
  "stateside": { dinner: "data: restaurant; 1.5h+ stay", drinks: "reviewed: 'Whiskey Bar' in its label; 100+ bourbons and ryes" },
  // River Twice
  "river-twice": { dinner: "data: restaurant; 1.5h+ stay" },
  // Noir
  "noir-restaurant": { dinner: "data: restaurant; 1.5h+ stay" },
  // Mish Mish
  "mish-mish": { dinner: "data: restaurant; 1.5h+ stay" },
  // Burrata
  "burrata-byob": { dinner: "data: restaurant; 1.5h+ stay" },
  // Ralph's Italian Restaurant
  "ralphs-italian-restaurant": { dinner: "data: restaurant; 1.5h+ stay" },
  // Fiorella
  "fiorella": { dinner: "data: restaurant; 1.5h+ stay" },
  // Barcelona Wine Bar
  "barcelona-wine-bar-south-philly": { dinner: "reviewed: Spanish tapas at $35-55 per person, 1.5-2h stay", drinks: "data: Spanish Tapas & Wine Bar: serves alcohol, drinks are a listed draw" },
  // Italian Market
  "italian-market-walk": { activity: "data: activity venue; the experience is the draw" },
  // The Victor Café
  "the-victor-cafe": { dinner: "reviewed: 'Live Opera Dinner' is the experience", activity: "data: activity venue; the experience is the draw" },
  // Theatre Exile
  "theatre-exile": { activity: "data: activity venue; the experience is the draw" },
  // Pistolas del Sur
  "pistolas-del-sur": { drinks: "data: Tequila & Mezcal Bar: serves alcohol, drinks are a listed draw" },
  // Watkins Drinkery
  "watkins-drinkery": { dinner: "reviewed: 'unusually adventurous gastropub menu'", drinks: "data: Cocktail Bar & Gastropub: serves alcohol, drinks are a listed draw" },
  // Cartesian Brewing
  "cartesian-brewing": { drinks: "data: Brewery Taproom & Board Games: serves alcohol, drinks are a listed draw", activity: "reviewed: 'Brewery Taproom & Board Games' in its label; game-night draw" },
  // Human Robot SÜD
  "human-robot-sud": { drinks: "data: Brewery Taproom: serves alcohol, drinks are a listed draw" },
  // Fountain Porter
  "fountain-porter": { drinks: "data: Casual Neighborhood Bar: serves alcohol, drinks are a listed draw" },
  // Triangle Tavern
  "triangle-tavern": { drinks: "data: Historic Tavern: serves alcohol, drinks are a listed draw" },
  // Rival Bros Coffee
  "rival-bros-coffee-passyunk": { coffee: "data: café whose record centers on coffee" },
  // Ground Up Cafe & Coffee
  "ground-up-cafe": { coffee: "data: café whose record centers on coffee" },
  // Anthony's Italian Coffee House
  "anthonys-italian-coffee-house": { coffee: "data: café whose record centers on coffee", dessert: "reviewed: 'coffee house, chocolate shop, and gelateria'; gelato and sfogliatelle" },
  // Termini Bros Bakery
  "termini-bros-bakery": { dessert: "data: dessert/bakery shop" },
  // Isgro Pastries
  "isgro-pastries": { dessert: "data: dessert/bakery shop" },
  // Milk Jawn
  "milk-jawn": { dessert: "data: dessert/bakery shop" },
  // D'Emilio's Old World Ice Treats
  "demilios-old-world-ice-treats": { dessert: "data: dessert/bakery shop" },
};

/** Venues with no specific type for now. They stay fully discoverable through Anything. */
export const ANYTHING_ONLY: string[] = [
  "dizengoff", // Dizengoff: walk-in hummus counter, 45m-1h; looks daytime-led
  "kfar", // K'Far: bakery-cafe; coffee not mentioned; bagels and borekas are savory, not dessert
  "sabrinas-cafe-university-city", // Sabrina's Café: brunch restaurant; evening service not shown in the record
];
