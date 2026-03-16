const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { db, User, Project, Task } = require('./database/setup');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false
    }
  })
);

// Test database connection
async function testConnection() {
  try {
    await db.authenticate();
    console.log('Connection to database established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}
testConnection();

// Authentication middleware
async function requireAuth(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'You must be logged in to access this route' });
    }

    const user = await User.findByPk(req.session.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid session. Please log in again.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// AUTH ROUTES

// POST /api/register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ error: 'A user with that email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.userId = user.id;

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

// POST /api/logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error('Error logging out:', error);
      return res.status(500).json({ error: 'Failed to log out' });
    }

    res.json({ message: 'Logout successful' });
  });
});

// PROJECT ROUTES

// GET /api/projects - protected
app.get('/api/projects', requireAuth, async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { userId: req.user.id }
    });

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id
app.get('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects
app.post('/api/projects', requireAuth, async (req, res) => {
  try {
    const { name, description, status, dueDate } = req.body;

    const newProject = await Project.create({
      name,
      description,
      status,
      dueDate,
      userId: req.user.id
    });

    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id
app.put('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const { name, description, status, dueDate } = req.body;

    const [updatedRowsCount] = await Project.update(
      { name, description, status, dueDate },
      {
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updatedProject = await Project.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id
app.delete('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const deletedRowsCount = await Project.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// TASK ROUTES

// GET /api/tasks
app.get('/api/tasks', requireAuth, async (req, res) => {
  try {
    const tasks = await Task.findAll({
      include: [
        {
          model: Project,
          where: { userId: req.user.id },
          attributes: []
        }
      ]
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id
app.get('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Project,
          where: { userId: req.user.id }
        }
      ]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks
app.post('/api/tasks', requireAuth, async (req, res) => {
  try {
    const { title, description, completed, priority, dueDate, projectId } = req.body;

    const project = await Project.findOne({
      where: {
        id: projectId,
        userId: req.user.id
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or does not belong to you' });
    }

    const newTask = await Task.create({
      title,
      description,
      completed,
      priority,
      dueDate,
      projectId
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id
app.put('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const { title, description, completed, priority, dueDate, projectId } = req.body;

    const existingTask = await Task.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Project,
          where: { userId: req.user.id }
        }
      ]
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (projectId) {
      const project = await Project.findOne({
        where: {
          id: projectId,
          userId: req.user.id
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found or does not belong to you' });
      }
    }

    await Task.update(
      { title, description, completed, priority, dueDate, projectId },
      { where: { id: req.params.id } }
    );

    const updatedTask = await Task.findByPk(req.params.id);
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const existingTask = await Task.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Project,
          where: { userId: req.user.id }
        }
      ]
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await Task.destroy({ where: { id: req.params.id } });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});