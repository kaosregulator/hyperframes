(() => {
  const c = window.__chessTable,
    cam = window.__tableCam;
  if (!c) return "nohook";
  window.__cn = (window.__cn || 0) + 1;
  const n = window.__cn;
  const views = [
    { yaw: 0, pitch: 0, zoom: 1 },
    { yaw: 0.5, pitch: 0.15, zoom: 1.6 },
    { yaw: -0.6, pitch: -0.1, zoom: 1.9 },
    { yaw: 0.2, pitch: 0.25, zoom: 2.4 },
    { yaw: -0.3, pitch: 0.05, zoom: 1.4 },
    { yaw: 0.9, pitch: -0.05, zoom: 2.0 },
  ];
  if (cam) {
    cam.user = views[n % views.length];
    cam.listeners.forEach((f) => f());
  }
  const st = c.state();
  if (st.over) {
    c.reset("w");
    return "reset";
  }
  if (st.busy) return "busy";
  if (st.turn !== st.you) return "their turn";
  const L = [
    [
      [6, 4],
      [4, 4],
    ],
    [
      [7, 5],
      [4, 2],
    ],
    [
      [7, 3],
      [3, 7],
    ],
    [
      [3, 7],
      [1, 5],
    ],
    [
      [7, 6],
      [5, 5],
    ],
    [
      [6, 3],
      [5, 3],
    ],
    [
      [7, 1],
      [5, 2],
    ],
    [
      [4, 2],
      [1, 5],
    ],
    [
      [5, 5],
      [3, 4],
    ],
    [
      [3, 7],
      [1, 7],
    ],
    [
      [6, 0],
      [4, 0],
    ],
    [
      [6, 7],
      [4, 7],
    ],
  ];
  for (const [a, b] of L)
    if (c.move(a, b)) return "moved " + a + ">" + b + " view " + (n % views.length);
  return "nomove";
})();
