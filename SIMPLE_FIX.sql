-- SIMPLE FIX: Copy and paste this entire block into Supabase SQL Editor
-- This will set up your messaging system in one go

-- Step 1: Clean up and create tables
DROP TABLE IF EXISTS public.co_parent_messages CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- Add email to user profiles if it doesn't exist
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create conversations table
CREATE TABLE public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    parent2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent1_id, parent2_id),
    CONSTRAINT different_parents CHECK (parent1_id != parent2_id)
);

-- Create messages table
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create conversation participants table
CREATE TABLE public.conversation_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Create invitations table
CREATE TABLE public.invitations (
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

-- Step 2: Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies (with DROP IF EXISTS to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = parent1_id OR auth.uid() = parent2_id);

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = parent1_id OR auth.uid() = parent2_id);

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (parent1_id = auth.uid() OR parent2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
CREATE POLICY "Users can send messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (parent1_id = auth.uid() OR parent2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants in their conversations" ON public.conversation_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (parent1_id = auth.uid() OR parent2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can join conversations they're part of" ON public.conversation_participants;
CREATE POLICY "Users can join conversations they're part of" ON public.conversation_participants
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (parent1_id = auth.uid() OR parent2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can view their sent invitations" ON public.invitations;
CREATE POLICY "Users can view their sent invitations" ON public.invitations
    FOR SELECT USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can create invitations" ON public.invitations;
CREATE POLICY "Users can create invitations" ON public.invitations
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their invitations" ON public.invitations;
CREATE POLICY "Users can update their invitations" ON public.invitations
    FOR UPDATE USING (auth.uid() = sender_id);

-- Step 4: Create indexes and functions
CREATE INDEX IF NOT EXISTS idx_conversations_parent1 ON public.conversations(parent1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_parent2 ON public.conversations(parent2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Auto-populate participants function
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

-- Create trigger
DROP TRIGGER IF EXISTS populate_participants_on_conversation_create ON public.conversations;
CREATE TRIGGER populate_participants_on_conversation_create
    AFTER INSERT ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION populate_conversation_participants();

-- Helper function
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
BEGIN
    SELECT id INTO conversation_id
    FROM public.conversations
    WHERE (parent1_id = user1_id AND parent2_id = user2_id)
       OR (parent1_id = user2_id AND parent2_id = user1_id)
    LIMIT 1;
    
    IF conversation_id IS NULL THEN
        INSERT INTO public.conversations (parent1_id, parent2_id)
        VALUES (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id))
        RETURNING id INTO conversation_id;
    END IF;
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;