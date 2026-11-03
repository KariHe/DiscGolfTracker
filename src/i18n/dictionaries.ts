const en = {
  tabs: { label: 'Main', home: 'Home', courses: 'Courses', players: 'Players', history: 'History' },
  language: { label: 'Language' },
  home: {
    appName: 'Disc Golf Tracker',
    title: 'Let’s play',
    noRound: 'No round in progress',
    headOut: 'Head out to the course',
    pickToStart: 'Pick a course, layout and players to start scoring.',
    startRound: 'Start a round',
    recentRounds: 'Recent rounds',
    seeAll: 'See all',
    noFinished: 'No finished rounds yet',
    roundInProgress: 'Round in progress',
    resumeRound: 'Resume round',
    players: (n: number) => (n === 1 ? '1 player' : `${n} players`),
    holeOf: (hole: number, count: number) => `Hole ${hole} of ${count}`,
    holesComplete: (done: number, count: number) => `${done} of ${count} holes complete`,
  },
}

export type Dictionary = typeof en

const fi: Dictionary = {
  tabs: { label: 'Päävalikko', home: 'Koti', courses: 'Radat', players: 'Pelaajat', history: 'Historia' },
  language: { label: 'Kieli' },
  home: {
    appName: 'Disc Golf Tracker',
    title: 'Pelataan',
    noRound: 'Ei käynnissä olevaa kierrosta',
    headOut: 'Suuntaa radalle',
    pickToStart: 'Valitse rata, layout ja pelaajat aloittaaksesi pisteiden kirjauksen.',
    startRound: 'Aloita kierros',
    recentRounds: 'Viimeisimmät kierrokset',
    seeAll: 'Näytä kaikki',
    noFinished: 'Ei vielä päättyneitä kierroksia',
    roundInProgress: 'Kierros käynnissä',
    resumeRound: 'Jatka kierrosta',
    players: (n) => (n === 1 ? '1 pelaaja' : `${n} pelaajaa`),
    holeOf: (hole, count) => `Väylä ${hole}/${count}`,
    holesComplete: (done, count) => `${done}/${count} väylää pelattu`,
  },
}

export const languages = { en, fi }
export type Language = keyof typeof languages
export const languageNames: Record<Language, string> = { en: 'English', fi: 'Suomi' }
