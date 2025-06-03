# Run Rally Hub - Real Data Usage Guide

## Introduction
This guide will help you understand how to use the Run Rally Hub application with real data. The application has been pre-populated with realistic data in the Supabase database.

## Access the Application
1. Start the application using `npm run dev`
2. Open your browser to the URL displayed in the terminal (typically http://localhost:5173/)

## Available Features

### Homepage
- View accurate race categories (3K, 6K, and 10K) with real pricing from the database
- See the actual inclusions for each race category
- Register for a race by clicking on the "Register" button

### Registration
- Fill in the registration form to register for a specific category
- Select your department, ministry, and cluster if you're a church attendee
- Submit your registration to be added to the database

### Dashboard
- View registration statistics (total registrants, revenue, etc.)
- See recent registrations in the system
- Break down registrants by category (3K, 6K, 10K)

### Admin Section
- Login with the admin credentials:
  - Username: `admin` 
  - Password: `admin123`
- View and manage all registrations
- Access reports and analytics

## Data Structure
The following real data has been populated in the database:

### Categories
- **3K**: ₱1,500 - Includes race bib, finisher medal, and water bottle
- **6K**: ₱2,500 - Includes race bib, finisher medal, water bottle, and T-shirt
- **10K**: ₱3,500 - Includes race bib, finisher medal, water bottle, T-shirt, and cap

### Church Organization
- **5 Departments**: Worship, Outreach, Family Life, Next Gen, and Operations
- **10 Ministries**: Distributed across the departments
- **20 Clusters**: Specialized groups within each ministry

### Registrations
- 20 sample registrations with a mix of:
  - **Confirmed**: 14 registrations
  - **Pending**: 5 registrations
  - **Cancelled**: 2 registrations

## Testing the Application
1. View the homepage to see the accurate pricing and inclusions
2. Try registering a new participant
3. View the dashboard to see registration statistics
4. Login to the admin section to manage registrations

## Consistent Data Formatting

The application now uses consistent formatting utilities throughout the UI:

1. **Currency Formatting**: All monetary values are displayed with the Philippine Peso symbol (₱) and properly formatted thousands separators
2. **Category Color Coding**: Each race category (3K, 6K, 10K) has consistent color styling across all components
3. **Status Indicators**: Registration status (confirmed, pending, cancelled) has consistent color styling

These formatting utilities are implemented in `src/lib/format-utils.ts` and include:
- `formatCurrency(amount)`: Formats a number as Philippine Peso
- `getCategoryColorClass(category)`: Returns appropriate CSS classes for category styling
- `getCategoryDescription(category)`: Returns a standard description for each category
- `getStatusColorClass(status)`: Returns appropriate CSS classes for status styling

## Real-Time Data Visualization

The dashboard now displays real-time charts and statistics:

1. **Daily Registration Chart**: Shows actual registration trends over the past 7 days
2. **Category Distribution Chart**: Displays both registration counts and revenue by category
3. **Registration Cards**: Updated to show real data with proper formatting

## Troubleshooting
If you encounter any issues:

1. Check that Supabase is properly connected (verify in the console)
2. Ensure you've run the seeding script to populate the database
3. Check the browser developer tools for any errors
4. Verify that the formatting utilities are being imported correctly in components

---

The Run Rally Hub application is now using real data from the Supabase database, providing a realistic simulation of the event management system with consistent formatting and visualization.
