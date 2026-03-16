const express = require('express');
const { db, Project, Task } = require('./database/setup');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

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

// PROJECT ROUTES

// GET /api/projects - Get all projects
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.findAll();
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// GET /api/projects/:id - Get project by ID
app.get('/api/projects/:id', async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        res.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// POST /api/projects - Create new project
app.post('/api/projects', async (req, res) => {
    try {
        const { name, description, status, dueDate } = req.body;
        
        const newProject = await Project.create({
            name,
            description,
            status,
            dueDate
        });
        
        res.status(201).json(newProject);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// PUT /api/projects/:id - Update existing project
app.put('/api/projects/:id', async (req, res) => {
    try {
        const { name, description, status, dueDate } = req.body;
        
        const [updatedRowsCount] = await Project.update(
            { name, description, status, dueDate },
            { where: { id: req.params.id } }
        );
        
        if (updatedRowsCount === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        const updatedProject = await Project.findByPk(req.params.id);
        res.json(updatedProject);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// DELETE /api/projects/:id - Delete project
app.delete('/api/projects/:id', async (req, res) => {
    try {
        const deletedRowsCount = await Project.destroy({
            where: { id: req.params.id }
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

// GET /api/tasks - Get all tasks
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.findAll();
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// GET /api/tasks/:id - Get task by ID
app.get('/api/tasks/:id', async (req, res) => {
    try {
        const task = await Task.findByPk(req.params.id);
        
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.json(task);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});

// POST /api/tasks - Create new task
app.post('/api/tasks', async (req, res) => {
    try {
        const { title, description, completed, priority, dueDate, projectId } = req.body;
        
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

// PUT /api/tasks/:id - Update existing task
app.put('/api/tasks/:id', async (req, res) => {
    try {
        const { title, description, completed, priority, dueDate, projectId } = req.body;
        
        const [updatedRowsCount] = await Task.update(
            { title, description, completed, priority, dueDate, projectId },
            { where: { id: req.params.id } }
        );
        
        if (updatedRowsCount === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        const updatedTask = await Task.findByPk(req.params.id);
        res.json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// DELETE /api/tasks/:id - Delete task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const deletedRowsCount = await Task.destroy({
        where: { id: req.params.id }
        });
        
        if (deletedRowsCount === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});