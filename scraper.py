"""
Scrapes real ICT/software/AI tenders from Bangladesh government websites.
Filters for engineersTech-relevant scope: software, web, mobile, AI, ICT, consulting.
Runs daily via GitHub Actions and updates tenders.json + data.js.
"""
import urllib.request, re, ssl, json, html as htmlmod, datetime, pathlib, sys

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

SOURCES = [
    {"name": "ICT Division (a2i)",    "org": "ICT Division / a2i",                    "url": "https://ictd.gov.bd/pages/tenders",  "district": "Dhaka"},
    {"name": "BCC",                   "org": "Bangladesh Computer Council",            "url": "https://bcc.gov.bd/pages/tenders",   "district": "Dhaka"},
    {"name": "BTRC",                  "org": "Bangladesh Telecommunication Regulatory Commission", "url": "https://btrc.gov.bd/pages/tenders", "district": "Dhaka"},
    {"name": "BTCL",                  "org": "Bangladesh Telecommunications Company Ltd", "url": "https://btcl.gov.bd/pages/tenders", "district": "Dhaka"},
    {"name": "DoICT",                 "org": "Department of ICT",                      "url": "https://doict.gov.bd/pages/tenders", "district": "Dhaka"},
    {"name": "BHTPA",                 "org": "Bangladesh Hi-Tech Park Authority",      "url": "https://bhtpa.gov.bd/pages/tenders", "district": "Dhaka"},
]

# Keywords that match engineersTech scope
RELEVANT_KEYWORDS = [
    "software", "web", "mobile", "app", "application", "system", "platform",
    "digital", "ict", "it ", "i.t.", "network", "internet", "bandwidth",
    "server", "cloud", "database", "data", "ai ", "artificial intelligence",
    "machine learning", "automation", "portal", "website", "e-service",
    "e-government", "e-gp", "e-tender", "consultant", "consultancy",
    "development", "design", "programming", "cybersecurity", "security",
    "siem", "vapt", "erp", "crm", "mis", "eoi", "rfp", "expression of interest",
    "fiber", "optical", "telecom", "connectivity", "infrastructure monitoring",
    "scanning", "sensor", "monitoring system", "maintenance service",
]

def fetch(url):
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,*/*;q=0.9",
        })
        return urllib.request.urlopen(req, timeout=15, context=ctx).read().decode("utf-8", "ignore")
    except Exception as e:
        print(f"  FETCH ERROR {url}: {e}", file=sys.stderr)
        return ""

def clean(s):
    s = htmlmod.unescape(s)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s)).strip()

def is_relevant(title):
    t = title.lower()
    return any(kw in t for kw in RELEVANT_KEYWORDS)

def parse_date(s):
    """Normalize date to YYYY-MM-DD"""
    s = s.strip()
    for fmt in ("%m/%d/%Y", "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except: pass
    return s

def scrape_source(source):
    print(f"Scraping {source['name']}...")
    d = fetch(source["url"])
    if len(d) < 1000:
        print(f"  No data returned")
        return []

    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", d, re.S)
    results = []
    for r in rows:
        cells = re.findall(r"<td[^>]*>(.*?)</td>", r, re.S)
        if len(cells) < 2:
            continue

        # Find title: longest cell text > 20 chars, not just digits
        title = ""
        for c in cells:
            t = clean(c)
            if len(t) > 20 and not re.match(r"^[\d\s।৳]+$", t):
                title = t
                break

        if not title or len(title) < 20:
            continue

        # Filter for engineersTech relevance
        if not is_relevant(title):
            continue

        date_match = re.search(r"(\d{1,2}/\d{1,2}/\d{4}|\d{4}-\d{2}-\d{2})", r)
        raw_date = date_match.group(1) if date_match else ""
        date = parse_date(raw_date) if raw_date else datetime.date.today().isoformat()

        pdf_links = re.findall(r'href=["\']([^"\']+\.pdf[^"\']*)["\']', r, re.I)
        page_links = re.findall(r'href=["\']([^"\']+)["\']', r)
        view_link = next((l for l in page_links if "view" in l.lower() or "detail" in l.lower()), "")

        results.append({
            "title": title[:250],
            "org": source["org"],
            "district": source["district"],
            "date": date,
            "source": source["name"],
            "source_url": source["url"],
            "pdf_url": pdf_links[0] if pdf_links else "",
            "view_url": view_link,
        })

    print(f"  Found {len(results)} relevant tenders")
    return results

def main():
    all_tenders = []
    for source in SOURCES:
        all_tenders.extend(scrape_source(source))

    # Deduplicate by title similarity
    seen = set()
    unique = []
    for t in all_tenders:
        key = re.sub(r"\W+", "", t["title"][:60].lower())
        if key not in seen:
            seen.add(key)
            unique.append(t)

    # Sort newest first
    unique.sort(key=lambda x: x["date"], reverse=True)

    # Assign IDs
    for i, t in enumerate(unique, 1):
        t["id"] = i

    # Categorize
    def categorize(title):
        t = title.lower()
        if any(k in t for k in ["software", "app", "application", "portal", "website", "web ", "mobile", "erp", "crm", "mis", "platform", "system development", "e-service"]):
            return "Software & Web"
        if any(k in t for k in ["ai ", "artificial intelligence", "machine learning", "data", "analytics", "automation"]):
            return "AI & Data"
        if any(k in t for k in ["consultant", "consultancy", "eoi", "rfp", "expression of interest", "advisory"]):
            return "Consulting"
        if any(k in t for k in ["network", "server", "cloud", "fiber", "optical", "telecom", "bandwidth", "internet", "connectivity", "infrastructure", "equipment", "hardware", "scanning", "sensor", "monitoring"]):
            return "ICT Infrastructure"
        return "ICT Services"

    for t in unique:
        t["category"] = categorize(t["title"])

    # Save tenders.json
    out_path = pathlib.Path("tenders.json")
    out_path.write_text(json.dumps(unique, ensure_ascii=False, indent=2))
    print(f"\nSaved {len(unique)} tenders to tenders.json")

    # Rebuild data.js
    import subprocess
    subprocess.run(["python3", "build.py"], check=True)

if __name__ == "__main__":
    main()
