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
5. Add any distribution notes if needed
6. Click "Mark Kit as Claimed" to update the record

### Manual Entry

If the QR code is damaged or cannot be scanned:

1. Navigate to the "Kit Distribution" page
2. Select the "Manual Entry" tab
3. Enter the QR code string format: `CogFamRun2025|REG123|John Doe|5K|600|Large`
4. Click "Lookup Registration" to verify the participant
5. Review participant details and click "Mark Kit as Claimed"

## Database Schema

The kit distribution system uses the following columns in the registrations table:

- `kit_claimed` (boolean) - Indicates if the kit has been claimed
- `claimed_at` (timestamp) - When the kit was claimed
- `claimed_by` (text) - Who processed the kit distribution
- `claim_notes` (text) - Any notes related to the kit distribution

## QR Code Format

The QR codes use the following format:
`CogFamRun2025|registration_id|participant_name|category|price|shirt_size`

Example:
`CogFamRun2025|REG12345|John Doe|5K|600|Large`
