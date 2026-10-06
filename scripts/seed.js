// Fills an empty database with the sample days from the original design.
// Usage: npm run seed

import * as db from '../src/db.js';

const SAMPLE_DAYS = {
  '2025-10-04': ['flight', 'black', 'Trip to Rome'],
  '2025-10-12': ['flight', 'black', 'Back'],
  '2025-11-08': ['person', 'black', 'Met Clara'],
  '2025-11-27': ['restaurant', 'orange', 'Thanksgiving'],
  '2025-12-20': ['ac_unit', 'blue', 'First snow'],
  '2025-12-25': ['celebration', 'red', 'Christmas'],
  '2026-01-01': ['celebration', 'orange', 'New Year'],
  '2026-01-02': ['flight', 'black', 'Flight to Lisbon'],
  '2026-01-03': ['rainy', 'gray', 'Rain all day'],
  '2026-01-11': ['person', 'black', 'Coffee with Leo'],
  '2026-01-18': ['star', 'black', 'First 10k'],
  '2026-01-27': ['cake', 'red', 'Mom’s birthday'],
  '2026-02-06': ['flight', 'black', 'Back home'],
  '2026-02-14': ['favorite', 'red', 'Valentine’s dinner'],
  '2026-02-21': ['ac_unit', 'blue', 'Snow'],
  '2026-03-04': ['call', 'black', 'Call with Sam'],
  '2026-03-09': ['thunderstorm', 'blue', 'Storm'],
  '2026-03-10': ['thunderstorm', 'blue', 'Storm'],
  '2026-03-11': ['thunderstorm', 'blue', 'Storm'],
  '2026-03-22': ['directions_run', 'green', 'Half marathon'],
  '2026-04-05': ['flight', 'black', 'Trip to Kyoto'],
  '2026-04-12': ['local_florist', 'red', 'Cherry blossoms'],
  '2026-04-19': ['flight', 'black', 'Return'],
  '2026-05-02': ['credit_card', 'yellow', 'New laptop'],
  '2026-05-16': ['music_note', 'black', 'Concert'],
  '2026-05-30': ['sunny', 'orange', 'First beach day'],
  '2026-06-08': ['work', 'black', 'New job starts'],
  '2026-06-21': ['sunny', 'orange', 'Longest day'],
  '2026-06-27': ['rainy', 'blue', 'Rain'],
  '2026-07-03': ['call', 'black', 'Meet Ana'],
  '2026-07-14': ['flag', 'red', 'Team offsite'],
  '2026-07-25': ['flight', 'black', 'Summer trip'],
  '2026-08-02': ['beach_access', 'orange', 'Beach'],
  '2026-08-09': ['flight', 'black', 'Back'],
  '2026-08-18': ['flag', 'green', 'Project shipped'],
  '2026-08-29': ['star', 'red', 'Promotion'],
  '2026-09-06': ['pets', 'black', 'Adopted Miso'],
  '2026-09-13': ['local_hospital', 'red', 'Dentist'],
  '2026-09-20': ['hiking', 'green', 'Hike'],
  '2026-09-26': ['person', 'black', 'Dinner at Clara’s'],
};

const SAMPLE_JOURNAL = {
  '2026-09-26': {
    title: 'Dinner at Clara’s',
    body: [
      '## The table',
      'Clara made **saffron risotto**, too much of it, which was perfect.',
      '',
      '- Leo finally met Ana',
      '- Talked about the *Berlin* trip',
      '- Walked home the long way',
      '',
      '> Remember to send her the photos.',
    ].join('\n'),
  },
};

if (db.listDays().length > 0) {
  console.log('The database already has days in it, so nothing was seeded.');
  process.exit(0);
}

for (const [date, [icon, color, label]] of Object.entries(SAMPLE_DAYS)) {
  db.saveDay(date, { icon, color, label });
}
for (const [date, entry] of Object.entries(SAMPLE_JOURNAL)) {
  db.saveJournal(date, entry);
}

console.log(`Seeded ${Object.keys(SAMPLE_DAYS).length} days and ${Object.keys(SAMPLE_JOURNAL).length} journal entry.`);
