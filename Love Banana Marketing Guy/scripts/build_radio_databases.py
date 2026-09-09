import csv
import json
import os

EMAIL_STATIONS = [
    # --- NSW & ACT ---
    {
        "callsign": "2FBI",
        "name": "FBi Radio 94.5FM",
        "state": "NSW",
        "city": "Sydney",
        "postcode": "2016",
        "pitch_category": "Sydney Local",
        "contact_role": "Music Director / Music Team",
        "email": "music@fbiradio.com",
        "website": "http://fbi.radio",
        "genre_fit": "Indie Pop, Garage Rock, Post-Punk, Sydney Local",
        "pitch_notes": "Primary Sydney indie/youth champion. Loves local Sydney bands. Mention Sydney gigs (Ty Segall, Babe Rainbow) and Mikey Young mastering."
    },
    {
        "callsign": "2SER",
        "name": "2SER 107.3FM",
        "state": "NSW",
        "city": "Sydney",
        "postcode": "2007",
        "pitch_category": "Sydney Local",
        "contact_role": "Music Department",
        "email": "music@2ser.com",
        "website": "http://www.2ser.com",
        "genre_fit": "Alternative, Indie Rock, Pop, Local Sydney",
        "pitch_notes": "UTS / Macquarie station. Huge supporter of Sydney indie and Australian underground. Already played earlier Love Banana material."
    },
    {
        "callsign": "2RSR",
        "name": "Radio Skid Row 88.9FM",
        "state": "NSW",
        "city": "Sydney (Marrickville)",
        "postcode": "2204",
        "pitch_category": "Sydney Local",
        "contact_role": "Station & Programming Coordinator",
        "email": "stationmanager@skidrow.com.au",
        "website": "https://radioskidrow.org",
        "genre_fit": "Inner-West DIY, Punk, Alternative, Community",
        "pitch_notes": "Inner-West Sydney community powerhouse based in Marrickville. Deep connection to DIY and local grassroots indie music."
    },
    {
        "callsign": "2RES",
        "name": "89.7 Eastside Radio",
        "state": "NSW",
        "city": "Sydney (Paddington)",
        "postcode": "2021",
        "pitch_category": "Sydney Local",
        "contact_role": "Music Coordinator",
        "email": "music@eastsidefm.org",
        "website": "http://www.eastsidefm.org",
        "genre_fit": "Eclectic Indie, Blues, Soul, Pop, Local",
        "pitch_notes": "Eastern suburbs Sydney station. Plays eclectic local sounds and supports independent Sydney songwriters."
    },
    {
        "callsign": "2SWR",
        "name": "SWR 99.9 FM",
        "state": "NSW",
        "city": "Sydney (Blacktown/Doonside)",
        "postcode": "2767",
        "pitch_category": "Sydney Local",
        "contact_role": "Music Director",
        "email": "music@swr999.com.au",
        "website": "https://www.swr999.com.au/",
        "genre_fit": "General, Rock, Indie, Local Aussie",
        "pitch_notes": "Western Sydney community radio with dedicated Aussie music programs."
    },
    {
        "callsign": "2GLF",
        "name": "89.3 2GLF",
        "state": "NSW",
        "city": "Sydney (Liverpool)",
        "postcode": "2170",
        "pitch_category": "Sydney Local",
        "contact_role": "Music Department",
        "email": "music@893fm.com.au",
        "website": "http://www.893fm.com.au",
        "genre_fit": "General, Local Artists, Indie",
        "pitch_notes": "South-West Sydney community broadcaster. Welcomes music from independent Sydney artists."
    },
    {
        "callsign": "2NSB",
        "name": "Northside Radio 99.3FM",
        "state": "NSW",
        "city": "Sydney (Chatswood)",
        "postcode": "2067",
        "pitch_category": "Sydney Local",
        "contact_role": "Music Coordinator",
        "email": "music@northsideradio.com.au",
        "website": "http://northsideradio.com.au/",
        "genre_fit": "Indie, Rock, Pop, Contemporary",
        "pitch_notes": "Northern suburbs Sydney station covering Chatswood to the Hawkesbury."
    },
    {
        "callsign": "2MWM",
        "name": "Radio Northern Beaches",
        "state": "NSW",
        "city": "Sydney (Belrose/Manly)",
        "postcode": "2085",
        "pitch_category": "Sydney Local",
        "contact_role": "Music Submissions Team",
        "email": "music@rnb.org.au",
        "website": "http://www.rnb.org.au",
        "genre_fit": "Garage Rock, Surf Rock, Indie, Local",
        "pitch_notes": "Northern Beaches Sydney station. Surf/garage rock sound is a natural match for local presenters."
    },
    {
        "callsign": "2SSR",
        "name": "2SSR 99.7 FM",
        "state": "NSW",
        "city": "Sydney (Sutherland)",
        "postcode": "1499",
        "pitch_category": "Sydney Local",
        "contact_role": "Music Director",
        "email": "music@2ssr.com.au",
        "website": "https://www.2ssr.com.au",
        "genre_fit": "General, Aussie Music, Rock, Pop",
        "pitch_notes": "The Shire / Sutherland Shire community radio station. Regular Australian music focus."
    },
    {
        "callsign": "2HHH",
        "name": "Triple H 100.1 FM",
        "state": "NSW",
        "city": "Sydney (Hornsby/Ku-ring-gai)",
        "postcode": "2077",
        "pitch_category": "Sydney Local",
        "contact_role": "Music Team",
        "email": "music@triplehfm.com.au",
        "website": "http://www.triplehfm.com.au",
        "genre_fit": "General, Indie, Local, Rock",
        "pitch_notes": "Community station in Northern Sydney. Has several specialist alternative and Aussie rock shows."
    },
    {
        "callsign": "2RDJ",
        "name": "2RDJ FM 88.1",
        "state": "NSW",
        "city": "Sydney (Burwood)",
        "postcode": "2134",
        "pitch_category": "Sydney Local",
        "contact_role": "Programming & Music",
        "email": "info@radio2rdj.com",
        "website": "http://www.radio2rdj.com",
        "genre_fit": "General, Community, Local",
        "pitch_notes": "Inner West Sydney local station."
    },
    {
        "callsign": "Connect FM",
        "name": "Connect FM 100.9",
        "state": "NSW",
        "city": "Sydney (Padstow/Bankstown)",
        "postcode": "2211",
        "pitch_category": "Sydney Local",
        "contact_role": "Station Management",
        "email": "info@connectfm.au",
        "website": "https://www.connectfm.au/",
        "genre_fit": "General, Contemporary, Local",
        "pitch_notes": "Canterbury-Bankstown community broadcaster."
    },
    {
        "callsign": "2BBB",
        "name": "2BBB 93.3FM",
        "state": "NSW",
        "city": "Bellingen",
        "postcode": "2454",
        "pitch_category": "Australia National",
        "contact_role": "Music Director",
        "email": "music@2bbb.net.au",
        "website": "http://www.2bbb.net.au/",
        "genre_fit": "Eclectic, Indie Rock, Roots, Folk, Pop",
        "pitch_notes": "Bellingen Mid North Coast community radio. Very receptive to indie bands touring the east coast."
    },
    {
        "callsign": "2NUR",
        "name": "2NURFM 103.7",
        "state": "NSW",
        "city": "Newcastle",
        "postcode": "2308",
        "pitch_category": "Australia National",
        "contact_role": "Music Coordinator",
        "email": "music@2nurfm.com.au",
        "website": "http://www.2nurfm.com.au",
        "genre_fit": "Classic Hits, Indie, Contemporary Australian",
        "pitch_notes": "University of Newcastle community station. Big reach across Newcastle and the Hunter."
    },
    {
        "callsign": "2CCC",
        "name": "Coast FM 96.3",
        "state": "NSW",
        "city": "Gosford (Central Coast)",
        "postcode": "2250",
        "pitch_category": "Australia National",
        "contact_role": "Music Department",
        "email": "music@coastfm.org.au",
        "website": "http://www.coastfm.org.au",
        "genre_fit": "General, Australian Music, Indie Pop",
        "pitch_notes": "Central Coast community broadcaster. Supports touring NSW bands."
    },
    {
        "callsign": "2CHY",
        "name": "104.1 CHY FM",
        "state": "NSW",
        "city": "Coffs Harbour",
        "postcode": "2450",
        "pitch_category": "Australia National",
        "contact_role": "Station Manager / Music Team",
        "email": "info@chyfm.org.au",
        "website": "https://www.chyfm.org.au",
        "genre_fit": "Youth, Indie, Pop, Alternative",
        "pitch_notes": "Dedicated youth community radio station in Coffs Harbour. Perfect demographic for Love Banana."
    },
    {
        "callsign": "2MCE",
        "name": "2MCE 92.3 & 94.7FM",
        "state": "NSW",
        "city": "Bathurst & Orange",
        "postcode": "2795",
        "pitch_category": "Australia National",
        "contact_role": "Music Director / Station Team",
        "email": "2mce@csu.edu.au",
        "website": "https://2mce.org/",
        "genre_fit": "Educational, Alternative, Indie, Pop",
        "pitch_notes": "Charles Sturt University station broadcasting to Central West NSW. Great indie programming."
    },
    {
        "callsign": "2WKT",
        "name": "Highland FM 107.1",
        "state": "NSW",
        "city": "Bowral (Southern Highlands)",
        "postcode": "2576",
        "pitch_category": "Australia National",
        "contact_role": "Music Director",
        "email": "music@highlandfm.org.au",
        "website": "http://www.highlandfm.org.au",
        "genre_fit": "Indie, Contemporary, Local Australian",
        "pitch_notes": "Known for their 100% Homegrown Australian music showcases and artist interviews."
    },
    {
        "callsign": "2BLU",
        "name": "Radio Blue Mountains 89.1",
        "state": "NSW",
        "city": "Wentworth Falls",
        "postcode": "2782",
        "pitch_category": "Australia National",
        "contact_role": "Station Coordinator",
        "email": "manager@rbm.org.au",
        "website": "http://www.rbm.org.au",
        "genre_fit": "Alternative, Rock, Community, Eclectic",
        "pitch_notes": "Blue Mountains regional station. Very supportive of NSW indie acts."
    },
    {
        "callsign": "2VOX",
        "name": "VOX FM 106.9",
        "state": "NSW",
        "city": "Wollongong",
        "postcode": "2500",
        "pitch_category": "Australia National",
        "contact_role": "Music Submissions",
        "email": "voxfm@voxfm.org.au",
        "website": "http://www.voxfm.org.au",
        "genre_fit": "General, Alternative, Community",
        "pitch_notes": "Illawarra community radio station. Active music programming."
    },
    {
        "callsign": "2HWK",
        "name": "Pulse FM 89.9",
        "state": "NSW",
        "city": "Wollongong",
        "postcode": "2500",
        "pitch_category": "Australia National",
        "contact_role": "Music Submissions",
        "email": "info@pulse899fm.com.au",
        "website": "https://pulse899fm.com.au/",
        "genre_fit": "Youth, Contemporary, Indie, Pop",
        "pitch_notes": "Wollongong youth/contemporary station."
    },
    {
        "callsign": "2UUU",
        "name": "Triple U FM 104.5",
        "state": "NSW",
        "city": "Nowra (Shoalhaven)",
        "postcode": "2541",
        "pitch_category": "Australia National",
        "contact_role": "Station Administration",
        "email": "admin@tripleu.org.au",
        "website": "https://www.tripleu.org.au/",
        "genre_fit": "General, Rock, Indie, Local",
        "pitch_notes": "Shoalhaven South Coast community radio."
    },
    {
        "callsign": "2EAR",
        "name": "2EAR FM 107.5 & 102.9",
        "state": "NSW",
        "city": "Moruya (Eurobodalla)",
        "postcode": "2537",
        "pitch_category": "Australia National",
        "contact_role": "Music Coordinator",
        "email": "info@2earfm.au",
        "website": "https://2earfm.au/",
        "genre_fit": "General, Aussie Indie, Rock",
        "pitch_notes": "Eurobodalla South Coast community station."
    },
    {
        "callsign": "2SFM",
        "name": "97.5 Sapphire FM",
        "state": "NSW",
        "city": "Merimbula",
        "postcode": "2548",
        "pitch_category": "Australia National",
        "contact_role": "Music Director",
        "email": "info@sapphirefm.au",
        "website": "https://sapphirefm.au/",
        "genre_fit": "Eclectic, Indie Rock, Community",
        "pitch_notes": "Far South Coast NSW community radio."
    },
    {
        "callsign": "2BOB",
        "name": "2BOB Radio 104.7",
        "state": "NSW",
        "city": "Taree (Manning Valley)",
        "postcode": "2430",
        "pitch_category": "Australia National",
        "contact_role": "Music Team",
        "email": "info@2bobradio.org.au",
        "website": "http://www.2bobradio.org.au",
        "genre_fit": "Community, Independent, Alternative",
        "pitch_notes": "One of NSW's oldest community radio stations. Proudly independent."
    },
    {
        "callsign": "2GLA",
        "name": "Great Lakes FM 101.5",
        "state": "NSW",
        "city": "Tuncurry / Forster",
        "postcode": "2428",
        "pitch_category": "Australia National",
        "contact_role": "Station Management",
        "email": "manager@greatlakesfm.org.au",
        "website": "http://www.greatlakesfm.org.au",
        "genre_fit": "General, Australian Music",
        "pitch_notes": "Mid North Coast regional broadcaster."
    },
    {
        "callsign": "2WET",
        "name": "TANK FM 103.1",
        "state": "NSW",
        "city": "West Kempsey",
        "postcode": "2440",
        "pitch_category": "Australia National",
        "contact_role": "Music Team",
        "email": "info@tankfm.org",
        "website": "https://tankfm.org/",
        "genre_fit": "General, Rock, Indie, Alternative",
        "pitch_notes": "Kempsey Macleay Valley community station."
    },
    {
        "callsign": "2WAY",
        "name": "2WAY 103.9 FM",
        "state": "NSW",
        "city": "Wauchope / Port Macquarie",
        "postcode": "2446",
        "pitch_category": "Australia National",
        "contact_role": "Music Submissions",
        "email": "contact@2wayfm.com.au",
        "website": "http://2wayfm.com.au",
        "genre_fit": "General, Rock, Pop, Local",
        "pitch_notes": "Hastings / Port Macquarie community radio."
    },
    {
        "callsign": "2NIM",
        "name": "NIM FM 102.3",
        "state": "NSW",
        "city": "Nimbin",
        "postcode": "2480",
        "pitch_category": "Australia National",
        "contact_role": "Music Team",
        "email": "nimfm.radio@gmail.com",
        "website": "http://www.nimfm.org",
        "genre_fit": "Alternative, Psychedelic, Indie, DIY",
        "pitch_notes": "Nimbin community radio. Very open to fuzzy garage and psych-pop sounds."
    },
    {
        "callsign": "2NCR",
        "name": "River FM 92.9",
        "state": "NSW",
        "city": "Lismore",
        "postcode": "2480",
        "pitch_category": "Australia National",
        "contact_role": "Station Team",
        "email": "info@2ncr.org.au",
        "website": "http://www.2ncr.org.au",
        "genre_fit": "General, Local Music, Northern Rivers",
        "pitch_notes": "Northern Rivers community radio station."
    },
    {
        "callsign": "2YOU",
        "name": "88.9FM Tamworth",
        "state": "NSW",
        "city": "Tamworth",
        "postcode": "2340",
        "pitch_category": "Australia National",
        "contact_role": "Music Submissions",
        "email": "admin@889fmtamworth.com.au",
        "website": "http://www.889fmtamworth.com.au",
        "genre_fit": "General, Contemporary, Australian Music",
        "pitch_notes": "Tamworth community broadcaster."
    },
    {
        "callsign": "2ARM",
        "name": "2ARM FM 92.1",
        "state": "NSW",
        "city": "Armidale",
        "postcode": "2350",
        "pitch_category": "Australia National",
        "contact_role": "Station Management",
        "email": "admin@2arm.net.au",
        "website": "http://www.2arm.net.au",
        "genre_fit": "General, Community, Local",
        "pitch_notes": "New England community broadcaster."
    },
    {
        "callsign": "Tune FM",
        "name": "Tune! FM 106.9",
        "state": "NSW",
        "city": "Armidale",
        "postcode": "2351",
        "pitch_category": "Australia National",
        "contact_role": "Music Director",
        "email": "music@tunefm.net",
        "website": "http://www.tunefm.net",
        "genre_fit": "Student, Indie, Alternative, Garage Rock",
        "pitch_notes": "Australia's oldest university radio station (UNE). Passionate about new Aussie alternative music."
    },
    {
        "callsign": "SURG FM",
        "name": "SURG FM (Sydney Uni)",
        "state": "NSW",
        "city": "Sydney (Camperdown)",
        "postcode": "2006",
        "pitch_category": "Sydney Local",
        "contact_role": "Music Director",
        "email": "music@surgfm.com",
        "website": "http://www.surgfm.com/",
        "genre_fit": "Student, Youth, Indie Pop, Garage Rock",
        "pitch_notes": "Sydney University student broadcaster. Huge listener base among young indie/garage fans in Sydney."
    },
    {
        "callsign": "UCFM",
        "name": "UCFM 87.8",
        "state": "ACT",
        "city": "Canberra (Bruce)",
        "postcode": "2617",
        "pitch_category": "Australia National",
        "contact_role": "Music Submissions",
        "email": "info@ucfm.com.au",
        "website": "http://www.ucfm.com.au/",
        "genre_fit": "Student, Youth, Indie, Pop",
        "pitch_notes": "University of Canberra student radio station."
    },
    {
        "callsign": "1VFM",
        "name": "Valley FM 89.5",
        "state": "ACT",
        "city": "Canberra (Tuggeranong)",
        "postcode": "2903",
        "pitch_category": "Australia National",
        "contact_role": "Music Coordinator",
        "email": "valleyfm@valleyfm.com",
        "website": "http://www.valleyfm.com/",
        "genre_fit": "General, Community, Aussie Music",
        "pitch_notes": "Tuggeranong Canberra community station."
    },
    {
        "callsign": "2DRY",
        "name": "2DRY 107.7 FM",
        "state": "NSW",
        "city": "Broken Hill",
        "postcode": "2880",
        "pitch_category": "Australia National",
        "contact_role": "Music Coordinator / Program Director",
        "email": "info@2dryfm.com",
        "website": "http://www.2dryfm.com/",
        "genre_fit": "Alternative, DIY, Arts, Eclectic Rock",
        "pitch_notes": "Far West NSW community station with an adventurous alternative music policy."
    },
    {
        "callsign": "2AAA",
        "name": "2AAA FM 107.1",
        "state": "NSW",
        "city": "Wagga Wagga",
        "postcode": "2650",
        "pitch_category": "Australia National",
        "contact_role": "Music Coordinator",
        "email": "triplea@tripleafm.net.au",
        "website": "https://tripleafm.net.au/",
        "genre_fit": "General, Australian Music, Rock",
        "pitch_notes": "Riverina community radio."
    },
    {
        "callsign": "2YAS",
        "name": "Yass FM 100.3",
        "state": "NSW",
        "city": "Yass",
        "postcode": "2582",
        "pitch_category": "Australia National",
        "contact_role": "Music Coordinator",
        "email": "info@yassfm.org",
        "website": "http://www.yassfm.org",
        "genre_fit": "General, Australian Indie, Folk, Rock",
        "pitch_notes": "Southern Tablelands community broadcaster."
    },
    {
        "callsign": "2QBN",
        "name": "QBN FM 96.7",
        "state": "NSW",
        "city": "Queanbeyan",
        "postcode": "2620",
        "pitch_category": "Australia National",
        "contact_role": "Music Submissions",
        "email": "info@qbnfm.com.au",
        "website": "http://www.qbnfm.com.au",
        "genre_fit": "General, Contemporary, Australian",
        "pitch_notes": "Queanbeyan and ACT region."
    },
    {
        "callsign": "2LND",
        "name": "Koori Radio 93.7FM",
        "state": "NSW",
        "city": "Sydney (Redfern)",
        "postcode": "2012",
        "pitch_category": "Sydney Local",
        "contact_role": "Music Department",
        "email": "music@kooriradio.com",
        "website": "http://www.kooriradio.com/",
        "genre_fit": "First Nations, Local Sydney, Hip Hop, Rock, Pop",
        "pitch_notes": "Sydney's only First Nations broadcaster based in Redfern. Plays diverse local Australian artists."
    },

    # --- VICTORIA ---
    {
        "callsign": "3RRR",
        "name": "Triple R 102.7FM",
        "state": "VIC",
        "city": "Melbourne (Brunswick East)",
        "postcode": "3057",
        "pitch_category": "Australia National",
        "contact_role": "Music Coordinator",
        "email": "music@rrr.org.au",
        "website": "http://www.rrr.org.au/",
        "genre_fit": "Indie Pop, Garage Rock, Post-Punk, Alternative",
        "pitch_notes": "The undisputed heavyweight of Australian independent music radio. Reaches over 1 million listeners. Mastered by Mikey Young is an instant selling point here."
    },
    {
        "callsign": "3PBS",
        "name": "PBS 106.7FM",
        "state": "VIC",
        "city": "Melbourne (Collingwood)",
        "postcode": "3065",
        "pitch_category": "Australia National",
        "contact_role": "Music Director",
        "email": "music@pbsfm.org.au",
        "website": "http://www.pbsfm.org.au",
        "genre_fit": "Garage Rock, Punk, Alternative, Soul, Indie",
        "pitch_notes": "Collingwood-based music powerhouse. Specialist programming has massive love for scuzzy rock & roll and garage pop."
    },
    {
        "callsign": "3CMR",
        "name": "MAINfm 94.9",
        "state": "VIC",
        "city": "Castlemaine",
        "postcode": "3450",
        "pitch_category": "Australia National",
        "contact_role": "Music Coordinator",
        "email": "music@mainfm.net",
        "website": "http://mainfm.net/",
        "genre_fit": "Indie Rock, Garage, Alternative, Eclectic",
        "pitch_notes": "Castlemaine has one of the highest concentrations of indie musicians in regional Australia. MAINfm is revered by touring bands."
    },
    {
        "callsign": "3MDR",
        "name": "3MDR 97.1FM",
        "state": "VIC",
        "city": "Upwey (Dandenong Ranges)",
        "postcode": "3158",
        "pitch_category": "Australia National",
        "contact_role": "Music Department",
        "email": "music@3mdr.com",
        "website": "http://www.3mdr.com",
        "genre_fit": "Alternative, Indie, Folk-Rock, Pop",
        "pitch_notes": "Mountain District Radio in the Dandenongs. Passionate community of music presenters championing Aussie releases."
    },
    {
        "callsign": "3JOY",
        "name": "JOY Media 94.9FM",
        "state": "VIC",
        "city": "Melbourne (St Kilda)",
        "postcode": "3182",
        "pitch_category": "Australia National",
        "contact_role": "Music Director",
        "email": "music@joy.org.au",
        "website": "http://www.joy.org.au",
        "genre_fit": "Pop, Indie Pop, Electronic, Upbeat",
        "pitch_notes": "Australia's premier LGBTIQA+ broadcaster. Plays vibrant pop, indie-pop, and upbeat indie singles."
    },
    {
        "callsign": "3SCB",
        "name": "88.3 Southern FM",
        "state": "VIC",
        "city": "Melbourne (Brighton)",
        "postcode": "3186",
        "pitch_category": "Australia National",
        "contact_role": "Music Director",
        "email": "music@southernfm.com.au",
        "website": "http://www.southernfm.com.au/",
        "genre_fit": "General, Rock, Indie, Aussie Music",
        "pitch_notes": "Bayside Melbourne community station with dedicated local music programming."
    },
    {
        "callsign": "3WBC",
        "name": "3WBC 94.1FM",
        "state": "VIC",
        "city": "Melbourne (Box Hill)",
        "postcode": "3128",
        "pitch_category": "Australia National",
        "contact_role": "Music Director",
        "email": "music@3wbc.org.au",
        "website": "http://www.3wbc.org.au",
        "genre_fit": "General, Alternative, Aussie Rock",
        "pitch_notes": "Inner Eastern Melbourne community station."
    },
    {
        "callsign": "3CR",
        "name": "3CR Community Radio 855AM",
        "state": "VIC",
        "city": "Melbourne (Collingwood)",
        "postcode": "3066",
        "pitch_category": "Australia National",
        "contact_role": "Music & Programming",
        "email": "admin@3cr.org.au",
        "website": "http://www.3cr.org.au",
        "genre_fit": "Community Access, Radical/Punk, Alternative",
        "pitch_notes": "Long-running progressive community radio in Collingwood. Independent music shows."
    },
    {
        "callsign": "3PLS",
        "name": "94.7 The Pulse",
        "state": "VIC",
        "city": "Geelong",
        "postcode": "3220",
        "pitch_category": "Australia National",
        "contact_role": "Music Submissions",
        "email": "music@947thepulse.com",
        "website": "http://www.947thepulse.com",
        "genre_fit": "General, Indie, Rock, Pop",
        "pitch_notes": "Geelong community radio station. Active music programming for Greater Geelong and the Bellarine."
    },
    {
        "callsign": "3BBB",
        "name": "Voice FM 99.9",
        "state": "VIC",
        "city": "Ballarat",
        "postcode": "3350",
        "pitch_category": "Australia National",
        "contact_role": "Music Team",
        "email": "music@voicefm.org.au",
        "website": "https://www.voicefm.org.au",
        "genre_fit": "General, Indie, Contemporary",
        "pitch_notes": "Ballarat regional community broadcaster."
    },
    {
        "callsign": "3CH",
        "name": "Highlands FM 100.7",
        "state": "VIC",
        "city": "Woodend (Macedon Ranges)",
        "postcode": "3442",
        "pitch_category": "Australia National",
        "contact_role": "Music Coordinator",
        "email": "info@highlandsfm.org.au",
        "website": "http://www.highlandsfm.org.au",
        "genre_fit": "General, Indie, Local, Classic",
        "pitch_notes": "Macedon Ranges community radio."
    },
    {
        "callsign": "3GCR",
        "name": "Gippsland FM 104.7",
        "state": "VIC",
        "city": "Morwell (Gippsland)",
        "postcode": "3840",
        "pitch_category": "Australia National",
        "contact_role": "Music Submissions",
        "email": "info@gippslandfm.org.au",
        "website": "http://www.gippslandfm.org.au",
        "genre_fit": "General, Rock, Australian",
        "pitch_notes": "Serving Central and East Gippsland."
    },
    {
        "callsign": "3BBR",
        "name": "3BBR-FM 103.1",
        "state": "VIC",
        "city": "Drouin (West Gippsland)",
        "postcode": "3818",
        "pitch_category": "Australia National",
        "contact_role": "Music Submissions",
        "email": "3bbrfm@3bbrfm.org.au",
        "website": "http://www.3bbrfm.org.au",
        "genre_fit": "General, Community, Local",
        "pitch_notes": "West Gippsland community station."
    },
    {
        "callsign": "3MFM",
        "name": "South Coast FM 89.1",
        "state": "VIC",
        "city": "Wonthaggi",
        "postcode": "3995",
        "pitch_category": "Australia National",
        "contact_role": "Station Management",
        "email": "info@southcoastfm.au",
        "website": "https://southcoastfm.au/",
        "genre_fit": "General, Rock, Pop, Community",
        "pitch_notes": "Bass Coast and South Gippsland."
    },
    {
        "callsign": "3WAY",
        "name": "3 WAY FM 103.7 Great Ocean Radio",
        "state": "VIC",
        "city": "Warrnambool",
        "postcode": "3280",
        "pitch_category": "Australia National",
        "contact_role": "Music Submissions",
        "email": "info@3wayfm.org.au",
        "website": "http://www.3wayfm.org.au/",
        "genre_fit": "General, Indie, Surf, Rock",
        "pitch_notes": "South West Victoria coastal community radio."
    },
    {
        "callsign": "3OCR",
        "name": "OCR FM 98.3",
        "state": "VIC",
        "city": "Colac",
        "postcode": "3250",
        "pitch_category": "Australia National",
        "contact_role": "Music Department",
        "email": "admin@ocrfm.org.au",
        "website": "http://www.ocrfm.org.au/",
        "genre_fit": "General, Indie, Local Aussie",
        "pitch_notes": "Otway region community broadcaster."
    },
    {
        "callsign": "3ONE",
        "name": "OneFM 98.5",
        "state": "VIC",
        "city": "Shepparton (Goulburn Valley)",
        "postcode": "3632",
        "pitch_category": "Australia National",
        "contact_role": "Music Submissions",
        "email": "admin@fm985.com.au",
        "website": "http://www.fm985.com.au/",
        "genre_fit": "General, Contemporary, Australian",
        "pitch_notes": "Goulburn Valley community radio."
    },
    {
        "callsign": "3PFM",
        "name": "106.7 Phoenix FM Bendigo",
        "state": "VIC",
        "city": "Bendigo",
        "postcode": "3556",
        "pitch_category": "Australia National",
        "contact_role": "Music Team",
        "email": "info@phoenixfm.org.au",
        "website": "http://www.phoenixfm.org.au",
        "genre_fit": "General, Alternative, Indie",
        "pitch_notes": "Bendigo community radio."
    },
    {
        "callsign": "3SER",
        "name": "Casey Radio 97.7FM",
        "state": "VIC",
        "city": "Melbourne (Cranbourne)",
        "postcode": "3977",
        "pitch_category": "Australia National",
        "contact_role": "Music Director",
        "email": "music@caseyradio.com.au",
        "website": "http://www.caseyradio.com.au",
        "genre_fit": "General, Contemporary, Aussie",
        "pitch_notes": "South-East Melbourne community broadcaster."
    },
    {
        "callsign": "3VYV",
        "name": "Yarra Valley FM 99.1",
        "state": "VIC",
        "city": "Healesville",
        "postcode": "3777",
        "pitch_category": "Australia National",
        "contact_role": "Music Director",
        "email": "music@yarravalleyfm.com",
        "website": "http://www.yarravalleyfm.com",
        "genre_fit": "General, Indie, Acoustic, Rock",
        "pitch_notes": "Yarra Valley community broadcaster."
    },

    # --- QUEENSLAND ---
    {
        "callsign": "4ZZZ",
        "name": "4ZZZ 102.1FM",
        "state": "QLD",
        "city": "Brisbane (Fortitude Valley)",
        "postcode": "4006",
        "pitch_category": "Australia National",
        "contact_role": "Music Coordinator",
        "email": "music@4zzz.org.au",
        "website": "http://www.4zzz.org.au",
        "genre_fit": "Punk, Garage Rock, Indie Pop, Alternative",
        "pitch_notes": "Legendary Brisbane alternative station. Has already spun Love Banana 7-inch. Perfect fit for 'Seagull'."
    },
    {
        "callsign": "4BI",
        "name": "Switch Brisbane 1197AM",
        "state": "QLD",
        "city": "Brisbane (Toowong)",
        "postcode": "4066",
        "pitch_category": "Australia National",
        "contact_role": "Music Director",
        "email": "music@switchbrisbane.com.au",
        "website": "https://switchbrisbane.com.au/",
        "genre_fit": "Youth, Indie Pop, Alternative, Contemporary",
        "pitch_notes": "Brisbane's youth community station. Strong focus on emerging Aussie artists."
    },
    {
        "callsign": "4RED",
        "name": "99.7 Bridge FM",
        "state": "QLD",
        "city": "Redcliffe (Moreton Bay)",
        "postcode": "4020",
        "pitch_category": "Australia National",
        "contact_role": "Music Department",
        "email": "music@997fm.com.au",
        "website": "http://www.997fm.com.au",
        "genre_fit": "General, Rock, Pop, Contemporary",
        "pitch_notes": "Moreton Bay region station with good local music support."
    },
    {
        "callsign": "4OUR",
        "name": "101.5FM Moreton Bay's Own",
        "state": "QLD",
        "city": "Caboolture",
        "postcode": "4510",
        "pitch_category": "Australia National",
        "contact_role": "Music Coordinator",
        "email": "music@1015fm.com.au",
        "website": "http://www.1015fm.com.au",
        "genre_fit": "General, Aussie Indie, Rock",
        "pitch_notes": "Caboolture and northern Moreton Bay."
    },
    {
        "callsign": "4NSA",
        "name": "Noosa FM 101.3",
        "state": "QLD",
        "city": "Noosa Heads",
        "postcode": "4567",
        "pitch_category": "Australia National",
        "contact_role": "Music Director",
        "email": "music@noosafm.org",
        "website": "http://www.noosafm.org/",
        "genre_fit": "Eclectic, Surf Rock, Indie, Coastal",
        "pitch_notes": "Sunshine Coast community station. Sunny garage-pop vibes fit very well."
    },
    {
        "callsign": "4CCR",
        "name": "Cairns FM 89.1",
        "state": "QLD",
        "city": "Cairns",
        "postcode": "4870",
        "pitch_category": "Australia National",
        "contact_role": "Music Submissions",
        "email": "music@cairnsfm891.org.au",
        "website": "http://www.cairnsfm891.org.au",
        "genre_fit": "General, Alternative, Indie",
        "pitch_notes": "Far North Queensland community broadcaster."
    },
    {
        "callsign": "4MET",
        "name": "105.7 Radio Metro",
        "state": "QLD",
        "city": "Gold Coast",
        "postcode": "9726",
        "pitch_category": "Australia National",
        "contact_role": "Music Director",
        "email": "music@radiometro.com.au",
        "website": "http://www.radiometro.com.au",
        "genre_fit": "Youth, Dance, Pop, Upbeat Indie",
        "pitch_notes": "Gold Coast youth station."
    },
    {
        "callsign": "4FCR",
        "name": "Fraser Coast FM 107.5",
        "state": "QLD",
        "city": "Hervey Bay",
        "postcode": "4655",
        "pitch_category": "Australia National",
        "contact_role": "Music Coordinator",
        "email": "music@frasercoast.fm",
        "website": "http://www.frasercoast.fm",
        "genre_fit": "General, Rock, Pop, Community",
        "pitch_notes": "Fraser Coast / Hervey Bay community station."
    },
    {
        "callsign": "4CRM",
        "name": "4CRM 107.5 FM",
        "state": "QLD",
        "city": "Mackay",
        "postcode": "4740",
        "pitch_category": "Australia National",
        "contact_role": "Music Team",
        "email": "admin@4crm.com.au",
        "website": "http://www.4crm.com.au",
        "genre_fit": "General, Community, Australian",
        "pitch_notes": "Mackay regional broadcaster."
    },
    {
        "callsign": "4TTT",
        "name": "103.9 Triple T",
        "state": "QLD",
        "city": "Townsville",
        "postcode": "4810",
        "pitch_category": "Australia National",
        "contact_role": "Station Management",
        "email": "info@triplet.com.au",
        "website": "http://www.triplet.com.au",
        "genre_fit": "General, Rock, Australian",
        "pitch_notes": "Townsville regional community radio."
    },

    # --- SOUTH AUSTRALIA ---
    {
        "callsign": "5DDD",
        "name": "Three D Radio 93.7FM",
        "state": "SA",
        "city": "Adelaide (Stepney)",
        "postcode": "5069",
        "pitch_category": "Australia National",
        "contact_role": "Music Director / Submissions",
        "email": "music@threedradio.com",
        "website": "http://www.threedradio.com",
        "genre_fit": "Punk, Garage Rock, DIY, Alternative, Pop",
        "pitch_notes": "One of Australia's purest independent alternative music stations. Minimum 40% Australian music policy. Admires Mikey Young."
    },
    {
        "callsign": "5UV",
        "name": "Radio Adelaide 101.5FM",
        "state": "SA",
        "city": "Adelaide",
        "postcode": "5063",
        "pitch_category": "Australia National",
        "contact_role": "Music Coordinator",
        "email": "music@radioadelaide.org.au",
        "website": "http://radioadelaide.org.au/",
        "genre_fit": "Educational, Indie, Eclectic, Pop",
        "pitch_notes": "Australia's first community station (est. 1972). Dedicated focus on indie and Australian music."
    },
    {
        "callsign": "5CST",
        "name": "Adelaide's Coast FM 88.7",
        "state": "SA",
        "city": "Adelaide (Glandore)",
        "postcode": "5037",
        "pitch_category": "Australia National",
        "contact_role": "Music Department",
        "email": "info@coastfm.com.au",
        "website": "http://www.coastfm.com.au",
        "genre_fit": "General, Aussie Classics & New Indie",
        "pitch_notes": "Southern Adelaide community radio station."
    },
    {
        "callsign": "5PBA",
        "name": "PBA-FM 89.7",
        "state": "SA",
        "city": "Adelaide (Salisbury)",
        "postcode": "5108",
        "pitch_category": "Australia National",
        "contact_role": "Music Team",
        "email": "pbafm@pbafm.org.au",
        "website": "http://www.pbafm.org.au/",
        "genre_fit": "General, Alternative, Community",
        "pitch_notes": "Northern suburbs Adelaide community radio."
    },
    {
        "callsign": "5WOW",
        "name": "WOW FM 100.5",
        "state": "SA",
        "city": "Adelaide (Semaphore)",
        "postcode": "5019",
        "pitch_category": "Australia National",
        "contact_role": "Music Team",
        "email": "admin@wowfm.org",
        "website": "https://wowfm.org/",
        "genre_fit": "General, Local Music, Rock, Pop",
        "pitch_notes": "Western suburbs / Port Adelaide community broadcaster."
    },
    {
        "callsign": "Tribe FM",
        "name": "Tribe FM 91.1",
        "state": "SA",
        "city": "Willunga",
        "postcode": "5172",
        "pitch_category": "Australia National",
        "contact_role": "Music Coordinator",
        "email": "music@tribefm.org.au",
        "website": "http://www.tribefm.org.au/",
        "genre_fit": "Indie, Rock, Alternative, Pop",
        "pitch_notes": "Fleurieu Peninsula community station. Strong indie music enthusiast presenters."
    },
    {
        "callsign": "5LCM",
        "name": "Lofty 88.9",
        "state": "SA",
        "city": "Totness (Adelaide Hills)",
        "postcode": "5250",
        "pitch_category": "Australia National",
        "contact_role": "Music Submissions",
        "email": "music@lofty.org.au",
        "website": "http://lofty.org.au/",
        "genre_fit": "Indie, Alternative, Contemporary",
        "pitch_notes": "Adelaide Hills community radio. Loves independent Australian talent."
    },

    # --- WESTERN AUSTRALIA ---
    {
        "callsign": "6RTR",
        "name": "RTR FM 92.1",
        "state": "WA",
        "city": "Perth (Mount Lawley)",
        "postcode": "6929",
        "pitch_category": "Australia National",
        "contact_role": "Music Director",
        "email": "music@rtrfm.com.au",
        "website": "http://www.rtrfm.com.au",
        "genre_fit": "Indie Rock, Garage Rock, Post-Punk, Alternative",
        "pitch_notes": "Western Australia's premier independent tastemaker. Critical airplay target for national indie credibility. Mikey Young master is huge here."
    },
    {
        "callsign": "6CCR",
        "name": "Radio Fremantle 107.9FM",
        "state": "WA",
        "city": "Fremantle",
        "postcode": "6163",
        "pitch_category": "Australia National",
        "contact_role": "Music Department",
        "email": "music@radiofremantle.com.au",
        "website": "https://www.radiofremantle.com.au/",
        "genre_fit": "Indie, Rock, Blues, Local",
        "pitch_notes": "Fremantle port city community station with deep roots in WA's legendary indie scene."
    },
    {
        "callsign": "6TCR",
        "name": "89 7FM",
        "state": "WA",
        "city": "Perth (Joondalup)",
        "postcode": "6027",
        "pitch_category": "Australia National",
        "contact_role": "Music Coordinator",
        "email": "music@897fm.com.au",
        "website": "http://www.897fm.com.au/",
        "genre_fit": "Youth, Indie, Alternative, Australian",
        "pitch_notes": "Perth northern suburbs community radio. High quota of Australian and independent tracks."
    },
    {
        "callsign": "6HFM",
        "name": "107.3 HFM",
        "state": "WA",
        "city": "Perth (Gosnells)",
        "postcode": "6990",
        "pitch_category": "Australia National",
        "contact_role": "Music Submissions",
        "email": "music@hfm.radio",
        "website": "https://www.hfm.radio/",
        "genre_fit": "General, Rock, Pop, Australian",
        "pitch_notes": "South-East Perth community radio."
    },
    {
        "callsign": "6KCR",
        "name": "KCR 88.9FM",
        "state": "WA",
        "city": "Perth (Kalamunda)",
        "postcode": "6076",
        "pitch_category": "Australia National",
        "contact_role": "Music Coordinator",
        "email": "music@kcr-fm.org.au",
        "website": "http://www.kcr-fm.org.au/",
        "genre_fit": "General, Classic & Modern Rock, Pop",
        "pitch_notes": "Perth Hills community station."
    },
    {
        "callsign": "6RMR",
        "name": "Radio Margaret River 101.9",
        "state": "WA",
        "city": "Margaret River",
        "postcode": "6285",
        "pitch_category": "Australia National",
        "contact_role": "Music Director",
        "email": "info@radiomargaretriver.com",
        "website": "https://www.radiomargaretriver.com/",
        "genre_fit": "Surf Rock, Indie, Coastal, Pop",
        "pitch_notes": "Margaret River cultural hub. Loves beachy garage-pop and indie rock."
    },
    {
        "callsign": "Denmark FM",
        "name": "Denmark FM 99.3",
        "state": "WA",
        "city": "Denmark (Great Southern)",
        "postcode": "6333",
        "pitch_category": "Australia National",
        "contact_role": "Music Coordinator",
        "email": "info@denmarkfm.com.au",
        "website": "https://denmarkfm.com.au/",
        "genre_fit": "Eclectic, Indie, Alternative",
        "pitch_notes": "Vibrant Great Southern coastal WA community radio."
    },

    # --- TASMANIA ---
    {
        "callsign": "7EDG",
        "name": "Edge Radio 99.3 FM",
        "state": "TAS",
        "city": "Hobart",
        "postcode": "7000",
        "pitch_category": "Australia National",
        "contact_role": "Music Director",
        "email": "music@edgeradio.org.au",
        "website": "http://www.edgeradio.org.au",
        "genre_fit": "Indie Pop, Garage Rock, Punk, Alternative",
        "pitch_notes": "Hobart's youth and student broadcaster (Univ of Tasmania). Massive supporter of emerging Australian indie/garage sounds."
    },
    {
        "callsign": "7THE",
        "name": "Hobart FM 96.1",
        "state": "TAS",
        "city": "Hobart (Howrah)",
        "postcode": "7018",
        "pitch_category": "Australia National",
        "contact_role": "Music Department",
        "email": "hobartfm@hobartfm.org.au",
        "website": "http://www.hobartfm.org.au",
        "genre_fit": "General, Contemporary, Australian",
        "pitch_notes": "Southern Tasmania community station."
    },
    {
        "callsign": "7LTN",
        "name": "City Park Radio 103.7FM",
        "state": "TAS",
        "city": "Launceston",
        "postcode": "7250",
        "pitch_category": "Australia National",
        "contact_role": "Music Submissions",
        "email": "cityparkradio@internode.on.net",
        "website": "http://www.cityparkradio.com",
        "genre_fit": "General, Australian Music, Rock",
        "pitch_notes": "Northern Tasmania's primary community broadcaster."
    },
    {
        "callsign": "7DBS",
        "name": "Coast FM 88.9",
        "state": "TAS",
        "city": "Wynyard",
        "postcode": "7325",
        "pitch_category": "Australia National",
        "contact_role": "Music Team",
        "email": "coastfm@coastfmtas.au",
        "website": "http://www.coastfmtas.au",
        "genre_fit": "General, Rock, Australian",
        "pitch_notes": "North-West Tasmania community broadcaster."
    },

    # --- NORTHERN TERRITORY ---
    {
        "callsign": "8TFM",
        "name": "104.1 Territory FM",
        "state": "NT",
        "city": "Darwin",
        "postcode": "0909",
        "pitch_category": "Australia National",
        "contact_role": "Music Director",
        "email": "music@territoryfm.com",
        "website": "http://www.territoryfm.com",
        "genre_fit": "Alternative, Rock, Greatest Hits, Australian",
        "pitch_notes": "Charles Darwin University community station. High profile across Darwin and Palmerston."
    },
    {
        "callsign": "8CCC",
        "name": "8CCC Radio 102.1FM",
        "state": "NT",
        "city": "Alice Springs & Tennant Creek",
        "postcode": "0871",
        "pitch_category": "Australia National",
        "contact_role": "Music Coordinator",
        "email": "music@8ccc.com.au",
        "website": "http://www.8ccc.com.au/",
        "genre_fit": "Eclectic, DIY, Desert Indie, Rock",
        "pitch_notes": "Broadcasting across Central Australia. Hugely receptive to quirky, upbeat Australian independent rock and pop."
    },
    {
        "callsign": "8EAR",
        "name": "Gove FM 105.7",
        "state": "NT",
        "city": "Nhulunbuy (East Arnhem)",
        "postcode": "0881",
        "pitch_category": "Australia National",
        "contact_role": "Station Management",
        "email": "admin@govefm.com.au",
        "website": "http://www.govefm.com.au",
        "genre_fit": "General, Australian Music, Rock",
        "pitch_notes": "Isolated Arnhem Land community radio with high engagement."
    }
]

WEB_SUBMISSION_STATIONS = [
    {
        "callsign": "1XXR",
        "name": "2 Double X (2XX FM 98.3)",
        "state": "ACT",
        "city": "Canberra (Civic)",
        "submission_type": "Online Submission Form",
        "submission_url": "https://www.2xxfm.org.au/get-involved/submit-music/",
        "guidelines": "Accepts downloadable WAV, FLAC, or 320kbps MP3 via links (Dropbox/Drive). Requires short bio, genre, social links, and track details.",
        "backup_email": "manager@2xxfm.org.au",
        "notes": "Canberra's premier independent community station. Mandatory online form for music intake."
    },
    {
        "callsign": "2BAY",
        "name": "BAYFM 99.9",
        "state": "NSW",
        "city": "Byron Bay",
        "submission_type": "Website Form (Subject: Music)",
        "submission_url": "https://www.bayfm.org/contact-us/",
        "guidelines": "In the contact form, select 'Music' in the Subject dropdown, specify your genre, and include EPK / streaming and download links in the message.",
        "backup_email": "frontdesk@bayfm.org",
        "notes": "Byron Bay community radio. Does not take unsolicited email attachments; routing through web form guarantees delivery to music programmers."
    },
    {
        "callsign": "2RRR",
        "name": "2RRR 88.5FM",
        "state": "NSW",
        "city": "Sydney (Gladesville)",
        "submission_type": "Dropbox Audio Request Portal",
        "submission_url": "https://www.dropbox.com/request/cUVsKyoL1kKsDznnW9d2",
        "guidelines": "Upload .mp3 files directly to their Dropbox request link. Strict filename format: 'Artist Name - Song Title [A] (Genre) (.mp3)'. Note: Do NOT upload WAVs as their Dropbox space is limited and WAVs may be auto-deleted.",
        "backup_email": "office@2rrr.org.au",
        "notes": "Ryde Regional Radio in Sydney. Automated Dropbox drop makes ingestion seamless for presenters."
    },
    {
        "callsign": "3SYN",
        "name": "SYN Media 90.7FM",
        "state": "VIC",
        "city": "Melbourne",
        "submission_type": "Online Music Submission Form",
        "submission_url": "https://syn.org.au/music-submissions/",
        "guidelines": "Use their online portal to enter artist name, single title, release date, download link (Dropbox/Drive/WAV), streaming link, and bio.",
        "backup_email": "music@syn.org.au",
        "notes": "Melbourne youth media staple. Fills their Sweet 16 feature album and weekly playlist from this portal."
    },
    {
        "callsign": "5FBI",
        "name": "Fresh 92.7",
        "state": "SA",
        "city": "Adelaide",
        "submission_type": "Fresh Music Submission Portal",
        "submission_url": "https://fresh927.com.au/music/submit-music/",
        "guidelines": "Submit track metadata, streaming link, download link, and bio via the online portal.",
        "backup_email": "music@fresh927.com.au",
        "notes": "Adelaide youth/electronic/indie broadcaster. Strongly prefers submission via their portal."
    },
    {
        "callsign": "ALL_CBAA",
        "name": "Amrap (Australian Music Radio Airplay Project)",
        "state": "National (Australia-wide)",
        "city": "National",
        "submission_type": "National Community Radio Portal (CBAA)",
        "submission_url": "https://amrap.org.au/",
        "guidelines": "Create free artist profile on Amrap, upload 320kbps MP3 / WAV, cover art, release date, bio, and tour dates. Over 4,000 community radio DJs browse Amrap to program Australian tracks.",
        "backup_email": "airit@cbaa.org.au",
        "notes": "The single most effective tool in Australian music radio. Broadcasters from 2SER, FBi, RRR, PBS, 4ZZZ, RTRFM and 200+ regional stations use Amrap daily to discover and log airplay."
    },
    {
        "callsign": "TRIPLE_J",
        "name": "triple j Unearthed",
        "state": "National",
        "city": "National",
        "submission_type": "Artist Upload Portal",
        "submission_url": "https://www.triplejunearthed.com/",
        "guidelines": "Upload full WAV/MP3 master of 'Seagull', bio, and artwork. Unearthed music team and community radio presenters frequently cross-scout tracks here.",
        "backup_email": "unearthed@abc.net.au",
        "notes": "ABC / triple j's dedicated platform for independent, un-signed and emerging Australian music."
    }
]

def main():
    # 1. Write australian_radio_music_pitch_emails.csv
    email_csv_path = 'data/australian_radio_music_pitch_emails.csv'
    root_email_csv = 'australian_radio_music_pitch_emails.csv'
    
    fieldnames_email = [
        'callsign', 'name', 'state', 'city', 'postcode', 
        'pitch_category', 'contact_role', 'email', 'website', 
        'genre_fit', 'pitch_notes'
    ]
    
    for path in [email_csv_path, root_email_csv]:
        with open(path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames_email)
            writer.writeheader()
            for row in EMAIL_STATIONS:
                writer.writerow(row)
        print(f"Wrote {len(EMAIL_STATIONS)} stations to {path}")

    # 2. Write australian_radio_web_submissions.csv
    web_csv_path = 'data/australian_radio_web_submissions.csv'
    root_web_csv = 'australian_radio_web_submissions.csv'
    
    fieldnames_web = [
        'callsign', 'name', 'state', 'city', 
        'submission_type', 'submission_url', 'guidelines', 
        'backup_email', 'notes'
    ]
    
    for path in [web_csv_path, root_web_csv]:
        with open(path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames_web)
            writer.writeheader()
            for row in WEB_SUBMISSION_STATIONS:
                writer.writerow(row)
        print(f"Wrote {len(WEB_SUBMISSION_STATIONS)} stations to {path}")

    # 3. Import curated email stations into data/bandspot.json
    bandspot_path = 'data/bandspot.json'
    if os.path.exists(bandspot_path):
        with open(bandspot_path, 'r', encoding='utf-8') as f:
            db = json.load(f)
        
        existing_emails = {c.get('email', '').lower() for c in db.get('contacts', [])}
        new_contacts = []
        
        for s in EMAIL_STATIONS:
            sem = s['email'].strip().lower()
            if sem in existing_emails:
                continue
            existing_emails.add(sem)
            
            new_id = f"c-radio-{s['callsign'].lower().replace(' ', '-')}"
            contact_obj = {
                "id": new_id,
                "name": f"{s['name']} ({s['contact_role']})",
                "email": s['email'].strip(),
                "outlet": s['name'],
                "category": "Radio",
                "country": "Australia",
                "city": s['city'],
                "genre_fit": s['genre_fit'],
                "notes": f"{s['pitch_category']} - {s['pitch_notes']}",
                "stage": "lead",
                "last_contacted_at": None,
                "created_at": "2026-09-08T11:20:00.000Z"
            }
            new_contacts.append(contact_obj)
        
        db['contacts'].extend(new_contacts)
        with open(bandspot_path, 'w', encoding='utf-8') as f:
            json.dump(db, f, indent=2)
        print(f"Imported {len(new_contacts)} new Australian radio stations directly into bandspot.json!")

if __name__ == '__main__':
    main()
