/**
 * Tạo ảnh thumbnail dạng SVG (data URI) cho lô thuốc từ dữ liệu import (tên + hoạt chất + liều dùng).
 * Ưu điểm:
 * - Không cần tìm ảnh thủ công
 * - Không phụ thuộc Internet / API bên thứ 3
 * - Lưu thẳng vào DB dưới dạng string (data:image/svg+xml)
 */

const escapeXml = (str) =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const short = (str, max = 48) => {
  const s = String(str || '').trim();
  if (!s) return '';
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

const hashColor = (seed) => {
  const s = String(seed || 'drug');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  // Hue 0..360
  const hue = h % 360;
  return {
    a: `hsl(${hue}, 85%, 55%)`,
    b: `hsl(${(hue + 40) % 360}, 85%, 50%)`
  };
};

function generateDrugImageDataUrl({
  name,
  activeIngredient,
  dosage,
  form,
  certificateNumber
} = {}) {
  const title = short(name, 42);
  const sub1 = short(activeIngredient, 54);
  const sub2 = short([dosage, form].filter(Boolean).join(' • '), 54);
  const cert = short(certificateNumber, 40);

  const colors = hashColor(`${name}|${activeIngredient}|${dosage}|${form}`);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${colors.a}"/>
      <stop offset="1" stop-color="${colors.b}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#0f172a" flood-opacity="0.25"/>
    </filter>
  </defs>

  <rect width="640" height="400" rx="28" fill="#f8fafc"/>
  <rect x="22" y="22" width="596" height="356" rx="22" fill="url(#g)" filter="url(#shadow)"/>

  <g fill="#ffffff">
    <text x="56" y="110" font-family="Inter,Segoe UI,Arial" font-size="34" font-weight="800">
      ${escapeXml(title) || 'Lô thuốc'}
    </text>

    <text x="56" y="162" font-family="Inter,Segoe UI,Arial" font-size="18" font-weight="600" opacity="0.92">
      Hoạt chất:
    </text>
    <text x="56" y="188" font-family="Inter,Segoe UI,Arial" font-size="20" font-weight="700">
      ${escapeXml(sub1) || '—'}
    </text>

    <text x="56" y="236" font-family="Inter,Segoe UI,Arial" font-size="18" font-weight="600" opacity="0.92">
      Thông tin:
    </text>
    <text x="56" y="262" font-family="Inter,Segoe UI,Arial" font-size="20" font-weight="700">
      ${escapeXml(sub2) || '—'}
    </text>

    <g opacity="0.9">
      <rect x="56" y="300" width="290" height="44" rx="12" fill="rgba(255,255,255,0.18)"/>
      <text x="72" y="328" font-family="Inter,Segoe UI,Arial" font-size="14" font-weight="700">
        ${escapeXml(cert ? `Số GCN/CV: ${cert}` : 'Nguồn: Import công văn')}
      </text>
    </g>
  </g>

  <g opacity="0.22">
    <circle cx="540" cy="110" r="72" fill="#fff"/>
    <circle cx="560" cy="128" r="46" fill="#fff"/>
    <circle cx="520" cy="140" r="34" fill="#fff"/>
  </g>
</svg>`;

  // Encode SVG as data URI
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

module.exports = {
  generateDrugImageDataUrl
};


