-- Add email column to banned_users for direct email lookup during signup
ALTER TABLE public.banned_users ADD COLUMN IF NOT EXISTS email text;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_banned_users_email ON public.banned_users(email);

-- Add policy to allow checking if email is banned (for signup validation)
CREATE POLICY "Anyone can check if email is banned" 
ON public.banned_users 
FOR SELECT 
USING (true);