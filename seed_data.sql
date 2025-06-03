-- seed_data.sql

-- First, let's start with admin_users
INSERT INTO public.admin_users (username, password_hash)
VALUES 
('admin', '$2a$10$hACwQ5/HQI6FhbIIK5C5IOocXDsjOYuokuCJUgzouIm7QFn1R5HEa'); -- password: admin123

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE public.departments, public.ministries, public.clusters, public.categories, public.registrations CASCADE;

-- Insert departments
INSERT INTO public.departments (name, description) 
VALUES
('Worship', 'Handles all worship and music ministries'),
('Outreach', 'Focuses on community outreach and evangelism'),
('Family Life', 'Support for families and relationship building'),
('Next Gen', 'Youth and children ministries'),
('Operations', 'Church operations and facilities management');

-- Insert ministries
INSERT INTO public.ministries (name, department_id)
VALUES
('Worship Team', (SELECT id FROM public.departments WHERE name = 'Worship')),
('Sound & Media', (SELECT id FROM public.departments WHERE name = 'Worship')),
('Community Service', (SELECT id FROM public.departments WHERE name = 'Outreach')),
('Evangelism', (SELECT id FROM public.departments WHERE name = 'Outreach')),
('Marriage Ministry', (SELECT id FROM public.departments WHERE name = 'Family Life')),
('Parenting Support', (SELECT id FROM public.departments WHERE name = 'Family Life')),
('Youth Ministry', (SELECT id FROM public.departments WHERE name = 'Next Gen')),
('Children\'s Church', (SELECT id FROM public.departments WHERE name = 'Next Gen')),
('Facilities', (SELECT id FROM public.departments WHERE name = 'Operations')),
('Events', (SELECT id FROM public.departments WHERE name = 'Operations'));

-- Insert clusters
INSERT INTO public.clusters (name, ministry_id)
VALUES
('Vocalists', (SELECT id FROM public.ministries WHERE name = 'Worship Team')),
('Instrumentalists', (SELECT id FROM public.ministries WHERE name = 'Worship Team')),
('Audio Team', (SELECT id FROM public.ministries WHERE name = 'Sound & Media')),
('Video Team', (SELECT id FROM public.ministries WHERE name = 'Sound & Media')),
('Food Bank', (SELECT id FROM public.ministries WHERE name = 'Community Service')),
('Homeless Outreach', (SELECT id FROM public.ministries WHERE name = 'Community Service')),
('Street Evangelism', (SELECT id FROM public.ministries WHERE name = 'Evangelism')),
('Online Ministry', (SELECT id FROM public.ministries WHERE name = 'Evangelism')),
('Newlyweds', (SELECT id FROM public.ministries WHERE name = 'Marriage Ministry')),
('Long-term Marriage', (SELECT id FROM public.ministries WHERE name = 'Marriage Ministry')),
('New Parents', (SELECT id FROM public.ministries WHERE name = 'Parenting Support')),
('Teen Parents', (SELECT id FROM public.ministries WHERE name = 'Parenting Support')),
('Middle School', (SELECT id FROM public.ministries WHERE name = 'Youth Ministry')),
('High School', (SELECT id FROM public.ministries WHERE name = 'Youth Ministry')),
('Preschool', (SELECT id FROM public.ministries WHERE name = 'Children\'s Church')),
('Elementary', (SELECT id FROM public.ministries WHERE name = 'Children\'s Church')),
('Building Maintenance', (SELECT id FROM public.ministries WHERE name = 'Facilities')),
('Grounds', (SELECT id FROM public.ministries WHERE name = 'Facilities')),
('Conference Planning', (SELECT id FROM public.ministries WHERE name = 'Events')),
('Sunday Service', (SELECT id FROM public.ministries WHERE name = 'Events'));

-- Insert categories
INSERT INTO public.categories (name, price, inclusions)
VALUES
('3K', 1500, ARRAY['Race bib', 'Finisher medal', 'Water bottle']),
('6K', 2500, ARRAY['Race bib', 'Finisher medal', 'Water bottle', 'T-shirt']),
('10K', 3500, ARRAY['Race bib', 'Finisher medal', 'Water bottle', 'T-shirt', 'Cap']);

-- Insert sample registrations
INSERT INTO public.registrations (
  first_name, 
  last_name, 
  email, 
  phone, 
  age, 
  gender,
  category,
  price,
  is_church_attendee,
  department,
  ministry,
  cluster,
  emergency_contact,
  emergency_phone,
  medical_conditions,
  registration_id,
  status,
  created_at
)
VALUES
-- Confirmed registrations
('John', 'Smith', 'john.smith@example.com', '+2547123456789', 35, 'Male', '10K', 3500, true, 'Worship', 'Worship Team', 'Vocalists', 'Mary Smith', '+2547123456780', 'None', 'REG-001-2025', 'confirmed', NOW() - INTERVAL '10 days'),
('Sarah', 'Johnson', 'sarah.johnson@example.com', '+2547234567890', 28, 'Female', '6K', 2500, true, 'Next Gen', 'Youth Ministry', 'High School', 'Mike Johnson', '+2547234567891', 'Asthma', 'REG-002-2025', 'confirmed', NOW() - INTERVAL '9 days'),
('Michael', 'Williams', 'michael.williams@example.com', '+2547345678901', 42, 'Male', '3K', 1500, false, NULL, NULL, NULL, 'Jane Williams', '+2547345678902', 'None', 'REG-003-2025', 'confirmed', NOW() - INTERVAL '8 days'),
('Emily', 'Brown', 'emily.brown@example.com', '+2547456789012', 31, 'Female', '10K', 3500, true, 'Outreach', 'Evangelism', 'Street Evangelism', 'David Brown', '+2547456789013', 'None', 'REG-004-2025', 'confirmed', NOW() - INTERVAL '7 days'),
('David', 'Jones', 'david.jones@example.com', '+2547567890123', 29, 'Male', '6K', 2500, true, 'Operations', 'Facilities', 'Building Maintenance', 'Susan Jones', '+2547567890124', 'Knee injury', 'REG-005-2025', 'confirmed', NOW() - INTERVAL '7 days'),

-- Pending registrations
('Jennifer', 'Davis', 'jennifer.davis@example.com', '+2547678901234', 25, 'Female', '3K', 1500, true, 'Family Life', 'Marriage Ministry', 'Newlyweds', 'Robert Davis', '+2547678901235', 'None', 'REG-006-2025', 'pending', NOW() - INTERVAL '6 days'),
('Robert', 'Miller', 'robert.miller@example.com', '+2547789012345', 38, 'Male', '10K', 3500, false, NULL, NULL, NULL, 'Nancy Miller', '+2547789012346', 'Diabetes', 'REG-007-2025', 'pending', NOW() - INTERVAL '5 days'),
('Jessica', 'Wilson', 'jessica.wilson@example.com', '+2547890123456', 27, 'Female', '6K', 2500, true, 'Worship', 'Sound & Media', 'Audio Team', 'Andrew Wilson', '+2547890123457', 'None', 'REG-008-2025', 'pending', NOW() - INTERVAL '4 days'),
('James', 'Moore', 'james.moore@example.com', '+2547901234567', 33, 'Male', '3K', 1500, true, 'Next Gen', 'Children\'s Church', 'Elementary', 'Patricia Moore', '+2547901234568', 'None', 'REG-009-2025', 'pending', NOW() - INTERVAL '3 days'),
('Patricia', 'Taylor', 'patricia.taylor@example.com', '+2547012345678', 29, 'Female', '10K', 3500, true, 'Operations', 'Events', 'Conference Planning', 'Thomas Taylor', '+2547012345679', 'Allergies', 'REG-010-2025', 'pending', NOW() - INTERVAL '2 days'),

-- Cancelled registrations
('Thomas', 'Anderson', 'thomas.anderson@example.com', '+2547112345678', 45, 'Male', '6K', 2500, false, NULL, NULL, NULL, 'Linda Anderson', '+2547112345679', 'High blood pressure', 'REG-011-2025', 'cancelled', NOW() - INTERVAL '9 days'),
('Linda', 'White', 'linda.white@example.com', '+2547122345678', 39, 'Female', '3K', 1500, true, 'Outreach', 'Community Service', 'Food Bank', 'George White', '+2547122345679', 'None', 'REG-012-2025', 'cancelled', NOW() - INTERVAL '7 days'),

-- More confirmed registrations (newer)
('George', 'Martin', 'george.martin@example.com', '+2547132345678', 37, 'Male', '10K', 3500, true, 'Family Life', 'Parenting Support', 'New Parents', 'Susan Martin', '+2547132345679', 'None', 'REG-013-2025', 'confirmed', NOW() - INTERVAL '2 days'),
('Susan', 'Clark', 'susan.clark@example.com', '+2547142345678', 30, 'Female', '6K', 2500, true, 'Worship', 'Worship Team', 'Instrumentalists', 'Daniel Clark', '+2547142345679', 'None', 'REG-014-2025', 'confirmed', NOW() - INTERVAL '1 day'),
('Daniel', 'Lewis', 'daniel.lewis@example.com', '+2547152345678', 28, 'Male', '3K', 1500, false, NULL, NULL, NULL, 'Karen Lewis', '+2547152345679', 'Asthma', 'REG-015-2025', 'confirmed', NOW() - INTERVAL '1 day'),
('Karen', 'Walker', 'karen.walker@example.com', '+2547162345678', 34, 'Female', '10K', 3500, true, 'Operations', 'Events', 'Sunday Service', 'Edward Walker', '+2547162345679', 'None', 'REG-016-2025', 'confirmed', NOW() - INTERVAL '12 hours'),
('Edward', 'Hall', 'edward.hall@example.com', '+2547172345678', 41, 'Male', '6K', 2500, true, 'Next Gen', 'Youth Ministry', 'Middle School', 'Nancy Hall', '+2547172345679', 'None', 'REG-017-2025', 'confirmed', NOW() - INTERVAL '10 hours'),
('Nancy', 'Young', 'nancy.young@example.com', '+2547182345678', 32, 'Female', '3K', 1500, true, 'Outreach', 'Evangelism', 'Online Ministry', 'Peter Young', '+2547182345679', 'None', 'REG-018-2025', 'confirmed', NOW() - INTERVAL '8 hours'),
('Peter', 'Wright', 'peter.wright@example.com', '+2547192345678', 36, 'Male', '10K', 3500, false, NULL, NULL, NULL, 'Dorothy Wright', '+2547192345679', 'High blood pressure', 'REG-019-2025', 'confirmed', NOW() - INTERVAL '6 hours'),
('Dorothy', 'Lopez', 'dorothy.lopez@example.com', '+2547202345678', 27, 'Female', '6K', 2500, true, 'Family Life', 'Marriage Ministry', 'Long-term Marriage', 'Scott Lopez', '+2547202345679', 'None', 'REG-020-2025', 'confirmed', NOW() - INTERVAL '4 hours');
