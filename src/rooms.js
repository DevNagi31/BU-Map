// Room navigation database for BU campus map
// Floor codes: B/G = below grade, N = main/entry level, 2-9 = upper floors

export const FLOOR_INFO = {
  B: { label: 'Basement',        stairs: 'Head down to the basement level' },
  G: { label: 'Ground Floor',    stairs: 'Head down to the ground floor' },
  N: { label: 'Main Floor',      stairs: 'The room is on the main (entry) floor — no stairs needed' },
  1: { label: '1st Floor',       stairs: 'The room is on the 1st floor — no stairs needed' },
  2: { label: '2nd Floor',       stairs: 'Take the stairs or elevator up to the 2nd floor' },
  3: { label: '3rd Floor',       stairs: 'Take the stairs or elevator up to the 3rd floor' },
  4: { label: '4th Floor',       stairs: 'Take the stairs or elevator up to the 4th floor' },
  5: { label: '5th Floor',       stairs: 'Take the stairs or elevator up to the 5th floor' },
  6: { label: '6th Floor',       stairs: 'Take the elevator up to the 6th floor' },
  7: { label: '7th Floor',       stairs: 'Take the elevator up to the 7th floor' },
  8: { label: '8th Floor',       stairs: 'Take the elevator up to the 8th floor' },
  9: { label: '9th Floor',       stairs: 'Take the elevator up to the 9th floor' },
};

// Each room: { id, floor, type, desc }
// floor matches a key in FLOOR_INFO
export const ROOMS = {
  // ── Engineering Building ──────────────────────────────────────────────────
  EB: [
    { id: 'G01',  floor: 'G', type: 'lab',        desc: 'Machine shop / fabrication lab' },
    { id: 'G10',  floor: 'G', type: 'lab',        desc: 'Electronic systems lab' },
    { id: 'N01',  floor: 'N', type: 'auditorium', desc: 'Main lecture hall (~200 seats)' },
    { id: 'N06',  floor: 'N', type: 'classroom',  desc: 'Mid-size lecture room' },
    { id: 'N20',  floor: 'N', type: 'office',     desc: "Dean's Office — Watson School of Engineering" },
    { id: 'Q01',  floor: '2', type: 'lab',        desc: 'Computer Engineering lab' },
    { id: 'Q18',  floor: '2', type: 'office',     desc: 'Electrical & Computer Engineering dept.' },
    { id: 'R01',  floor: '3', type: 'lab',        desc: 'Systems Science research lab' },
    { id: 'R21',  floor: '3', type: 'office',     desc: 'ME / ISE faculty offices' },
    { id: 'S01',  floor: '4', type: 'lab',        desc: 'Advanced research lab' },
    { id: 'T23',  floor: '5', type: 'office',     desc: 'Department chair offices' },
  ],

  // ── Lecture Hall ─────────────────────────────────────────────────────────
  LH: [
    { id: 'G01',  floor: 'G', type: 'classroom',  desc: 'Seminar room' },
    { id: 'N001', floor: 'N', type: 'auditorium', desc: 'Main auditorium (~400 seats)' },
    { id: 'N002', floor: 'N', type: 'auditorium', desc: 'Auditorium B (~300 seats)' },
    { id: 'N003', floor: 'N', type: 'auditorium', desc: 'Auditorium C (~200 seats)' },
    { id: '201',  floor: '2', type: 'classroom',  desc: 'Upper-level classroom' },
    { id: '301',  floor: '3', type: 'classroom',  desc: 'Seminar room / small lecture' },
  ],

  // ── Science buildings ─────────────────────────────────────────────────────
  S1: [
    { id: 'B01',  floor: 'B', type: 'lab',       desc: 'Prep / stockroom' },
    { id: 'N01',  floor: 'N', type: 'classroom', desc: 'Large science classroom' },
    { id: '201',  floor: '2', type: 'lab',       desc: 'General chemistry lab' },
    { id: '301',  floor: '3', type: 'lab',       desc: 'Organic chemistry lab' },
    { id: '401',  floor: '4', type: 'lab',       desc: 'Biology research lab' },
    { id: '501',  floor: '5', type: 'office',    desc: 'Faculty research offices' },
  ],
  S2: [
    { id: 'B01',  floor: 'B', type: 'lab',       desc: 'Physics stockroom' },
    { id: 'N01',  floor: 'N', type: 'classroom', desc: 'Physics lecture room' },
    { id: '201',  floor: '2', type: 'lab',       desc: 'Physics lab — mechanics' },
    { id: '301',  floor: '3', type: 'lab',       desc: 'Physics lab — E&M' },
    { id: '401',  floor: '4', type: 'lab',       desc: 'Environmental studies lab' },
    { id: '501',  floor: '5', type: 'office',    desc: 'Physics department offices' },
  ],
  S3: [
    { id: 'N01',  floor: 'N', type: 'classroom', desc: 'Earth sciences classroom' },
    { id: '201',  floor: '2', type: 'lab',       desc: 'Geology / mineralogy lab' },
    { id: '301',  floor: '3', type: 'lab',       desc: 'Environmental science lab' },
    { id: '401',  floor: '4', type: 'office',    desc: 'Earth sciences faculty offices' },
  ],

  // ── Academic A & B ────────────────────────────────────────────────────────
  AA: [
    { id: 'G01',  floor: 'G', type: 'lab',        desc: 'PODS computing lab' },
    { id: 'G02',  floor: 'G', type: 'lab',        desc: 'PODS computing lab' },
    { id: 'N01',  floor: 'N', type: 'auditorium', desc: 'Large lecture hall' },
    { id: 'N101', floor: 'N', type: 'classroom',  desc: 'Classroom' },
    { id: '201',  floor: '2', type: 'office',     desc: 'School of Management offices' },
    { id: '301',  floor: '3', type: 'classroom',  desc: 'Seminar rooms' },
    { id: '401',  floor: '4', type: 'office',     desc: 'Kaschak Institute' },
  ],
  AB: [
    { id: 'G01',  floor: 'G', type: 'lab',       desc: 'Physical Therapy anatomy lab' },
    { id: 'N01',  floor: 'N', type: 'classroom', desc: 'Lecture room' },
    { id: '201',  floor: '2', type: 'office',    desc: 'Student Affairs Administration' },
    { id: '301',  floor: '3', type: 'office',    desc: 'Environmental Studies Program' },
    { id: '401',  floor: '4', type: 'office',    desc: 'Harriet Tubman Center' },
  ],

  // ── Fine Arts ─────────────────────────────────────────────────────────────
  FA: [
    { id: 'G01',  floor: 'G', type: 'studio',   desc: 'Sculpture studio' },
    { id: 'G02',  floor: 'G', type: 'lab',      desc: 'Darkroom / photography lab' },
    { id: 'N01',  floor: 'N', type: 'classroom',desc: 'Art history classroom' },
    { id: 'N02',  floor: 'N', type: 'studio',   desc: 'Painting studio' },
    { id: '201',  floor: '2', type: 'studio',   desc: '2D studio art space' },
    { id: '301',  floor: '3', type: 'studio',   desc: '3D / mixed media studio' },
    { id: '401',  floor: '4', type: 'office',   desc: 'Art & Music faculty offices' },
  ],

  // ── Anderson Center ───────────────────────────────────────────────────────
  AC: [
    { id: 'N01',  floor: 'N', type: 'theater', desc: 'Watters Theater (500-seat main stage)' },
    { id: 'N02',  floor: 'N', type: 'theater', desc: 'Osterhout Concert Theater' },
    { id: '201',  floor: '2', type: 'theater', desc: 'Chamber Hall (intimate recital space)' },
    { id: '301',  floor: '3', type: 'office',  desc: 'Theater & Music faculty offices' },
  ],

  // ── University Union ──────────────────────────────────────────────────────
  UU: [
    { id: 'B01',  floor: 'B', type: 'lounge',  desc: 'The Underground (events / lounge space)' },
    { id: 'N01',  floor: 'N', type: 'dining',  desc: 'Appalachian Dining' },
    { id: 'N02',  floor: 'N', type: 'lounge',  desc: 'Student lounge / game room' },
    { id: 'N03',  floor: 'N', type: 'office',  desc: 'Student Association offices' },
    { id: '201',  floor: '2', type: 'office',  desc: 'Student org offices & meeting rooms' },
    { id: '202',  floor: '2', type: 'studio',  desc: 'BingTV / WHRW radio studio' },
    { id: '301',  floor: '3', type: 'office',  desc: 'Dean of Students / Multicultural Resource Center' },
  ],

  // ── Libraries ─────────────────────────────────────────────────────────────
  LS: [
    { id: 'B01',  floor: 'B', type: 'stacks', desc: 'Remote storage / government documents' },
    { id: '101',  floor: '1', type: 'service',desc: 'Circulation & Reserve desk' },
    { id: '102',  floor: '1', type: 'lab',    desc: 'Research & Information Services' },
    { id: '201',  floor: '2', type: 'stacks', desc: 'General stacks — A–P call numbers' },
    { id: '301',  floor: '3', type: 'stacks', desc: 'General stacks — P–Z call numbers' },
    { id: '401',  floor: '4', type: 'lab',    desc: 'Microforms & media' },
    { id: '501',  floor: '5', type: 'room',   desc: 'Special Collections & Archives' },
    { id: '601',  floor: '6', type: 'stacks', desc: 'Upper stacks' },
    { id: '701',  floor: '7', type: 'room',   desc: 'Top-floor reading room' },
  ],
  LN: [
    { id: '101',  floor: '1', type: 'stacks', desc: 'Stacks / reading area' },
    { id: '201',  floor: '2', type: 'stacks', desc: 'Stacks / reading area' },
    { id: '301',  floor: '3', type: 'stacks', desc: 'Stacks / reading area' },
    { id: '401',  floor: '4', type: 'room',   desc: 'Reading room with campus views' },
    { id: '501',  floor: '5', type: 'room',   desc: 'Seminar / study room' },
    { id: '601',  floor: '6', type: 'room',   desc: 'Upper reading room' },
    { id: '701',  floor: '7', type: 'room',   desc: 'Research collection' },
    { id: '801',  floor: '8', type: 'room',   desc: 'Archival collection' },
    { id: '901',  floor: '9', type: 'room',   desc: 'Top-floor reading room — panoramic views' },
  ],

  // ── Athletics ─────────────────────────────────────────────────────────────
  GE: [
    { id: 'N01',  floor: 'N', type: 'gym',     desc: 'Main gymnasium / basketball courts' },
    { id: 'N02',  floor: 'N', type: 'fitness', desc: 'Cardio & weights fitness floor' },
    { id: 'N03',  floor: 'N', type: 'pool',    desc: 'Olympic-size swimming pool' },
    { id: '201',  floor: '2', type: 'court',   desc: 'Racquetball courts' },
    { id: '301',  floor: '3', type: 'office',  desc: 'Recreation Services admin' },
  ],
  EC: [
    { id: 'N01',  floor: 'N', type: 'arena',   desc: 'Main arena floor (6,000-seat)' },
    { id: 'N02',  floor: 'N', type: 'concourse',desc: 'Main concourse / ticketing' },
    { id: '201',  floor: '2', type: 'suite',   desc: 'Upper concourse / suites' },
    { id: '301',  floor: '3', type: 'office',  desc: 'Athletics administration' },
  ],

  // ── Administration ────────────────────────────────────────────────────────
  AD: [
    { id: 'N01',  floor: 'N', type: 'office', desc: "President's Office" },
    { id: 'N02',  floor: 'N', type: 'office', desc: "Provost's Office" },
    { id: '201',  floor: '2', type: 'office', desc: "Bursar's Office" },
    { id: '202',  floor: '2', type: 'office', desc: "Registrar's Office" },
    { id: '203',  floor: '2', type: 'office', desc: 'Financial Aid Office' },
  ],
};

// Parse a search query into { code, roomQuery } if it looks like "EB N06"
export function parseRoomQuery(query) {
  const upper = query.trim().toUpperCase();
  for (const code of Object.keys(ROOMS)) {
    if (upper.startsWith(code)) {
      const rest = upper.slice(code.length).replace(/^[\s-]+/, '');
      if (rest) return { code, roomQuery: rest };
    }
  }
  return null;
}
