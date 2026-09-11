// Transcribed from the paper "First Floor" room inspection checklist.
export const CHECKLIST_TEMPLATE = [
  {
    name: 'Air Conditioning/Heating',
    items: [
      'Filter and grill clean',
      'T-Stat Operable',
      'All Switches Working',
      'Fan Blower working/noisy',
      'AC Temp/Heater Temp',
    ],
  },
  {
    name: 'Lamps/Lights/Switches/Outlets',
    items: [
      'Lamp sockets',
      'Lamp shades',
      'Outlet wallplates',
      'Lights and fixtures',
      'Switches',
    ],
  },
  {
    name: 'TV and Radio',
    items: ['Tv working/reception ok', 'Tv Remote', 'Tv cable box secure'],
  },
  {
    name: 'Phones',
    items: ['Working/no static', 'Dialing instructions', 'All cords neat and Ok'],
  },
  {
    name: 'Window',
    items: ['Window Frame Paint/Clean', 'Window Clean', 'Outside appearance'],
  },
  {
    name: 'Front Door',
    items: ['Stains/Paint', 'Damage/Battery Ok', 'Check threshold'],
  },
  {
    name: 'Furniture',
    items: [
      'Art work secure and Ok',
      'Desk/chairs/table Ok',
      'Headboards secure',
      'Nightstands appearance',
      'Lamps functional',
      'Coat rack secure/hangers',
      'Tv, armoir, appearance Ok',
      'Bed mattress box/springs',
    ],
  },
  {
    name: 'Wall/Floor/Ceiling',
    items: ['Carpet Ok', 'Paint/vinyl Ok', 'Ceilings, appearance'],
  },
  {
    name: 'Drapes',
    items: ['Drapes/blackout secure', 'Hardware functional', 'Wands functional'],
  },
  {
    name: 'Doors',
    items: [
      'General appearance',
      'Handles, secure',
      'Electric Lock Reader Ok',
      'Lock mechanism',
      'Door chain/viewer/hinges',
      'Lock striker plate',
      'Door frame/connecting door',
      'Door Stop',
      'Door closer/threshold',
    ],
  },
  {
    name: 'Air leaks',
    items: ['Door light blackout', 'Window/sliding door seals', 'A/C Air, Lights Leaks'],
  },
  {
    name: 'Bathroom',
    items: [
      'Bathtub safety bars/mat/hardware',
      'Toilet flush valve',
      'Toilet seat',
      'Sink & tub drain plugs',
      'Shower & sink faucets',
      'Shower head',
      'Escutcheon plates',
      'Bathroom fan/lights',
      'Tub grout/toilet grout',
      'Mirror',
      'Hot Water Temperature',
    ],
  },
  {
    name: 'Smoke Detector',
    items: ['Visual check', 'Not damage', 'Light blinking'],
  },
]

// Best-effort seed room list, reconstructed from the paper log photos.
// Flagged for verification in the Settings > Rooms screen.
function floorRooms(hundreds) {
  const skip = new Set([9, 11, 17, 18, 20, 35])
  const rooms = []
  for (let n = 1; n <= 36; n++) {
    if (skip.has(n)) continue
    rooms.push(hundreds * 100 + n)
  }
  return rooms
}

export const SEED_ROOMS = [
  ...['101', '102'].map((n) => ({ roomNumber: n, floor: 1 })),
  ...floorRooms(2).map((n) => ({ roomNumber: String(n), floor: 2 })),
  ...floorRooms(3).map((n) => ({ roomNumber: String(n), floor: 3 })),
  ...floorRooms(4).map((n) => ({ roomNumber: String(n), floor: 4 })),
  ...floorRooms(5).map((n) => ({ roomNumber: String(n), floor: 5 })),
]
