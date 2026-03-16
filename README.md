# Task Management API

A REST API for managing projects and tasks.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create the database:
    ```bash
    npm run setup
    ```

3. Seed with sample data:
    ```bash
    npm run seed
    ```

4. Start the server:
    ```bash
    npm start
    ```


## API Endpoints

### Projects

- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks

- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Project Structure

```plaintext
task-management-api/
├── database/
│   ├── setup.js    # Database setup and models
│   └── seed.js     # Sample data
├── server.js       # Main server file
├── package.json    # Dependencies
├── .env            # Environment variables
└── README.md       # This file
```