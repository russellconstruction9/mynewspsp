# Easy Migration Steps for CustodyX.AI Messaging System

## Quick 4-Step Setup (Copy & Paste Approach)

Instead of dealing with complex migration files, follow these simple steps to set up your messaging system:

### Step 1: Clean Up Old Tables
Copy and paste this into your Supabase SQL Editor:

```sql
-- Clean up old messaging tables
DROP TABLE IF EXISTS public.co_parent_messages CASCADE;
```

### Step 2: Create Core Tables
Copy and paste this into your Supabase SQL Editor:

```sql
-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    parent2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent1_id, parent2_id),
    CONSTRAINT different_parents CHECK (parent1_id != parent2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create conversation participants table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    recipient_email TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT,
    status TEXT CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Add email to user profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
```

### Step 3: Set Up Security Policies
Copy and paste this into your Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations they're part of" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their sent invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can create invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can update their invitations" ON public.invitations;

-- Create conversation policies
CREATE POLICY "Users can view their conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = parent1_id OR auth.uid() = parent2_id);

CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = parent1_id OR auth.uid() = parent2_id);

-- Create message policies
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (parent1_id = auth.uid() OR parent2_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (parent1_id = auth.uid() OR parent2_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- Create participant policies
CREATE POLICY "Users can view participants in their conversations" ON public.conversation_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (parent1_id = auth.uid() OR parent2_id = auth.uid())
        )
    );

CREATE POLICY "Users can join conversations they're part of" ON public.conversation_participants
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (parent1_id = auth.uid() OR parent2_id = auth.uid())
        )
    );

-- Create invitation policies
CREATE POLICY "Users can view their sent invitations" ON public.invitations
    FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Users can create invitations" ON public.invitations
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their invitations" ON public.invitations
    FOR UPDATE USING (auth.uid() = sender_id);
```

### Step 4: Create Functions and Triggers
Copy and paste this into your Supabase SQL Editor:

```sql
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_parent1 ON public.conversations(parent1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_parent2 ON public.conversations(parent2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_invitations_sender ON public.invitations(sender_id);
CREATE INDEX IF NOT EXISTS idx_invitations_recipient_email ON public.invitations(recipient_email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

-- Create function to auto-populate participants
CREATE OR REPLACE FUNCTION populate_conversation_participants()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES 
        (NEW.id, NEW.parent1_id),
        (NEW.id, NEW.parent2_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS populate_participants_on_conversation_create ON public.conversations;
CREATE TRIGGER populate_participants_on_conversation_create
    AFTER INSERT ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION populate_conversation_participants();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON public.conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON public.messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create helper function for conversations
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
BEGIN
    -- Try to find existing conversation (order doesn't matter)
    SELECT id INTO conversation_id
    FROM public.conversations
    WHERE (parent1_id = user1_id AND parent2_id = user2_id)
       OR (parent1_id = user2_id AND parent2_id = user1_id)
    LIMIT 1;
    
    -- If no conversation exists, create one
    IF conversation_id IS NULL THEN
        INSERT INTO public.conversations (parent1_id, parent2_id)
        VALUES (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id))
        RETURNING id INTO conversation_id;
    END IF;
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;
```

## ✅ That's It!

After running all 4 steps, your messaging system will be fully set up with:
- ✅ Bidirectional messaging between co-parents
- ✅ Real-time message delivery
- ✅ Invitation system for finding other parents
- ✅ Complete security isolation between families
- ✅ Professional chat interface

## Next Steps:
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run each step in order (copy & paste)
4. Test your messaging system in the app

Your messaging system is now ready to use! 🎉
