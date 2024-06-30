const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 9000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Atlas connection
const uri = 'YOUR CONNECTION STRING';
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected...');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

// Task Schema
const taskSchema = new mongoose.Schema({
    description: String,
    category: String,
    date: String,
    time: String,
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    status: { type: String, default: 'Incomplete' }
});

taskSchema.methods.updateStatus = function() {
    if (this.completed) {
        const dueDateTime = new Date(`${this.date}T${this.time}:00Z`);
        const completedDateTime = new Date(this.completedAt);
        this.status = completedDateTime <= dueDateTime ? 'Completed on time' : 'Completed late';
    } else {
        this.status = 'Incomplete';
    }
};

const Task = mongoose.model('Task', taskSchema);

// Routes
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/tasks', async (req, res) => {
    try {
        const task = new Task(req.body);
        task.updateStatus();
        const savedTask = await task.save();
        res.status(201).send(savedTask);
    } catch (err) {
        res.status(400).send(err);
    }
});

app.get('/tasks', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.send(tasks);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.put('/tasks/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).send();
        }
        Object.assign(task, req.body);
        task.updateStatus();
        const updatedTask = await task.save();
        res.send(updatedTask);
    } catch (err) {
        res.status(400).send(err);
    }
});

app.put('/tasks/:id/complete', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).send();
        }
        task.completed = true;
        task.completedAt = new Date().toISOString();
        task.updateStatus();
        const updatedTask = await task.save();
        res.send(updatedTask);
    } catch (err) {
        res.status(400).send(err);
    }
});

app.delete('/tasks/:id', async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
