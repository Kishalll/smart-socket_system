const API_URL = 'http://localhost:3000';

// State Management
let currentPage = 'dashboard';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    switchPage('dashboard', document.querySelector('.sidebar-nav li'));
});

// Expose functions to window for inline HTML handlers (since this is a module)
window.switchPage = switchPage;
window.openModal = openModal;
window.closeModal = closeModal;
window.handleFormSubmit = handleFormSubmit;
window.handleUpdate = handleUpdate;
window.deleteItem = deleteItem;
window.openUpdateModal = openUpdateModal;

// --- Page Switching ---
function switchPage(page, element) {
    currentPage = page;
    
    // Update Sidebar UI
    document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
    element.classList.add('active');
    
    // Update Top Bar
    const titleMap = {
        'dashboard': 'Dashboard',
        'students': 'Student Management',
        'rooms': 'Room Management',
        'sockets': 'Socket Management',
        'events': 'Power Usage Events',
        'violations': 'Violation Cases',
        'fines': 'Fine Management',
        'reports': 'System Reports'
    };
    document.getElementById('page-title').innerText = titleMap[page];
    
    // Render Content
    renderPage(page);
}

async function renderPage(page) {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '<div class="loading">Loading...</div>';
    
    switch(page) {
        case 'dashboard':
            await renderDashboard();
            break;
        case 'students':
            await renderTablePage('students', ['ID', 'Reg No', 'Name', 'Dept', 'Year', 'Room', 'Actions'], 'Add Student');
            break;
        case 'rooms':
            await renderTablePage('rooms', ['ID', 'Number', 'Floor', 'Type', 'Capacity', 'Block', 'Actions'], 'Add Room');
            break;
        case 'sockets':
            await renderTablePage('sockets', ['ID', 'Label', 'Type', 'Status', 'Room', 'Actions'], 'Add Socket');
            break;
        case 'events':
            await renderTablePage('events', ['ID', 'Socket', 'Start', 'End', 'Watts', 'Source'], 'Log Event');
            break;
        case 'violations':
            await renderTablePage('violations', ['ID', 'Socket', 'Watts', 'Reason', 'Time', 'Status', 'Actions'], null);
            break;
        case 'fines':
            await renderTablePage('fines', ['ID', 'Student', 'Warden', 'Amount', 'Issued', 'Due', 'Status'], 'Issue Fine');
            break;
        case 'reports':
            await renderReports();
            break;
    }
}

// --- Dashboard Render ---
async function renderDashboard() {
    try {
        const res = await fetch(`${API_URL}/dashboard-stats`);
        const stats = await res.json();
        
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-title">Total Students</span>
                    <span class="stat-value">${stats.studentCount}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-title">Total Rooms</span>
                    <span class="stat-value">${stats.roomCount}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-title">Pending Violations</span>
                    <span class="stat-value" style="color: var(--error)">${stats.pendingViolations}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-title">Power Events</span>
                    <span class="stat-value">${stats.totalEvents}</span>
                </div>
            </div>
            
            <div class="table-container">
                <h3>Quick Actions</h3>
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button class="btn btn-primary" onclick="openModal('students')">Add Student</button>
                    <button class="btn btn-primary" onclick="openModal('events')">Log Power Event</button>
                    <button class="btn btn-primary" onclick="openModal('rooms')">Add Room</button>
                </div>
            </div>
        `;
    } catch (err) {
        console.error(err);
    }
}

// --- Generic Table Page Render ---
async function renderTablePage(type, headers, actionText) {
    try {
        const res = await fetch(`${API_URL}/${type}`);
        const data = await res.json();
        
        const contentArea = document.getElementById('content-area');
        let html = `
            <div class="action-bar">
                <h2>Manage ${type.charAt(0).toUpperCase() + type.slice(1)}</h2>
                ${actionText ? `<button class="btn btn-primary" onclick="openModal('${type}')">${actionText}</button>` : ''}
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
        `;
        
        if (data.length === 0) {
            html += `<tr><td colspan="${headers.length}" style="text-align:center; padding: 2rem;">No data found</td></tr>`;
        } else {
            data.forEach(row => {
                html += `<tr>${renderRow(type, row)}</tr>`;
            });
        }
        
        html += `</tbody></table></div>`;
        contentArea.innerHTML = html;
    } catch (err) {
        console.error(err);
    }
}

function renderRow(type, row) {
    switch(type) {
        case 'students':
            return `
                <td>${row.student_id}</td>
                <td>${row.reg_no}</td>
                <td>${row.first_name} ${row.last_name}</td>
                <td>${row.department}</td>
                <td>${row.year_of_study}</td>
                <td>${row.room_number || 'N/A'}</td>
                <td>
                    <button class="btn btn-danger" onclick="deleteItem('students', ${row.student_id})">Delete</button>
                </td>
            `;
        case 'rooms':
            return `
                <td>${row.room_id}</td>
                <td>${row.room_number}</td>
                <td>${row.floor_no}</td>
                <td>${row.room_type}</td>
                <td>${row.capacity}</td>
                <td>${row.block_name}</td>
                <td>
                    <button class="btn btn-primary" onclick="openUpdateModal('rooms', ${row.room_id}, ${row.capacity})">Update</button>
                </td>
            `;
        case 'sockets':
            return `
                <td>${row.socket_id}</td>
                <td>${row.socket_label}</td>
                <td>${row.socket_type}</td>
                <td>${row.socket_status}</td>
                <td>${row.room_number || 'N/A'}</td>
                <td>-</td>
            `;
        case 'events':
            return `
                <td>${row.event_id}</td>
                <td>${row.socket_label}</td>
                <td>${new Date(row.start_time).toLocaleString()}</td>
                <td>${row.end_time ? new Date(row.end_time).toLocaleString() : 'Active'}</td>
                <td>${row.watts} W</td>
                <td>${row.event_source}</td>
            `;
        case 'violations':
            return `
                <td>${row.case_id}</td>
                <td>${row.socket_label}</td>
                <td>${row.watts} W</td>
                <td>${row.violation_reason}</td>
                <td>${new Date(row.detected_time).toLocaleString()}</td>
                <td><span style="color: ${row.case_status === 'Pending' ? 'var(--error)' : 'var(--success)'}">${row.case_status}</span></td>
                <td>
                    ${row.case_status === 'Pending' ? `<button class="btn btn-primary" onclick="openModal('fines', ${row.case_id})">Issue Fine</button>` : 'Resolved'}
                </td>
            `;
        case 'fines':
            return `
                <td>${row.fine_id}</td>
                <td>${row.first_name} ${row.last_name}</td>
                <td>${row.warden_fname}</td>
                <td>$${row.fine_amount}</td>
                <td>${new Date(row.issued_date).toLocaleDateString()}</td>
                <td>${new Date(row.due_date).toLocaleDateString()}</td>
                <td>${row.payment_status}</td>
            `;
    }
}

// --- Reports Render ---
async function renderReports() {
    try {
        const res = await fetch(`${API_URL}/reports`);
        const reports = await res.json();
        
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-title">Total Violations</span>
                    <span class="stat-value">${reports.totalViolations}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-title">Total Revenue from Fines</span>
                    <span class="stat-value">$${reports.totalFines}</span>
                </div>
            </div>
            
            <div class="report-grid">
                <div class="report-item">
                    <h3>Top Students (Most Fines)</h3>
                    <table>
                        <thead><tr><th>Student</th><th>Fines Count</th></tr></thead>
                        <tbody>
                            ${reports.topStudents.map(s => `<tr><td>${s.first_name} ${s.last_name}</td><td>${s.fine_count}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="report-item">
                    <h3>Hotspot Rooms (Most Violations)</h3>
                    <table>
                        <thead><tr><th>Room No</th><th>Violations</th></tr></thead>
                        <tbody>
                            ${reports.topRooms.map(r => `<tr><td>${r.room_number}</td><td>${r.violation_count}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (err) {
        console.error(err);
    }
}

// --- Modal & Form Logic ---
async function openModal(type, extraId = null) {
    const modal = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modal.classList.remove('hidden');
    modalTitle.innerText = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    modalBody.innerHTML = '<div class="loading">Preparing form...</div>';
    
    let formHtml = '';
    try {
        switch(type) {
            case 'blocks':
                formHtml = `
                    <form onsubmit="handleFormSubmit(event, 'blocks')">
                        <div class="form-group"><label>Block Name</label><input type="text" id="block_name" placeholder="e.g. Boys Hostel A" required></div>
                        <div class="form-group">
                            <label>Gender Type</label>
                            <select id="gender_type">
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Co-ed">Co-ed</option>
                            </select>
                        </div>
                        <div class="form-group"><label>Total Floors</label><input type="number" id="total_floors" required></div>
                        <button type="submit" class="btn btn-primary w-100">Save Block</button>
                    </form>
                `;
                break;
            case 'students':
                const roomRes = await fetch(`${API_URL}/rooms`);
                const rooms = await roomRes.json();
                formHtml = `
                    <form onsubmit="handleFormSubmit(event, 'students')">
                        <div class="form-group"><label>Reg No</label><input type="text" id="reg_no" required></div>
                        <div class="form-group"><label>First Name</label><input type="text" id="first_name" required></div>
                        <div class="form-group"><label>Last Name</label><input type="text" id="last_name" required></div>
                        <div class="form-group"><label>Department</label><input type="text" id="department"></div>
                        <div class="form-group"><label>Year</label><input type="number" id="year_of_study"></div>
                        <div class="form-group"><label>Phone</label><input type="text" id="phone_no"></div>
                        <div class="form-group">
                            <label>Assign Room</label>
                            <select id="room_id" required>
                                <option value="">Select a Room</option>
                                ${rooms.map(r => `<option value="${r.room_id}">${r.room_number} (Block: ${r.block_name})</option>`).join('')}
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary w-100">Save Student</button>
                    </form>
                `;
                break;
            case 'rooms':
                const blockRes = await fetch(`${API_URL}/blocks`);
                const blocks = await blockRes.json();
                formHtml = `
                    <form onsubmit="handleFormSubmit(event, 'rooms')">
                        <div class="form-group"><label>Room Number</label><input type="text" id="room_number" required></div>
                        <div class="form-group"><label>Floor No</label><input type="number" id="floor_no" required></div>
                        <div class="form-group"><label>Room Type</label><input type="text" id="room_type" placeholder="e.g. Single, Double"></div>
                        <div class="form-group"><label>Capacity</label><input type="number" id="capacity" required></div>
                        <div class="form-group">
                            <label>Hostel Block</label>
                            <select id="block_id" required>
                                <option value="">Select a Block</option>
                                ${blocks.map(b => `<option value="${b.block_id}">${b.block_name}</option>`).join('')}
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary w-100">Save Room</button>
                    </form>
                `;
                break;
            case 'sockets':
                const sRoomRes = await fetch(`${API_URL}/rooms`);
                const sRooms = await sRoomRes.json();
                formHtml = `
                    <form onsubmit="handleFormSubmit(event, 'sockets')">
                        <div class="form-group"><label>Socket Label</label><input type="text" id="socket_label" placeholder="e.g. Wall-Left" required></div>
                        <div class="form-group"><label>Socket Type</label><input type="text" id="socket_type" placeholder="e.g. 15A Power"></div>
                        <div class="form-group">
                            <label>Room</label>
                            <select id="room_id" required>
                                <option value="">Select a Room</option>
                                ${sRooms.map(r => `<option value="${r.room_id}">${r.room_number}</option>`).join('')}
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary w-100">Save Socket</button>
                    </form>
                `;
                break;
            case 'events':
                const sockRes = await fetch(`${API_URL}/sockets`);
                const socks = await sockRes.json();
                formHtml = `
                    <form onsubmit="handleFormSubmit(event, 'events')">
                        <div class="form-group">
                            <label>Socket</label>
                            <select id="socket_id" required>
                                <option value="">Select Socket</option>
                                ${socks.map(s => `<option value="${s.socket_id}">${s.socket_label} (Room ${s.room_number})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group"><label>Start Time</label><input type="datetime-local" id="start_time" required></div>
                        <div class="form-group"><label>Watts Usage</label><input type="number" step="0.01" id="watts" required></div>
                        <div class="form-group"><label>Appliance/Source</label><input type="text" id="event_source" placeholder="e.g. Electric Kettle"></div>
                        <button type="submit" class="btn btn-primary w-100">Log Event</button>
                    </form>
                `;
                break;
            case 'fines':
                const stuRes = await fetch(`${API_URL}/students`);
                const students = await stuRes.json();
                const warRes = await fetch(`${API_URL}/wardens`);
                const wardens = await warRes.json();
                formHtml = `
                    <form onsubmit="handleFormSubmit(event, 'fines')">
                        <input type="hidden" id="case_id" value="${extraId}">
                        <div class="form-group">
                            <label>Student</label>
                            <select id="student_id" required>
                                <option value="">Select Student</option>
                                ${students.map(s => `<option value="${s.student_id}">${s.first_name} ${s.last_name} (${s.reg_no})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Issuing Warden</label>
                            <select id="warden_id" required>
                                <option value="">Select Warden</option>
                                ${wardens.map(w => `<option value="${w.warden_id}">${w.first_name} ${w.last_name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group"><label>Fine Amount ($)</label><input type="number" id="fine_amount" required></div>
                        <div class="form-group"><label>Due Date</label><input type="date" id="due_date" required></div>
                        <button type="submit" class="btn btn-primary w-100">Issue Fine</button>
                    </form>
                `;
                break;
        }
        modalBody.innerHTML = formHtml;
    } catch (err) {
        modalBody.innerHTML = `<div class="error">Failed to load form data. Please ensure you have added prerequisite data (like Blocks or Rooms) first.</div>`;
    }
}

function openUpdateModal(type, id, currentVal) {
    const modal = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modal.classList.remove('hidden');
    modalTitle.innerText = `Update ${type.charAt(0).toUpperCase() + type.slice(1)} Capacity`;
    
    modalBody.innerHTML = `
        <form onsubmit="handleUpdate(event, '${type}', ${id})">
            <div class="form-group"><label>New Capacity</label><input type="number" id="update_val" value="${currentVal}" required></div>
            <button type="submit" class="btn btn-primary">Update</button>
        </form>
    `;
}

async function handleFormSubmit(event, type) {
    event.preventDefault();
    const formData = {};
    const inputs = event.target.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.id) formData[input.id] = input.value;
    });

    if (type === 'fines') {
        formData.issued_date = new Date().toISOString().split('T')[0];
    }

    try {
        const res = await fetch(`${API_URL}/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            closeModal();
            renderPage(currentPage);
        } else {
            const err = await res.json();
            alert('Error: ' + err.error);
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleUpdate(event, type, id) {
    event.preventDefault();
    const val = document.getElementById('update_val').value;
    try {
        const res = await fetch(`${API_URL}/rooms/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ capacity: val })
        });
        if (res.ok) {
            closeModal();
            renderPage(currentPage);
        }
    } catch (err) {
        console.error(err);
    }
}

async function deleteItem(type, id) {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
        const res = await fetch(`${API_URL}/students/${id}`, { method: 'DELETE' });
        if (res.ok) {
            renderPage(currentPage);
        }
    } catch (err) {
        console.error(err);
    }
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}
