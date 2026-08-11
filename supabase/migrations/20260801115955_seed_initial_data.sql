/*
# Sysmobyte OMS - Seed Data

Creates initial departments and demo data.
Note: The admin user (ahmedforkan26@gmail.com) must sign up through the app's
auth flow. This migration creates the department structure and demo data.
*/

-- Create default departments
INSERT INTO departments (name, description, icon, color)
SELECT 'Engineering', 'Software development and engineering', 'Code2', 'blue'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Engineering');

INSERT INTO departments (name, description, icon, color)
SELECT 'Design', 'UI/UX and product design', 'Palette', 'pink'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Design');

INSERT INTO departments (name, description, icon, color)
SELECT 'Marketing', 'Marketing and growth', 'Megaphone', 'green'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Marketing');

INSERT INTO departments (name, description, icon, color)
SELECT 'Human Resources', 'HR and people operations', 'Users', 'orange'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Human Resources');

INSERT INTO departments (name, description, icon, color)
SELECT 'Sales', 'Sales and business development', 'TrendingUp', 'purple'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Sales');

-- Create a demo project
INSERT INTO projects (title, description, status, priority, start_date, end_date, progress)
SELECT 'Sysmobyte Platform v2', 'Complete rebuild of the office management platform with modern UI', 'active', 'high', CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', 45
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Sysmobyte Platform v2');

INSERT INTO projects (title, description, status, priority, start_date, end_date, progress)
SELECT 'Mobile App Development', 'Native mobile apps for iOS and Android', 'planning', 'medium', CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '120 days', 0
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Mobile App Development');

INSERT INTO projects (title, description, status, priority, start_date, end_date, progress)
SELECT 'Brand Refresh 2026', 'Complete brand identity refresh', 'active', 'medium', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '45 days', 70
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Brand Refresh 2026');

-- Create demo notices
INSERT INTO notices (title, content, type, pinned)
SELECT 'Welcome to Sysmobyte OMS', 'Welcome to your new office management system. Please complete your profile and explore all features.', 'success', true
WHERE NOT EXISTS (SELECT 1 FROM notices WHERE title = 'Welcome to Sysmobyte OMS');

INSERT INTO notices (title, content, type)
SELECT 'System Maintenance', 'The system will undergo maintenance this weekend. Please save your work.', 'warning'
WHERE NOT EXISTS (SELECT 1 FROM notices WHERE title = 'System Maintenance');

-- Create demo schedules
INSERT INTO schedules (title, description, type, start_time, end_time, location)
SELECT 'Weekly Team Standup', 'Weekly sync with the engineering team', 'meeting', CURRENT_DATE + INTERVAL '1 day' + INTERVAL '9 hours', CURRENT_DATE + INTERVAL '1 day' + INTERVAL '10 hours', 'Conference Room A'
WHERE NOT EXISTS (SELECT 1 FROM schedules WHERE title = 'Weekly Team Standup');

INSERT INTO schedules (title, description, type, start_time, end_time, location)
SELECT 'Project Review Meeting', 'Monthly project progress review', 'review', CURRENT_DATE + INTERVAL '3 days' + INTERVAL '14 hours', CURRENT_DATE + INTERVAL '3 days' + INTERVAL '16 hours', 'Main Hall'
WHERE NOT EXISTS (SELECT 1 FROM schedules WHERE title = 'Project Review Meeting');

INSERT INTO schedules (title, description, type, start_time, end_time)
SELECT 'Q3 Product Launch', 'Final deadline for Q3 product launch', 'project_deadline', CURRENT_DATE + INTERVAL '30 days', NULL
WHERE NOT EXISTS (SELECT 1 FROM schedules WHERE title = 'Q3 Product Launch');