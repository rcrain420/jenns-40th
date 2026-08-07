export type TripStyle = "inshore" | "flats" | "nearshore" | "fly";

export type FishingGuide = {
  id: string;
  name: string;
  captain: string;
  summary: string;
  styles: TripStyle[];
  species: string[];
  maxGuests: number;
  boatLengthFt: number;
  marinaArea: string;
  startingFromUsd: number;
  bookingUrl: string;
  websiteUrl?: string;
};

const FISHINGBOOKER_ROCKPORT =
  "https://fishingbooker.com/destinations/location/us/TX/rockport";
const CAPTAIN_EXPERIENCES_ROCKPORT =
  "https://captainexperiences.com/locations/texas/rockport";
const FISHANYWHERE_ROCKPORT =
  "https://fishanywhere.com/locations/texas/rockport/technique/inshore";

/** Rockport-area fishing charters — verify availability for tournament day. */
export const ROCKPORT_GUIDES: FishingGuide[] = [
  {
    id: "barnards",
    name: "Barnard's Guide Service",
    captain: "Capt. Tommy Barnard",
    summary:
      "Long-tenured Rockport bay guide targeting redfish, trout, and drum on a 22 ft bay boat.",
    styles: ["inshore", "flats"],
    species: ["redfish", "speckled trout", "black drum"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport / Cove Harbor",
    startingFromUsd: 500,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
    websiteUrl: "https://therockportfishingguide.com",
  },
  {
    id: "first-light",
    name: "First Light Guide Service",
    captain: "Capt. Brian Oxford",
    summary:
      "Inshore Rockport trips with an early start — good fit for tournament mornings.",
    styles: ["inshore"],
    species: ["speckled trout", "redfish", "gafftopsail"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 600,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "smileys",
    name: "Smiley's Guide Service",
    captain: "Capt. William Smiley",
    summary:
      "Bay and nearshore days out of Rockport for mixed bags of trout, reds, and drum.",
    styles: ["inshore", "nearshore"],
    species: ["redfish", "speckled trout", "flounder"],
    maxGuests: 4,
    boatLengthFt: 25,
    marinaArea: "Rockport / Hwy 35 N",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "texas-crewd",
    name: "Texas Crew'd Bay Fishing",
    captain: "Capt. Blake",
    summary:
      "Affordable bay charters sized for small teams — up to five anglers on a 22 ft boat.",
    styles: ["inshore"],
    species: ["redfish", "speckled trout", "black drum"],
    maxGuests: 5,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 500,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "reel-adventures",
    name: "Reel Adventures Private Charters",
    captain: "Capt. Corey",
    summary:
      "Private Rockport charters with weather-savvy communication before launch.",
    styles: ["inshore", "nearshore"],
    species: ["redfish", "speckled trout", "flounder"],
    maxGuests: 5,
    boatLengthFt: 23,
    marinaArea: "Rockport / Port Aransas",
    startingFromUsd: 500,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "tnt",
    name: "TNT Guide Service",
    captain: "Capt. Travis Garrett",
    summary:
      "Limit-minded trout trips on a roomy 25 ft bay boat for crews of up to five.",
    styles: ["inshore"],
    species: ["speckled trout", "redfish"],
    maxGuests: 5,
    boatLengthFt: 25,
    marinaArea: "Rockport / Hwy 35 N",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "tony-gonzalez",
    name: "Capt. Tony Gonzalez Inshore Fishing",
    captain: "Capt. Tony Gonzalez",
    summary:
      "Welcoming inshore days ideal for mixed-experience teams and families.",
    styles: ["inshore", "flats"],
    species: ["redfish", "speckled trout", "black drum"],
    maxGuests: 4,
    boatLengthFt: 23,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "blue-line",
    name: "Blue Line Guide Service",
    captain: "Capt. Tom Sowell",
    summary:
      "Family-friendly inshore and flats trips around Rockport and Baffin Bay waters.",
    styles: ["inshore", "flats"],
    species: ["redfish", "speckled trout"],
    maxGuests: 4,
    boatLengthFt: 21,
    marinaArea: "Rockport / Baffin Bay",
    startingFromUsd: 600,
    bookingUrl: CAPTAIN_EXPERIENCES_ROCKPORT,
  },
  {
    id: "wing-rod",
    name: "Wing & Rod Guide Service",
    captain: "Capt. Ben Wells",
    summary:
      "Coastal Bend bay and flats trips covering Rockport, Port Aransas, and Laguna Madre.",
    styles: ["inshore", "flats"],
    species: ["redfish", "speckled trout"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport / Port Aransas",
    startingFromUsd: 550,
    bookingUrl: CAPTAIN_EXPERIENCES_ROCKPORT,
  },
  {
    id: "flat-bottom",
    name: "Flat Bottom Charters",
    captain: "Flat Bottom Charters",
    summary:
      "Shallow-draft flats boat for skinny-water reds and trout near Rockport.",
    styles: ["flats", "inshore"],
    species: ["redfish", "speckled trout"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: FISHANYWHERE_ROCKPORT,
  },
  {
    id: "krazy-kroaker",
    name: "Krazy Kroaker Guide Service",
    captain: "Krazy Kroaker",
    summary:
      "25 ft bay boat for larger tournament crews fishing Rockport inshore waters.",
    styles: ["inshore"],
    species: ["redfish", "speckled trout", "black drum"],
    maxGuests: 5,
    boatLengthFt: 25,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: FISHANYWHERE_ROCKPORT,
  },
  {
    id: "fly-fish-rockport",
    name: "Fly Fish Rockport",
    captain: "Fly Fish Rockport",
    summary:
      "Dedicated fly trips on Copano and Aransas Bay flats — best for pairs chasing reds.",
    styles: ["fly", "flats"],
    species: ["redfish", "speckled trout", "black drum"],
    maxGuests: 2,
    boatLengthFt: 17,
    marinaArea: "Rockport",
    startingFromUsd: 450,
    bookingUrl: "https://flyfishrockport.com",
    websiteUrl: "https://flyfishrockport.com",
  },
  {
    id: "marios-fishing-mission",
    name: "Mario's Fishing Mission",
    captain: "Capt. Mario",
    summary:
      "Patient, accommodating inshore guide fishing Copano Bay and Rockport flats.",
    styles: ["inshore", "flats"],
    species: ["redfish", "speckled trout", "black drum"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport / Copano Bay",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "ccc-guide",
    name: "CCC Guide Service",
    captain: "CCC Guide Service",
    summary:
      "Inshore Rockport trips known for speckled trout limits and all-day hustle.",
    styles: ["inshore"],
    species: ["speckled trout", "redfish", "black drum"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "coastal-guide-rockport",
    name: "Coastal Guide Service Rockport",
    captain: "Capt. Chris",
    summary:
      "Light- and heavy-tackle bay trips with a focus on putting anglers on fish.",
    styles: ["inshore"],
    species: ["redfish", "speckled trout", "flounder"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "saltwater-experience",
    name: "Saltwater Experience Charters",
    captain: "Capt. Paul Baucum",
    summary:
      "Friendly inshore days on Rockport bay systems, flats, and backwaters.",
    styles: ["inshore", "flats"],
    species: ["redfish", "speckled trout", "black drum"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "just-fishing",
    name: "Just Fishing Guide Service",
    captain: "Capt. David Hill",
    summary:
      "20+ years on Rockport bay waters — solid pick for classic inshore days.",
    styles: ["inshore"],
    species: ["redfish", "speckled trout", "black drum"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "hi-dukes",
    name: "Hi-Duke's Guide Service",
    captain: "Hi-Duke's Guide Service",
    summary:
      "Bay fishing for black drum, flounder, redfish, and speckled trout out of Rockport.",
    styles: ["inshore"],
    species: ["black drum", "flounder", "redfish", "speckled trout"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "fillabite",
    name: "Fillabite Guide Service",
    captain: "Capt. Randy Filla",
    summary:
      "Three decades of Coastal Bend experience for authentic Rockport bay trips.",
    styles: ["inshore"],
    species: ["redfish", "speckled trout", "black drum"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "fishing-all-the-time",
    name: "Fishing All The Time Guide Service",
    captain: "Capt. Larry Miller",
    summary:
      "30+ years guiding with Rockport Cove Harbor and Port Aransas pickups available.",
    styles: ["inshore"],
    species: ["redfish", "speckled trout", "black drum"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport / Cove Harbor",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "hines",
    name: "Hines Guide Service",
    captain: "Hines Guide Service",
    summary: "Rockport inshore charters listed among top local bay guides.",
    styles: ["inshore"],
    species: ["redfish", "speckled trout"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "jellybean",
    name: "Jellybean Guide Service",
    captain: "Jellybean Guide Service",
    summary: "Rockport bay fishing charters for trout, redfish, and drum.",
    styles: ["inshore"],
    species: ["redfish", "speckled trout", "black drum"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "kevin-sims",
    name: "Rockport Fishing Charters (Bay Charters)",
    captain: "Capt. Kevin Sims",
    summary:
      "Bay, drift, wade, reef, and flats trips on a 23 ft Stone Fury — also offers duck hunts.",
    styles: ["inshore", "flats"],
    species: ["redfish", "speckled trout", "black drum", "flounder"],
    maxGuests: 4,
    boatLengthFt: 23,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: "https://rockportfishingcharters.com",
    websiteUrl: "https://rockportfishingcharters.com",
  },
  {
    id: "captain-rons",
    name: "Captain Ron's Charters",
    captain: "Capt. Ron",
    summary:
      "Light-tackle inshore trips for redfish and black drum; kid- and family-friendly options.",
    styles: ["inshore", "flats"],
    species: ["redfish", "black drum"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport / Henderson St",
    startingFromUsd: 550,
    bookingUrl: "https://www.rockportareafishingcharters.com",
    websiteUrl: "https://www.rockportareafishingcharters.com",
  },
  {
    id: "ingleside-rockport",
    name: "Ingleside Fishing Charter – Rockport",
    captain: "Ingleside Fishing Charter",
    summary:
      "Copano and Aransas Bay inshore trips for redfish, trout, flounder, and black drum.",
    styles: ["inshore"],
    species: ["redfish", "speckled trout", "flounder", "black drum"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport / Enterprise Blvd",
    startingFromUsd: 550,
    bookingUrl: "https://inglesidefishingcharter.com",
    websiteUrl: "https://inglesidefishingcharter.com",
  },
  {
    id: "johans",
    name: "Johans Fishing Guide Service",
    captain: "Johan",
    summary:
      "Marine-ecology background with all styles of Rockport bay fishing for stress-free days.",
    styles: ["inshore", "flats"],
    species: ["redfish", "speckled trout", "black drum"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: "https://johansrockportguideservice.com",
    websiteUrl: "https://johansrockportguideservice.com",
  },
  {
    id: "mojo",
    name: "Mojo Guide Service & Outfitters",
    captain: "Capt. JC Algueseva",
    summary:
      "30+ years guiding — teaching-focused Rockport trips for anglers who want to improve.",
    styles: ["inshore", "flats"],
    species: ["redfish", "speckled trout"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport / S Water St",
    startingFromUsd: 550,
    bookingUrl: "https://fishingwithmojo.com",
    websiteUrl: "https://fishingwithmojo.com",
  },
  {
    id: "big-ms",
    name: "Big M's Fishing Charters",
    captain: "Capt. M.L. Engel",
    summary:
      "Full-time Coastal Bend guide since 1985 — USCG and TPWD licensed year-round.",
    styles: ["inshore"],
    species: ["redfish", "speckled trout", "black drum", "flounder"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: "https://bigmfishingcharters.com",
    websiteUrl: "https://bigmfishingcharters.com",
  },
  {
    id: "titelines",
    name: "TiteLines Guide Service",
    captain: "TiteLines Guide Service",
    summary:
      "Year-round inshore trips for families and buddies — reds, trout, drum, and flounder.",
    styles: ["inshore"],
    species: ["redfish", "speckled trout", "black drum", "flounder"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport / Cove Harbor",
    startingFromUsd: 550,
    bookingUrl:
      "https://sites.google.com/view/tite-lines-guide-service",
    websiteUrl:
      "https://sites.google.com/view/tite-lines-guide-service",
  },
  {
    id: "saltitude",
    name: "Saltitude Outfitters",
    captain: "Capt. Sam Schiwart",
    summary:
      "Bay, wade, surf, and tournament trips from San Antonio Bay to Baffin — CBGA member.",
    styles: ["inshore", "flats", "nearshore"],
    species: ["redfish", "speckled trout"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: "https://saltitudeoutfitters.com",
    websiteUrl: "https://saltitudeoutfitters.com",
  },
  {
    id: "just-add-water",
    name: "Just Add Water Guide Service",
    captain: "Capt. Jay Nichols",
    summary:
      "Drift, wade, or sight-cast — tackle, bait, and fish cleaning included.",
    styles: ["inshore", "flats"],
    species: ["redfish", "speckled trout", "black drum"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: "https://jawgs.com",
    websiteUrl: "https://jawgs.com",
  },
  {
    id: "mason-matejcek",
    name: "Captain Mason Matejcek",
    captain: "Capt. Mason Matejcek",
    summary:
      "Full-time fly and light-tackle sight-casting from a technical poling skiff (2 anglers).",
    styles: ["fly", "flats"],
    species: ["redfish", "jack crevalle"],
    maxGuests: 2,
    boatLengthFt: 18,
    marinaArea: "Rockport / Port O'Connor",
    startingFromUsd: 500,
    bookingUrl: "https://captainmasonm.com",
    websiteUrl: "https://captainmasonm.com",
  },
  {
    id: "rockport-red-runner",
    name: "Rockport Red Runner Fishing Guide",
    captain: "Capt. Chad",
    summary:
      "20+ years covering Aransas, Copano, Mesquite, and Coastal Bend bay systems.",
    styles: ["inshore", "flats"],
    species: ["redfish", "speckled trout", "black drum"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: "https://rockportredrunner.com",
    websiteUrl: "https://rockportredrunner.com",
  },
  {
    id: "saltwater-sport",
    name: "SaltWater Sport Guide Service",
    captain: "SaltWater Sport Guide Service",
    summary:
      "Year-round drift and wade trips from Rockport to Matagorda, Baffin, and Laguna Madre.",
    styles: ["inshore", "flats"],
    species: ["speckled trout", "redfish", "black drum", "flounder"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport / Port Aransas",
    startingFromUsd: 550,
    bookingUrl: "https://saltwatersporttexas.com",
    websiteUrl: "https://saltwatersporttexas.com",
  },
  {
    id: "shallow-water",
    name: "Shallow Water Guide Service",
    captain: "Capt. Larry Robinson",
    summary:
      "CCA Guide of the Year alum — bay fishing, airboat access, and skinny-water days.",
    styles: ["inshore", "flats"],
    species: ["redfish", "speckled trout", "flounder"],
    maxGuests: 4,
    boatLengthFt: 20,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: "https://shallow-water.com",
    websiteUrl: "https://shallow-water.com",
  },
  {
    id: "graham-slam",
    name: "Graham Slam Fishing Charters",
    captain: "Graham Slam Fishing Charters",
    summary:
      "Licensed captains for bay, jetty, and nearshore — trout, reds, tarpon, and kingfish.",
    styles: ["inshore", "nearshore"],
    species: [
      "speckled trout",
      "redfish",
      "black drum",
      "tarpon",
      "kingfish",
    ],
    maxGuests: 4,
    boatLengthFt: 24,
    marinaArea: "Rockport / Cove Harbor",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "gone-coastal",
    name: "Gone Coastal Guide Service & Airboat Tours",
    captain: "Gone Coastal",
    summary:
      "Bay and back-lake fishing plus airboat access where conventional boats can't go.",
    styles: ["inshore", "flats"],
    species: ["redfish", "speckled trout", "black drum"],
    maxGuests: 4,
    boatLengthFt: 20,
    marinaArea: "Rockport / Fulton",
    startingFromUsd: 550,
    bookingUrl: "https://gonecoastaltx.com",
    websiteUrl: "https://gonecoastaltx.com",
  },
  {
    id: "night-stalker",
    name: "Night Stalker Guide Service",
    captain: "Night Stalker Guide Service",
    summary:
      "Night flounder gigging on shallow Rockport flats with lights — specialty trips.",
    styles: ["inshore", "flats"],
    species: ["flounder"],
    maxGuests: 4,
    boatLengthFt: 20,
    marinaArea: "Rockport",
    startingFromUsd: 500,
    bookingUrl: "https://nightstalkerguideservice.com",
    websiteUrl: "https://nightstalkerguideservice.com",
  },
  {
    id: "bent-rod",
    name: "Bent Rod Guide Service",
    captain: "Bent Rod Guide Service",
    summary:
      "Inshore and shark trips from a Rockport-based captain with tournament experience.",
    styles: ["inshore", "nearshore"],
    species: ["redfish", "speckled trout", "shark"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport / Hwy 35 N",
    startingFromUsd: 550,
    bookingUrl: "https://bentrodfishing.com",
    websiteUrl: "https://bentrodfishing.com",
  },
  {
    id: "rockport-bay-fishing",
    name: "Rockport Bay Fishing Charters",
    captain: "Rockport Bay Fishing Charters",
    summary: "Top-rated Rockport bay charters for classic Coastal Bend species.",
    styles: ["inshore"],
    species: ["redfish", "speckled trout", "black drum"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "rpm-guide",
    name: "RPM Guide Services",
    captain: "Capt. Don",
    summary: "Rockport guide service with strong reviews for inshore bay trips.",
    styles: ["inshore"],
    species: ["redfish", "speckled trout"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "keepin-up-jones",
    name: "Keepin up With the Jones Outfitters",
    captain: "Keepin up With the Jones",
    summary: "Rockport outfitter offering guided inshore fishing adventures.",
    styles: ["inshore"],
    species: ["redfish", "speckled trout", "black drum"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "redfish-reaper",
    name: "Redfish Reaper Guide Service",
    captain: "Capt. James Hinton",
    summary:
      "Fishing, nature tours, and family cruises in and around Rockport waters.",
    styles: ["inshore", "flats"],
    species: ["redfish", "speckled trout"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "d-reel",
    name: "D Reel Guiding",
    captain: "D Reel Guiding",
    summary:
      "Wade-focused trips with Port Aransas access — listed among Rockport-area guides.",
    styles: ["inshore", "flats"],
    species: ["redfish", "speckled trout"],
    maxGuests: 3,
    boatLengthFt: 20,
    marinaArea: "Rockport / Port Aransas",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "cedar-bayou",
    name: "Cedar Bayou Outfitters",
    captain: "Cedar Bayou Outfitters",
    summary:
      "Guided fishing and hunting along the Texas Gulf Coast near Rockport.",
    styles: ["inshore", "flats"],
    species: ["redfish", "speckled trout", "flounder"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport / Cedar Bayou",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "keepin-it-reel",
    name: "Keepin It Reel Fishing Guide",
    captain: "Keepin It Reel",
    summary:
      "Shallow-water bay trips plus offshore deepwater options out of Rockport.",
    styles: ["inshore", "nearshore"],
    species: ["redfish", "speckled trout", "red snapper"],
    maxGuests: 4,
    boatLengthFt: 24,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "james-regini",
    name: "James Regini Guide Service",
    captain: "Capt. James Regini",
    summary: "Seasoned Rockport coastal guide for classic bay fishing days.",
    styles: ["inshore"],
    species: ["redfish", "speckled trout", "black drum"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
  {
    id: "gone-with-the-fish",
    name: "Gone With The Fish Charters",
    captain: "Gone With The Fish",
    summary:
      "Rockport and Baffin Bay inshore charters focused on redfish and Coastal Bend species.",
    styles: ["inshore", "flats"],
    species: ["redfish", "speckled trout"],
    maxGuests: 4,
    boatLengthFt: 22,
    marinaArea: "Rockport / Baffin Bay",
    startingFromUsd: 550,
    bookingUrl: FISHINGBOOKER_ROCKPORT,
  },
];

export const TRIP_STYLE_LABELS: Record<TripStyle, string> = {
  inshore: "Inshore",
  flats: "Flats",
  nearshore: "Nearshore",
  fly: "Fly",
};

export const MARKETPLACE_LINKS = [
  {
    label: "FishingBooker — Rockport",
    href: FISHINGBOOKER_ROCKPORT,
  },
  {
    label: "Captain Experiences — Rockport",
    href: CAPTAIN_EXPERIENCES_ROCKPORT,
  },
  {
    label: "FishAnywhere — Rockport inshore",
    href: FISHANYWHERE_ROCKPORT,
  },
] as const;

export type GuideSearchFilters = {
  query?: string;
  style?: TripStyle | "all";
  minGuests?: number;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function searchGuides(
  guides: FishingGuide[],
  filters: GuideSearchFilters,
): FishingGuide[] {
  const q = normalize(filters.query ?? "");
  const style = filters.style && filters.style !== "all" ? filters.style : null;
  const minGuests = filters.minGuests && filters.minGuests > 0 ? filters.minGuests : null;

  return guides.filter((guide) => {
    if (style && !guide.styles.includes(style)) return false;
    if (minGuests && guide.maxGuests < minGuests) return false;
    if (!q) return true;

    const haystack = [
      guide.name,
      guide.captain,
      guide.summary,
      guide.marinaArea,
      ...guide.species,
      ...guide.styles,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

export function getGuideById(id: string): FishingGuide | undefined {
  return ROCKPORT_GUIDES.find((g) => g.id === id);
}
