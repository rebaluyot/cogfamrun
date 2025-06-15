# Event Registration System Enhancement

The application has been enhanced to support a variety of event types beyond just fun runs. This document explains the new features and how to configure them.

## New Features

The application now supports the following new settings:

1. **Event Type Configuration**
   - Generic event type instead of just "Fun Run"
   - Customizable event description
   - Event banner image

2. **Categories Management**
   - Create multiple registration categories with custom names
   - Set prices for each category
   - Add detailed descriptions
   - Link category-specific images

3. **Routes Configuration**
   - Define custom event routes with descriptions
   - Specify distance and difficulty levels
   - Add route-specific map images

4. **Inclusions Management**
   - Create a list of items included with registration
   - Add descriptions and images for each inclusion

## How to Configure

### Access Settings

1. Log in as an administrator
2. Go to the Admin section
3. Navigate to the Application Settings tab

### Configure Event Type

In the "Categories" tab, you can:
- Set the event type (e.g., "Fun Run", "Conference", "Workshop")
- Write a detailed event description
- Provide a URL for the event banner image

### Configure Categories

In the "Categories" tab, you can:
1. Add new categories by clicking the "Add Category" button
2. For each category, configure:
   - Name
   - Description
   - Price
   - Optional image URL

### Configure Routes

In the "Routes" tab, you can:
1. Add new routes by clicking the "Add Route" button
2. For each route, configure:
   - Name
   - Description
   - Distance (e.g., "3K", "5K", "10K" for runs, or any other measurement)
   - Difficulty level (Easy, Medium, Hard)
   - Optional map image URL

### Configure Inclusions

In the "Inclusions" tab, you can:
1. Add new inclusions by clicking the "Add Inclusion" button
2. For each inclusion, configure:
   - Name
   - Description
   - Optional image URL

## Implementation Details

### Database Schema

All new event settings use the existing `system_settings` table with the following structure:
- `event_type` - String setting for the event type
- `event_description` - String setting for the event description
- `event_banner_url` - String setting for the banner image URL
- `event_categories` - JSON array of category objects
- `event_routes` - JSON array of route objects
- `event_inclusions` - JSON array of inclusion objects

### Architecture

- Settings are stored as JSON in the database
- The app has backward compatibility with the original fun run structure
- New properties automatically fall back to reasonable defaults if not set

## Migration

To apply the database migration that adds support for these new features, run:

```
node scripts/apply-event-settings.mjs
```

This will ensure all the necessary database columns and default values are in place.

## UI Implementation

The application's front-end has been updated to dynamically display:
- Event type and description on the home page
- Categories with their respective details
- Routes with maps and difficulty indicators
- Inclusions with images and descriptions

The UI will gracefully fall back to the original fun run display if the new settings are not configured.
