// Builds a HyperFrames vertical promo project from a JSON spec.
//   node gen/build.mjs specs/<name>.json out/<name>   (run ./prepare.sh first)
import fs from "node:fs";
import path from "node:path";

const [specPath, outDir] = process.argv.slice(2);
const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const specDir = path.dirname(path.resolve(specPath));
fs.mkdirSync(path.join(outDir, "assets"), { recursive: true });

const BOARED = process.env.BOARED ?? path.resolve(specDir, "../../../../Boared-games-beta");
const copy = (src, name) => {
  src = src.replace("$BOARED", BOARED);
  const dst = path.join(
    outDir,
    "assets",
    name ?? path.resolve(specDir, src).split("/").slice(-3).join("_"),
  );
  if (!fs.existsSync(dst)) fs.copyFileSync(path.resolve(specDir, src), dst);
  return "assets/" + path.basename(dst);
};
copy(spec.gsap, "gsap.min.js");
const reel = spec.reel ? copy(spec.reel, "reel.mp4") : null;
const music = copy(spec.music.src, "music.mp3");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const f = (n) => Number(n.toFixed(3));

let html = "";
let js = "";
let z = 1;
let t = 0;
const shotTimes = [];

spec.shots.forEach((s, i) => {
  const id = `s${i}`;
  const start = t;
  const d = s.d;
  shotTimes.push({ start, d, id });
  const x0 = s.x0 ?? 0,
    x1 = s.x1 ?? x0,
    s0 = s.s0 ?? 1.05,
    s1 = s.s1 ?? s0 * 1.12;
  const y0 = s.y0 ?? 0,
    y1 = s.y1 ?? y0;
  if (s.kind === "reel") {
    html += `      <div class="cam" id="${id}c" style="z-index:${z}">\n        <video id="${id}v" class="clip" data-start="${f(start)}" data-duration="${f(d)}" data-media-start="${s.ms}" data-track-index="0" src="${reel}" muted playsinline></video>\n      </div>\n`;
  } else {
    const img = copy(s.src);
    const layout = s.layout ?? "bleed";
    let inner;
    if (layout === "card") {
      const bg = copy(s.bg ?? s.src);
      inner = `<img class="bleed" src="${bg}" alt="" /><div class="cardwrap" style="top:${s.cardTop ?? 600}px"><img class="card" src="${img}" alt="" /></div>`;
    } else if (layout === "poster") {
      const bg = copy(s.bg ?? s.src);
      inner = `<img class="bleed" src="${bg}" alt="" /><img class="poster" src="${img}" alt="" style="top:${s.cardTop ?? 420}px" />`;
    } else {
      inner = `<img class="bleed" src="${img}" alt="" />`;
    }
    html += `      <div id="${id}" class="clip shot" data-start="${f(start)}" data-duration="${f(d)}" data-track-index="0" style="z-index:${z}" data-layout-allow-overflow data-layout-ignore>\n        <div class="cam" id="${id}c">${inner}</div>\n      </div>\n`;
  }
  // entrance
  const tr = s.tr ?? (i === 0 ? "none" : "cut");
  const cam = `#${id}c`;
  let settle = 0;
  const prev = i > 0 ? `#s${i - 1}c` : null;
  const ps = i > 0 ? spec.shots[i - 1] : null;
  const pX = ps ? (ps.x1 ?? ps.x0 ?? 0) : 0,
    pY = ps ? (ps.y1 ?? ps.y0 ?? 0) : 0,
    pS = ps ? (ps.s1 ?? (ps.s0 ?? 1.05) * 1.12) : 1;
  switch (tr) {
    case "whip":
      if (prev)
        js += `tl.fromTo("${prev}", { x: ${pX}, filter: "blur(0px)" }, { x: ${pX - 900}, filter: "blur(18px)", immediateRender: false, duration: 0.2, ease: "power3.in" }, ${f(start - 0.2)});\n`;
      js += `tl.fromTo("${cam}", { x: ${x0 + 900}, y: ${y0}, scale: ${s0}, filter: "blur(18px)" }, { x: ${x0}, filter: "blur(0px)", duration: 0.35, ease: "expo.out" }, ${f(start)});\n`;
      settle = 0.35;
      break;
    case "vwhip":
      if (prev)
        js += `tl.fromTo("${prev}", { y: ${pY}, filter: "blur(0px)" }, { y: ${pY - 1400}, filter: "blur(20px)", immediateRender: false, duration: 0.22, ease: "power3.in" }, ${f(start - 0.22)});\n`;
      js += `tl.fromTo("${cam}", { x: ${x0}, y: ${y0 + 1400}, scale: ${s0}, filter: "blur(20px)" }, { y: ${y0}, filter: "blur(0px)", duration: 0.4, ease: "expo.out" }, ${f(start)});\n`;
      settle = 0.4;
      break;
    case "zoom":
      if (prev)
        js += `tl.fromTo("${prev}", { scale: ${pS}, filter: "blur(0px)" }, { scale: ${f(pS * 2.2)}, filter: "blur(16px)", immediateRender: false, duration: 0.3, ease: "power3.in" }, ${f(start - 0.3)});\n`;
      js += `tl.fromTo("${cam}", { x: ${x0}, y: ${y0}, scale: ${f(s0 * 2.6)}, filter: "blur(14px)" }, { scale: ${s0}, filter: "blur(0px)", duration: 0.8, ease: "expo.out" }, ${f(start)});\n`;
      js += `tl.fromTo("#flash", { opacity: 0 }, { opacity: 0.9, duration: 0.06, ease: "none" }, ${f(start - 0.06)});\ntl.fromTo("#flash", { opacity: 0.9 }, { opacity: 0, immediateRender: false, duration: 0.35, ease: "power2.out" }, ${f(start)});\n`;
      settle = 0.8;
      break;
    case "iris":
      js += `tl.fromTo("${cam}", { x: ${x0}, y: ${y0}, scale: ${f(s0 * 1.2)}, clipPath: "circle(0% at 50% 50%)" }, { scale: ${s0}, clipPath: "circle(85% at 50% 50%)", duration: 0.5, ease: "power3.out" }, ${f(start)});\n`;
      settle = 0.5;
      break;
    case "flash":
      js += `tl.fromTo("#flash", { opacity: 0 }, { opacity: 0.88, duration: 0.06, ease: "none" }, ${f(start - 0.06)});\ntl.fromTo("#flash", { opacity: 0.9 }, { opacity: 0, immediateRender: false, duration: 0.3, ease: "power2.out" }, ${f(start)});\n`;
      js += `tl.fromTo("${cam}", { x: ${x0}, y: ${y0}, scale: ${f(s0 * 1.25)} }, { scale: ${s0}, duration: 0.45, ease: "expo.out" }, ${f(start)});\n`;
      settle = 0.45;
      break;
    case "dip":
      js += `tl.fromTo("#dip", { opacity: 0 }, { opacity: 0.65, duration: 0.1, ease: "none" }, ${f(start - 0.1)});\ntl.fromTo("#dip", { opacity: 0.65 }, { opacity: 0, immediateRender: false, duration: 0.18, ease: "power2.out" }, ${f(start)});\n`;
      break;
    case "punch":
      js += `tl.fromTo("${cam}", { x: ${x0}, y: ${y0}, scale: ${f(s0 * 1.35)} }, { scale: ${s0}, duration: 0.3, ease: "expo.out" }, ${f(start)});\n`;
      settle = 0.3;
      break;
    default:
      break;
  }
  const nx = spec.shots[i + 1]?.tr;
  const outCut = nx === "whip" ? 0.2 : nx === "vwhip" ? 0.22 : nx === "zoom" ? 0.3 : 0;
  if (settle === 0) js += `tl.set("${cam}", { x: ${x0}, y: ${y0}, scale: ${s0} }, ${f(start)});\n`;
  js += `tl.fromTo("${cam}", { x: ${x0}, y: ${y0}, scale: ${s0} }, { x: ${x1}, y: ${y1}, scale: ${s1}, duration: ${f(d - settle - outCut)}, ease: "${s.ease ?? "power1.inOut"}", immediateRender: false }, ${f(start + settle)});\n`;
  z++;
  t += d;
});

const total = f(t);

// ---------- copy ----------
let ti = 0;
const textHtml = [];
for (const tx of spec.texts) {
  const id = `t${ti++}`;
  const at = tx.at,
    d = tx.d;
  const y = tx.y ?? 820;
  const end = at + d;
  let body = "";
  const words = (s, cls) => {
    let on = false;
    return s
      .split(" ")
      .map((w) => {
        let hl = on;
        if (w.startsWith("*")) {
          hl = true;
          on = true;
          w = w.slice(1);
        }
        if (w.endsWith("*")) {
          on = false;
          w = w.slice(0, -1);
        }
        return `<span class="w ${cls}"${hl ? ' style="color:var(--accent)"' : ""}>${esc(w)}</span>`;
      })
      .join(" ");
  };
  const enter = tx.enter ?? ["pop", "rise", "blur", "slam", "drop"][ti % 5];
  switch (tx.kind) {
    case "big":
    case "mid":
    case "sub": {
      const lines = Array.isArray(tx.text) ? tx.text : [tx.text];
      body = `<div class="center ${tx.kind}" style="top:${y}px${tx.size ? `;font-size:${tx.size}px` : ""}">${lines.map((l) => words(l, `${id}w`)).join("<br />")}</div>`;
      const st = tx.kind === "sub" ? 0.07 : 0.1;
      if (enter === "hook")
        js += `tl.fromTo(".${id}w", { opacity: 1, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.35, stagger: 0.08, ease: "expo.out" }, ${at});\n`;
      else if (enter === "pop")
        js += `tl.fromTo(".${id}w", { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.3, stagger: ${st}, ease: "back.out(2.4)" }, ${at});\n`;
      else if (enter === "rise")
        js += `tl.fromTo(".${id}w", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.3, stagger: ${st}, ease: "expo.out" }, ${at});\n`;
      else if (enter === "blur")
        js += `tl.fromTo(".${id}w", { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.16, stagger: ${st}, ease: "power2.out" }, ${at});\n`;
      else if (enter === "slam")
        js += `tl.fromTo(".${id}w", { opacity: 0, scale: 2.2 }, { opacity: 1, scale: 1, duration: 0.22, stagger: ${st + 0.04}, ease: "expo.out" }, ${at});\n`;
      else
        js += `tl.fromTo(".${id}w", { opacity: 0, y: -80, rotation: -8 }, { opacity: 1, y: 0, rotation: 0, duration: 0.35, stagger: ${st}, ease: "back.out(2)" }, ${at});\n`;
      if (!tx.hold)
        js += `tl.fromTo("#${id} .center", { opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(10px)", immediateRender: false, duration: 0.16, ease: "power2.in" }, ${f(end - 0.18)});\n`;
      break;
    }
    case "sticker": {
      body = `<div class="center" style="top:${y}px"><div id="${id}s" class="sticker ${tx.color ?? ""}">${esc(tx.text)}</div></div>`;
      if (tx.sub)
        body += `<div class="center sub" style="top:${y + 170}px">${words(tx.sub, `${id}w`)}</div>`;
      const rot = tx.rot ?? -4;
      js += `tl.fromTo("#${id}s", { opacity: 0, scale: 2.2, rotation: ${rot + 14} }, { opacity: 1, scale: 1, rotation: ${rot}, duration: 0.38, ease: "back.out(2)" }, ${at});\n`;
      if (tx.sub)
        js += `tl.fromTo(".${id}w", { opacity: 0, filter: "blur(6px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.14, stagger: 0.08, ease: "power2.out" }, ${f(at + 0.35)});\n`;
      js += `tl.fromTo("#${id} .center", { opacity: 1, y: 0 }, { opacity: 0, y: -40, immediateRender: false, duration: 0.16, ease: "power2.in" }, ${f(end - 0.18)});\n`;
      break;
    }
    case "slot": {
      const items = tx.items;
      body = `<div class="center" style="top:${y}px"><div class="mid" style="font-size:70px">${esc(tx.label)}</div><div class="slot"><div class="slot-reel" id="${id}r">${items.map((x) => `<div>${esc(x)}</div>`).join("")}</div></div></div>`;
      js += `tl.fromTo("#${id} .center", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, ${at});\n`;
      js += `tl.fromTo("#${id}r", { y: 0 }, { y: ${-(items.length - 1) * 130}, duration: ${tx.spin ?? 1.8}, ease: "power3.inOut" }, ${f(at + 0.3)});\n`;
      js += `tl.fromTo("#${id} .center", { opacity: 1 }, { opacity: 0, immediateRender: false, duration: 0.16, ease: "power2.in" }, ${f(end - 0.18)});\n`;
      break;
    }
    case "counter": {
      // a number that rolls up, written as fixed digit wheels
      const digits = String(tx.to).split("");
      body = `<div class="center" style="top:${y}px"><div class="sub" style="color:var(--accent)">${esc(tx.label)}</div><div class="counter">${esc(tx.prefix ?? "")}${digits
        .map((dg, k) =>
          /\d/.test(dg)
            ? `<span class="wheel"><span class="wheel-in" id="${id}d${k}">${"0123456789"
                .split("")
                .map((n) => `<i>${n}</i>`)
                .join("")}</span></span>`
            : `<span>${esc(dg)}</span>`,
        )
        .join("")}${esc(tx.suffix ?? "")}</div></div>`;
      js += `tl.fromTo("#${id} .center", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3, ease: "expo.out" }, ${at});\n`;
      digits.forEach((dg, k) => {
        if (/\d/.test(dg))
          js += `tl.fromTo("#${id}d${k}", { y: 0 }, { y: ${-Number(dg) * 150}, duration: ${f(1.0 + k * 0.15)}, ease: "power3.out" }, ${f(at + 0.2)});\n`;
      });
      js += `tl.fromTo("#${id} .center", { opacity: 1 }, { opacity: 0, immediateRender: false, duration: 0.16, ease: "power2.in" }, ${f(end - 0.18)});\n`;
      break;
    }
    case "polaroids": {
      body = tx.items
        .map(
          (p, k) =>
            `<div class="polaroid" id="${id}p${k}" style="left:${p.x}px;top:${p.y}px"><img src="${copy(p.src)}" alt="" /><span>${esc(p.label)}</span></div>`,
        )
        .join("");
      tx.items.forEach((p, k) => {
        const from = k % 2 ? 900 : -900;
        js += `tl.fromTo("#${id}p${k}", { opacity: 0, y: ${from}, rotation: ${p.r * 5} }, { opacity: 1, y: 0, rotation: ${p.r}, duration: 0.5, ease: "back.out(1.6)" }, ${f(at + k * 0.15)});\n`;
      });
      js += `tl.fromTo("#${id} .polaroid", { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.6, immediateRender: false, duration: 0.2, stagger: 0.03, ease: "power2.in" }, ${f(end - 0.3)});\n`;
      break;
    }
    case "endcard": {
      const logoA = "BOARED"
        .split("")
        .map((c) => `<span class="l">${c}</span>`)
        .join("");
      const logoB = "GAMES"
        .split("")
        .map((c) => `<span class="l">${c}</span>`)
        .join("");
      body = `<div class="center sub" style="top:${y - 90}px;color:var(--yellow)" id="${id}k">${esc(tx.kicker)}</div>
        <div class="center big" id="${id}logo" style="top:${y}px;font-size:168px">${logoA}<br />${logoB}</div>
        <div class="center sub" style="top:${y + 350}px;font-size:46px" id="${id}s">${esc(tx.sub)}</div>
        <div class="center" style="top:${y + 410}px"><div class="cta" id="${id}c">${esc(tx.cta)}</div></div>
        <div class="center sub" style="top:1282px;font-size:28px;opacity:.75" id="${id}cr">${esc(spec.music.credit)}</div>`;
      js += `tl.fromTo("#${id}k", { opacity: 0, scaleX: 1.5 }, { opacity: 1, scaleX: 1, duration: 0.5, ease: "expo.out" }, ${at});\n`;
      js += `tl.fromTo("#${id}logo .l", { opacity: 0, y: 120 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.05, ease: "back.out(2.4)" }, ${f(at + 0.2)});\n`;
      js += `tl.fromTo("#${id}s", { opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.25, ease: "power2.out" }, ${f(at + 1.0)});\n`;
      js += `tl.fromTo("#${id}c", { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.2)" }, ${f(at + 1.4)});\n`;
      js += `tl.fromTo("#${id}cr", { opacity: 0 }, { opacity: 0.75, duration: 0.3, ease: "none" }, ${f(at + 1.8)});\n`;
      break;
    }
  }
  textHtml.push(
    `      <div id="${id}" class="clip layer" data-start="${f(at)}" data-duration="${f(d)}" data-track-index="2" style="z-index:${60 + (tx.z ?? 0)}" data-layout-allow-overflow data-layout-allow-overlap>\n        ${body}\n      </div>`,
  );
}

// end tint
const tintAt = spec.tintAt ?? total - 5;
js += `tl.fromTo("#tint", { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power2.inOut" }, ${tintAt});\n`;
js += `tl.fromTo("#hud-date", { opacity: 1 }, { opacity: 0, immediateRender: false, duration: 0.2, ease: "none" }, ${tintAt});\n`;
js += `tl.fromTo("#hud-rec", { opacity: 1 }, { opacity: 0.15, duration: 0.5, ease: "steps(1)", repeat: ${Math.floor(total * 2) - 1}, yoyo: true }, 0);\n`;

const tpl = fs.readFileSync(new URL("./template.html", import.meta.url), "utf8");
const out = tpl
  .replaceAll("{{TOTAL}}", String(total))
  .replace("{{ACCENT}}", spec.accent ?? "#ffe14d")
  .replace("{{HUD_LABEL}}", esc(spec.hud ?? "SP  OCT.31 1998"))
  .replace("{{SHOTS}}", html)
  .replace("{{TEXTS}}", textHtml.join("\n"))
  .replace("{{TINT_START}}", String(tintAt))
  .replace("{{TINT_DUR}}", String(f(total - tintAt)))
  .replace(
    "{{MUSIC}}",
    `<audio id="music" class="clip" data-start="0" data-duration="${total}" data-media-start="${spec.music.start ?? 0}" data-volume="${spec.music.volume ?? 0.9}" data-fade-in="${spec.music.fadeIn ?? 0}" data-fade-out="2" data-track-index="5" src="${music}"></audio>`,
  )
  .replace("{{JS}}", js);
fs.writeFileSync(path.join(outDir, "index.html"), out);
fs.copyFileSync(
  new URL("./hyperframes.json", import.meta.url),
  path.join(outDir, "hyperframes.json"),
);
console.log(`built ${outDir} (${total}s, ${spec.shots.length} shots, ${spec.texts.length} texts)`);
