# CustodyX.AI Messaging System Setup

## Overview

The messaging system enables secure, bidirectional communication between co-parents through Supabase real-time features. Each conversation is isolated and secure with Row Level Security (RLS) policies.

## Setup Instructions

### 1. Run the Database Migration

Execute the migration in your Supabase SQL Editor:

```bash
# Navigate to the Supabase dashboard
# Go to SQL Editor
# Copy and paste the contents of supabase/messaging-migration.sql
# Run the migration
```

This migration will:
- Drop the old `co_parent_messages` table
- Create new `conversations`, `messages`, and `conversation_participants` tables
- Set up RLS policies for data isolation
- Add email field to `user_profiles` for finding other parents
- Create helper functions for conversation management

### 2. Database Schema

The new messaging system uses these tables:

**conversations**
- Manages conversations between two parents
- Ensures each pair of parents has only one conversation
- Tracks creation and update timestamps

**messages**
- Stores individual messages within conversations
- Tracks read status and sender information
- Supports real-time updates

**conversation_participants**
- Links users to conversations for easier querying
- Automatically populated when conversations are created

### 3. Features Implemented

✅ **Real-time Messaging**: Messages appear instantly using Supabase real-time subscriptions
✅ **Read Receipts**: Track when messages are read
✅ **Secure Isolation**: RLS policies ensure parents only see their own conversations
✅ **Conversation Management**: Automatic conversation creation between co-parents
✅ **User Discovery**: Find other parents by email address
✅ **Message History**: Full conversation history with timestamps

### 4. Security Features

- **Row Level Security**: Users can only access their own conversations and messages
- **Data Isolation**: Complete separation between different families
- **Encrypted Communication**: All messages are stored securely in Supabase
- **Access Control**: Users must be part of a conversation to send/receive messages

### 5. How It Works

1. **Starting a Conversation**: 
   - Users can start conversations by entering the other parent's email
   - System automatically finds or creates a conversation between the two parents

2. **Sending Messages**:
   - Messages are instantly sent to Supabase
   - Real-time subscriptions notify the other parent immediately
   - Messages are marked with timestamps and read status

3. **Real-time Updates**:
   - Uses Supabase real-time features for instant message delivery
   - Automatic scroll to new messages
   - Visual indicators for message status

### 6. Current Limitations & Future Enhancements

**Current Limitations:**
- User discovery requires knowing the other parent's exact email
- No file attachments in messages yet
- No message search functionality

**Planned Enhancements:**
- Invitation system for adding co-parents
- File attachment support
- Message search and filtering
- Push notifications
- Message encryption at rest
- Conversation archiving

### 7. Technical Implementation

The messaging system consists of:

- **MessagingService** (`services/messagingService.ts`): Handles all messaging operations
- **Messaging Component** (`components/Messaging.tsx`): Provides the UI interface
- **Database Migration** (`supabase/messaging-migration.sql`): Sets up the database schema
- **Type Definitions** (`types.ts`): Updated with new messaging types

### 8. Usage in Components

The Messaging component is now self-contained and handles all messaging functionality:

```tsx
<Messaging userProfile={userProfile} />
```

The component manages:
- Loading conversations
- Real-time message updates
- Sending new messages
- Conversation switching
- User interface updates

### 9. Testing the System

1. Ensure both parents have accounts and profiles set up
2. Add email addresses to user profiles (manual step for now)
3. Navigate to the Messaging section
4. Start a conversation using the other parent's email
5. Send messages and verify real-time delivery
6. Test read receipts and message history

## Troubleshooting

### Common Issues

1. **Messages not appearing**: Check browser console for real-time subscription errors
2. **Can't find other parent**: Verify email address is correctly added to their profile
3. **Permission errors**: Ensure RLS policies are properly set up
4. **Real-time not working**: Check Supabase project real-time settings

### Debug Steps

1. Check browser console for errors
2. Verify Supabase connection and authentication
3. Test database queries in Supabase SQL editor
4. Ensure real-time is enabled in Supabase project settings

## Security Considerations

- All conversations are completely isolated between families
- Users cannot access conversations they're not part of
- Message content is stored securely in Supabase
- Real-time subscriptions are authenticated and filtered
- No cross-contamination of data between different co-parent relationships

This messaging system provides a secure, real-time communication platform specifically designed for co-parenting situations where all communications need to be documented and easily accessible.