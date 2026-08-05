const TENDERS = [];

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
