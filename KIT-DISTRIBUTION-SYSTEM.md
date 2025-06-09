# Kit Distribution System

This document describes the kit distribution system for the COG FamRun 2025 event application.

## Overview

The kit distribution system enables event staff to efficiently distribute kits to registered participants by scanning their QR codes and updating their claim status in the database.

## Features

- QR Code scanning using device camera
- Manual QR code entry
- Instant verification of registrant details
- Kit claim status update with timestamp
- Track who distributed the kit and any notes related to distribution

## Setup

To set up the kit distribution system, follow these steps:

1. Run the migration to add necessary columns to the database:

```bash
npm run kit:setup
```

2. Test the kit distribution features:

```bash
npm run kit:test
```

3. Launch the application and navigate to the Kit Distribution page:

```bash
npm run dev
```

## Using the Kit Distribution System

### Scanning a QR Code

1. Navigate to the "Kit Distribution" page in the admin section
2. Click "Start Scanner" to activate the device camera
3. Position the QR code within the scanning frame
4. Once scanned, the participant's details will display
5. Enter required information:
   - The person claiming the kit (participant or someone on their behalf)
   - The location where the kit is being claimed (select from dropdown)
   - Optional distribution notes
6. Click "Mark Kit as Claimed" to update the record

### Manual Entry

If the QR code is damaged or cannot be scanned:

1. Navigate to the "Kit Distribution" page
2. Select the "Manual Entry" tab
3. Enter the QR code string format: `CogFamRun2025|REG123|John Doe|5K|600|Large`
4. Click "Lookup Registration" to verify the participant
5. Enter required information:
   - The person claiming the kit
   - The location where the kit is being claimed
   - Optional distribution notes
6. Review participant details and click "Mark Kit as Claimed"

### Managing Claim Locations

1. Navigate to the Admin section
2. In the Kit Distribution dashboard, click "Manage Claim Locations"
3. From this interface you can:
   - Add new claim locations
   - Edit existing locations
   - Deactivate locations that are no longer in use

## Database Schema

### Registrations Table

The kit distribution system uses the following columns in the registrations table:

- `kit_claimed` (boolean) - Indicates if the kit has been claimed
- `claimed_at` (timestamp) - When the kit was claimed
- `processed_by` (text) - The staff member who processed the kit distribution
- `actual_claimer` (text) - The person who physically claimed the kit
- `claim_location_id` (integer) - Reference to the location where the kit was claimed
- `claim_notes` (text) - Any notes related to the kit distribution

### Claim Locations Table

A separate table stores the predefined claim locations:

- `id` (serial) - Primary key
- `name` (text) - Location name
- `address` (text) - Optional address of the location
- `active` (boolean) - Whether the location is currently active
- `created_at` (timestamp) - When the location was created
- `updated_at` (timestamp) - When the location was last updated

## QR Code Format

The QR codes use the following format:
`CogFamRun2025|registration_id|participant_name|category|price|shirt_size`

Example:
`CogFamRun2025|REG12345|John Doe|5K|600|Large`
