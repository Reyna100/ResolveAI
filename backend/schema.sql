-- ResolveAI Database Schema

CREATE DATABASE IF NOT EXISTS resolveai_db;
USE resolveai_db;

-- Citizen users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  mobile VARCHAR(15) NOT NULL UNIQUE,
  email VARCHAR(255),
  state VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  preferred_language VARCHAR(50) DEFAULT 'English',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Public grievances table
CREATE TABLE IF NOT EXISTS grievances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  complaint_text TEXT NOT NULL,
  category VARCHAR(100),
  confidence DECIMAL(5, 4),
  location VARCHAR(255),
  duration VARCHAR(100),
  additional_details TEXT,
  language VARCHAR(50) DEFAULT 'English',
  status VARCHAR(50) DEFAULT 'Draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
