const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const [game, out, shots] = [process.argv[2], process.argv[3], +(process.argv[4] || 10)];
  const W = +(process.env.W || 1280),
    H = +(process.env.H || 720);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
      "--hide-scrollbars",
    ],
  });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.setDefaultTimeout(600000);
  await page.addInitScript(() => {
    try {
      localStorage.setItem("engine:graphics-preset", "high");
      localStorage.setItem("engine:graphics-adaptive", "0");
    } catch {}
  });
  await page.goto(process.env.URL || `http://127.0.0.1:3000/?play=${game}&dpr=1`);
  if (process.env.WAITMS) await page.waitForTimeout(+process.env.WAITMS);
  else
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll("button")).some((b) =>
          /Pack up/.test(b.textContent || ""),
        ),
      null,
      { timeout: 240000 },
    );
  if (process.env.SLOW)
    await page.evaluate((n) => {
      if (window.__tableCam) window.__tableCam.slow = n;
    }, +process.env.SLOW);
  const pri = (
    process.env.PRI ||
    "Play as|Start|New game|Roll|Deal|Fire|Hit|Stand|End turn|Continue|Next|Buy|Drop|OK|Done|Ask|Guess"
  ).split("|");
  const hideCss =
    "body *:not(canvas):not(:has(canvas)) { visibility: hidden !important; } canvas { visibility: visible !important; }";
  for (let i = 0; i < shots; i++) {
    const clean = i % 3 !== 2;
    let h;
    if (clean) h = await page.addStyleTag({ content: hideCss });
    await page.screenshot({
      path: `${out}/${String(i).padStart(2, "0")}${clean ? "" : "-ui"}.jpg`,
      quality: 90,
    });
    if (h) await h.evaluate((n) => n.remove());
    const btns = await page.evaluate(() =>
      Array.from(document.querySelectorAll("button"))
        .filter((b) => b.offsetParent && !b.disabled)
        .map((b) => (b.textContent || "").trim().slice(0, 40))
        .filter(Boolean),
    );
    let clicked = null;
    for (const p of pri) {
      const t = btns.find(
        (b) => b.toLowerCase().startsWith(p.toLowerCase()) && !/Stand up/.test(b),
      );
      if (t) {
        clicked = t;
        await page
          .getByRole("button", { name: t, exact: true })
          .first()
          .click({ timeout: 60000 })
          .catch((e) => console.log("clickfail", e.message.slice(0, 80)));
        break;
      }
    }
    if (!clicked && process.env.CLICKCANVAS) {
      const x = Math.round(W * (0.3 + (0.4 * ((i * 37) % 10)) / 10)),
        y = Math.round(H * (0.45 + (0.3 * ((i * 53) % 10)) / 10));
      await page.mouse.click(x, y);
      clicked = `canvas ${x},${y}`;
    }
    if (process.env.HOOK) {
      const r = await page
        .evaluate(process.env.HOOK)
        .catch((e) => "hookerr " + e.message.slice(0, 80));
      clicked = (clicked || "") + " hook:" + JSON.stringify(r);
    }
    if (process.env.KEYS) {
      const ks = process.env.KEYS.split(",");
      const k = ks[i % ks.length];
      for (const kk of k.split("+")) await page.keyboard.down(kk);
      await page.waitForTimeout(+(process.env.KEYMS || 2500));
      for (const kk of k.split("+")) await page.keyboard.up(kk);
      clicked = (clicked || "") + " keys:" + k;
    }
    console.log(game, i, "clicked:", clicked, "| buttons:", JSON.stringify(btns.slice(0, 18)));
    await page.waitForTimeout(+(process.env.GAP || 3000));
  }
  await browser.close();
})().catch((e) => {
  console.log("FATAL", e.message);
  process.exit(1);
});
