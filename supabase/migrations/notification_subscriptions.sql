-- Create notification_subscriptions table
CREATE TABLE IF NOT EXISTS notification_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_user_id 
ON notification_subscriptions(user_id);

-- Enable Row Level Security
ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own subscription
CREATE POLICY "Users can read own subscription"
ON notification_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own subscription
CREATE POLICY "Users can insert own subscription"
ON notification_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own subscription
CREATE POLICY "Users can update own subscription"
ON notification_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own subscription
CREATE POLICY "Users can delete own subscription"
ON notification_subscriptions
FOR DELETE
USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER update_notification_subscription_updated_at
    BEFORE UPDATE ON notification_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_subscription_updated_at();
