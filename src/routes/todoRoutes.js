const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');

// GET routes
router.get('/', todoController.getAllTasks);
router.get('/api/stats', todoController.getStats);

// POST routes
router.post('/add', todoController.addTask);
router.post('/toggle/:id', todoController.toggleTask);
router.post('/delete/:id', todoController.deleteTask);
router.post('/edit/:id', todoController.editTask);
router.post('/clear', todoController.clearAll);

module.exports = router;
