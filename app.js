const DATA = (window.RAIL_DATA && window.RAIL_DATA.records) || [];
const META = (window.RAIL_DATA) || {};
const MATERIALS = (window.RAIL_MATERIALS && window.RAIL_MATERIALS.grades) || {};

const state = {
  query: "",
  region: "",
  category: "",
  sort: "popularity",
  selected: new Set(),
  materials: {},
};

const MAX_COMPARE = 3;

const els = {
  search: document.getElementById("search"),
  regionFilter: document.getElementById("regionFilter"),
  categoryFilter: document.getElementById("categoryFilter"),
  sortSelect: document.getElementById("sortSelect"),
  railRows: document.getElementById("railRows"),
  resultCount: document.getElementById("resultCount"),
  emptyState: document.getElementById("emptyState"),
  detailPanel: document.getElementById("detailPanel"),
  detailEmpty: document.getElementById("detailEmpty"),
  detailContent: document.getElementById("detailContent"),
  compareOutlines: document.getElementById("compareOutlines"),
  compareBand: document.getElementById("compareBand"),
  compareRows: document.getElementById("compareRows"),
  compareStatus: document.getElementById("compareStatus"),
  clearCompare: document.getElementById("clearCompare"),
  closeCompare: document.getElementById("closeCompare"),
  resetFilters: document.getElementById("resetFilters"),
};

function icon(name) {
  const paths = {
    check: '<path d="M5 12l4 4L19 6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ""}</svg>`;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

const CATEGORY_PRIORITY = {
  "GB / YB": 0,
  "DIN": 1,
  "UIC / EN": 2,
  "GOST": 3,
  "JIS": 4,
  "BS": 5,
  "AREMA / ASTM / ASCE": 6,
  "IRS / IS 3443": 7,
  "ISCOR": 8,
  "ARBED / MRS": 9,
  "AS / BHP": 10,
  "PN": 11,
};

const HOT_RANK = {
  "p60": 1,
  "uic-60": 2,
  "uic-60e2": 3,
  "gost-p65": 4,
  "p50": 5,
  "uic-50": 6,
  "gost-p50": 7,
  "din-s49": 8,
  "din-s49t-49e2": 9,
  "gb-t-2585-43kg": 10,
  "din-s41-r10": 11,
  "din-s41-r14": 12,
  "gb-t-2585-38kg": 13,
  "uic-54": 14,
  "uic-54e": 15,
  "din-s54": 16,
  "gb-t-2585-75kg": 17,
  "qu70": 18,
  "qu80": 19,
  "qu100": 20,
  "qu120": 21,
  "gb-t-11264-8kg": 22,
  "gb-t-11264-9kg": 23,
  "gb-t-11264-12kg": 24,
  "gb-t-11264-15kg": 25,
  "gb-t-11264-22kg": 26,
  "gb-t-11264-24kg": 27,
  "gb-t-11264-30kg": 28,
  "gb-t-11264-6kg": 29,
  "a55": 30,
  "a65": 31,
  "a75": 32,
  "a100": 33,
  "a120": 34,
  "a150": 35,
  "a45": 36,
  "jis-15kg": 37,
  "jis-22kg": 38,
  "jis-30a": 39,
  "jis-50n": 40,
  "jis-60kg": 41,
  "jis-40n": 42,
  "jis-37a": 43,
  "jis-50kg": 44,
  "jis-12kg": 45,
  "arema-115-area": 46,
  "arema-136-area": 47,
  "arema-133-area": 48,
  "arema-132-area-aus-66kg": 49,
  "arema-131-area": 50,
  "arema-140-area": 51,
  "arema-119-area": 52,
  "arema-100-area": 53,
  "arema-100-araa": 54,
  "arema-100-arab": 55,
  "arema-90-araa": 56,
  "asce-60": 57,
  "asce-75": 58,
  "asce-80": 59,
  "asce-85": 60,
  "asce-70": 61,
};

function popularityRank(record) {
  if (HOT_RANK[record.id] !== undefined) return HOT_RANK[record.id];
  const categoryRank = CATEGORY_PRIORITY[record.category] ?? 12;
  const isASeries = record.category === "DIN" && /^A\d/.test(record.model);
  const aRank = record.category === "DIN" ? (isASeries ? 0 : 1) : 0;
  return 1000 + categoryRank * 100 + aRank * 10 + Math.min(99, record.mass_kg_m || 0);
}

function buildFilters() {
  const regions = uniqueSorted(DATA.map((r) => r.region));
  const categories = uniqueSorted(DATA.map((r) => r.category));

  els.regionFilter.insertAdjacentHTML(
    "beforeend",
    regions.map((r) => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join("")
  );
  els.categoryFilter.insertAdjacentHTML(
    "beforeend",
    categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")
  );
}

function filtered() {
  const q = state.query.trim().toLowerCase();
  let rows = DATA.filter((r) => {
    const matchesQuery =
      !q ||
      r.model.toLowerCase().includes(q) ||
      r.standard.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q);
    const matchesRegion = !state.region || r.region === state.region;
    const matchesCategory = !state.category || r.category === state.category;
    return matchesQuery && matchesRegion && matchesCategory;
  });

  rows = [...rows].sort((a, b) => {
    if (state.sort === "popularity") {
      const diff = popularityRank(a) - popularityRank(b);
      if (diff !== 0) return diff;
      return a.model.localeCompare(b.model);
    }
    if (state.sort === "mass-desc") return b.mass_kg_m - a.mass_kg_m;
    if (state.sort === "model-asc") return a.model.localeCompare(b.model);
    return a.mass_kg_m - b.mass_kg_m;
  });

  return rows;
}

function renderRows() {
  const rows = filtered();
  els.railRows.innerHTML = rows
    .map((r) => {
      const selected = state.selected.has(r.id);
      return `
        <tr data-id="${escapeHtml(r.id)}" class="${selected ? "selected" : ""}">
          <td class="col-compare">
            <button class="compare-check ${selected ? "checked" : ""}" data-compare="${escapeHtml(r.id)}" type="button" aria-label="Compare ${escapeHtml(r.model)}">
              ${selected ? icon("check") : ""}
            </button>
          </td>
          <td class="model">${escapeHtml(r.model)}${r.cn_replacement ? `<span class="alt-badge" title="Approximate GB substitute">GB alt</span>` : ""}</td>
          <td class="standard">${escapeHtml(r.standard)}</td>
          <td><span class="region">${escapeHtml(r.region)}</span></td>
          <td class="num">${formatNumber(r.base_mm)}</td>
          <td class="num">${formatNumber(r.head_mm)}</td>
          <td class="num">${formatNumber(r.height_mm)}</td>
          <td class="num">${formatNumber(r.mass_kg_m)}</td>
          <td>
            <a class="drawing-link" href="${escapeHtml(r.drawing_url || "#")}" target="_blank" rel="noopener" ${r.drawing_url ? "" : "aria-disabled=\"true\""}>
              ${icon("download")} PDF
            </a>
          </td>
        </tr>`;
    })
    .join("");

  els.emptyState.hidden = rows.length !== 0;
  els.resultCount.textContent = `${rows.length} of ${DATA.length} profiles`;
  updateCompareStatus();
}

function renderDetail(record) {
  if (!record) {
    state.activeDetailId = null;
    els.detailEmpty.hidden = false;
    els.detailContent.hidden = true;
    return;
  }
  state.activeDetailId = record.id;
  els.detailEmpty.hidden = true;
  els.detailContent.hidden = false;

  const hasDimensions = Boolean(record.has_dimensions);
  const specGrid = hasDimensions
    ? `
      <div class="spec-grid">
        <div class="spec-item"><span class="label">Base width</span><span class="value">${formatNumber(record.base_mm)} mm</span></div>
        <div class="spec-item"><span class="label">Head width</span><span class="value">${formatNumber(record.head_mm)} mm</span></div>
        <div class="spec-item"><span class="label">Height</span><span class="value">${formatNumber(record.height_mm)} mm</span></div>
        <div class="spec-item"><span class="label">Mass</span><span class="value">${formatNumber(record.mass_kg_m)} kg/m</span></div>
      </div>`
    : "";

  const schematicBlock = hasDimensions
    ? `<div class="rail-schematic">${schematic(record)}</div>`
    : `<div class="detail-drawing-note">Dimension table is not yet available for this profile. The manufacturer drawing PDF is the primary reference.</div>`;
  const dataNote = record.data_note
    ? `<div class="data-note">${escapeHtml(record.data_note)}</div>`
    : "";

  els.detailContent.innerHTML = `
    <div class="detail-content">
      <h2>${escapeHtml(record.model)}</h2>
      <p class="detail-standard">${escapeHtml(record.standard)} · ${escapeHtml(record.category)}</p>
      ${schematicBlock}
      ${specGrid}
      ${dataNote}
      ${renderMaterials(record)}
      <div class="detail-actions">
        <a class="button" href="${escapeHtml(record.product_url)}" target="_blank" rel="noopener">${icon("external")} Product page</a>
        <a class="button" href="${escapeHtml(record.drawing_url || "#")}" target="_blank" rel="noopener">${icon("download")} Drawing PDF</a>
        <a class="button primary" href="https://forgesail.com/#form" target="_blank" rel="noopener">Request quote</a>
      </div>
      <div class="disclaimer">${escapeHtml(META.disclaimer || "Reference data only. Verify before engineering use.")}</div>
    </div>`;
}

function materialKeys(record) {
  if (Array.isArray(record.materials) && record.materials.length) return record.materials;
  const family = {
    "AREMA / ASTM / ASCE": ["900a", "r260", "r350ht"],
    "UIC / EN": ["900a", "r260", "r350ht"],
    "DIN": ["900a", "r260", "r350ht"],
    "GOST": ["u71mn", "u75v"],
    "JIS": ["900a", "r260", "r350ht"],
    "BS": ["900a", "r260"],
    "IRS / IS 3443": ["u71mn", "u75v"],
    "ISCOR": ["900a", "r260"],
    "ARBED / MRS": ["900a", "r260", "r350ht"],
    "AS / BHP": ["900a", "r260"],
    "PN": ["900a", "r260"],
    "GB / YB": ["u71mn", "u75v"],
  };
  return family[record.category] || ["900a", "r260"];
}

function selectedMaterial(record) {
  const keys = materialKeys(record);
  const current = state.materials[record.id];
  return keys.includes(current) ? current : keys[0];
}

function renderMaterials(record) {
  const keys = materialKeys(record);
  const activeKey = selectedMaterial(record);
  const grade = MATERIALS[activeKey];
  if (!grade) return "";

  const chips = keys
    .map((key) => {
      const g = MATERIALS[key];
      return `<button class="material-chip ${key === activeKey ? "active" : ""}" data-material="${escapeHtml(key)}" type="button" ${g ? `title="${escapeHtml(g.standard)}"` : ""}>${escapeHtml(g ? g.label : key)}</button>`;
    })
    .join("");

  const compositionRows = Object.entries(grade.composition)
    .map(([element, value]) => `<tr><th>${escapeHtml(element)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join("");

  const replacement = record.cn_replacement
    ? `<div class="replacement-note"><strong>CN replacement</strong><span>${escapeHtml(record.cn_replacement)}</span><small>${escapeHtml(record.cn_replacement_note || "")}</small></div>`
    : "";

  return `
    <section class="material-block">
      <div class="material-head">
        <h3>Material reference</h3>
        <span>${escapeHtml(grade.standard)}</span>
      </div>
      <div class="material-chips">${chips}</div>
      <div class="property-grid">
        <div class="property"><span>Tensile</span><strong>${formatNumber(grade.tensile_mpa)} MPa</strong></div>
        <div class="property"><span>Hardness</span><strong>${escapeHtml(grade.hardness_hb)} HB</strong></div>
        <div class="property"><span>Elongation</span><strong>${formatNumber(grade.elongation_pct)}%</strong></div>
      </div>
      <table class="composition-table">
        <caption>Typical composition, % by mass</caption>
        <tbody>${compositionRows}</tbody>
      </table>
      <div class="equivalence-grid">
        <div><span>China</span><strong>${escapeHtml(grade.equivalent.CN)}</strong></div>
        <div><span>Europe</span><strong>${escapeHtml(grade.equivalent.EU)}</strong></div>
        <div><span>US</span><strong>${escapeHtml(grade.equivalent.US)}</strong></div>
      </div>
      ${replacement}
    </section>`;
}

function schematic(record) {
  const viewWidth = 260;
  const viewHeight = 180;
  const top = 22;
  const usable = 120;
  const scale = usable / Math.max(record.height_mm, record.base_mm, 1);
  const center = 130;
  const base = record.base_mm * scale;
  const head = record.head_mm * scale;
  const height = record.height_mm * scale;
  const headH = Math.max(12, height * 0.24);
  const footH = Math.max(12, height * 0.26);
  const webH = Math.max(14, height - headH - footH);
  const web = Math.min(head, base) * 0.38;

  const headX = center - head / 2;
  const outline = railPath(center, top, top + height, head, base, headH, footH, web);

  return `
    <svg viewBox="0 0 ${viewWidth} ${viewHeight}" role="img" aria-label="Schematic cross-section of ${escapeHtml(record.model)}">
      <path d="${outline}" fill="none" stroke="#0a3380" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <g font-size="10" fill="#59636b" font-family="-apple-system, Segoe UI, Roboto, sans-serif">
        <text x="${center}" y="${viewHeight - 8}" text-anchor="middle">${formatNumber(record.base_mm)} mm</text>
        <text x="${center}" y="${top - 7}" text-anchor="middle">${formatNumber(record.head_mm)} mm</text>
        <text x="${center + Math.max(base, head) / 2 + 13}" y="${top + height / 2 + 3}">${formatNumber(record.height_mm)}</text>
      </g>
      <line x1="${center + Math.max(base, head) / 2 + 7}" y1="${top}" x2="${center + Math.max(base, head) / 2 + 7}" y2="${top + height}" stroke="#59636b" stroke-width="1"/>
      <path d="M${center + Math.max(base, head) / 2 + 4} ${top + 4} L${center + Math.max(base, head) / 2 + 7} ${top} L${center + Math.max(base, head) / 2 + 10} ${top + 4}" fill="none" stroke="#59636b" stroke-width="1"/>
      <path d="M${center + Math.max(base, head) / 2 + 4} ${top + height - 4} L${center + Math.max(base, head) / 2 + 7} ${top + height} L${center + Math.max(base, head) / 2 + 10} ${top + height - 4}" fill="none" stroke="#59636b" stroke-width="1"/>
      <text x="${viewWidth / 2}" y="14" text-anchor="middle" font-size="9" fill="#8b9499">Schematic only, not to scale</text>
    </svg>`;
}

function railPath(cx, top, bottom, headWidth, baseWidth, headH, footH, webWidth) {
  const halfHead = headWidth / 2;
  const halfBase = baseWidth / 2;
  const web = Math.min(headWidth, baseWidth) * 0.34;
  const webTop = top + headH;
  const webBottom = bottom - footH;
  const left = cx - halfHead;
  const right = cx + halfHead;
  const webL = cx - web / 2;
  const webR = cx + web / 2;

  return [
    `M ${left} ${top}`,
    `L ${right} ${top}`,
    `L ${right} ${top + headH * 0.7}`,
    `Q ${cx + halfHead * 0.88} ${webTop} ${webR} ${webTop}`,
    `L ${webR} ${webBottom}`,
    `Q ${cx + web * 0.62} ${webBottom + footH * 0.3} ${cx + halfBase} ${bottom - footH * 0.42}`,
    `L ${cx + halfBase} ${bottom}`,
    `L ${cx - halfBase} ${bottom}`,
    `L ${cx - halfBase} ${bottom - footH * 0.42}`,
    `Q ${cx - web * 0.62} ${webBottom + footH * 0.3} ${webL} ${webBottom}`,
    `L ${webL} ${webTop}`,
    `Q ${cx - halfHead * 0.88} ${webTop} ${left} ${top + headH * 0.7}`,
    "Z",
  ].join(" ");
}

function renderCompare() {
  const selected = [...state.selected]
    .map((id) => DATA.find((r) => r.id === id))
    .filter(Boolean);

  if (!selected.length) {
    els.compareBand.hidden = true;
    return;
  }
  els.compareBand.hidden = false;

  const slots = [...selected];
  while (slots.length < MAX_COMPARE) slots.push(null);
  const headerExtra = slots
    .map((r) => `<th class="compare-col">${r ? escapeHtml(r.model) : ""}</th>`)
    .join("");
  const header = `<tr><th>Property</th>${headerExtra}</tr>`;

  const fields = [
    ["Standard", (r) => r.standard],
    ["Region", (r) => r.region],
    ["Base mm", (r) => formatNumber(r.base_mm)],
    ["Head mm", (r) => formatNumber(r.head_mm)],
    ["Height mm", (r) => formatNumber(r.height_mm)],
    ["Mass kg/m", (r) => formatNumber(r.mass_kg_m)],
  ];

  const body = fields
    .map(([label, get]) => {
      const cells = slots.map((r) => `<td>${r ? get(r) : ""}</td>`).join("");
      return `<tr><td>${label}</td>${cells}</tr>`;
    })
    .join("");

  const doc = document.querySelector(".compare-table");
  doc.querySelector("thead").innerHTML = header;
  els.compareRows.innerHTML = body;
  els.compareOutlines.innerHTML = selected
    .map(
      (r) => `
        <div class="compare-outline">
          <div class="compare-outline-head">
            <strong>${escapeHtml(r.model)}</strong>
            <span>${formatNumber(r.mass_kg_m)} kg/m</span>
          </div>
          ${compactSchematic(r)}
        </div>`
    )
    .join("");
}

function compactSchematic(record) {
  const width = 150;
  const height = 118;
  const top = 18;
  const usable = 72;
  const scale = usable / Math.max(record.height_mm, record.base_mm, 1);
  const center = width / 2;
  const base = record.base_mm * scale;
  const head = record.head_mm * scale;
  const railHeight = record.height_mm * scale;
  const headH = Math.max(8, railHeight * 0.24);
  const footH = Math.max(8, railHeight * 0.26);
  const webH = Math.max(8, railHeight - headH - footH);
  const web = Math.min(head, base) * 0.34;
  const headY = top;
  const dimX = center + Math.max(base, head) / 2 + 8;
  const outline = railPath(center, top, top + railHeight, head, base, headH, footH, web);

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Cross-section of ${escapeHtml(record.model)}">
      <path d="${outline}" fill="none" stroke="#0a3380" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
      <g font-size="8" fill="#52677d">
        <text x="${center}" y="${headY - 5}" text-anchor="middle">${formatNumber(record.head_mm)}</text>
        <text x="${center}" y="${height - 3}" text-anchor="middle">${formatNumber(record.base_mm)}</text>
        <text x="${dimX}" y="${top + railHeight / 2 + 2}">${formatNumber(record.height_mm)}</text>
      </g>
      <line x1="${dimX - 4}" y1="${top}" x2="${dimX - 4}" y2="${top + railHeight}" stroke="#9aa9b8" stroke-width="1"/>
    </svg>`;
}

function updateCompareStatus() {
  els.compareStatus.textContent =
    state.selected.size === 0
      ? "Compare up to 3 profiles"
      : `${state.selected.size} of ${MAX_COMPARE} selected`;
}

function toggleCompare(id, btn) {
  if (state.selected.has(id)) {
    state.selected.delete(id);
  } else {
    if (state.selected.size >= MAX_COMPARE) {
      return;
    }
    state.selected.add(id);
  }
  if (btn) {
    btn.classList.toggle("checked", state.selected.has(id));
    btn.innerHTML = state.selected.has(id) ? icon("check") : "";
  }
  const row = els.railRows.querySelector(`tr[data-id="${cssEscape(id)}"]`);
  if (row) row.classList.toggle("selected", state.selected.has(id));
  renderCompare();
  updateCompareStatus();
}

function clearCompare() {
  state.selected.clear();
  renderRows();
  renderCompare();
}

function resetFilters() {
  state.query = "";
  state.region = "";
  state.category = "";
  state.sort = "popularity";
  els.search.value = "";
  els.regionFilter.value = "";
  els.categoryFilter.value = "";
  els.sortSelect.value = "popularity";
  renderRows();
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "—";
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cssEscape(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

els.search.addEventListener("input", (e) => {
  state.query = e.target.value;
  renderRows();
});

els.regionFilter.addEventListener("change", (e) => {
  state.region = e.target.value;
  renderRows();
});

els.categoryFilter.addEventListener("change", (e) => {
  state.category = e.target.value;
  renderRows();
});

els.sortSelect.addEventListener("change", (e) => {
  state.sort = e.target.value;
  renderRows();
});

els.resetFilters.addEventListener("click", resetFilters);

els.railRows.addEventListener("click", (e) => {
  const compareBtn = e.target.closest("[data-compare]");
  if (compareBtn) {
    e.stopPropagation();
    toggleCompare(compareBtn.dataset.compare, compareBtn);
    return;
  }

  const drawingLink = e.target.closest("a.drawing-link");
  if (drawingLink) {
    e.stopPropagation();
    return;
  }

  const row = e.target.closest("tr[data-id]");
  if (row) {
    const record = DATA.find((r) => r.id === row.dataset.id);
    renderDetail(record);
  }
});

els.detailContent.addEventListener("click", (e) => {
  const chip = e.target.closest("[data-material]");
  if (!chip) return;
  const record = DATA.find((r) => r.id === state.activeDetailId);
  if (record) {
    state.materials[record.id] = chip.dataset.material;
    renderDetail(record);
  }
});

els.clearCompare.addEventListener("click", clearCompare);
els.closeCompare.addEventListener("click", clearCompare);
buildFilters();
renderRows();
renderDetail(null);
