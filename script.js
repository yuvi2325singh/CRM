 // ============ DATA STORES (Empty initially) ============
    let employees = [];
    let projects = [];
    let tasks = [];
    let attendances = [];
    let leaves = [];
    let workHours = [];  // { id, userId, taskId, date, hours, description }
    let notifications = [];

    let currentUser = null;
    let nextEmpId = 1;
    let nextProjectId = 1;
    let nextTaskId = 1;
    let nextLeaveId = 1;
    let nextWorkId = 1;
    let editingTaskId = null;

    // Helper Functions
    function showNotification(message, type = 'info') {
        const popup = document.createElement('div');
        popup.className = `notification-popup ${type}`;
        popup.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i><span>${message}</span>`;
        document.body.appendChild(popup);
        
        notifications.unshift({ id: Date.now(), text: message, time: new Date().toLocaleTimeString(), read: false });
        updateNotificationBadge();
        renderNotificationList();
        setTimeout(() => popup.remove(), 3000);
    }

    function updateNotificationBadge() {
        const badge = document.getElementById('notifBadge');
        if(badge) badge.innerText = notifications.filter(n => !n.read).length;
    }

    function renderNotificationList() {
        const container = document.getElementById('notifList');
        if(!container) return;
        container.innerHTML = notifications.slice(0, 10).map(n => `
            <div style="padding:0.5rem; border-bottom:1px solid var(--border); cursor:pointer" onclick="markNotificationRead(${n.id})">
                <small>${n.time}</small><br>${n.text}
            </div>
        `).join('');
        if(notifications.length === 0) container.innerHTML = '<div style="padding:0.5rem">No notifications</div>';
    }

    window.markNotificationRead = function(id) {
        const notif = notifications.find(n => n.id === id);
        if(notif) notif.read = true;
        updateNotificationBadge();
        renderNotificationList();
    };

    function updateEmployeeDropdowns() {
        const options = `<option value="">Select Employee</option>` + employees.map(e => `<option value="${e.id}">${e.name} (${e.id})</option>`).join('');
        const selects = ['projectAssignTo', 'taskAssignTo'];
        selects.forEach(id => {
            const sel = document.getElementById(id);
            if(sel) sel.innerHTML = options;
        });
    }

    function updateTaskDropdownForEmployee() {
        const taskSelect = document.getElementById('workTaskSelect');
        if(taskSelect && currentUser && currentUser.role !== 'admin') {
            const userTasks = tasks.filter(t => t.assignedTo === currentUser.id);
            taskSelect.innerHTML = '<option value="">Select Task</option>' + 
                userTasks.map(t => `<option value="${t.id}">${t.title} (${t.projectName})</option>`).join('');
        }
    }

    function refreshUI() {
        if(!currentUser) return;
        
        document.getElementById('userName').innerText = currentUser.name;
        document.getElementById('dropdownName').innerText = currentUser.name;
        document.getElementById('dropdownRole').innerText = currentUser.role === 'admin' ? 'Administrator' : 'Employee';
        
        const welcomeMsg = document.getElementById('welcomeMsg');
        if(welcomeMsg) {
            welcomeMsg.innerHTML = currentUser.role === 'admin' 
                ? 'Welcome Admin! You have full control to manage employees, projects, tasks, and view all data.'
                : `Welcome ${currentUser.name}! You can view your projects, tasks, mark attendance, apply leaves, and log work hours.`;
        }
        
        // Dashboard Stats
        const statsDiv = document.getElementById('dashboardStats');
        if(statsDiv) {
            if(currentUser.role === 'admin') {
                const totalHours = workHours.reduce((sum, w) => sum + w.hours, 0);
                statsDiv.innerHTML = `
                    <div class="stat-card"><h3>${employees.length}</h3><p>Employees</p></div>
                    <div class="stat-card"><h3>${projects.length}</h3><p>Projects</p></div>
                    <div class="stat-card"><h3>${tasks.length}</h3><p>Tasks</p></div>
                    <div class="stat-card"><h3>${totalHours}</h3><p>Total Hours</p></div>
                `;
            } else {
                const myTasks = tasks.filter(t => t.assignedTo === currentUser.id).length;
                const myProjects = projects.filter(p => p.assignedTo === currentUser.id).length;
                const myHours = workHours.filter(w => w.userId === currentUser.id).reduce((sum, w) => sum + w.hours, 0);
                statsDiv.innerHTML = `
                    <div class="stat-card"><h3>${myProjects}</h3><p>My Projects</p></div>
                    <div class="stat-card"><h3>${myTasks}</h3><p>My Tasks</p></div>
                    <div class="stat-card"><h3>${myHours}</h3><p>Total Hours</p></div>
                `;
            }
        }
        
        // Employee Table (Admin only)
        if(currentUser.role === 'admin') {
            const search = document.getElementById('empSearch')?.value.toLowerCase() || '';
            const filtered = employees.filter(e => e.name.toLowerCase().includes(search) || e.id.toLowerCase().includes(search));
            document.getElementById('employeeList').innerHTML = filtered.map(emp => `
                <tr>
                    <td>${emp.id}</td><td>${emp.name}</td><td>${emp.email}</td><td>${emp.password}</td>
                    <td>
                        <button class="btn-edit editEmp" data-id="${emp.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn-danger deleteEmp" data-id="${emp.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
            
            document.querySelectorAll('.editEmp').forEach(btn => btn.addEventListener('click', () => editEmployee(btn.getAttribute('data-id'))));
            document.querySelectorAll('.deleteEmp').forEach(btn => btn.addEventListener('click', () => deleteEmployee(btn.getAttribute('data-id'))));
        }
        
        // Projects List
        const projSearch = document.getElementById('projectSearch')?.value.toLowerCase() || '';
        let filteredProjects = currentUser.role === 'admin' ? projects : projects.filter(p => p.assignedTo === currentUser.id);
        filteredProjects = filteredProjects.filter(p => p.name.toLowerCase().includes(projSearch));
        document.getElementById('projectList').innerHTML = filteredProjects.map(p => `
            <tr>
                <td>${p.id}</td><td>${p.name}</td><td>${p.assignedTo}</td><td>${p.dueDate}</td>
                <td><span class="badge badge-success">${p.status}</span></td>
                <td>${currentUser.role === 'admin' ? `<button class="btn-edit editProj" data-id="${p.id}"><i class="fas fa-edit"></i></button><button class="btn-danger deleteProj" data-id="${p.id}"><i class="fas fa-trash"></i></button>` : ''}</td>
            </tr>
        `).join('');
        
        if(currentUser.role === 'admin') {
            document.querySelectorAll('.editProj')?.forEach(btn => btn.addEventListener('click', () => editProject(btn.getAttribute('data-id'))));
            document.querySelectorAll('.deleteProj')?.forEach(btn => btn.addEventListener('click', () => deleteProject(btn.getAttribute('data-id'))));
        }
        
        // Tasks List with Hours
        const taskSearch = document.getElementById('taskSearch')?.value.toLowerCase() || '';
        let filteredTasks = currentUser.role === 'admin' ? tasks : tasks.filter(t => t.assignedTo === currentUser.id);
        filteredTasks = filteredTasks.filter(t => t.title.toLowerCase().includes(taskSearch));
        document.getElementById('taskList').innerHTML = filteredTasks.map(t => {
            const taskHours = workHours.filter(w => w.taskId === t.id).reduce((sum, w) => sum + w.hours, 0);
            return `
                <tr>
                    <td>${t.title}</td><td>${t.projectName}</td><td>${t.assignedTo}</td>
                    <td><span class="badge ${t.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${t.status}</span></td>
                    <td>${taskHours} hrs</td>
                    <td>
                        ${(currentUser.role === 'admin' || t.assignedTo === currentUser.id) ? `<button class="btn-edit updateTaskBtn" data-id="${t.id}"><i class="fas fa-sync-alt"></i></button>` : ''}
                        ${currentUser.role === 'admin' ? `<button class="btn-danger deleteTask" data-id="${t.id}"><i class="fas fa-trash"></i></button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');
        
        document.querySelectorAll('.updateTaskBtn')?.forEach(btn => btn.addEventListener('click', () => openEditTaskModal(btn.getAttribute('data-id'))));
        if(currentUser.role === 'admin') {
            document.querySelectorAll('.deleteTask')?.forEach(btn => btn.addEventListener('click', () => deleteTask(btn.getAttribute('data-id'))));
        }
        
        // Attendance UI
        renderAttendanceUI();
        
        // Leave UI
        renderLeaveUI();
        
        // Timesheet UI
        renderTimesheetUI();
        
        updateEmployeeDropdowns();
        updateTaskDropdownForEmployee();
    }
    
    function renderAttendanceUI() {
        const attDiv = document.getElementById('attendanceUI');
        if(!attDiv) return;
        const today = new Date().toISOString().split('T')[0];
        
        if(currentUser.role === 'admin') {
            attDiv.innerHTML = `
                <select id="attendanceSelect" style="padding:0.5rem; border-radius:0.5rem; margin-right:0.5rem">
                    <option value="">Select Employee</option>
                    ${employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
                </select>
                <button class="btn-primary" id="markAttendanceBtn"><i class="fas fa-check"></i> Mark Present</button>
                <div style="margin-top:1rem; overflow-x:auto">
                    <table><thead><tr><th>Employee</th><th>Date</th><th>Time</th></tr></thead><tbody>
                    ${attendances.map(a => {
                        const emp = employees.find(e => e.id === a.userId);
                        return `<tr><td>${emp?.name || a.userId}</td><td>${a.date}</td><td>${a.time || '09:00'}</td></tr>`;
                    }).join('')}</tbody></table>
                </div>
            `;
            document.getElementById('markAttendanceBtn')?.addEventListener('click', () => {
                const userId = document.getElementById('attendanceSelect').value;
                if(!userId) { showNotification('Select employee', 'error'); return; }
                if(attendances.some(a => a.userId === userId && a.date === today)) { showNotification('Already marked', 'error'); return; }
                attendances.push({ userId, date: today, time: new Date().toLocaleTimeString() });
                showNotification(`Attendance marked`, 'success');
                refreshUI();
            });
        } else {
            const alreadyMarked = attendances.some(a => a.userId === currentUser.id && a.date === today);
            attDiv.innerHTML = `
                ${!alreadyMarked ? `<button class="btn-primary" id="selfAttendanceBtn"><i class="fas fa-check-circle"></i> Mark My Attendance</button><br><br>` : `<p>✅ Already marked for ${today}</p>`}
                <h4>My Attendance History</h4>
                <div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Time</th></tr></thead><tbody>
                ${attendances.filter(a => a.userId === currentUser.id).map(a => `<tr><td>${a.date}</td><td>${a.time || '09:00'}</td></tr>`).join('')}
                </tbody></table></div>
            `;
            document.getElementById('selfAttendanceBtn')?.addEventListener('click', () => {
                if(attendances.some(a => a.userId === currentUser.id && a.date === today)) { showNotification('Already marked', 'error'); return; }
                attendances.push({ userId: currentUser.id, date: today, time: new Date().toLocaleTimeString() });
                showNotification('Attendance marked!', 'success');
                refreshUI();
            });
        }
    }
    
    function renderLeaveUI() {
        const leaveDiv = document.getElementById('leaveUI');
        if(!leaveDiv) return;
        
        if(currentUser.role === 'admin') {
            leaveDiv.innerHTML = `
                <h4>Pending Requests</h4>
                <div style="overflow-x:auto"><table><thead><tr><th>Employee</th><th>From</th><th>To</th><th>Reason</th><th>Action</th></tr></thead><tbody>
                ${leaves.filter(l => l.status === 'pending').map(l => {
                    const emp = employees.find(e => e.id === l.userId);
                    return `<tr>
                        <td>${emp?.name || l.userId}</td><td>${l.fromDate}</td><td>${l.toDate}</td><td>${l.reason}</td>
                        <td><button class="btn-primary approveLeave" data-id="${l.id}">Approve</button> <button class="btn-danger rejectLeave" data-id="${l.id}">Reject</button></td>
                    </tr>`;
                }).join('')}</tbody></table></div>
                <h4>All Leaves</h4>
                <div style="overflow-x:auto"><table><thead><tr><th>Employee</th><th>Dates</th><th>Status</th></tr></thead><tbody>
                ${leaves.map(l => {
                    const emp = employees.find(e => e.id === l.userId);
                    return `<tr><td>${emp?.name || l.userId}</td><td>${l.fromDate} to ${l.toDate}</td><td>${l.status}</td></tr>`;
                }).join('')}</tbody></table></div>
            `;
            document.querySelectorAll('.approveLeave').forEach(btn => btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const leave = leaves.find(l => l.id === id);
                if(leave) { leave.status = 'approved'; showNotification(`Leave approved`, 'success'); refreshUI(); }
            }));
            document.querySelectorAll('.rejectLeave').forEach(btn => btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const leave = leaves.find(l => l.id === id);
                if(leave) { leave.status = 'rejected'; showNotification(`Leave rejected`, 'warning'); refreshUI(); }
            }));
        } else {
            leaveDiv.innerHTML = `
                <button class="btn-primary" id="applyLeaveBtn"><i class="fas fa-plus"></i> Apply for Leave</button>
                <div style="margin-top:1rem; overflow-x:auto"><table><thead><tr><th>From</th><th>To</th><th>Reason</th><th>Status</th></tr></thead><tbody>
                ${leaves.filter(l => l.userId === currentUser.id).map(l => `
                    <tr><td>${l.fromDate}</td><td>${l.toDate}</td><td>${l.reason}</td>
                    <td><span class="badge ${l.status === 'approved' ? 'badge-success' : l.status === 'pending' ? 'badge-warning' : 'badge-danger'}">${l.status}</span></td></tr>
                `).join('')}</tbody></table></div>
            `;
            document.getElementById('applyLeaveBtn')?.addEventListener('click', () => document.getElementById('leaveModal').classList.add('active'));
        }
    }
    
    function renderTimesheetUI() {
        const tsDiv = document.getElementById('timesheetUI');
        if(!tsDiv) return;
        
        if(currentUser.role === 'admin') {
            tsDiv.innerHTML = `
                <h4>All Work Hours</h4>
                <div style="overflow-x:auto"><table><thead><tr><th>Employee</th><th>Task</th><th>Date</th><th>Hours</th><th>Description</th></tr></thead><tbody>
                ${workHours.map(w => {
                    const emp = employees.find(e => e.id === w.userId);
                    const task = tasks.find(t => t.id === w.taskId);
                    return `<tr><td>${emp?.name || w.userId}</td><td>${task?.title || 'N/A'}</td><td>${w.date}</td><td>${w.hours}h</td><td>${w.description}</td></tr>`;
                }).join('')}</tbody></table></div>
            `;
        } else {
            const myHours = workHours.filter(w => w.userId === currentUser.id);
            tsDiv.innerHTML = `
                <button class="btn-primary" id="logWorkBtn"><i class="fas fa-clock"></i> Log Work Hours</button>
                <div style="margin-top:1rem; overflow-x:auto"><table><thead><tr><th>Task</th><th>Date</th><th>Hours</th><th>Description</th></tr></thead><tbody>
                ${myHours.map(w => {
                    const task = tasks.find(t => t.id === w.taskId);
                    return `<tr><td>${task?.title || 'N/A'}</td><td>${w.date}</td><td>${w.hours}h</td><td>${w.description}</td></tr>`;
                }).join('')}</tbody></table></div>
            `;
            document.getElementById('logWorkBtn')?.addEventListener('click', () => {
                document.getElementById('workHoursModal').classList.add('active');
                updateTaskDropdownForEmployee();
            });
        }
    }
    
    // Admin CRUD Operations
    function createEmployee() {
        const name = document.getElementById('empName').value;
        const email = document.getElementById('empEmail').value;
        const password = document.getElementById('empPassword').value;
        
        if(!name || !email) { showNotification('Fill all fields', 'error'); return; }
        if(!email.includes('@') || !email.includes('.')) { showNotification('Valid email required', 'error'); return; }
        
        const newId = `EMP${String(nextEmpId++).padStart(3,'0')}`;
        employees.push({ id: newId, name, email, password });
        showNotification(`Employee ${name} created with ID: ${newId}`, 'success');
        document.getElementById('employeeModal').classList.remove('active');
        document.getElementById('empName').value = '';
        document.getElementById('empEmail').value = '';
        refreshUI();
    }
    
    function editEmployee(id) {
        const emp = employees.find(e => e.id === id);
        if(!emp) return;
        const newName = prompt('Edit Name:', emp.name);
        const newEmail = prompt('Edit Email:', emp.email);
        const newPassword = prompt('Edit Password:', emp.password);
        if(newName) emp.name = newName;
        if(newEmail && newEmail.includes('@')) emp.email = newEmail;
        if(newPassword) emp.password = newPassword;
        showNotification(`Employee ${id} updated`, 'success');
        refreshUI();
    }
    
    function deleteEmployee(id) {
        if(confirm('Delete this employee? This will remove all their data.')) {
            employees = employees.filter(e => e.id !== id);
            projects = projects.filter(p => p.assignedTo !== id);
            tasks = tasks.filter(t => t.assignedTo !== id);
            leaves = leaves.filter(l => l.userId !== id);
            workHours = workHours.filter(w => w.userId !== id);
            showNotification(`Employee ${id} deleted`, 'success');
            refreshUI();
        }
    }
    
    function addProject() {
        const name = document.getElementById('projectName').value;
        const assignedTo = document.getElementById('projectAssignTo').value;
        const dueDate = document.getElementById('projectDueDate').value;
        
        if(!name || !assignedTo || !dueDate) { showNotification('Fill all fields', 'error'); return; }
        
        projects.push({ id: `PRJ${String(nextProjectId++).padStart(3,'0')}`, name, assignedTo, dueDate, status: 'Active' });
        showNotification(`Project "${name}" created`, 'success');
        document.getElementById('projectModal').classList.remove('active');
        document.getElementById('projectName').value = '';
        refreshUI();
    }
    
    function editProject(id) {
        const proj = projects.find(p => p.id === id);
        if(!proj) return;
        const newName = prompt('Edit Project Name:', proj.name);
        const newDue = prompt('Edit Due Date (YYYY-MM-DD):', proj.dueDate);
        if(newName) proj.name = newName;
        if(newDue) proj.dueDate = newDue;
        showNotification(`Project updated`, 'success');
        refreshUI();
    }
    
    function deleteProject(id) {
        if(confirm('Delete this project?')) {
            projects = projects.filter(p => p.id !== id);
            showNotification(`Project deleted`, 'success');
            refreshUI();
        }
    }
    
    function addTask() {
        const title = document.getElementById('taskTitle').value;
        const projectName = document.getElementById('taskProject').value;
        const assignedTo = document.getElementById('taskAssignTo').value;
        
        if(!title || !projectName || !assignedTo) { showNotification('Fill all fields', 'error'); return; }
        
        tasks.push({ id: nextTaskId++, title, projectName, assignedTo, status: 'Pending' });
        showNotification(`Task "${title}" created`, 'success');
        document.getElementById('taskModal').classList.remove('active');
        document.getElementById('taskTitle').value = '';
        refreshUI();
    }
    
    function openEditTaskModal(id) {
        editingTaskId = parseInt(id);
        const task = tasks.find(t => t.id === editingTaskId);
        if(task) {
            document.getElementById('editTaskStatus').value = task.status;
            document.getElementById('editTaskModal').classList.add('active');
        }
    }
    
    function updateTaskStatus() {
        if(editingTaskId) {
            const task = tasks.find(t => t.id === editingTaskId);
            if(task) {
                task.status = document.getElementById('editTaskStatus').value;
                showNotification(`Task status updated to ${task.status}`, 'success');
                document.getElementById('editTaskModal').classList.remove('active');
                refreshUI();
            }
        }
    }
    
    function deleteTask(id) {
        if(confirm('Delete this task?')) {
            tasks = tasks.filter(t => t.id != id);
            workHours = workHours.filter(w => w.taskId != id);
            showNotification(`Task deleted`, 'success');
            refreshUI();
        }
    }
    
    function submitLeave() {
        const fromDate = document.getElementById('leaveFrom').value;
        const toDate = document.getElementById('leaveTo').value;
        const reason = document.getElementById('leaveReason').value;
        
        if(!fromDate || !toDate || !reason) { showNotification('Fill all fields', 'error'); return; }
        
        leaves.push({ id: nextLeaveId++, userId: currentUser.id, fromDate, toDate, reason, status: 'pending' });
        showNotification(`Leave request submitted from ${fromDate} to ${toDate}`, 'success');
        document.getElementById('leaveModal').classList.remove('active');
        document.getElementById('leaveFrom').value = '';
        document.getElementById('leaveTo').value = '';
        document.getElementById('leaveReason').value = '';
        refreshUI();
    }
    
    function logWorkHours() {
        const taskId = document.getElementById('workTaskSelect').value;
        const date = document.getElementById('workDate').value;
        const hours = parseFloat(document.getElementById('workHours').value);
        const description = document.getElementById('workDescription').value;
        
        if(!taskId || !date || !hours || !description) { 
            showNotification('Please fill all fields', 'error'); 
            return;
        }
        
        if(isNaN(hours) || hours <= 0) {
            showNotification('Please enter valid hours', 'error');
            return;
        }
        
        const task = tasks.find(t => t.id == taskId);
        if(!task) {
            showNotification('Invalid task selected', 'error');
            return;
        }
        
        workHours.push({ 
            id: nextWorkId++, 
            userId: currentUser.id, 
            taskId: parseInt(taskId), 
            date, 
            hours, 
            description 
        });
        
        showNotification(`${hours} hours logged for "${task.title}"`, 'success');
        
        document.getElementById('workHoursModal').classList.remove('active');
        document.getElementById('workHours').value = '';
        document.getElementById('workDescription').value = '';
        document.getElementById('workDate').value = '';
        
        refreshUI();
    }
    
    // Navigation
    function showTab(tabId) {
        document.querySelectorAll('.tab-section').forEach(sec => sec.style.display = 'none');
        const section = document.getElementById(`${tabId}Section`);
        if(section) section.style.display = 'block';
        
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
        if(activeNav) activeNav.classList.add('active');
        refreshUI();
    }
    
    function loadNavbar() {
        const container = document.getElementById('navContainer');
        if(currentUser.role === 'admin') {
            container.innerHTML = `
                <div class="nav-item active" data-tab="dashboard"><i class="fas fa-tachometer-alt"></i><span> Dashboard</span></div>
                <div class="nav-item" data-tab="employee"><i class="fas fa-users"></i><span> Employees</span></div>
                <div class="nav-item" data-tab="projects"><i class="fas fa-project-diagram"></i><span> Projects</span></div>
                <div class="nav-item" data-tab="tasks"><i class="fas fa-tasks"></i><span> Tasks</span></div>
                <div class="nav-item" data-tab="attendance"><i class="fas fa-calendar-check"></i><span> Attendance</span></div>
                <div class="nav-item" data-tab="leave"><i class="fas fa-umbrella-beach"></i><span> Leaves</span></div>
                <div class="nav-item" data-tab="timesheet"><i class="fas fa-clock"></i><span> Work Hours</span></div>
            `;
        } else {
            container.innerHTML = `
                <div class="nav-item active" data-tab="dashboard"><i class="fas fa-tachometer-alt"></i><span> Dashboard</span></div>
                <div class="nav-item" data-tab="projects"><i class="fas fa-project-diagram"></i><span> My Projects</span></div>
                <div class="nav-item" data-tab="tasks"><i class="fas fa-tasks"></i><span> My Tasks</span></div>
                <div class="nav-item" data-tab="attendance"><i class="fas fa-calendar-check"></i><span> Attendance</span></div>
                <div class="nav-item" data-tab="leave"><i class="fas fa-umbrella-beach"></i><span> Leaves</span></div>
                <div class="nav-item" data-tab="timesheet"><i class="fas fa-clock"></i><span> Work Hours</span></div>
            `;
        }
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => showTab(item.getAttribute('data-tab')));
        });
    }
    
    function handleLogin() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        if(username === 'admin' && password === 'admin123') {
            currentUser = { id: 'admin', name: 'Administrator', role: 'admin' };
            document.getElementById('loginWrapper').style.display = 'none';
            document.getElementById('appWrapper').style.display = 'block';
            loadNavbar();
            showTab('dashboard');
            showNotification('Welcome Admin!', 'success');
            return;
        }
        
        const employee = employees.find(e => (e.id === username || e.email === username) && e.password === password);
        if(employee) {
            currentUser = { id: employee.id, name: employee.name, role: 'employee', email: employee.email };
            document.getElementById('loginWrapper').style.display = 'none';
            document.getElementById('appWrapper').style.display = 'block';
            loadNavbar();
            showTab('dashboard');
            showNotification(`Welcome ${employee.name}!`, 'success');
            return;
        }
        
        showNotification('Invalid credentials!', 'error');
    }
    
    function logout() {
        currentUser = null;
        document.getElementById('appWrapper').style.display = 'none';
        document.getElementById('loginWrapper').style.display = 'flex';
        showNotification('Logged out', 'success');
    }
    
    function toggleDarkMode() {
        document.body.classList.toggle('dark');
        localStorage.setItem('darkMode', document.body.classList.contains('dark'));
    }
    
    // Event Listeners
    window.onload = () => {
        if(localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark');
        
        document.getElementById('loginBtn').addEventListener('click', handleLogin);
        document.getElementById('logoutBtn').addEventListener('click', logout);
        document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
        
        document.getElementById('createEmployeeBtn')?.addEventListener('click', () => document.getElementById('employeeModal').classList.add('active'));
        document.getElementById('addProjectBtn')?.addEventListener('click', () => document.getElementById('projectModal').classList.add('active'));
        document.getElementById('addTaskBtn')?.addEventListener('click', () => document.getElementById('taskModal').classList.add('active'));
        
        document.getElementById('saveEmployeeBtn')?.addEventListener('click', createEmployee);
        document.getElementById('saveProjectBtn')?.addEventListener('click', addProject);
        document.getElementById('saveTaskBtn')?.addEventListener('click', addTask);
        document.getElementById('submitLeaveBtn')?.addEventListener('click', submitLeave);
        document.getElementById('saveWorkHoursBtn')?.addEventListener('click', logWorkHours);
        document.getElementById('updateTaskStatusBtn')?.addEventListener('click', updateTaskStatus);
        
        document.getElementById('closeEmpModal')?.addEventListener('click', () => document.getElementById('employeeModal').classList.remove('active'));
        document.getElementById('closeProjectModal')?.addEventListener('click', () => document.getElementById('projectModal').classList.remove('active'));
        document.getElementById('closeTaskModal')?.addEventListener('click', () => document.getElementById('taskModal').classList.remove('active'));
        document.getElementById('closeLeaveModal')?.addEventListener('click', () => document.getElementById('leaveModal').classList.remove('active'));
        document.getElementById('closeWorkModal')?.addEventListener('click', () => document.getElementById('workHoursModal').classList.remove('active'));
        document.getElementById('closeEditModal')?.addEventListener('click', () => document.getElementById('editTaskModal').classList.remove('active'));
        
        document.getElementById('empSearch')?.addEventListener('input', () => refreshUI());
        document.getElementById('projectSearch')?.addEventListener('input', () => refreshUI());
        document.getElementById('taskSearch')?.addEventListener('input', () => refreshUI());
        
        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.getElementById('profileDropdown');
        const bell = document.getElementById('notificationBell');
        const notifPanel = document.getElementById('notificationPanel');
        
        profileBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
            notifPanel?.classList.remove('show');
        });
        
        bell?.addEventListener('click', (e) => {
            e.stopPropagation();
            notifPanel.classList.toggle('show');
            profileDropdown.classList.remove('show');
        });
        
        document.addEventListener('click', () => {
            profileDropdown?.classList.remove('show');
            notifPanel?.classList.remove('show');
        });
    };