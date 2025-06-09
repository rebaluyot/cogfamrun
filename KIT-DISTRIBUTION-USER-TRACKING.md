# Enhanced Kit Distribution User Tracking System

This document describes how the Kit Distribution system tracks detailed information about kit claims.

## Overview

The Kit Distribution system now records comprehensive information about kit claims, including:

1. The actual person who claimed the kit (may be different from the registered participant)
2. The physical location where the kit was claimed
3. The staff member who processed the claim

This information is stored in the database and displayed in the UI, providing accountability and an audit trail of kit distribution activities.

## Implementation Details

### Database Fields

For each registration in the database, the following fields are used to track kit claims:

- `kit_claimed` (boolean): Indicates if the kit has been claimed
- `claimed_at` (timestamp): Records exactly when the kit was claimed
- `processed_by` (text): Stores the username of the staff member who processed the claim
- `actual_claimer` (text): Records who physically claimed the kit (the participant or someone on their behalf)
- `claim_location_id` (integer): References the predefined location where the kit was claimed
- `claim_notes` (text): Optional notes about the kit distribution

### Claim Locations System

The system uses a dedicated `claim_locations` table to store predefined locations where kits can be claimed:

- `id` (serial): Primary key
- `name` (text): Location name
- `address` (text): Optional address of the location
- `active` (boolean): Whether this location is currently active
- `created_at` and `updated_at` (timestamps): Record creation/modification times

### User Authentication

The system uses the authenticated username from the AuthContext to record which staff member processed each claim. This provides accurate tracking of user actions without requiring additional input from the user.

## How It Works

1. When a staff member logs in, their username is stored in the AuthContext
2. When they mark a kit as claimed:
   - Their username is automatically recorded in the `processed_by` field
   - The name of the person claiming the kit is recorded in the `actual_claimer` field
   - The location where the kit is claimed is recorded via the `claim_location_id` field
   - The current timestamp is recorded in the `claimed_at` field
   - Any notes entered by the staff member are recorded in the `claim_notes` field
3. This comprehensive information is displayed in the UI when viewing registration details

## Managing Claim Locations

Administrators can manage claim locations through a dedicated interface:

1. Go to the **Admin** section
2. In the **Kit Distribution** tab, click "Manage Claim Locations"
3. Add new locations, edit existing ones, or deactivate unused locations
4. Only active locations are shown in the kit claim dropdown

## Benefits

- **Comprehensive Tracking**: Records who claimed the kit, where, and which staff handled it
- **Flexibility**: Supports scenarios where someone claims a kit on another's behalf
- **Location Management**: Enables distribution from multiple physical locations
- **Accountability**: Clear record of which staff member processed each kit claim
- **Timestamp Tracking**: Accurate recording of exactly when kits were distributed
- **Audit Trail**: Complete history of kit distribution activities
- **Staff Recognition**: Ability to track staff productivity in kit distribution

## Security Considerations

- The username is retrieved from the secure AuthContext, not from user input
- The timestamp is generated server-side to ensure accuracy
- Only users with the `canDistributeKits` permission can access the kit distribution functionality
- Administrators can manage claim locations through a protected interface
