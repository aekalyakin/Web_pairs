// Railway не умеет сам раздавать статику Vite-приложения (в отличие от Vercel) —
// поэтому нужен минимальный сервер, который отдаёт файлы из dist/
// и всегда возвращает index.html для любого пути (SPA-роутинг).

const express = require('express');
const path = require('path');

const app = express();
const DIST_DIR = path.join(__dirname, 'dist');

app.use(express.static(DIST_DIR));

// Все остальные пути — отдаём index.html (client-side роутинг)
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on port ${PORT}`);
});
