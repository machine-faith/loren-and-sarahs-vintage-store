export interface LabelTarget {
  id: string;
  name: string;
  labelName: string;
  email: string;
  secondaryEmail?: string;
  territory: 'Europe' | 'USA' | 'New Zealand' | 'Japan' | 'South America' | 'Global';
  location: string;
  salutation: string;
  notes: string;
  connection: string;
  status: 'pending' | 'drafted' | 'scheduled' | 'sent' | 'replied';
  hasReleasedGeeTee?: boolean;
  customSubject?: string;
  customBody?: string;
}

export const INITIAL_LABEL_TARGETS: LabelTarget[] = [
  {
    id: 'lbl-goodbye-boozy',
    name: 'Gabriele Di Gregorio',
    labelName: 'Goodbye Boozy Records',
    email: 'goodbyeboozy@tin.it',
    secondaryEmail: 'gabriele.digregorio3@virgilio.it',
    territory: 'Europe',
    location: 'San Salvo, Italy',
    salutation: 'Hey Gabriele,',
    notes: 'Legendary Italian garage/punk label. Released multiple Gee Tee LPs/7"s, RMFC / Set-Top Box split, Tee Vee Repairmann, Snooper.',
    connection: 'Frequent home for Michael Barker (Gee Tee / RMFC)',
    hasReleasedGeeTee: true,
    status: 'pending'
  },
  {
    id: 'lbl-total-punk',
    name: 'Rich Evans',
    labelName: 'Total Punk Records',
    email: 'floridasdyingrecords@gmail.com',
    territory: 'USA',
    location: 'Portland, OR / Florida, USA',
    salutation: 'Hey Rich,',
    notes: 'Released Gee Tee and distributes Australian punk/garage. Very direct, loves raw tunes and straight talk.',
    connection: 'Released Gee Tee & distributes RMFC',
    hasReleasedGeeTee: true,
    status: 'pending'
  },
  {
    id: 'lbl-goner',
    name: 'Zac Ives & Eric Friedl',
    labelName: 'Goner Records',
    email: 'records@goner-records.com',
    secondaryEmail: 'gonershop@gmail.com',
    territory: 'USA',
    location: 'Memphis, TN, USA',
    salutation: 'Hey Zac & Eric,',
    notes: 'Organizers of Gonerfest. Released Gee Tee\'s "Goodnight Neanderthal" and "Prehistoric Chrome".',
    connection: 'Released Gee Tee LPs & champions Aus garage',
    hasReleasedGeeTee: true,
    status: 'pending'
  },
  {
    id: 'lbl-in-the-red',
    name: 'Larry Hardy',
    labelName: 'In The Red Records',
    email: 'igor@intheredrecords.com',
    territory: 'USA',
    location: 'Los Angeles, CA, USA',
    salutation: 'Hey Larry,',
    notes: 'Legendary garage punk label (The Scientists, Cosmic Psychos, Thee Oh Sees, Ty Segall). Correspondence handled via Igor / direct inbox.',
    connection: 'Major champion of Australian garage rock',
    status: 'pending'
  },
  {
    id: 'lbl-ett',
    name: 'Christian Busch',
    labelName: 'Erste Theke Tonträger (ETT)',
    email: 'Vaukajott@gmx.de',
    territory: 'Europe',
    location: 'Germany',
    salutation: 'Hey Christian,',
    notes: 'Key German DIY punk label. Released RMFC "Hive Volumes 1 & 2", Gee Tee, Research Reactor Corp.',
    connection: 'Released RMFC LP & core European hub for egg-punk/garage',
    hasReleasedGeeTee: true,
    status: 'pending'
  },
  {
    id: 'lbl-alien-snatch',
    name: 'Daniel Bender',
    labelName: 'Alien Snatch! Records',
    email: 'support@aliensnatch.com',
    secondaryEmail: 'mail@aliensnatch.de',
    territory: 'Europe',
    location: 'Berlin, Germany',
    salutation: 'Hey Daniel,',
    notes: 'Long-running Berlin garage rock, power pop, and punk label. Big supporter of Australian garage acts.',
    connection: 'Extensive European distro & mailorder',
    status: 'pending'
  },
  {
    id: 'lbl-drunken-sailor',
    name: 'Julian',
    labelName: 'Drunken Sailor Records',
    email: 'drunkensailorrecs@gmail.com',
    territory: 'Europe',
    location: 'Leeds, UK',
    salutation: 'Hey Julian,',
    notes: 'Premier UK DIY punk/garage label. Distributes and presses Australian garage & post-punk across the UK.',
    connection: 'Key UK tour and distro partner',
    status: 'pending'
  },
  {
    id: 'lbl-bachelor',
    name: 'Lukas ("Luki")',
    labelName: 'Bachelor Records',
    email: 'bachelorrecords@gmail.com',
    territory: 'Europe',
    location: 'Austria',
    salutation: 'Hey Lukas,',
    notes: 'Austrian powerhouse for 60s garage pop, budget rock, and garage punk 7"s and LPs.',
    connection: 'Passionate DIY European vinyl label',
    status: 'pending'
  },
  {
    id: 'lbl-feel-it',
    name: 'Sam Richardson',
    labelName: 'Feel It Records',
    email: 'feelitrecordshop@gmail.com',
    territory: 'USA',
    location: 'Richmond, VA / Cleveland, OH, USA',
    salutation: 'Hey Sam,',
    notes: 'Major US distributor and label for RMFC ("Access" 7"), Sweeping Promises, The Toads.',
    connection: 'US distro home for RMFC releases',
    status: 'pending'
  },
  {
    id: 'lbl-slovenly',
    name: 'Pete Slovenly & Joe',
    labelName: 'Slovenly Recordings',
    email: 'djbazookajoe@slovenly.com',
    secondaryEmail: 'info@slovenly.com',
    territory: 'Global',
    location: 'USA / Spain / Netherlands',
    salutation: 'Hey Pete & Joe,',
    notes: 'Global garage rock empire with warehouses in USA and Europe. Co-releases and tours international acts.',
    connection: 'Bridges both Europe and USA distribution',
    status: 'pending'
  },
  {
    id: 'lbl-flying-nun',
    name: 'Ben Howe',
    labelName: 'Flying Nun Records',
    email: 'ben@flyingnun.co.nz',
    secondaryEmail: 'enquiries@flyingnun.co.nz',
    territory: 'New Zealand',
    location: 'Auckland / Wellington, New Zealand',
    salutation: 'Hey Ben,',
    notes: 'Legendary New Zealand indie/jangle/pop label (The Clean, The Chills, Bats, Vera Ellen). Huge sonic kinship with Love Banana.',
    connection: 'Dunedin Sound & Trans-Tasman jangle pop kindred spirit',
    status: 'pending'
  },
  {
    id: 'lbl-1-12',
    name: 'Kim Martinengo & David Perry',
    labelName: '1:12 Records',
    email: 'kim@1to12records.com',
    secondaryEmail: '1to12records@gmail.com',
    territory: 'New Zealand',
    location: 'Auckland, New Zealand',
    salutation: 'Hey Kim, David & 1:12 team,',
    notes: 'Auckland premier DIY garage rock, punk, and rock & roll record label.',
    connection: 'Champions Australasian underground garage punk',
    status: 'pending'
  },
  {
    id: 'lbl-sunreturn',
    name: 'Zac Arnold',
    labelName: 'Sunreturn',
    email: 'zac@sunreturn.nz',
    territory: 'New Zealand',
    location: 'Auckland, New Zealand',
    salutation: 'Hey Zac,',
    notes: 'Auckland independent label championing alternative guitar pop and post-punk.',
    connection: 'Key NZ indie/guitar pop tastemaker',
    status: 'pending'
  },
  {
    id: 'lbl-big-love',
    name: 'Masashi Naka & Haruka',
    labelName: 'Big Love Records',
    email: 'order@bigloverecords.jp',
    secondaryEmail: 'info@bigloverecords.jp',
    territory: 'Japan',
    location: 'Harajuku, Tokyo, Japan',
    salutation: 'Hey Masashi & Haruka,',
    notes: 'The most influential independent record store and boutique vinyl label in Tokyo. Huge champions of international weirdo garage, punk, and guitar pop.',
    connection: 'Tokyo cultural epicenter for underground vinyl and indie rock',
    status: 'pending'
  },
  {
    id: 'lbl-waterslide',
    name: 'Kawa-san',
    labelName: 'Waterslide Records',
    email: 'info@watersliderecords.com',
    territory: 'Japan',
    location: 'Tokyo, Japan',
    salutation: 'Hey Kawa-san,',
    notes: 'The premier Japanese indie label for melodic garage pop, power pop, and scuzzy guitar bands. Regularly releases and distributes Australian acts.',
    connection: 'Top Japanese distributor for upbeat garage pop and indie punk',
    status: 'pending'
  },
  {
    id: 'lbl-stiff-slack',
    name: 'Keishi Shinjo',
    labelName: 'Stiff Slack Records',
    email: 'info@stiffslack.com',
    territory: 'Japan',
    location: 'Nagoya / Tokyo, Japan',
    salutation: 'Hey Keishi,',
    notes: 'Legendary Japanese independent guitar rock label, live venue, and import record shop.',
    connection: 'Historic hub for international independent guitar bands in Japan',
    status: 'pending'
  },
  {
    id: 'lbl-laja',
    name: 'Fabiano Mozine',
    labelName: 'Laja Records',
    email: 'lajarex@uol.com.br',
    territory: 'South America',
    location: 'Vila Velha / Vitória, Brazil',
    salutation: 'Hey Fabiano,',
    notes: 'Legendary Brazilian DIY garage punk, rock & roll, and surf label active since the 90s. Presses vinyl and tapes for wild guitar bands worldwide.',
    connection: 'Premier South American underground garage rock and punk outpost',
    status: 'pending'
  },
  {
    id: 'lbl-laptra',
    name: 'Laptra Collective',
    labelName: 'Discos Laptra',
    email: 'discoslaptra@gmail.com',
    secondaryEmail: 'contacto@laptra.com.ar',
    territory: 'South America',
    location: 'Buenos Aires / La Plata, Argentina',
    salutation: 'Hey Laptra crew,',
    notes: 'The flagship DIY garage pop and indie rock collective in Argentina (El Mato, Bestia Bebe). Huge affinity for catchy, scuzzy guitar pop.',
    connection: 'Core Argentine home for melodic indie/garage rock',
    status: 'pending'
  },
  {
    id: 'lbl-nada-nada',
    name: 'Nada Nada team',
    labelName: 'Nada Nada Discos',
    email: 'contato@nadanadadiscos.com',
    territory: 'South America',
    location: 'São Paulo, Brazil',
    salutation: 'Hey Nada Nada team,',
    notes: 'Iconic underground record shop and label in São Paulo specializing in raw punk, garage, and DIY vinyl.',
    connection: 'Essential Brazilian vinyl hub for independent punk and garage',
    status: 'pending'
  },
  {
    id: 'lbl-damaged-goods',
    name: 'Ian Ballard',
    labelName: 'Damaged Goods Records',
    email: 'info@damagedgoods.co.uk',
    territory: 'Europe',
    location: 'London, UK',
    salutation: 'Hey Ian,',
    notes: 'Legendary UK garage punk and rock & roll label since 1988 (Billy Childish, Thee Headcoats, Manic Street Preachers).',
    connection: 'Flagship UK home for scuzzy garage rock & roll and punk vinyl',
    status: 'pending'
  },
  {
    id: 'lbl-lavidaesunmus',
    name: 'Paco',
    labelName: 'La Vida Es Un Mus Discos',
    email: 'paco@lavidaesunmus.com',
    territory: 'Europe',
    location: 'Hackney, London, UK',
    salutation: 'Hey Paco,',
    notes: 'One of the most revered underground punk labels in the world (The Chisel, Chubby & The Gang, Rata Negra).',
    connection: 'London underground DIY punk powerhouse with deep global respect',
    status: 'pending'
  },
  {
    id: 'lbl-sweet-time',
    name: 'Ryan Sweeney',
    labelName: 'Sweet Time Records',
    email: 'sweettimerecords@gmail.com',
    territory: 'USA',
    location: 'Nashville, TN, USA',
    salutation: 'Hey Ryan,',
    notes: 'Run by Ryan Sweeney (ex-Cheap Time drummer). Nashville garage rock & punk label behind Sweet Time RNR Comp.',
    connection: 'Premier Nashville garage punk label with close ties to the scene',
    status: 'pending'
  },
  {
    id: 'lbl-nailbiter',
    name: 'Erik Hart (Erik Nervous)',
    labelName: 'Nailbiter Records',
    email: 'nailbiterrecs@gmail.com',
    territory: 'USA',
    location: 'Indiana / Midwest, USA',
    salutation: 'Hey Erik,',
    notes: 'Released Gee Tee "Prehistoric Chrome" LP, Liquids, and Erik Nervous. Direct collaborator with Michael Barker.',
    connection: 'Direct collaborator with Michael Barker / Gee Tee in the US Midwest',
    hasReleasedGeeTee: true,
    status: 'pending'
  },
  {
    id: 'lbl-crypt-wizard',
    name: 'Charlie Woolley',
    labelName: 'Crypt of the Wizard',
    email: 'charlie@cryptofthewizard.com',
    territory: 'Europe',
    location: 'Hackney, London, UK',
    salutation: 'Hey Charlie,',
    notes: 'Cult London record shop and boutique label specializing in underground rock & roll, psych, and heavy vinyl.',
    connection: 'Key East London record shop and physical vinyl tastemaker',
    status: 'pending'
  },
  {
    id: 'lbl-sacred-bones',
    name: 'Caleb Braaten',
    labelName: 'Sacred Bones Records',
    email: 'caleb@sacredbonesrecords.com',
    secondaryEmail: 'info@sacredbonesrecords.com',
    territory: 'USA',
    location: 'Brooklyn, NY, USA',
    salutation: 'Hey Caleb,',
    notes: 'Iconic Brooklyn independent label for dark post-punk, weirdo psych, and cult indie rock (Institute, The Men).',
    connection: 'Prestige American indie label with major vinyl reach',
    status: 'pending'
  },
  {
    id: 'lbl-whats-your-rupture',
    name: 'Kevin Pedersen',
    labelName: "What's Your Rupture?",
    email: 'whatsyourrupture@gmail.com',
    territory: 'USA',
    location: 'Brooklyn, NY, USA',
    salutation: 'Hey Kevin,',
    notes: 'Legendary label that released Royal Headache, Parquet Courts, and early Amyl and the Sniffers in the US.',
    connection: 'Major champion of Australian garage rock & post-punk in America',
    status: 'pending'
  },
  {
    id: 'lbl-sub-pop',
    name: 'Sub Pop A&R Team',
    labelName: 'Sub Pop Records',
    email: 'demos@subpop.com',
    territory: 'USA',
    location: 'Seattle, WA, USA',
    salutation: 'Hey Sub Pop team,',
    notes: 'Legendary independent label (Nirvana, Mudhoney, Metz). Official submission policy accepts streaming links only.',
    connection: 'Historic US independent powerhouse with global distribution',
    status: 'pending'
  },
  {
    id: 'lbl-rough-trade',
    name: 'Geoff Travis & A&R Team',
    labelName: 'Rough Trade Records',
    email: 'info@roughtraderecords.com',
    territory: 'Europe',
    location: 'London, UK',
    salutation: 'Hey Rough Trade team,',
    notes: 'Pioneering UK independent label (The Smiths, The Strokes, Amyl and the Sniffers UK/EU). Beggars Group backing.',
    connection: 'Preeminent UK independent guitar tastemaker',
    status: 'pending'
  }
];

export function buildLabelPitch(
  target: LabelTarget,
  customMaster?: { subject?: string; body?: string }
): { subject: string; body: string } {
  const isGeeTeeLabel = Boolean(target.hasReleasedGeeTee);

  const defaultSubject = isGeeTeeLabel
    ? `Love Banana / debut LP (Michael Barker recommended we get in touch)`
    : `Love Banana / debut LP 'Any Direction' (Sydney garage pop)`;

  const connectionLine = isGeeTeeLabel
    ? `Michael Barker (Gee Tee / RMFC) is putting out our debut album 'Any Direction' here in Australia on his label Ragnar Records, and he pointed us in your direction to see if you'd be interested in teaming up on an overseas physical release.`
    : `Our debut album 'Any Direction' is coming out here in Australia on Ragnar Records (run by Michael Barker of Gee Tee / RMFC), and we're getting in touch to see if you might be interested in hearing the tunes for your label.`;

  const firstName = target.name.split(' ')[0] || target.name;

  if (customMaster && (customMaster.body || customMaster.subject)) {
    let sub = customMaster.subject || defaultSubject;
    let b = customMaster.body || '';

    // Replace common label tokens
    const replacements: Record<string, string> = {
      '{{salutation}}': target.salutation,
      '{{label_name}}': target.labelName,
      '{{outlet}}': target.labelName,
      '{{name}}': target.name,
      '{{first_name}}': firstName,
      '{{connection_line}}': connectionLine,
      '{{connection}}': target.connection,
      '{{location}}': target.location,
      '{{territory}}': target.territory,
      '{{city}}': target.location.split(',')[0].trim(),
      '{{country}}': target.location.split(',').pop()?.trim() || target.territory,
    };

    for (const [token, val] of Object.entries(replacements)) {
      sub = sub.split(token).join(val);
      b = b.split(token).join(val);
    }

    // If template starts with a standard salutation placeholder, format nicely
    if (b.startsWith('Hey ') || b.startsWith('Hi ')) {
      b = b.replace(/^(Hey|Hi)\s+[^,\n]+,/i, target.salutation);
    }

    return { subject: sub, body: b };
  }

  const body = `${target.salutation}

Reaching out from Sydney, Australia. I sing and play guitar in Love Banana, a five-piece garage pop band.

${connectionLine}

We're doing our digital release ourselves, but we're looking for an indie label partner to team up on a physical release (vinyl / tape) over your way. In Australia, Michael is pressing the records, sorting us with band copies for shows, and keeping the sales from the run. We'd love to do something similar over there to get the record into local shops and into people's hands.

The album has 13 tracks and was mastered by Mikey Young. We don't have a locked release date for the full album yet because we want to coordinate with our physical partners. The digital rollout starts with our first single "Seagull" dropping on September 16, followed by our second single "Fit For Motion" alongside an official music video.

On the live side, we're taking this global to back the record: we've already begun booking a European tour for October 2027, and we're currently putting together an American tour as well. Over here in Australia we've supported Ty Segall, Babe Rainbow, and Bananagun, and our debut 7" went to #3 on the Australian AIR indie charts.

You can stream the unreleased record and check out our links here:

Advance LP Stream: https://love-banana-epk.vercel.app/album.html
Lead Single ("Seagull" WAV Master): https://love-banana-epk.vercel.app/downloads/Love%20Banana%20-%20Seagull.wav
Band EPK: https://love-banana-epk.vercel.app/epk.html
Bandcamp: https://lovebanana.bandcamp.com/
Instagram: https://www.instagram.com/lovebanarna/

Give the album stream a listen when you have a minute and let us know if you think this could be a fit for your roster. No stress either way, really appreciate your time.

Cheers,
Henry Collins
Love Banana
lovebananaband@gmail.com`;

  return { subject: defaultSubject, body };
}
