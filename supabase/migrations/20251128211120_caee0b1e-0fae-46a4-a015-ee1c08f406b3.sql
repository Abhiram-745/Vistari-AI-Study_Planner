-- Update is_admin function to include both admin emails
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = _user_id 
    AND email IN ('abhiramkakarla1@gmail.com', 'dhrishiv.panjabi@gmail.com')
  );
$$;