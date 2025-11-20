let tasks = [
  { id: 1, text: "Welcome to Professional TodoList!", done: false, createdAt: new Date(), alarmTime: null },
  { id: 2, text: "Click + to add a new task", done: false, createdAt: new Date(), alarmTime: null },
  { id: 3, text: "Click the trash icon to delete a task", done: false, createdAt: new Date(), alarmTime: null }
];
let nextId = 4;

class TodoController {
  // Get all tasks
  getAllTasks(req, res) {
    try {
      const sortedTasks = tasks.sort((a, b) => b.createdAt - a.createdAt);
      res.render('index', { 
        tasks: sortedTasks,
        appName: req.app.locals.appName 
      });
    } catch (error) {
      res.status(500).render('error', { error: error.message });
    }
  }

  // Add new task
  addTask(req, res) {
    try {
      const text = (req.body.text || '').trim();
      const alarmTime = req.body.alarmTime || null;
      
      if (!text) {
        req.flash?.('error', 'Task cannot be empty');
        return res.redirect('/');
      }
      
      if (text.length > 200) {
        req.flash?.('error', 'Task is too long (max 200 characters)');
        return res.redirect('/');
      }

      tasks.unshift({ 
        id: nextId++, 
        text, 
        done: false,
        createdAt: new Date(),
        alarmTime: alarmTime
      });
      res.redirect('/');
    } catch (error) {
      res.status(500).send('Error adding task');
    }
  }

  // Delete task
  deleteTask(req, res) {
    try {
      const id = parseInt(req.params.id);
      const initialLength = tasks.length;
      tasks = tasks.filter(t => t.id !== id);
      
      if (tasks.length === initialLength) {
        return res.status(404).send('Task not found');
      }
      res.redirect('/');
    } catch (error) {
      res.status(500).send('Error deleting task');
    }
  }

  // Toggle task completion
  toggleTask(req, res) {
    try {
      const id = parseInt(req.params.id);
      const taskIndex = tasks.findIndex(t => t.id === id);
      
      if (taskIndex === -1) {
        return res.status(404).send('Task not found');
      }
      
      tasks[taskIndex].done = !tasks[taskIndex].done;
      res.redirect('/');
    } catch (error) {
      res.status(500).send('Error toggling task');
    }
  }

  // Clear all tasks
  clearAll(req, res) {
    try {
      tasks = [];
      res.redirect('/');
    } catch (error) {
      res.status(500).send('Error clearing tasks');
    }
  }

  // Get task stats
  getStats(req, res) {
    try {
      const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.done).length,
        pending: tasks.filter(t => !t.done).length
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Edit task
  editTask(req, res) {
    try {
      const id = parseInt(req.params.id);
      const text = (req.body.text || '').trim();
      const alarmTime = req.body.alarmTime || null;

      if (!text) {
        return res.status(400).send('Task cannot be empty');
      }

      if (text.length > 200) {
        return res.status(400).send('Task is too long (max 200 characters)');
      }

      const taskIndex = tasks.findIndex(t => t.id === id);
      if (taskIndex === -1) {
        return res.status(404).send('Task not found');
      }

      tasks[taskIndex].text = text;
      tasks[taskIndex].alarmTime = alarmTime;
      
      res.redirect('/');
    } catch (error) {
      res.status(500).send('Error editing task');
    }
  }
}

module.exports = new TodoController();
