(() => {
  const b = window.__battleship;
  if (!b) return "nohook";
  if (b.phase !== "battle" || b.turn !== "me") return b.phase + " " + b.turn;
  window.__bsn = (window.__bsn || 0) + 1;
  const cells = [];
  for (const s of b.theirs)
    for (let k = 0; k < s.size; k++)
      cells.push([s.x + (s.horizontal ? k : 0), s.y + (s.horizontal ? 0 : k)]);
  if (window.__bsn % 3 === 0) {
    b.fire(0, 9 - (window.__bsn % 10));
    return "miss?";
  }
  const c = cells[(window.__bsn * 2) % cells.length];
  b.fire(c[0], c[1]);
  return "fire " + c;
})();
