-- 001_add_role_and_admin_policies.sql
-- Adds a role column to profiles and policies for admin access

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Allow admins to select any profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile or admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'admin'));

-- Allow admins to update any profiles; users can update own
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile or admin" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'admin'));

-- Allow admins to insert (keeps original insert rule)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- If you want admins to be able to delete profiles:
DROP POLICY IF EXISTS "Users can delete own calculations" ON public.calculations;
CREATE POLICY "Admins can delete calculations" ON public.calculations
  FOR DELETE USING (auth.uid() = user_id OR exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'admin'));

-- Optionally, add a function to promote a user to admin (requires service_role key)
CREATE OR REPLACE FUNCTION public.set_user_role(target_uuid UUID, new_role TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles SET role = new_role WHERE id = target_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
