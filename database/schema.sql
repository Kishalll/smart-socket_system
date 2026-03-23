CREATE DATABASE IF NOT EXISTS smart_socket;
USE smart_socket;

-- Hostel blocks are created first
CREATE TABLE IF NOT EXISTS HOSTEL_BLOCK (
    block_id INT PRIMARY KEY AUTO_INCREMENT,
    block_name VARCHAR(100) NOT NULL,
    gender_type VARCHAR(20) NOT NULL,
    total_floors INT NOT NULL
);

-- Rooms are added under hostel blocks
CREATE TABLE IF NOT EXISTS ROOM (
    room_id INT PRIMARY KEY AUTO_INCREMENT,
    room_number VARCHAR(20) NOT NULL,
    floor_no INT NOT NULL,
    room_type VARCHAR(50),
    capacity INT NOT NULL,
    block_id INT,
    FOREIGN KEY (block_id) REFERENCES HOSTEL_BLOCK(block_id) ON DELETE CASCADE
);

-- Students are assigned to rooms
CREATE TABLE IF NOT EXISTS STUDENT (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    reg_no VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    year_of_study INT,
    phone_no VARCHAR(20),
    room_id INT,
    FOREIGN KEY (room_id) REFERENCES ROOM(room_id) ON DELETE SET NULL
);

-- Electrical sockets are assigned to rooms
CREATE TABLE IF NOT EXISTS SOCKET (
    socket_id INT PRIMARY KEY AUTO_INCREMENT,
    socket_label VARCHAR(50) NOT NULL,
    socket_type VARCHAR(50),
    socket_status VARCHAR(20) DEFAULT 'Active',
    room_id INT,
    FOREIGN KEY (room_id) REFERENCES ROOM(room_id) ON DELETE CASCADE
);

-- Power usage events are logged for sockets
CREATE TABLE IF NOT EXISTS POWER_EVENT (
    event_id INT PRIMARY KEY AUTO_INCREMENT,
    socket_id INT,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    watts DECIMAL(10, 2) NOT NULL,
    event_source VARCHAR(100),
    FOREIGN KEY (socket_id) REFERENCES SOCKET(socket_id) ON DELETE CASCADE
);

-- Load rules define maximum allowed wattage and duration
CREATE TABLE IF NOT EXISTS LOAD_RULE (
    rule_id INT PRIMARY KEY AUTO_INCREMENT,
    rule_name VARCHAR(100) NOT NULL,
    max_watts DECIMAL(10, 2) NOT NULL,
    max_duration_minutes INT NOT NULL,
    severity_level VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE
);

-- Wardens manage violation cases and fines
CREATE TABLE IF NOT EXISTS WARDEN (
    warden_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_no VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    block_id INT,
    FOREIGN KEY (block_id) REFERENCES HOSTEL_BLOCK(block_id) ON DELETE SET NULL
);

-- If a power event exceeds rules, a violation case is created
CREATE TABLE IF NOT EXISTS VIOLATION_CASE (
    case_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT,
    rule_id INT,
    detected_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    violation_reason TEXT,
    case_status VARCHAR(20) DEFAULT 'Pending',
    FOREIGN KEY (event_id) REFERENCES POWER_EVENT(event_id) ON DELETE CASCADE,
    FOREIGN KEY (rule_id) REFERENCES LOAD_RULE(rule_id) ON DELETE SET NULL
);

-- Fines are issued to students for confirmed violations
CREATE TABLE IF NOT EXISTS FINE (
    fine_id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT UNIQUE,
    student_id INT,
    warden_id INT,
    fine_amount DECIMAL(10, 2) NOT NULL,
    issued_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'Unpaid',
    FOREIGN KEY (case_id) REFERENCES VIOLATION_CASE(case_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id) ON DELETE CASCADE,
    FOREIGN KEY (warden_id) REFERENCES WARDEN(warden_id) ON DELETE SET NULL
);
