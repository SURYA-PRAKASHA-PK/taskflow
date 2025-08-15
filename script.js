// TaskFlow - Beautiful Todo List Application
class TaskFlow {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || [];
        this.currentFilter = 'all';
        this.editingTaskId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
        this.setDefaultDueDate();
    }

    initializeElements() {
        // Input elements
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.dueDateInput = document.getElementById('dueDateInput');
        
        // Container elements
        this.tasksContainer = document.getElementById('tasksContainer');
        this.emptyState = document.getElementById('emptyState');
        
        // Filter elements
        this.filterBtns = document.querySelectorAll('.filter-btn');
        
        // Stats elements
        this.totalTasks = document.getElementById('totalTasks');
        this.completedTasks = document.getElementById('completedTasks');
        
        // Modal elements
        this.editModal = document.getElementById('editModal');
        this.editTaskInput = document.getElementById('editTaskInput');
        this.editPrioritySelect = document.getElementById('editPrioritySelect');
        this.editDueDateInput = document.getElementById('editDueDateInput');
        this.closeModal = document.getElementById('closeModal');
        this.cancelEdit = document.getElementById('cancelEdit');
        this.saveEdit = document.getElementById('saveEdit');
        
        // Toast element
        this.successToast = document.getElementById('successToast');
    }

    bindEvents() {
        // Add task events
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Filter events
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // Modal events
        this.closeModal.addEventListener('click', () => this.closeEditModal());
        this.cancelEdit.addEventListener('click', () => this.closeEditModal());
        this.saveEdit.addEventListener('click', () => this.saveEditTask());
        
        // Close modal on overlay click
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) this.closeEditModal();
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeEditModal();
        });
    }

    setDefaultDueDate() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const formattedDate = tomorrow.toISOString().split('T')[0];
        this.dueDateInput.value = formattedDate;
    }

    addTask() {
        const title = this.taskInput.value.trim();
        if (!title) {
            this.showToast('Please enter a task description', 'error');
            return;
        }

        const task = {
            id: Date.now().toString(),
            title: title,
            completed: false,
            priority: this.prioritySelect.value,
            dueDate: this.dueDateInput.value || null,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.showToast('Task added successfully!', 'success');
        
        // Reset input
        this.taskInput.value = '';
        this.taskInput.focus();
    }

    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            const deletedTask = this.tasks[taskIndex];
            this.tasks.splice(taskIndex, 1);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showToast(`Task "${deletedTask.title}" deleted`, 'success');
        }
    }

    toggleTaskComplete(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
            const message = task.completed ? 'Task completed!' : 'Task marked as active';
            this.showToast(message, 'success');
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            this.editingTaskId = taskId;
            this.editTaskInput.value = task.title;
            this.editPrioritySelect.value = task.priority;
            this.editDueDateInput.value = task.dueDate || '';
            
            this.editModal.classList.add('show');
            this.editTaskInput.focus();
        }
    }

    saveEditTask() {
        const title = this.editTaskInput.value.trim();
        if (!title) {
            this.showToast('Please enter a task description', 'error');
            return;
        }

        const task = this.tasks.find(task => task.id === this.editingTaskId);
        if (task) {
            task.title = title;
            task.priority = this.editPrioritySelect.value;
            task.dueDate = this.editDueDateInput.value || null;
            
            this.saveTasks();
            this.renderTasks();
            this.closeEditModal();
            this.showToast('Task updated successfully!', 'success');
        }
    }

    closeEditModal() {
        this.editModal.classList.remove('show');
        this.editingTaskId = null;
        this.editTaskInput.value = '';
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.renderTasks();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(task => !task.completed);
            case 'completed':
                return this.tasks.filter(task => task.completed);
            case 'high':
                return this.tasks.filter(task => task.priority === 'high');
            default:
                return this.tasks;
        }
    }

    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            this.tasksContainer.innerHTML = '';
            this.emptyState.classList.add('show');
            return;
        }
        
        this.emptyState.classList.remove('show');
        this.tasksContainer.innerHTML = '';
        
        // Sort tasks: active tasks first, then completed tasks
        const sortedTasks = filteredTasks.sort((a, b) => {
            if (a.completed === b.completed) {
                // If both have same completion status, sort by creation date (newest first)
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            // Active tasks first, then completed tasks
            return a.completed ? 1 : -1;
        });
        
        sortedTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.tasksContainer.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const template = document.getElementById('taskTemplate');
        const taskElement = template.content.cloneNode(true);
        
        const taskItem = taskElement.querySelector('.task-item');
        taskItem.dataset.id = task.id;
        
        if (task.completed) {
            taskItem.classList.add('completed');
        }
        
        // Set task title
        const taskTitle = taskItem.querySelector('.task-title');
        taskTitle.textContent = task.title;
        
        // Set checkbox state
        const checkbox = taskItem.querySelector('.task-checkbox-input');
        const checkboxContainer = taskItem.querySelector('.task-checkbox');
        
        checkbox.checked = task.completed;
        
        // Add change event to checkbox
        checkbox.addEventListener('change', () => this.toggleTaskComplete(task.id));
        
        // Add click event to entire checkbox area for better UX
        checkboxContainer.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
                this.toggleTaskComplete(task.id);
            }
        });
        
        // Set priority
        const priorityElement = taskItem.querySelector('.task-priority');
        priorityElement.textContent = this.getPriorityLabel(task.priority);
        priorityElement.classList.add(task.priority);
        
        // Set due date
        const dueDateElement = taskItem.querySelector('.task-due-date');
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            let dueDateText = dueDate.toLocaleDateString();
            if (dueDate < today) {
                dueDateText += ' (Overdue)';
                dueDateElement.style.background = '#ffe6e6';
                dueDateElement.style.color = '#d63031';
            } else if (dueDate.toDateString() === today.toDateString()) {
                dueDateText += ' (Today)';
                dueDateElement.style.background = '#fff3cd';
                dueDateElement.style.color = '#856404';
            } else if (dueDate.toDateString() === tomorrow.toDateString()) {
                dueDateText += ' (Tomorrow)';
                dueDateElement.style.background = '#d1ecf1';
                dueDateElement.style.color = '#0c5460';
            }
            
            dueDateElement.textContent = dueDateText;
        } else {
            dueDateElement.textContent = 'No due date';
        }
        
        // Set created date
        const createdElement = taskItem.querySelector('.task-created');
        const createdDate = new Date(task.createdAt);
        createdElement.textContent = `Created: ${createdDate.toLocaleDateString()}`;
        
        // Bind action buttons
        const editBtn = taskItem.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => this.editTask(task.id));
        
        const deleteBtn = taskItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
        
        return taskElement;
    }

    getPriorityLabel(priority) {
        const labels = {
            low: '🟢 Low',
            medium: '🟡 Medium',
            high: '🔴 High'
        };
        return labels[priority] || '🟡 Medium';
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        
        this.totalTasks.textContent = total;
        this.completedTasks.textContent = completed;
    }

    saveTasks() {
        localStorage.setItem('taskflow_tasks', JSON.stringify(this.tasks));
    }

    showToast(message, type = 'success') {
        const toast = this.successToast;
        const messageElement = toast.querySelector('.toast-message');
        
        messageElement.textContent = message;
        
        // Update toast styling based on type
        if (type === 'error') {
            toast.style.background = '#f44336';
        } else {
            toast.style.background = '#4caf50';
        }
        
        toast.classList.add('show');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TaskFlow();
});

// Add some sample tasks for demonstration (optional)
function addSampleTasks() {
    const sampleTasks = [
        {
            id: 'sample1',
            title: 'Welcome to TaskFlow! 🎉',
            completed: false,
            priority: 'high',
            dueDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            completedAt: null
        },
        {
            id: 'sample2',
            title: 'Click the checkbox to mark tasks as complete',
            completed: false,
            priority: 'medium',
            dueDate: null,
            createdAt: new Date().toISOString(),
            completedAt: null
        },
        {
            id: 'sample3',
            title: 'Use filters to organize your tasks',
            completed: false,
            priority: 'low',
            dueDate: null,
            createdAt: new Date().toISOString(),
            completedAt: null
        }
    ];
    
    // Only add sample tasks if no tasks exist
    const existingTasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || [];
    if (existingTasks.length === 0) {
        localStorage.setItem('taskflow_tasks', JSON.stringify(sampleTasks));
    }
}

// Add sample tasks on first visit
addSampleTasks();
