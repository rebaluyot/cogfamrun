// seed-data.js
import { supabase } from './src/integrations/supabase/client.js';

const seedAdminUsers = async () => {
  // Add an admin user
  const { data, error } = await supabase.from('admin_users').insert([
    { username: 'admin', password_hash: '$2a$10$hACwQ5/HQI6FhbIIK5C5IOocXDsjOYuokuCJUgzouIm7QFn1R5HEa' }, // password: admin123
  ]).select();
  
  if (error) console.error('Error seeding admin users:', error);
  else console.log('Admin users seeded successfully:', data);
};

const seedDepartments = async () => {
  const departments = [
    { name: 'Worship', description: 'Handles all worship and music ministries' },
    { name: 'Outreach', description: 'Focuses on community outreach and evangelism' },
    { name: 'Family Life', description: 'Support for families and relationship building' },
    { name: 'Next Gen', description: 'Youth and children ministries' },
    { name: 'Operations', description: 'Church operations and facilities management' }
  ];
  
  const { data, error } = await supabase.from('departments').insert(departments).select();
  
  if (error) console.error('Error seeding departments:', error);
  else console.log('Departments seeded successfully:', data);
  
  return data;
};

const seedMinistries = async (departments) => {
  if (!departments || departments.length === 0) {
    console.error('No departments provided for ministry seeding');
    return;
  }
  
  const getDepartmentId = (name) => {
    const dept = departments.find(d => d.name === name);
    return dept ? dept.id : null;
  };
  
  const ministries = [
    { name: 'Worship Team', department_id: getDepartmentId('Worship') },
    { name: 'Sound & Media', department_id: getDepartmentId('Worship') },
    { name: 'Community Service', department_id: getDepartmentId('Outreach') },
    { name: 'Evangelism', department_id: getDepartmentId('Outreach') },
    { name: 'Marriage Ministry', department_id: getDepartmentId('Family Life') },
    { name: 'Parenting Support', department_id: getDepartmentId('Family Life') },
    { name: 'Youth Ministry', department_id: getDepartmentId('Next Gen') },
    { name: 'Children\'s Church', department_id: getDepartmentId('Next Gen') },
    { name: 'Facilities', department_id: getDepartmentId('Operations') },
    { name: 'Events', department_id: getDepartmentId('Operations') }
  ];
  
  const { data, error } = await supabase.from('ministries').insert(ministries).select();
  
  if (error) console.error('Error seeding ministries:', error);
  else console.log('Ministries seeded successfully:', data);
  
  return data;
};

const seedClusters = async (ministries) => {
  if (!ministries || ministries.length === 0) {
    console.error('No ministries provided for cluster seeding');
    return;
  }
  
  const getMinistryId = (name) => {
    const ministry = ministries.find(m => m.name === name);
    return ministry ? ministry.id : null;
  };
  
  const clusters = [
    { name: 'Vocalists', ministry_id: getMinistryId('Worship Team') },
    { name: 'Instrumentalists', ministry_id: getMinistryId('Worship Team') },
    { name: 'Audio Team', ministry_id: getMinistryId('Sound & Media') },
    { name: 'Video Team', ministry_id: getMinistryId('Sound & Media') },
    { name: 'Food Bank', ministry_id: getMinistryId('Community Service') },
    { name: 'Homeless Outreach', ministry_id: getMinistryId('Community Service') },
    { name: 'Street Evangelism', ministry_id: getMinistryId('Evangelism') },
    { name: 'Online Ministry', ministry_id: getMinistryId('Evangelism') },
    { name: 'Newlyweds', ministry_id: getMinistryId('Marriage Ministry') },
    { name: 'Long-term Marriage', ministry_id: getMinistryId('Marriage Ministry') },
    { name: 'New Parents', ministry_id: getMinistryId('Parenting Support') },
    { name: 'Teen Parents', ministry_id: getMinistryId('Parenting Support') },
    { name: 'Middle School', ministry_id: getMinistryId('Youth Ministry') },
    { name: 'High School', ministry_id: getMinistryId('Youth Ministry') },
    { name: 'Preschool', ministry_id: getMinistryId('Children\'s Church') },
    { name: 'Elementary', ministry_id: getMinistryId('Children\'s Church') },
    { name: 'Building Maintenance', ministry_id: getMinistryId('Facilities') },
    { name: 'Grounds', ministry_id: getMinistryId('Facilities') },
    { name: 'Conference Planning', ministry_id: getMinistryId('Events') },
    { name: 'Sunday Service', ministry_id: getMinistryId('Events') }
  ];
  
  const { data, error } = await supabase.from('clusters').insert(clusters).select();
  
  if (error) console.error('Error seeding clusters:', error);
  else console.log('Clusters seeded successfully:', data);
};

const seedCategories = async () => {
  const categories = [
    { name: '3K', price: 1500, inclusions: ['Race bib', 'Finisher medal', 'Water bottle'] },
    { name: '6K', price: 2500, inclusions: ['Race bib', 'Finisher medal', 'Water bottle', 'T-shirt'] },
    { name: '10K', price: 3500, inclusions: ['Race bib', 'Finisher medal', 'Water bottle', 'T-shirt', 'Cap'] }
  ];
  
  const { data, error } = await supabase.from('categories').insert(categories).select();
  
  if (error) console.error('Error seeding categories:', error);
  else console.log('Categories seeded successfully:', data);
};

const seedRegistrations = async () => {
  const generateRegistrationId = (index) => `REG-${String(index).padStart(3, '0')}-2025`;
  
  const getRandomDate = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    return date.toISOString();
  };
  
  const registrations = [
    // Confirmed registrations
    {
      first_name: 'John', last_name: 'Smith', email: 'john.smith@example.com', phone: '+2547123456789',
      age: 35, gender: 'Male', category: '10K', price: 3500, is_church_attendee: true,
      department: 'Worship', ministry: 'Worship Team', cluster: 'Vocalists',
      emergency_contact: 'Mary Smith', emergency_phone: '+2547123456780', medical_conditions: 'None',
      registration_id: generateRegistrationId(1), status: 'confirmed', created_at: getRandomDate(10)
    },
    {
      first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.johnson@example.com', phone: '+2547234567890',
      age: 28, gender: 'Female', category: '6K', price: 2500, is_church_attendee: true,
      department: 'Next Gen', ministry: 'Youth Ministry', cluster: 'High School',
      emergency_contact: 'Mike Johnson', emergency_phone: '+2547234567891', medical_conditions: 'Asthma',
      registration_id: generateRegistrationId(2), status: 'confirmed', created_at: getRandomDate(9)
    },
    {
      first_name: 'Michael', last_name: 'Williams', email: 'michael.williams@example.com', phone: '+2547345678901',
      age: 42, gender: 'Male', category: '3K', price: 1500, is_church_attendee: false,
      department: null, ministry: null, cluster: null,
      emergency_contact: 'Jane Williams', emergency_phone: '+2547345678902', medical_conditions: 'None',
      registration_id: generateRegistrationId(3), status: 'confirmed', created_at: getRandomDate(8)
    },
    {
      first_name: 'Emily', last_name: 'Brown', email: 'emily.brown@example.com', phone: '+2547456789012',
      age: 31, gender: 'Female', category: '10K', price: 3500, is_church_attendee: true,
      department: 'Outreach', ministry: 'Evangelism', cluster: 'Street Evangelism',
      emergency_contact: 'David Brown', emergency_phone: '+2547456789013', medical_conditions: 'None',
      registration_id: generateRegistrationId(4), status: 'confirmed', created_at: getRandomDate(7)
    },
    {
      first_name: 'David', last_name: 'Jones', email: 'david.jones@example.com', phone: '+2547567890123',
      age: 29, gender: 'Male', category: '6K', price: 2500, is_church_attendee: true,
      department: 'Operations', ministry: 'Facilities', cluster: 'Building Maintenance',
      emergency_contact: 'Susan Jones', emergency_phone: '+2547567890124', medical_conditions: 'Knee injury',
      registration_id: generateRegistrationId(5), status: 'confirmed', created_at: getRandomDate(7)
    },
    
    // Pending registrations
    {
      first_name: 'Jennifer', last_name: 'Davis', email: 'jennifer.davis@example.com', phone: '+2547678901234',
      age: 25, gender: 'Female', category: '3K', price: 1500, is_church_attendee: true,
      department: 'Family Life', ministry: 'Marriage Ministry', cluster: 'Newlyweds',
      emergency_contact: 'Robert Davis', emergency_phone: '+2547678901235', medical_conditions: 'None',
      registration_id: generateRegistrationId(6), status: 'pending', created_at: getRandomDate(6)
    },
    {
      first_name: 'Robert', last_name: 'Miller', email: 'robert.miller@example.com', phone: '+2547789012345',
      age: 38, gender: 'Male', category: '10K', price: 3500, is_church_attendee: false,
      department: null, ministry: null, cluster: null,
      emergency_contact: 'Nancy Miller', emergency_phone: '+2547789012346', medical_conditions: 'Diabetes',
      registration_id: generateRegistrationId(7), status: 'pending', created_at: getRandomDate(5)
    },
    
    // More pending and some cancelled
    {
      first_name: 'Jessica', last_name: 'Wilson', email: 'jessica.wilson@example.com', phone: '+2547890123456',
      age: 27, gender: 'Female', category: '6K', price: 2500, is_church_attendee: true,
      department: 'Worship', ministry: 'Sound & Media', cluster: 'Audio Team',
      emergency_contact: 'Andrew Wilson', emergency_phone: '+2547890123457', medical_conditions: 'None',
      registration_id: generateRegistrationId(8), status: 'pending', created_at: getRandomDate(4)
    },
    {
      first_name: 'Thomas', last_name: 'Anderson', email: 'thomas.anderson@example.com', phone: '+2547112345678',
      age: 45, gender: 'Male', category: '6K', price: 2500, is_church_attendee: false,
      department: null, ministry: null, cluster: null,
      emergency_contact: 'Linda Anderson', emergency_phone: '+2547112345679', medical_conditions: 'High blood pressure',
      registration_id: generateRegistrationId(9), status: 'cancelled', created_at: getRandomDate(9)
    },
    {
      first_name: 'Linda', last_name: 'White', email: 'linda.white@example.com', phone: '+2547122345678',
      age: 39, gender: 'Female', category: '3K', price: 1500, is_church_attendee: true,
      department: 'Outreach', ministry: 'Community Service', cluster: 'Food Bank',
      emergency_contact: 'George White', emergency_phone: '+2547122345679', medical_conditions: 'None',
      registration_id: generateRegistrationId(10), status: 'cancelled', created_at: getRandomDate(7)
    },
    
    // More recent registrations
    {
      first_name: 'George', last_name: 'Martin', email: 'george.martin@example.com', phone: '+2547132345678',
      age: 37, gender: 'Male', category: '10K', price: 3500, is_church_attendee: true,
      department: 'Family Life', ministry: 'Parenting Support', cluster: 'New Parents',
      emergency_contact: 'Susan Martin', emergency_phone: '+2547132345679', medical_conditions: 'None',
      registration_id: generateRegistrationId(11), status: 'confirmed', created_at: getRandomDate(2)
    },
    {
      first_name: 'Susan', last_name: 'Clark', email: 'susan.clark@example.com', phone: '+2547142345678',
      age: 30, gender: 'Female', category: '6K', price: 2500, is_church_attendee: true,
      department: 'Worship', ministry: 'Worship Team', cluster: 'Instrumentalists',
      emergency_contact: 'Daniel Clark', emergency_phone: '+2547142345679', medical_conditions: 'None',
      registration_id: generateRegistrationId(12), status: 'confirmed', created_at: getRandomDate(1)
    },
    {
      first_name: 'Daniel', last_name: 'Lewis', email: 'daniel.lewis@example.com', phone: '+2547152345678',
      age: 28, gender: 'Male', category: '3K', price: 1500, is_church_attendee: false,
      department: null, ministry: null, cluster: null,
      emergency_contact: 'Karen Lewis', emergency_phone: '+2547152345679', medical_conditions: 'Asthma',
      registration_id: generateRegistrationId(13), status: 'confirmed', created_at: getRandomDate(1)
    },
    {
      first_name: 'Karen', last_name: 'Walker', email: 'karen.walker@example.com', phone: '+2547162345678',
      age: 34, gender: 'Female', category: '10K', price: 3500, is_church_attendee: true,
      department: 'Operations', ministry: 'Events', cluster: 'Sunday Service',
      emergency_contact: 'Edward Walker', emergency_phone: '+2547162345679', medical_conditions: 'None',
      registration_id: generateRegistrationId(14), status: 'confirmed', created_at: new Date(Date.now() - 12 * 3600000).toISOString()
    },
    {
      first_name: 'Edward', last_name: 'Hall', email: 'edward.hall@example.com', phone: '+2547172345678',
      age: 41, gender: 'Male', category: '6K', price: 2500, is_church_attendee: true,
      department: 'Next Gen', ministry: 'Youth Ministry', cluster: 'Middle School',
      emergency_contact: 'Nancy Hall', emergency_phone: '+2547172345679', medical_conditions: 'None',
      registration_id: generateRegistrationId(15), status: 'confirmed', created_at: new Date(Date.now() - 10 * 3600000).toISOString()
    }
  ];
  
  const { data, error } = await supabase.from('registrations').insert(registrations).select();
  
  if (error) console.error('Error seeding registrations:', error);
  else console.log('Registrations seeded successfully:', data);
};

const runSeeding = async () => {
  try {
    console.log('Starting database seeding...');
    
    // Seed the database in sequence to respect foreign key constraints
    await seedAdminUsers();
    const departments = await seedDepartments();
    const ministries = await seedMinistries(departments);
    await seedClusters(ministries);
    await seedCategories();
    await seedRegistrations();
    
    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  }
};

// Run the seeding process
runSeeding();
