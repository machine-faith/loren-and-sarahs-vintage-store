import csv
import json
import os

def main():
    master_path = 'data/australian_community_radio_master_329_stations.csv'
    with open(master_path, 'r', encoding='utf-8') as f:
        all_stations = list(csv.DictReader(f))

    # Strict music-only filter
    music_stations = []
    excluded_count = 0
    excluded_reasons = {}

    for s in all_stations:
        suitability = s['Suitability for Love Banana'].lower()
        interest = s['Community of Interest'].lower()
        receptive = s['Music Receptive'].lower()

        # Check exclusions
        is_excluded = False
        reason = None

        if 'print' in suitability or 'print' in interest:
            is_excluded = True
            reason = 'Print Disability (Reads newspapers/books aloud)'
        elif 'television' in suitability or 'community tv' in interest:
            is_excluded = True
            reason = 'Television Channel (Not radio)'
        elif 'sports' in suitability or 'sports' in interest:
            is_excluded = True
            reason = 'Sports Talk (Commentary only, no music)'
        elif 'classical' in suitability or 'fine music' in interest:
            is_excluded = True
            reason = 'Fine Music (Classical / Opera only)'
        elif 'christian' in suitability or 'christian' in interest:
            is_excluded = True
            reason = 'Religious / Christian'
        elif 'islamic' in suitability or 'islamic' in interest or 'ethnic' in suitability or 'ethnic' in interest:
            is_excluded = True
            reason = 'Multilingual / Ethnic Community Talk'
        elif 'nostalgia' in suitability or 'senior' in interest:
            is_excluded = True
            reason = 'Senior Nostalgia (1940s-1950s Big Band only)'

        if is_excluded:
            excluded_count += 1
            excluded_reasons[reason] = excluded_reasons.get(reason, 0) + 1
        else:
            music_stations.append(s)

    print(f"Removed {excluded_count} non-music stations:")
    for r, count in sorted(excluded_reasons.items(), key=lambda x: -x[1]):
        print(f"  - {r}: {count}")
    print(f"Retained {len(music_stations)} pure music-playing radio stations.\n")

    # Priority sorting helper
    def get_priority_rank(st):
        suit = st['Suitability for Love Banana']
        if 'Sydney Local' in suit:
            return 1
        if 'Australia National' in suit:
            return 2
        if 'Youth' in suit or 'Alternative' in suit:
            return 3
        return 4

    music_stations.sort(key=lambda s: (get_priority_rank(s), s['State'], s['Station Name']))

    # 1. Generate clean australian_radio_music_pitch_emails.csv
    email_stations = [s for s in music_stations if s['Contact Email'] and '@' in s['Contact Email']]
    
    email_fieldnames = [
        'Callsign', 'Station Name', 'State', 'City', 'Postcode',
        'Region / Pitch Category', 'Contact Email', 'Website URL',
        'Format & Fit', 'Recommended Action / Pitch Notes'
    ]

    email_rows = []
    for s in email_stations:
        suit = s['Suitability for Love Banana']
        if 'Sydney Local' in suit:
            region = 'Sydney Local'
        elif 'Australia National' in suit or 'Youth' in suit:
            region = 'Australia National (High Priority)'
        else:
            region = f"Regional Community ({s['State']})"

        email_rows.append({
            'Callsign': s['Callsign'],
            'Station Name': s['Station Name'],
            'State': s['State'],
            'City': s['City'],
            'Postcode': s['Postcode'],
            'Region / Pitch Category': region,
            'Contact Email': s['Contact Email'],
            'Website URL': s['Website / Portal URL'],
            'Format & Fit': s['Community of Interest'],
            'Recommended Action / Pitch Notes': s['Recommended Action'] + (' — ' + s['Notes'] if s['Notes'] else '')
        })

    for path in ['data/australian_radio_music_pitch_emails.csv', 'australian_radio_music_pitch_emails.csv']:
        with open(path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=email_fieldnames)
            writer.writeheader()
            for r in email_rows:
                writer.writerow(r)
        print(f"Wrote {len(email_rows)} pure music email pitch stations to {path}")

    # 2. Generate clean australian_radio_web_submissions.csv
    # We load the curated web portals + any music station that requires web submissions
    web_stations = [
        {
            'Callsign': 'ALL_CBAA',
            'Station Name': 'Amrap (Australian Music Radio Airplay Project)',
            'State': 'National',
            'City': 'National',
            'Submission Type': 'National Community Radio Music Portal (CBAA)',
            'Submission URL': 'https://amrap.org.au/',
            'Guidelines & File Requirements': 'Upload 320kbps MP3 / WAV master of "Seagull", cover art, bio, and release date. Broadcasters across 200+ community stations search and download tracks here daily.',
            'Backup / Inquiries Email': 'airit@cbaa.org.au',
            'Notes': 'Priority #1 for Australian community radio. Used by DJs from FBi, 2SER, Triple R, PBS, 4ZZZ, RTRFM and all regional stations.'
        },
        {
            'Callsign': 'TRIPLE_J',
            'Station Name': 'triple j Unearthed',
            'State': 'National',
            'City': 'National',
            'Submission Type': 'Artist Upload Portal',
            'Submission URL': 'https://www.triplejunearthed.com/',
            'Guidelines & File Requirements': 'Upload full track master, artwork, and band bio. Regularly cross-scouted by community radio presenters and ABC music teams.',
            'Backup / Inquiries Email': 'unearthed@abc.net.au',
            'Notes': 'National indie showcase for un-signed / emerging Australian bands.'
        },
        {
            'Callsign': '1XXR',
            'Station Name': '2 Double X (2XX FM 98.3)',
            'State': 'ACT',
            'City': 'Canberra (Civic)',
            'Submission Type': 'Online Music Submission Form',
            'Submission URL': 'https://www.2xxfm.org.au/get-involved/submit-music/',
            'Guidelines & File Requirements': 'Accepts downloadable WAV, FLAC, or 320kbps MP3 via links (Dropbox/Drive). Requires short bio, genre, social links, and track details.',
            'Backup / Inquiries Email': 'manager@2xxfm.org.au',
            'Notes': 'Canberra premier indie station. Mandatory online form for music intake.'
        },
        {
            'Callsign': '2BAY',
            'Station Name': 'BAYFM 99.9',
            'State': 'NSW',
            'City': 'Byron Bay',
            'Submission Type': 'Website Form (Select Subject: Music)',
            'Submission URL': 'https://www.bayfm.org/contact-us/',
            'Guidelines & File Requirements': 'In the contact form, select "Music" in the Subject dropdown, specify your genre, and paste your EPK/streaming and download links in the message.',
            'Backup / Inquiries Email': 'frontdesk@bayfm.org',
            'Notes': 'Byron Bay community radio. Does not take email attachments; web form routes directly to music programmers.'
        },
        {
            'Callsign': '2RRR',
            'Station Name': '2RRR 88.5FM',
            'State': 'NSW',
            'City': 'Sydney (Gladesville)',
            'Submission Type': 'Dropbox Audio Request Portal',
            'Submission URL': 'https://www.dropbox.com/request/cUVsKyoL1kKsDznnW9d2',
            'Guidelines & File Requirements': 'Upload MP3 only (Dropbox space is limited; WAVs are deleted). Format filename as: "Love Banana - Seagull [A] (Garage Pop) (.mp3)".',
            'Backup / Inquiries Email': 'office@2rrr.org.au',
            'Notes': 'Ryde Regional Radio in Sydney. Automated Dropbox drop for music ingestion.'
        },
        {
            'Callsign': '3SYN',
            'Station Name': 'SYN Media 90.7FM',
            'State': 'VIC',
            'City': 'Melbourne',
            'Submission Type': 'Online Music Submission Form',
            'Submission URL': 'https://syn.org.au/music-submissions/',
            'Guidelines & File Requirements': 'Enter track name, artist, streaming link, download link (WAV/MP3), and bio. Programs their weekly Sweet 16 and high rotation playlists.',
            'Backup / Inquiries Email': 'music@syn.org.au',
            'Notes': 'Melbourne youth station with strong Australian indie support.'
        },
        {
            'Callsign': '5FBI',
            'Station Name': 'Fresh 92.7',
            'State': 'SA',
            'City': 'Adelaide',
            'Submission Type': 'Fresh Music Submission Portal',
            'Submission URL': 'https://fresh927.com.au/music/submit-music/',
            'Guidelines & File Requirements': 'Upload track metadata, streaming link, download link, and bio via the online portal.',
            'Backup / Inquiries Email': 'music@fresh927.com.au',
            'Notes': 'Adelaide youth/indie station. Recommends submission through portal.'
        }
    ]

    web_fieldnames = [
        'Callsign', 'Station Name', 'State', 'City',
        'Submission Type', 'Submission URL', 'Guidelines & File Requirements',
        'Backup / Inquiries Email', 'Notes'
    ]

    for path in ['data/australian_radio_web_submissions.csv', 'australian_radio_web_submissions.csv']:
        with open(path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=web_fieldnames)
            writer.writeheader()
            for r in web_stations:
                writer.writerow(r)
        print(f"Wrote {len(web_stations)} pure music web submission portals to {path}")

    # 3. Clean up the old 329-row master file or create a dedicated music master
    clean_master_paths = [
        'data/australian_community_radio_music_only_master.csv',
        'australian_community_radio_music_only_master.csv'
    ]
    master_fieldnames = [
        'Callsign', 'Station Name', 'State', 'City', 'Postcode',
        'Community of Interest', 'Suitability for Love Banana', 'Music Receptive',
        'Submission Method', 'Contact Email', 'Website / Portal URL',
        'Recommended Action', 'Notes'
    ]
    for path in clean_master_paths:
        with open(path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=master_fieldnames)
            writer.writeheader()
            for r in music_stations:
                writer.writerow(r)
        print(f"Wrote {len(music_stations)} pure music stations to clean master file {path}")

    # Also remove or overwrite the 329-row master file so no non-music files linger confusingly
    if os.path.exists('australian_community_radio_master_329_stations.csv'):
        os.remove('australian_community_radio_master_329_stations.csv')
    if os.path.exists('data/australian_community_radio_master_329_stations.csv'):
        os.remove('data/australian_community_radio_master_329_stations.csv')
    print("Removed obsolete 329-station files containing non-music services.")

if __name__ == '__main__':
    main()
