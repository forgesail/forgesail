const FASTENING = (window.FASTENING_DATA && window.FASTENING_DATA.records) || [];
const RAILS = (window.RAIL_DATA && window.RAIL_DATA.records) || [];

const form = document.getElementById("configForm");
const railSelect = document.getElementById("railSelect");
const resultTitle = document.getElementById("resultTitle");
const dutyBadge = document.getElementById("dutyBadge");
const drawingLink = document.getElementById("drawingLink");
const componentGrid = document.getElementById("componentGrid");
const quoteLink = document.getElementById("quoteLink");

const APPLICATION_NOTES = {
  "Container terminal": "Frequent heavy passes and corrosive coastal conditions. Prioritize lateral restraint and corrosion protection.",
  "Steel mill": "High temperature and impact loads. Welded or high-side-load clips are usually preferred.",
  "Warehouse & logistics": "Standard duty, long straight runs and moderate side loads.",
  "Shipyard & mining": "Heavy wheel loads and rough service. Review welded clips and continuous sole plates.",
};

const BASE_RULES = {
  "Concrete runway": {
    plate: "Continuous sole plate",
    note: "Drilled to the project rail pitch, supplied to drawing.",
  },
  "Steel girder": {
    plate: "Welded base plate",
    note: "Pre-drilled and tapped for the clip bolt pattern.",
  },
  "Grout bed": {
    plate: "Continuous sole plate",
    note: "Set on a leveling grout bed before final anchoring.",
  },
  "Existing track retrofit": {
    plate: "Individual base plates",
    note: "Machined to the existing hole pattern for replacement.",
  },
};

function icon(name) {
  const paths = {
    external: '<path d="M14 4h6v6M20 4l-9 9M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ""}</svg>`;
}

function selectedValues() {
  const formData = new FormData(form);
  return {
    rail: railSelect.value,
    application: formData.get("application"),
    base: formData.get("base"),
    duty: formData.get("duty"),
  };
}

function findFastening(rail) {
  return FASTENING.find((r) => r.rail_type === rail) || FASTENING[0];
}

function findRailGeometry(railType) {
  const exact = RAILS.find((r) => r.model === railType);
  if (exact) return exact;
  const normalized = railType.replace(/[-_]/g, "").toLowerCase();
  const fuzzy = RAILS.find((r) => r.model.replace(/[-_]/g, "").toLowerCase() === normalized);
  return fuzzy || null;
}

function populateRails() {
  railSelect.innerHTML = FASTENING.map(
    (r) => `<option value="${escapeHtml(r.rail_type)}">${escapeHtml(r.rail_type)} · ${escapeHtml(r.standard)} · ${formatNumber(r.weight_kg_m)} kg/m</option>`
  ).join("");
}

function plateRecommendation(base) {
  return BASE_RULES[base] || BASE_RULES["Concrete runway"];
}

function render() {
  const values = selectedValues();
  const fastening = findFastening(values.rail);
  const rail = findRailGeometry(values.rail);
  const plate = plateRecommendation(values.base);

  resultTitle.textContent = `${values.rail} · ${values.application}`;
  dutyBadge.textContent = values.duty;

  const clip = fastening.recommended_clip;
  const pad = fastening.rail_pad;
  const bolt = fastening.bolt_spec;
  const install = fastening.installation_method;

  drawingLink.href = fastening.drawing_url || "#";

  componentGrid.innerHTML = `
    <div class="component-card">
      <span class="label">Rail clip</span>
      <span class="value">${escapeHtml(clip)}</span>
      <span class="meta">${escapeHtml(install)} · ${formatNumber(fastening.side_load_kN)} kN lateral</span>
      <a class="meta" href="https://forgesail.com/products/rail-clips/" target="_blank" rel="noopener">${escapeHtml(fastening.standard)} compatible</a>
    </div>
    <div class="component-card">
      <span class="label">Rail pad</span>
      <span class="value">${escapeHtml(pad)}</span>
      <span class="meta">Vibration and track protection</span>
      <a class="meta" href="https://forgesail.com/products/rail-pads/" target="_blank" rel="noopener">Pad series</a>
    </div>
    <div class="component-card">
      <span class="label">Sole plate</span>
      <span class="value">${escapeHtml(plate.plate)}</span>
      <span class="meta">${escapeHtml(plate.note)}</span>
      <a class="meta" href="https://forgesail.com/products/sole-plates/" target="_blank" rel="noopener">Base plates</a>
    </div>
    <div class="component-card">
      <span class="label">Bolt set</span>
      <span class="value">${escapeHtml(bolt)}</span>
      <span class="meta">${escapeHtml(install)} · corrosion-protected</span>
      <a class="meta" href="https://forgesail.com/products/rail-clips/" target="_blank" rel="noopener">Part source</a>
    </div>`;

  const note = APPLICATION_NOTES[values.application] || "";
  document.querySelector(".engineering-note").textContent =
    `${note} Part numbers, pad suffixes, bolt grades and side-load values come from the published ForgeSail reference. Confirm final sizes, anchor spacing and load capacity with ForgeSail engineering.`;

  syncUrl(values);
}

function assemblySvg({ rail, fallback, clip, pad, bolt, plateType, base }) {
  const baseWidth = rail ? rail.base_mm : fallback.rail_base_width_mm;
  const headWidth = rail ? rail.head_mm : Math.max(45, fallback.rail_base_width_mm * 0.52);
  const railHeight = rail ? rail.height_mm : Math.max(baseWidth * 0.85, fallback.rail_base_width_mm * 0.9);

  const maxDim = Math.max(baseWidth, railHeight);
  const scale = Math.min(145 / maxDim, 2.2);
  const bw = baseWidth * scale;
  const hw = headWidth * scale;
  const rh = railHeight * scale;

  const cx = 360;
  const plateTop = 240;
  const railTop = plateTop - rh - 10;
  const padTop = plateTop - 8;
  const plateH = 24;
  const supportTop = plateTop + plateH;

  const clipH = Math.max(28, rh * 0.42);
  const clipW = Math.max(20, bw * 0.28);
  const clipY = railTop + rh * 0.42;

  return `
    <svg viewBox="0 0 720 360" role="img" aria-label="Schematic crane rail fastening assembly">
      <rect x="55" y="${supportTop}" width="610" height="76" rx="4" fill="#b8c1c5" stroke="#7d898f" stroke-width="2"/>
      <rect x="${cx - bw / 2 - 36}" y="${plateTop}" width="${bw + 72}" height="${plateH}" rx="3" fill="#718087" stroke="#4c5a60" stroke-width="2"/>
      <rect x="${cx - bw / 2 - 8}" y="${padTop}" width="${bw + 16}" height="8" rx="2" fill="#d98f4a" stroke="#9a5d20" stroke-width="1.5"/>
      <path d="${railPath(cx, railTop, hw, bw, rh)}" fill="#3c4b52" stroke="#222b30" stroke-width="2"/>

      <path d="${clipPath(cx - bw / 2 - 3, clipY, clipW, clipH, true)}" fill="#d65a1e" stroke="#8f3510" stroke-width="2"/>
      <path d="${clipPath(cx + bw / 2 + 3, clipY, clipW, clipH, false)}" fill="#d65a1e" stroke="#8f3510" stroke-width="2"/>

      <g stroke="#7a5b24" stroke-width="2">
        <line x1="${cx - bw / 2 - 24}" y1="${clipY + clipH * 0.2}" x2="${cx - bw / 2 - 24}" y2="${plateTop + plateH}"/>
        <line x1="${cx + bw / 2 + 24}" y1="${clipY + clipH * 0.2}" x2="${cx + bw / 2 + 24}" y2="${plateTop + plateH}"/>
      </g>
      <rect x="${cx - bw / 2 - 31}" y="${clipY + clipH * 0.02}" width="14" height="10" rx="2" fill="#b28a3f" stroke="#7a5b24" stroke-width="2"/>
      <rect x="${cx + bw / 2 + 17}" y="${clipY + clipH * 0.02}" width="14" height="10" rx="2" fill="#b28a3f" stroke="#7a5b24" stroke-width="2"/>

      <text x="${cx}" y="31" text-anchor="middle" font-size="14" font-weight="700" fill="#20272b">${escapeHtml(rail ? rail.model : fallback.rail_type)} · ${escapeHtml(plateType)}</text>
      <text x="${cx}" y="52" text-anchor="middle" font-size="11" fill="#5b646a">${escapeHtml(clip)} clip · ${escapeHtml(bolt)} bolts</text>
      <text x="${cx}" y="${supportTop + 46}" text-anchor="middle" font-size="12" fill="#4c5a60">${escapeHtml(base)}</text>
      <text x="${cx + bw / 2 + 70}" y="${railTop + rh / 2 + 4}" font-size="11" fill="#5b646a">${formatNumber(railHeight)} mm</text>
      <text x="${cx}" y="${plateTop - 2}" text-anchor="middle" font-size="10" fill="#5b646a">Rail pad · ${escapeHtml(pad)}</text>
    </svg>`;
}

function railPath(cx, top, hw, bw, rh) {
  const footH = rh * 0.2;
  const headH = rh * 0.22;
  const webW = Math.max(8, Math.min(hw, bw) * 0.34);
  const webY = top + headH;
  const webH = rh - headH - footH;
  return `M${cx - hw / 2} ${top} H${cx + hw / 2} V${top + headH} H${cx + webW / 2} V${webY + webH} H${cx + bw / 2} V${top + rh} H${cx - bw / 2} V${webY + webH} H${cx - webW / 2} V${top + headH} Z`;
}

function clipPath(x, y, w, h, left) {
  if (left) {
    return `M${x} ${y} h${w} v${h * 0.15} l${-w * 0.22} ${h * 0.55} v${h * 0.3} h${-w + w * 0.22} Z`;
  }
  return `M${x} ${y} h${-w} v${h * 0.15} l${w * 0.22} ${h * 0.55} v${h * 0.3} h${w - w * 0.22} Z`;
}

function legendMarkup() {
  const items = [
    ["#3c4b52", "Crane rail", "Selected profile"],
    ["#d65a1e", "Rail clip", "Clamps rail to plate"],
    ["#d98f4a", "Rail pad", "Protects track and base"],
    ["#718087", "Sole plate", "Distributes load"],
    ["#b8c1c5", "Support base", "Runway or girder"],
    ["#b28a3f", "Bolt set", "Anchors the assembly"],
  ];
  return items
    .map(
      ([color, label, note]) => `
        <div class="legend-item">
          <span class="legend-swatch" style="background:${color}"></span>
          <div><strong>${label}</strong><span>${note}</span></div>
        </div>`
    )
    .join("");
}

function syncUrl(values) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("rail", values.rail);
    url.searchParams.set("application", values.application);
    url.searchParams.set("base", values.base);
    url.searchParams.set("duty", values.duty);
    window.history.replaceState({}, "", url);
  } catch (_) {
    // File-based previews can restrict history replacement.
  }
  quoteLink.href = `https://forgesail.com/#form?rail=${encodeURIComponent(values.rail)}&clip=${encodeURIComponent(findFastening(values.rail).recommended_clip)}`;
}

function loadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const rail = params.get("rail");
  if (rail && FASTENING.some((r) => r.rail_type === rail)) {
    railSelect.value = rail;
  }
  const setRadio = (name, value) => {
    if (!value) return;
    const input = form.querySelector(`input[name="${name}"][value="${cssEscape(value)}"]`);
    if (input) input.checked = true;
  };
  setRadio("application", params.get("application"));
  setRadio("base", params.get("base"));
  setRadio("duty", params.get("duty"));
}

function copySummary() {
  const values = selectedValues();
  const fastening = findFastening(values.rail);
  const plate = plateRecommendation(values.base);
  const text = [
    `ForgeSail fastening configuration: ${values.rail}`,
    `Application: ${values.application}`,
    `Support base: ${values.base}`,
    `Duty: ${values.duty}`,
    `Clip: ${fastening.recommended_clip} (${fastening.installation_method})`,
    `Rail pad: ${fastening.rail_pad}`,
    `Sole plate: ${plate.plate}`,
    `Bolt: ${fastening.bolt_spec}`,
    `Reference side load: ${fastening.side_load_kN} kN`,
    "Preliminary reference only. Confirm with ForgeSail engineering.",
  ].join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text);
  }
}

function shareLink() {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(window.location.href);
  }
}

function formatNumber(value) {
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

form.addEventListener("input", render);
document.getElementById("printProposal").addEventListener("click", () => window.print());
document.getElementById("copySummary").addEventListener("click", copySummary);
document.getElementById("shareLink").addEventListener("click", shareLink);

populateRails();
loadFromUrl();
render();
