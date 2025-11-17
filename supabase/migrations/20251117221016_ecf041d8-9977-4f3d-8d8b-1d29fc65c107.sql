-- Add field to track if user needs to change password
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS deve_trocar_senha BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_deve_trocar_senha 
ON profiles(deve_trocar_senha) WHERE deve_trocar_senha = true;