import csv
import json
import os
import re

def derive_email_and_fit(station):
    callsign = station.get('Callsign', '').strip()
    name = station.get('On Air Name', '').strip()
    state = station.get('State', '').strip()
    city = station.get('City', '').strip()
    postcode = station.get('Postcode', '').strip()
    category = station.get('Community of Interest', '').strip()
    website = station.get('Website', '').strip()

    # Determine Suitability / Tag
    # 1. Non-music or format incompatible
    if 'Print Disability' in category:
        return {
            'suitability': 'Not Suitable (Print Reading for Vision-Impaired)',
            'recommended_action': 'Skip - Reads newspapers/books for blind listeners, no music airplay',
            'contact_email': 'info@' + re.sub(r'^https?://(www\.)?', '', website).split('/')[0] if website.startswith('http') else '',
            'music_receptive': 'No'
        }
    if 'Community TV' in category:
        return {
            'suitability': 'Not Suitable (Community Television Channel)',
            'recommended_action': 'Skip - TV broadcast channel, not radio',
            'contact_email': 'info@' + re.sub(r'^https?://(www\.)?', '', website).split('/')[0] if website.startswith('http') else '',
            'music_receptive': 'No'
        }
    if 'Sports' in category:
        return {
            'suitability': 'Not Suitable (Sports Talk Radio)',
            'recommended_action': 'Skip - 100% sports commentary and talk',
            'contact_email': 'info@' + re.sub(r'^https?://(www\.)?', '', website).split('/')[0] if website.startswith('http') else '',
            'music_receptive': 'No'
        }
    if 'Fine Music' in category:
        return {
            'suitability': 'Specialised (Classical / Fine Music / Opera)',
            'recommended_action': 'Skip for "Seagull" - Classical, Baroque, and Chamber music only',
            'contact_email': 'info@' + re.sub(r'^https?://(www\.)?', '', website).split('/')[0] if website.startswith('http') else '',
            'music_receptive': 'Classical Only'
        }
    if 'Religious - Christian' in category:
        return {
            'suitability': 'Specialised (Christian Radio)',
            'recommended_action': 'Low Priority - Programs Christian contemporary & worship music',
            'contact_email': 'info@' + re.sub(r'^https?://(www\.)?', '', website).split('/')[0] if website.startswith('http') else '',
            'music_receptive': 'Christian Music Only'
        }
    if 'Religious - Islamic' in category or 'Ethnic' in category:
        return {
            'suitability': 'Specialised (Multilingual / Ethnic Community)',
            'recommended_action': 'Low Priority - Language-specific community programming',
            'contact_email': 'info@' + re.sub(r'^https?://(www\.)?', '', website).split('/')[0] if website.startswith('http') else '',
            'music_receptive': 'Ethnic / World'
        }
    if 'Senior' in category:
        return {
            'suitability': 'Specialised (Nostalgia / Golden Oldies)',
            'recommended_action': 'Low Priority - Plays 1940s-1960s big band, jazz, easy listening',
            'contact_email': 'info@' + re.sub(r'^https?://(www\.)?', '', website).split('/')[0] if website.startswith('http') else '',
            'music_receptive': 'Nostalgia / Oldies'
        }
    if 'Torres Strait Islanders' in category or ('Indigenous' in category and any(k in name.lower() for k in ['boigu', 'amata', 'paw', 'teabba', 'pakam', 'wangki', 'prk'])):
        return {
            'suitability': 'Remote Indigenous Community Radio',
            'recommended_action': 'Best submitted via Amrap (broadcasters download tracks directly from Amrap)',
            'contact_email': 'admin@' + re.sub(r'^https?://(www\.)?', '', website).split('/')[0] if website.startswith('http') and 'facebook' not in website else '',
            'music_receptive': 'Yes (Via Amrap)'
        }

    # 2. Check if already in high-priority curated list
    # Look up in email stations or web stations
    return {
        'suitability': 'Regional Community Radio (General Music / Aussie Rock)',
        'recommended_action': 'Pitch via Email or Amrap (Local volunteer DJs play Aussie indie)',
        'contact_email': 'info@' + re.sub(r'^https?://(www\.)?', '', website).split('/')[0] if website.startswith('http') and 'facebook' not in website else '',
        'music_receptive': 'Yes'
    }

def main():
    # Load raw stations
    raw_path = 'data/cbaa_stations_raw.tsv'
    with open(raw_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        raw_stations = list(reader)

    # Load curated email stations
    email_path = 'data/australian_radio_music_pitch_emails.csv'
    curated_emails = {}
    if os.path.exists(email_path):
        with open(email_path, 'r', encoding='utf-8') as f:
            for r in csv.DictReader(f):
                cs = (r.get('Callsign') or r.get('callsign') or '').strip().lower()
                nm = (r.get('Station Name') or r.get('name') or '').strip().lower()
                st = (r.get('State') or r.get('state') or '').strip().lower()
                
                rec = {
                    'callsign': cs,
                    'name': nm,
                    'state': st,
                    'email': r.get('Contact Email') or r.get('email') or '',
                    'website': r.get('Website URL') or r.get('website') or '',
                    'pitch_category': r.get('Region / Pitch Category') or r.get('pitch_category') or '',
                    'contact_role': r.get('contact_role') or 'Music Department',
                    'pitch_notes': r.get('Recommended Action / Pitch Notes') or r.get('pitch_notes') or ''
                }
                if cs:
                    curated_emails[cs] = rec
                if nm:
                    curated_emails[nm] = rec

    # Load curated web stations
    web_path = 'data/australian_radio_web_submissions.csv'
    curated_webs = {}
    if os.path.exists(web_path):
        with open(web_path, 'r', encoding='utf-8') as f:
            for r in csv.DictReader(f):
                cs = (r.get('Callsign') or r.get('callsign') or '').strip().lower()
                nm = (r.get('Station Name') or r.get('name') or '').strip().lower()
                rec = {
                    'callsign': cs,
                    'name': nm,
                    'submission_type': r.get('Submission Type') or r.get('submission_type') or '',
                    'submission_url': r.get('Submission URL') or r.get('submission_url') or '',
                    'guidelines': r.get('Guidelines & File Requirements') or r.get('guidelines') or '',
                    'backup_email': r.get('Backup / Inquiries Email') or r.get('backup_email') or ''
                }
                if cs:
                    curated_webs[cs] = rec
                if nm:
                    curated_webs[nm] = rec

    master_records = []
    
    for row in raw_stations:
        callsign = row['Callsign'].strip()
        name = row['On Air Name'].strip()
        state = row['State'].strip()
        city = row['City'].strip()
        postcode = row['Postcode'].strip()
        category = row['Community of Interest'].strip()
        website = row['Website'].strip()

        cs_low = callsign.lower()
        name_low = name.lower()

        # Check if curated email station (must match callsign or both name and state)
        curated_email = None
        if cs_low and cs_low in curated_emails:
            c = curated_emails[cs_low]
            if not c.get('state') or c.get('state').lower() == state.lower():
                curated_email = c
        if not curated_email and name_low in curated_emails:
            c = curated_emails[name_low]
            if not c.get('state') or c.get('state').lower() == state.lower():
                curated_email = c

        curated_web = None
        if cs_low and cs_low in curated_webs:
            curated_web = curated_webs[cs_low]
        elif name_low in curated_webs:
            curated_web = curated_webs[name_low]

        if curated_web:
            submission_method = f"Web Portal: {curated_web['submission_type']}"
            target_email = curated_web.get('backup_email', '')
            submission_url = curated_web['submission_url']
            suitability = 'High Priority (Major Youth / Alternative Tastemaker)'
            action = f"Submit via form at: {submission_url}"
            music_receptive = 'Yes (Web Form)'
            notes = curated_web['guidelines']
        elif curated_email:
            submission_method = 'Direct Email Pitch'
            target_email = curated_email['email']
            submission_url = curated_email['website']
            suitability = f"High Priority ({curated_email['pitch_category']})"
            action = f"Pitch directly to {curated_email['contact_role']} ({curated_email['email']})"
            music_receptive = 'Yes (Direct Email)'
            notes = curated_email['pitch_notes']
        else:
            derived = derive_email_and_fit(row)
            submission_method = 'Email or Amrap' if derived['music_receptive'] == 'Yes' else 'N/A'
            target_email = derived['contact_email']
            submission_url = website
            suitability = derived['suitability']
            action = derived['recommended_action']
            music_receptive = derived['music_receptive']
            notes = f"Format: {category}. Community broadcaster for {city} {state}."

        master_records.append({
            'Callsign': callsign,
            'Station Name': name,
            'State': state,
            'City': city,
            'Postcode': postcode,
            'Community of Interest': category,
            'Suitability for Love Banana': suitability,
            'Music Receptive': music_receptive,
            'Submission Method': submission_method,
            'Contact Email': target_email,
            'Website / Portal URL': submission_url,
            'Recommended Action': action,
            'Notes': notes
        })

    # Write master file
    out_paths = [
        'data/australian_community_radio_master_329_stations.csv',
        'australian_community_radio_master_329_stations.csv'
    ]
    
    fieldnames = [
        'Callsign', 'Station Name', 'State', 'City', 'Postcode',
        'Community of Interest', 'Suitability for Love Banana', 'Music Receptive',
        'Submission Method', 'Contact Email', 'Website / Portal URL',
        'Recommended Action', 'Notes'
    ]

    for p in out_paths:
        with open(p, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for r in master_records:
                writer.writerow(r)
        print(f"Successfully wrote all {len(master_records)} stations to {p}")

    # Print summary breakdown
    status_counts = {}
    for r in master_records:
        s = r['Suitability for Love Banana']
        status_counts[s] = status_counts.get(s, 0) + 1
    
    print("\nBreakdown of all 329 stations:")
    for k, v in sorted(status_counts.items(), key=lambda x: -x[1]):
        print(f"  {k}: {v}")

if __name__ == '__main__':
    main()
