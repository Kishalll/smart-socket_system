const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// --- HOSTEL BLOCKS ---
app.get('/blocks', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM HOSTEL_BLOCK');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/blocks', async (req, res) => {
    const { block_name, gender_type, total_floors } = req.body;
    try {
        await db.query('INSERT INTO HOSTEL_BLOCK (block_name, gender_type, total_floors) VALUES (?, ?, ?)', 
            [block_name, gender_type, total_floors]);
        res.status(201).send('Block Added');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ROOMS ---
app.get('/rooms', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT r.*, b.block_name FROM ROOM r LEFT JOIN HOSTEL_BLOCK b ON r.block_id = b.block_id');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/rooms', async (req, res) => {
    const { room_number, floor_no, room_type, capacity, block_id } = req.body;
    try {
        await db.query('INSERT INTO ROOM (room_number, floor_no, room_type, capacity, block_id) VALUES (?, ?, ?, ?, ?)', 
            [room_number, floor_no, room_type, capacity, block_id]);
        res.status(201).send('Room Added');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/rooms/:id', async (req, res) => {
    const { capacity } = req.body;
    try {
        await db.query('UPDATE ROOM SET capacity = ? WHERE room_id = ?', [capacity, req.params.id]);
        res.send('Room Updated');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- STUDENTS ---
app.get('/students', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT s.*, r.room_number FROM STUDENT s LEFT JOIN ROOM r ON s.room_id = r.room_id');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/students', async (req, res) => {
    const { reg_no, first_name, last_name, department, year_of_study, phone_no, room_id } = req.body;
    try {
        await db.query('INSERT INTO STUDENT (reg_no, first_name, last_name, department, year_of_study, phone_no, room_id) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [reg_no, first_name, last_name, department, year_of_study, phone_no, room_id]);
        res.status(201).send('Student Added');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/students/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM STUDENT WHERE student_id = ?', [req.params.id]);
        res.send('Student Deleted');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SOCKETS ---
app.get('/sockets', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT s.*, r.room_number FROM SOCKET s LEFT JOIN ROOM r ON s.room_id = r.room_id');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/sockets', async (req, res) => {
    const { socket_label, socket_type, socket_status, room_id } = req.body;
    try {
        await db.query('INSERT INTO SOCKET (socket_label, socket_type, socket_status, room_id) VALUES (?, ?, ?, ?)', 
            [socket_label, socket_type, socket_status, room_id]);
        res.status(201).send('Socket Added');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- POWER EVENTS ---
app.get('/events', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT e.*, s.socket_label FROM POWER_EVENT e LEFT JOIN SOCKET s ON e.socket_id = s.socket_id');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/events', async (req, res) => {
    const { socket_id, start_time, end_time, watts, event_source } = req.body;
    try {
        const [result] = await db.query('INSERT INTO POWER_EVENT (socket_id, start_time, end_time, watts, event_source) VALUES (?, ?, ?, ?, ?)', 
            [socket_id, start_time, end_time, watts, event_source]);
        
        // --- Auto-detect Violation ---
        // This is a simplified logic. In a real system, you'd check LOAD_RULE table.
        const [rules] = await db.query('SELECT * FROM LOAD_RULE WHERE is_active = 1 AND max_watts < ?', [watts]);
        if (rules.length > 0) {
            const rule = rules[0];
            await db.query('INSERT INTO VIOLATION_CASE (event_id, rule_id, violation_reason) VALUES (?, ?, ?)',
                [result.insertId, rule.rule_id, `Exceeded max watts of ${rule.max_watts}`]);
        }
        
        res.status(201).send('Event Logged');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- LOAD RULES ---
app.get('/rules', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM LOAD_RULE');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/rules', async (req, res) => {
    const { rule_name, max_watts, max_duration_minutes, severity_level } = req.body;
    try {
        await db.query('INSERT INTO LOAD_RULE (rule_name, max_watts, max_duration_minutes, severity_level) VALUES (?, ?, ?, ?)', 
            [rule_name, max_watts, max_duration_minutes, severity_level]);
        res.status(201).send('Rule Added');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- VIOLATIONS ---
app.get('/violations', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT v.*, e.watts, r.rule_name, s.socket_label 
            FROM VIOLATION_CASE v 
            JOIN POWER_EVENT e ON v.event_id = e.event_id 
            JOIN LOAD_RULE r ON v.rule_id = r.rule_id
            JOIN SOCKET s ON e.socket_id = s.socket_id
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- FINES ---
app.get('/fines', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT f.*, s.first_name, s.last_name, w.first_name as warden_fname 
            FROM FINE f 
            JOIN STUDENT s ON f.student_id = s.student_id 
            JOIN WARDEN w ON f.warden_id = w.warden_id
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/fines', async (req, res) => {
    const { case_id, student_id, warden_id, fine_amount, issued_date, due_date } = req.body;
    try {
        await db.query('INSERT INTO FINE (case_id, student_id, warden_id, fine_amount, issued_date, due_date) VALUES (?, ?, ?, ?, ?, ?)', 
            [case_id, student_id, warden_id, fine_amount, issued_date, due_date]);
        
        // Update case status to Resolved
        await db.query('UPDATE VIOLATION_CASE SET case_status = "Resolved" WHERE case_id = ?', [case_id]);
        
        res.status(201).send('Fine Issued');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- WARDENS ---
app.get('/wardens', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM WARDEN');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REPORTS ---
app.get('/reports', async (req, res) => {
    try {
        const [totalViolations] = await db.query('SELECT COUNT(*) as count FROM VIOLATION_CASE');
        const [totalFines] = await db.query('SELECT SUM(fine_amount) as total FROM FINE');
        
        const [topStudents] = await db.query(`
            SELECT s.first_name, s.last_name, COUNT(f.fine_id) as fine_count 
            FROM STUDENT s 
            JOIN FINE f ON s.student_id = f.student_id 
            GROUP BY s.student_id 
            ORDER BY fine_count DESC LIMIT 5
        `);

        const [topRooms] = await db.query(`
            SELECT r.room_number, COUNT(v.case_id) as violation_count 
            FROM ROOM r 
            JOIN SOCKET s ON r.room_id = s.room_id 
            JOIN POWER_EVENT e ON s.socket_id = e.socket_id 
            JOIN VIOLATION_CASE v ON e.event_id = v.event_id 
            GROUP BY r.room_id 
            ORDER BY violation_count DESC LIMIT 5
        `);

        res.json({
            totalViolations: totalViolations[0].count,
            totalFines: totalFines[0].total || 0,
            topStudents,
            topRooms
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/dashboard-stats', async (req, res) => {
    try {
        const [students] = await db.query('SELECT COUNT(*) as count FROM STUDENT');
        const [rooms] = await db.query('SELECT COUNT(*) as count FROM ROOM');
        const [violations] = await db.query('SELECT COUNT(*) as count FROM VIOLATION_CASE WHERE case_status = "Pending"');
        const [events] = await db.query('SELECT COUNT(*) as count FROM POWER_EVENT');

        res.json({
            studentCount: students[0].count,
            roomCount: rooms[0].count,
            pendingViolations: violations[0].count,
            totalEvents: events[0].count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Smart Socket Backend running on http://localhost:${PORT}`);
});
