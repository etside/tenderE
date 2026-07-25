const TENDERS = [
  {
    "title": "Supply and Installation of Router, Firewall, Aggregation Switch, Server Farm Switch and Other Network Equipments for Prime Minister Office (PMO)",
    "org": "Bangladesh Computer Council",
    "district": "Dhaka",
    "date": "2026-07-21",
    "source": "BCC",
    "source_url": "https://bcc.gov.bd/pages/tenders",
    "pdf_url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bcc/2026/6/6a977d2c-62f6-4549-b937-706e2312f531.pdf",
    "view_url": "",
    "id": 1,
    "category": "ICT Infrastructure"
  },
  {
    "title": "Procurement of Tertiary Internet Services for High Level Redundancy of NDC & e-Govt. Network",
    "org": "Bangladesh Computer Council",
    "district": "Dhaka",
    "date": "2026-07-15",
    "source": "BCC",
    "source_url": "https://bcc.gov.bd/pages/tenders",
    "pdf_url": "",
    "view_url": "",
    "id": 2,
    "category": "ICT Infrastructure"
  },
  {
    "title": "Supply & Installation of the UPS & Power System for DC1",
    "org": "Bangladesh Computer Council",
    "district": "Dhaka",
    "date": "2026-07-02",
    "source": "BCC",
    "source_url": "https://bcc.gov.bd/pages/tenders",
    "pdf_url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bcc/2026/6/e76f3b8a-b852-4759-9132-380c417db43e.pdf",
    "view_url": "",
    "id": 3,
    "category": "ICT Services"
  },
  {
    "title": "Renewal of Oracle Database for NDC Managed Database Service.",
    "org": "Bangladesh Computer Council",
    "district": "Dhaka",
    "date": "2026-06-29",
    "source": "BCC",
    "source_url": "https://bcc.gov.bd/pages/tenders",
    "pdf_url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bcc/2026/5/18f9e4db-599c-4079-a8cc-1964af57f97c.pdf",
    "view_url": "",
    "id": 4,
    "category": "AI & Data"
  },
  {
    "title": "Procurement of Feasibility Study for the expansion of government`s video conferencing platform of BCC",
    "org": "Bangladesh Computer Council",
    "district": "Dhaka",
    "date": "2026-06-25",
    "source": "BCC",
    "source_url": "https://bcc.gov.bd/pages/tenders",
    "pdf_url": "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-bcc/2026/5/4bde72ee-a8a7-482e-b8b6-0f73859cc024.pdf",
    "view_url": "",
    "id": 5,
    "category": "Software & Web"
  }
];

const CATEGORIES = ["All", "Software & Web", "AI & Data", "Consulting", "ICT Infrastructure", "ICT Services"];
const DISTRICTS = ["All Districts","Dhaka","Chittagong","Sylhet","Rajshahi","Khulna","Barisal","Cox's Bazar"];
const SOURCES = ["All Sources","ICT Division (a2i)","BCC","BTRC","BTCL","DoICT","BHTPA"];

function badgeClass(cat) {
  return {
    "Software & Web": "badge-software",
    "AI & Data": "badge-ai",
    "Consulting": "badge-consulting",
    "ICT Infrastructure": "badge-infra",
    "ICT Services": "badge-services",
  }[cat] || "badge-services";
}

function daysLeft(deadline) {
  return Math.ceil((new Date(deadline) - new Date()) / 86400000);
}

function deadlineLabel(deadline) {
  const d = daysLeft(deadline);
  if (d < 0) return `<span class="deadline urgent">Expired</span>`;
  if (d <= 5) return `<span class="deadline urgent">⚠ ${d} days left</span>`;
  if (d <= 14) return `<span class="deadline warning">⏳ ${d} days left</span>`;
  return `<span class="deadline normal">📅 ${d} days left</span>`;
}

function renderCard(t) {
  const pdfBtn = t.pdf_url ? `<a href="${t.pdf_url}" target="_blank" class="btn-sm" style="background:var(--accent);color:#1a1a1a;margin-right:6px">📄 PDF</a>` : '';
  return `
  <div class="tender-card">
    <div class="card-top">
      <span class="card-badge ${badgeClass(t.category)}">${t.category}</span>
      <span class="card-source">${t.source}</span>
    </div>
    <h3><a href="detail.html?id=${t.id}">${t.title}</a></h3>
    <div class="card-meta">
      <span>🏢 ${t.org}</span>
      <span>📅 Published: ${t.date}</span>
    </div>
    <div class="card-footer">
      ${deadlineLabel(t.date)}
      <div style="display:flex;gap:6px">
        ${pdfBtn}
        <a href="detail.html?id=${t.id}" class="btn-sm">Details</a>
      </div>
    </div>
  </div>`;
}

function renderRow(t) {
  return `
  <tr>
    <td class="title-cell"><a href="detail.html?id=${t.id}">${t.title}</a></td>
    <td><span class="card-badge ${badgeClass(t.category)}">${t.category}</span></td>
    <td>${t.org}</td>
    <td>${t.source}</td>
    <td>${t.date}</td>
    <td>${t.pdf_url ? `<a href="${t.pdf_url}" target="_blank" class="btn-sm" style="background:var(--accent);color:#1a1a1a">📄 PDF</a>` : '<a href="detail.html?id='+t.id+'" class="btn-sm">View</a>'}</td>
  </tr>`;
}

function filterTenders({ query="", category="All", district="All Districts", source="All Sources", sort="newest" } = {}) {
  let list = TENDERS.filter(t => {
    const q = query.toLowerCase();
    const matchQ = !q || t.title.toLowerCase().includes(q) || t.org.toLowerCase().includes(q) || t.source.toLowerCase().includes(q);
    const matchC = category === "All" || t.category === category;
    const matchD = district === "All Districts" || t.district === district;
    const matchS = source === "All Sources" || t.source === source;
    return matchQ && matchC && matchD && matchS;
  });
  if (sort === "newest") list.sort((a,b) => b.date.localeCompare(a.date));
  if (sort === "deadline") list.sort((a,b) => a.date.localeCompare(b.date));
  return list;
}
