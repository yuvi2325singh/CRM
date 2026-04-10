// ---------- DATA STORES ----------
let employees = []; // { id, name, password }
let projects = [];
let tasks = [];
let attendances = []; // { userId, date, status }
let notifications = [];

// Helper: add notification & refresh UI
function addNotification(msg) {
    notifications.unshift({ text: msg, time: new Date().toLocaleTimeString() });
    if (notifications.length > 15) notifications.pop();
    renderNotificationPanel();
}

function renderNotificationPanel() {
    const container = document.getElementById('notifList');
    if (!container) return;
    if (notifications.length === 0) container.innerHTML = '<div class="notif-item">No new notifications</div>';
    else {
        container.innerHTML = notifications.map(n => `<div class="notif-item"><i class="fas fa-info-circle"></i> ${n.text} <br><small>${n.time}</small></div>`).join('');
    }
}

// Helper: refresh stats & all UI tables
function refreshAllUI() {
    // employees table
    const empBody = document.getElementById('employeeListBody');
    if (empBody) {
        empBody.innerHTML = employees.map(emp => `<tr><td>${emp.id}</td><td>${emp.name}</td><td>${emp.password}</td><td>
  <button class="btn-primary editEmpBtn" data-id="${emp.id}">Edit</button>
  <button class="btn-secondary deleteEmpBtn" data-id="${emp.id}">Delete</button>
</td></tr>`).join('');
        document.querySelectorAll('.deleteEmpBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                employees = employees.filter(e => e.id !== id);
                // also remove attendance records for that user
                attendances = attendances.filter(a => a.userId !== id);
                refreshAllUI();
                addNotification(`Employee ID ${id} removed`);
            });
        });
        document.querySelectorAll('.editEmpBtn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                editEmployee(id);
            });
        });
        function editEmployee(id) {
            const emp = employees.find(e => e.id === id);
            if (!emp) return;

            let newName = prompt("Edit Name:", emp.name);
            if (!newName) return;

            let newPassword = prompt("Edit Password:", emp.password);
            if (newPassword === null) return;

            emp.name = newName;
            emp.password = newPassword;

            addNotification(`Employee ${id} updated`);
            refreshAllUI();
        }

    }
    // projects
    const projList = document.getElementById('projectList');
    if (projList) {
        projList.innerHTML = projects.map(p => `<tr><td>${p.id}</td><td>${p.name}</td><td>${p.assignedTo || 'Unassigned'}</td><td><span class="badge">${p.status}</span></td></tr>`).join('');
    }
    // tasks
    const taskBody = document.getElementById('taskListBody');
    if (taskBody) {
        taskBody.innerHTML = tasks.map(t => `<tr><td>${t.title}</td><td>${t.projectName}</td><td>${t.assignedTo}</td><td><span class="badge">${t.status}</span></td></tr>`).join('');
    }
    // dashboard stats
    document.getElementById('statEmployees').innerText = employees.length;
    document.getElementById('statProjects').innerText = projects.length;
    const today = new Date().toISOString().split('T')[0];
    const todayAttendanceCount = attendances.filter(a => a.date === today).length;
    document.getElementById('statAttendance').innerText = todayAttendanceCount;

    // update attendance dropdown
    const attSelect = document.getElementById('attendanceEmployeeSelect');
    if (attSelect) {
        attSelect.innerHTML = '<option value="">-- Select Employee --</option>' + employees.map(emp => `<option value="${emp.id}">${emp.name} (${emp.id})</option>`).join('');
    }
    // attendance records display
    const attDiv = document.getElementById('attendanceRecordsList');
    if (attDiv) {
        let html = '<table width="100%"><tr><th>Employee</th><th>Date</th><th>Status</th></tr>';
        attendances.slice().reverse().forEach(att => {
            const emp = employees.find(e => e.id === att.userId);
            const empName = emp ? emp.name : att.userId;
            html += `<tr><td>${empName}</td><td>${att.date}</td><td>✅ Present</td></tr>`;
        });
        html += '</table>';
        attDiv.innerHTML = html;
    }
    renderNotificationPanel();
}

// report generation
function generateWorkReport() {
    let reportHtml = `<h4>📋 Overall Report</h4>`;
    reportHtml += `<p><strong>Total Employees:</strong> ${employees.length}</p>`;
    reportHtml += `<p><strong>Active Projects:</strong> ${projects.length}</p>`;
    reportHtml += `<p><strong>Total Tasks:</strong> ${tasks.length}</p>`;
    const uniqueDays = [...new Set(attendances.map(a => a.date))];
    reportHtml += `<p><strong>Attendance days recorded:</strong> ${uniqueDays.length}</p>`;
    if (tasks.length) reportHtml += `<p><strong>Latest tasks:</strong> ${tasks.slice(0, 3).map(t => t.title).join(', ')}</p>`;
    reportHtml += `<hr><i class="fas fa-chart-line"></i> Work summary: CRM running efficiently.`;
    document.getElementById('reportOutput').innerHTML = reportHtml;
    addNotification("Work report generated");
}

// create new user ID (employee)
function createEmployee() {
    let newId = "EMP" + (employees.length + 1001);
    let name = prompt("Enter employee name:", "New Employee");
    if (!name) return;
    let pwd = prompt("Set password for login (optional):", "pass123");
    if (pwd === null) pwd = "default";
    employees.push({ id: newId, name: name, password: pwd });
    addNotification(`User created: ID ${newId} | Name: ${name} | Password: ${pwd}`);
    refreshAllUI();
}

// new project
function addProject() {
    let pName = prompt("Project name:");
    if (!pName) return;
    let assign = prompt("Assign to (employee ID / name):", "Admin");
    let newId = "PRJ" + (projects.length + 101);
    projects.push({ id: newId, name: pName, assignedTo: assign, status: "Active" });
    addNotification(`Project "${pName}" created.`);
    refreshAllUI();
}

function addTask() {
    let title = prompt("Task title:");
    if (!title) return;
    let projName = prompt("Related project name:");
    let assigned = prompt("Assigned to (Employee ID/name):");
    tasks.push({ title, projectName: projName || "General", assignedTo: assigned || "Admin", status: "Pending" });
    addNotification(`New task: ${title}`);
    refreshAllUI();
}

// Mark attendance for selected employee (today)
function markAttendance() {
    const select = document.getElementById('attendanceEmployeeSelect');
    const userId = select.value;
    if (!userId) { alert("Select an employee!"); return; }
    const today = new Date().toISOString().split('T')[0];
    const already = attendances.some(a => a.userId === userId && a.date === today);
    if (already) { alert("Already marked present for today!"); return; }
    attendances.push({ userId, date: today, status: "present" });
    addNotification(`Attendance marked for ${employees.find(e => e.id === userId)?.name} on ${today}`);
    refreshAllUI();
}

// SIDEBAR navigation & notification bell toggle
let currentTab = "dashboard";
function showTab(tabId) {
    document.querySelectorAll('.tab-section').forEach(sec => sec.style.display = 'none');
    document.getElementById(`${tabId}Section`).style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`.nav-item[data-tab="${tabId}"]`).classList.add('active');
    currentTab = tabId;
    if (tabId === 'report') generateWorkReport(); // auto load fresh report
    refreshAllUI();
}

// event listeners
window.onload = () => {

    // LOGIC
    document.getElementById('doLoginBtn').addEventListener('click', () => {
        const user = document.getElementById('loginUsername').value;
        const pass = document.getElementById('loginPassword').value;
        // only admin can login
        if (user === "admin" && pass === "123") {
            // success popup
            alert("✅ Login Successfully!");
            document.getElementById('loginContainer').style.display = 'none';
            document.getElementById('appWrapper').style.display = 'block';
            addNotification("Admin logged in successfully.");
            refreshAllUI();
        } else {
            alert("❌ Access Denied. Only admin credentials (admin / 123)");
        }
    });

    // sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.getAttribute('data-tab');
            showTab(tab);
        });
    });

    // profile dropdown toggle
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('show');
        document.getElementById('notificationPanel')?.classList.remove('show');
    });
    // notification bell toggle
    const bell = document.getElementById('notificationBell');
    const notifPanel = document.getElementById('notificationPanel');
    bell.addEventListener('click', (e) => {
        e.stopPropagation();
        notifPanel.classList.toggle('show');
        profileDropdown.classList.remove('show');
    });
    document.addEventListener('click', () => {
        profileDropdown.classList.remove('show');
        notifPanel.classList.remove('show');
    });

    document.getElementById('createUserBtn')?.addEventListener('click', createEmployee);
    document.getElementById('addProjectBtn')?.addEventListener('click', addProject);
    document.getElementById('addTaskBtn')?.addEventListener('click', addTask);
    document.getElementById('markAttendanceBtn')?.addEventListener('click', markAttendance);
    document.getElementById('generateReportBtn')?.addEventListener('click', () => { generateWorkReport(); addNotification("Manual report generated"); });
    document.getElementById('logoutSideBtn')?.addEventListener('click', () => {
        document.getElementById('appWrapper').style.display = 'none';
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        addNotification("Logged out");
    });
    showTab('dashboard');
};