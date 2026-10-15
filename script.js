/* ==========================================================
   Linear Algebra Playground
   Part 1: tabs   Part 2: 2D transformations   Part 3: calculator
   ========================================================== */

/* ---------- Part 1: tab switching ---------- */
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

/* ---------- Part 2: 2D transformations ---------- */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const S = 30;                 // pixels per unit (range is about -10..10)
const CX = canvas.width / 2;
const CY = canvas.height / 2;

const val = id => parseFloat(document.getElementById(id).value) || 0;
const fmt = x => (Math.abs(x) < 1e-9 ? 0 : +x.toFixed(4)).toString();

function px(x, y) { return [CX + x * S, CY - y * S]; }

function line(p, q, color, width = 1, dash = []) {
  ctx.beginPath();
  ctx.setLineDash(dash);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.moveTo(...px(...p));
  ctx.lineTo(...px(...q));
  ctx.stroke();
  ctx.setLineDash([]);
}

function arrow(to, color) {
  line([0, 0], to, color, 3);
  const [x, y] = px(...to);
  const ang = Math.atan2(-(to[1]), to[0]);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 12 * Math.cos(ang - 0.4), y + 12 * Math.sin(ang - 0.4));
  ctx.lineTo(x - 12 * Math.cos(ang + 0.4), y + 12 * Math.sin(ang + 0.4));
  ctx.fill();
}

// eigenvalues and eigenvectors of [[a,b],[c,d]]
function eigen(a, b, c, d) {
  const tr = a + d, det = a * d - b * c;
  const disc = tr * tr - 4 * det;
  if (disc < -1e-12) {
    return { complex: true, re: tr / 2, im: Math.sqrt(-disc) / 2 };
  }
  const s = Math.sqrt(Math.max(disc, 0));
  const vals = [(tr + s) / 2, (tr - s) / 2];
  const vecs = vals.map(l => {
    let v;
    if (Math.abs(b) > 1e-9) v = [b, l - a];
    else if (Math.abs(c) > 1e-9) v = [l - d, c];
    else v = Math.abs(l - a) < 1e-9 ? [1, 0] : [0, 1];
    const n = Math.hypot(...v) || 1;
    return [v[0] / n, v[1] / n];
  });
  return { complex: false, vals, vecs };
}

function drawTransform() {
  const a = val("a"), b = val("b"), c = val("c"), d = val("d");
  const t = val("t");
  // interpolate between identity and A
  const m = [1 + t * (a - 1), t * b, t * c, 1 + t * (d - 1)];
  const T = (x, y) => [m[0] * x + m[1] * y, m[2] * x + m[3] * y];

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // original grid (faint) and axes
  for (let k = -10; k <= 10; k++) {
    line([k, -10], [k, 10], "rgba(255,255,255,0.06)");
    line([-10, k], [10, k], "rgba(255,255,255,0.06)");
  }
  line([-10, 0], [10, 0], "rgba(255,255,255,0.3)", 1.5);
  line([0, -10], [0, 10], "rgba(255,255,255,0.3)", 1.5);

  // transformed grid
  for (let k = -10; k <= 10; k++) {
    line(T(k, -10), T(k, 10), "rgba(167,139,250,0.55)");
    line(T(-10, k), T(10, k), "rgba(34,211,238,0.45)");
  }

  // transformed unit square
  const sq = [T(0, 0), T(1, 0), T(1, 1), T(0, 1)];
  ctx.beginPath();
  ctx.moveTo(...px(...sq[0]));
  sq.slice(1).forEach(p => ctx.lineTo(...px(...p)));
  ctx.closePath();
  ctx.fillStyle = "rgba(251,191,36,0.22)";
  ctx.fill();

  // eigenvector lines (computed for the final matrix A, drawn when t = 1)
  const e = eigen(a, b, c, d);
  if (!e.complex) {
    e.vecs.forEach(v => line([-12 * v[0], -12 * v[1]], [12 * v[0], 12 * v[1]], "#fbbf24", 2, [8, 6]));
  }

  // basis vectors
  arrow(T(1, 0), "#f87171");
  arrow(T(0, 1), "#34d399");
}

function updateInfo() {
  const a = val("a"), b = val("b"), c = val("c"), d = val("d");
  const det = a * d - b * c, tr = a + d;
  const e = eigen(a, b, c, d);
  let html = `det(A) = <code>${fmt(det)}</code> (area scale)<br>trace(A) = <code>${fmt(tr)}</code><br>`;
  if (Math.abs(det) < 1e-9) html += `<span class="err">Singular: space collapses, no inverse.</span><br>`;
  else if (det < 0) html += `Orientation is flipped.<br>`;
  if (e.complex) {
    html += `Eigenvalues: <code>${fmt(e.re)} &plusmn; ${fmt(e.im)}i</code><br>(complex: pure rotation part, no real eigenvectors)`;
  } else {
    html += `&lambda;<sub>1</sub> = <code>${fmt(e.vals[0])}</code>, v = (${fmt(e.vecs[0][0])}, ${fmt(e.vecs[0][1])})<br>`;
    html += `&lambda;<sub>2</sub> = <code>${fmt(e.vals[1])}</code>, v = (${fmt(e.vecs[1][0])}, ${fmt(e.vecs[1][1])})<br>`;
    html += `Dashed yellow lines show the eigen-directions.`;
  }
  document.getElementById("info").innerHTML = html;
}

function refresh() { drawTransform(); updateInfo(); }

["a", "b", "c", "d", "t"].forEach(id => document.getElementById(id).addEventListener("input", refresh));

document.querySelectorAll(".presets button").forEach(btn => {
  btn.addEventListener("click", () => {
    let p;
    if (btn.dataset.p === "rot") {
      const k = Math.cos(Math.PI / 4), s = Math.sin(Math.PI / 4);
      p = [k, -s, s, k].map(x => +x.toFixed(3));
    } else p = btn.dataset.p.split(",").map(Number);
    ["a", "b", "c", "d"].forEach((id, i) => (document.getElementById(id).value = p[i]));
    document.getElementById("t").value = 1;
    refresh();
  });
});

/* ---------- Part 3: matrix calculator ---------- */
const sizeSel = document.getElementById("size");

function buildGrid(id) {
  const n = +sizeSel.value;
  const g = document.getElementById(id);
  g.style.gridTemplateColumns = `repeat(${n}, auto)`;
  g.innerHTML = "";
  for (let i = 0; i < n * n; i++) {
    const inp = document.createElement("input");
    inp.type = "number";
    inp.value = id === "gridA" ? (i % (n + 1) === 0 ? 2 : 1) : (i % (n + 1) === 0 ? 1 : 0);
    g.appendChild(inp);
  }
}

function readMatrix(id) {
  const n = +sizeSel.value;
  const v = [...document.querySelectorAll(`#${id} input`)].map(i => parseFloat(i.value) || 0);
  return Array.from({ length: n }, (_, r) => v.slice(r * n, r * n + n));
}

const add = (A, B, s = 1) => A.map((r, i) => r.map((x, j) => x + s * B[i][j]));
const transpose = A => A[0].map((_, j) => A.map(r => r[j]));
const mul = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));

function det(M) {
  const A = M.map(r => [...r]), n = A.length;
  let d = 1;
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    if (Math.abs(A[p][i]) < 1e-12) return 0;
    if (p !== i) { [A[i], A[p]] = [A[p], A[i]]; d = -d; }
    d *= A[i][i];
    for (let r = i + 1; r < n; r++) {
      const f = A[r][i] / A[i][i];
      for (let c = i; c < n; c++) A[r][c] -= f * A[i][c];
    }
  }
  return d;
}

// Gauss-Jordan elimination on [A | I]
function inverse(M) {
  const n = M.length;
  const A = M.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => +(i === j))]);
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    if (Math.abs(A[p][i]) < 1e-12) return null;
    [A[i], A[p]] = [A[p], A[i]];
    const piv = A[i][i];
    A[i] = A[i].map(v => v / piv);
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const f = A[r][i];
      A[r] = A[r].map((v, j) => v - f * A[i][j]);
    }
  }
  return A.map(r => r.slice(n));
}

function show(M) {
  return "<table>" + M.map(r => "<tr>" + r.map(x => `<td>${fmt(x)}</td>`).join("") + "</tr>").join("") + "</table>";
}

document.querySelectorAll(".ops button").forEach(btn => {
  btn.addEventListener("click", () => {
    const A = readMatrix("gridA"), B = readMatrix("gridB");
    const out = document.getElementById("result");
    const op = btn.dataset.op;
    if (op === "add") out.innerHTML = show(add(A, B));
    else if (op === "sub") out.innerHTML = show(add(A, B, -1));
    else if (op === "mul") out.innerHTML = show(mul(A, B));
    else if (op === "tr") out.innerHTML = show(transpose(A));
    else if (op === "det") out.innerHTML = `det(A) = <b>${fmt(det(A))}</b>`;
    else if (op === "inv") {
      const I = inverse(A);
      out.innerHTML = I ? show(I) : `<span class="err">A is singular (det = 0), so it has no inverse.</span>`;
    }
  });
});

sizeSel.addEventListener("change", () => { buildGrid("gridA"); buildGrid("gridB"); });

/* ---------- start ---------- */
buildGrid("gridA");
buildGrid("gridB");
refresh();
                       
