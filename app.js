const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./src/config/config');
const todoRoutes = require('./src/routes/todoRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// ============ VIEW ENGINE SETUP ============
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============ MIDDLEWARE ============
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============ APP LOCALS ============
app.locals.appName = config.APP_NAME;

// ============ ROUTES ============
app.use('/', todoRoutes);

// ============ 404 HANDLER ============
app.use((req, res) => {
  res.status(404).render('error', { 
    error: 'Page not found',
    status: 404
  });
});

// ============ ERROR HANDLER ============
app.use(errorHandler);

// ============ SERVER ============
app.listen(config.PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`${config.APP_NAME} is running on http://localhost:${config.PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
  console.log(`${'='.repeat(50)}\n`);
});
