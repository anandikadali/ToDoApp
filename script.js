document.addEventListener('DOMContentLoaded', function () {
    let tasks = [];

    function renderTasks() {
        const taskList = document.getElementById('task-list');
        const completedTaskList = document.getElementById('completed-task-list');
        const allTaskList = document.getElementById('all-task-list');
        
        taskList.innerHTML = '';
        completedTaskList.innerHTML = '';
        allTaskList.innerHTML = '';
        
        tasks.forEach((task, index) => {
            const taskRow = document.createElement('tr');
            const status = task.completed ? getStatus(task.date, task.time, task.completedAt) : '';
            const completedAt = task.completedAt ? new Date(task.completedAt).toLocaleString() : '';
            taskRow.innerHTML = `
                <td>${index + 1}</td>
                <td>${task.description}</td>
                <td>${task.category}</td>
                <td>${task.date}</td>
                <td>${task.time}</td>
                <td>
                    <button onclick="editTask('${task._id}')" title="Edit Task"><i class="fa fa-pencil"></i></button>
                    <button onclick="deleteTask('${task._id}')" title="Delete Task"><i class="fa fa-trash"></i></button>
                    <button onclick="completeTask('${task._id}')" title="Complete Task"><i class="fa fa-check"></i></button>
                </td>
                <td>${status}</td>
                <td>${completedAt}</td>
            `;
            
            if (task.completed) {
                completedTaskList.appendChild(taskRow);
            } else {
                taskList.appendChild(taskRow);
            }
            allTaskList.appendChild(taskRow.cloneNode(true));
        });
    }

    function fetchTasks(category = '') {
        let url = 'http://localhost:9000/tasks';
        if (category) {
            url += `?category=${category}`;
        }
        fetch(url)
            .then(response => response.json())
            .then(data => {
                tasks = data;
                renderTasks();
            })
            .catch(error => console.error('Error fetching tasks:', error));
    }

    function addTask(description, category, date, time) {
        fetch('http://localhost:9000/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description,
                category,
                date,
                time,
                completed: false,
                completedAt: null
            })
        })
        .then(response => response.json())
        .then(task => {
            tasks.push(task);
            renderTasks();
            alert('Task added successfully!');
        })
        .catch(error => console.error('Error adding task:', error));
    }

    function deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            fetch(`http://localhost:9000/tasks/${id}`, {
                method: 'DELETE'
            })
            .then(() => {
                tasks = tasks.filter(task => task._id !== id);
                renderTasks();
                alert('Task deleted successfully!');
            })
            .catch(error => console.error('Error deleting task:', error));
        }
    }

    function completeTask(id) {
        const task = tasks.find(task => task._id === id);
        if (task) {
            const updatedTask = {
                ...task,
                completed: true,
                completedAt: new Date().toISOString(),
                status: getStatus(task.date, task.time, new Date().toISOString())
            };
            fetch(`http://localhost:9000/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedTask)
            })
            .then(response => response.json())
            .then(updatedTask => {
                const index = tasks.findIndex(t => t._id === id);
                tasks[index] = updatedTask;
                renderTasks();
                alert('Task marked as completed!');
            })
            .catch(error => console.error('Error completing task:', error));
        }
    }

    function editTask(id) {
        const task = tasks.find(task => task._id === id);
        if (task) {
            document.getElementById('write-task').value = task.description;
            document.getElementById('task-category').value = task.category;
            document.getElementById('task-date').value = task.date;
            document.getElementById('task-time').value = task.time;
            deleteTask(id);
            alert('Task details loaded for editing. Make your changes and click "Add Task" to save.');
        }
    }

    function getStatus(dueDate, dueTime, completedAt) {
        const dueDateTime = new Date(`${dueDate}T${dueTime}:00.000Z`); // Ensures due date is in UTC
        const completedDateTime = new Date(completedAt); // Date in ISO string format is already in UTC
        return completedDateTime <= dueDateTime ? 'Completed on time' : 'Completed late';
    }

    // Initial fetch of all tasks
    fetchTasks();

    // Event listener for the add task button
    document.getElementById('add-task-btn').addEventListener('click', function () {
        const description = document.getElementById('write-task').value;
        const category = document.getElementById('task-category').value;
        const date = document.getElementById('task-date').value;
        const time = document.getElementById('task-time').value;
        
        if (description && category && date && time) {
            addTask(description, category, date, time);
            document.getElementById('write-task').value = '';
            document.getElementById('task-category').value = '';
            document.getElementById('task-date').value = '';
            document.getElementById('task-time').value = '';
        } else {
            alert('Please fill out all fields before adding a task.');
        }
    });

    // Expose editTask, deleteTask, and completeTask functions globally
    window.editTask = editTask;
    window.deleteTask = deleteTask;
    window.completeTask = completeTask;
});
