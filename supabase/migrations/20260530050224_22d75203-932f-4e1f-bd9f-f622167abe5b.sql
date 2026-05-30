
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'member', 'user');
CREATE TYPE public.project_status AS ENUM ('active', 'closed', 'paused');
CREATE TYPE public.volunteer_status AS ENUM ('pending', 'approved', 'declined', 'postponed', 'blocked');
CREATE TYPE public.donation_status AS ENUM ('pending', 'verified', 'rejected');

-- ============ UPDATED_AT FUNCTION ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  district TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER_ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============ PROJECTS ============
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  district TEXT,
  image_url TEXT,
  target_amount NUMERIC(14,2) NOT NULL CHECK (target_amount > 0),
  raised_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  donor_count INT NOT NULL DEFAULT 0,
  status project_status NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ DONATIONS ============
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  donor_name TEXT NOT NULL,
  donor_email TEXT,
  donor_phone TEXT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  message TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  payment_method TEXT,
  transaction_ref TEXT,
  status donation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.donations TO anon, authenticated;
GRANT INSERT ON public.donations TO anon, authenticated;
GRANT UPDATE, DELETE ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_donations_project ON public.donations(project_id);
CREATE INDEX idx_donations_status ON public.donations(status);

-- Auto-update project raised_amount + auto-close on target
CREATE OR REPLACE FUNCTION public.recalc_project_totals()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  pid UUID;
  total NUMERIC(14,2);
  dcount INT;
  ptarget NUMERIC(14,2);
BEGIN
  pid := COALESCE(NEW.project_id, OLD.project_id);
  IF pid IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  SELECT COALESCE(SUM(amount),0), COUNT(*) INTO total, dcount
  FROM public.donations WHERE project_id = pid AND status = 'verified';

  SELECT target_amount INTO ptarget FROM public.projects WHERE id = pid;

  UPDATE public.projects
  SET raised_amount = total,
      donor_count = dcount,
      status = CASE
        WHEN total >= ptarget AND status = 'active' THEN 'closed'::project_status
        ELSE status
      END
  WHERE id = pid;

  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER donations_recalc AFTER INSERT OR UPDATE OR DELETE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.recalc_project_totals();

-- ============ VOLUNTEERS ============
CREATE TABLE public.volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  district TEXT NOT NULL,
  age INT,
  occupation TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  motivation TEXT NOT NULL,
  availability TEXT,
  status volunteer_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.volunteers TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.volunteers TO authenticated;
GRANT ALL ON public.volunteers TO service_role;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER volunteers_updated_at BEFORE UPDATE ON public.volunteers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- When volunteer approved, grant 'member' role automatically (if user_id linked)
CREATE OR REPLACE FUNCTION public.handle_volunteer_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, 'member')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER volunteers_approval AFTER UPDATE ON public.volunteers
  FOR EACH ROW EXECUTE FUNCTION public.handle_volunteer_approval();

-- ============ ORGANOGRAM ============
CREATE TABLE public.organogram (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT,
  responsibilities TEXT,
  photo_url TEXT,
  parent_id UUID REFERENCES public.organogram(id) ON DELETE SET NULL,
  level INT NOT NULL DEFAULT 0,
  order_index INT NOT NULL DEFAULT 0,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.organogram TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.organogram TO authenticated;
GRANT ALL ON public.organogram TO service_role;
ALTER TABLE public.organogram ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER organogram_updated_at BEFORE UPDATE ON public.organogram
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CONTACT MESSAGES ============
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS POLICIES ============

-- profiles
CREATE POLICY "Profiles viewable by owner or admin" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- projects
CREATE POLICY "Projects visible to all" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Admins manage projects" ON public.projects
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- donations: public can see verified donations (for live counters/donor wall)
CREATE POLICY "Verified donations public" ON public.donations
  FOR SELECT USING (status = 'verified' OR (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Anyone can donate" ON public.donations
  FOR INSERT WITH CHECK (status = 'pending');
CREATE POLICY "Admins manage donations" ON public.donations
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete donations" ON public.donations
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- volunteers
CREATE POLICY "Anyone can apply volunteer" ON public.volunteers
  FOR INSERT WITH CHECK (status = 'pending');
CREATE POLICY "Users see own application" ON public.volunteers
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage volunteers" ON public.volunteers
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete volunteers" ON public.volunteers
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- organogram
CREATE POLICY "Organogram visible to all" ON public.organogram FOR SELECT USING (true);
CREATE POLICY "Admins manage organogram" ON public.organogram
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- contact_messages
CREATE POLICY "Anyone send message" ON public.contact_messages
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read messages" ON public.contact_messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update messages" ON public.contact_messages
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete messages" ON public.contact_messages
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ SEED DATA ============
INSERT INTO public.projects (title, slug, short_description, description, category, district, target_amount, status, is_featured, end_date) VALUES
('Winter Relief 2024', 'winter-relief-2024', 'Warm clothes and blankets for 5,000 families in the northern districts.', 'Every winter, thousands of families in northern Bangladesh suffer from extreme cold without proper clothing. This initiative aims to distribute warm clothes, blankets, and essential supplies to 5,000 families in Rangpur, Dinajpur, and Kurigram.', 'Emergency Relief', 'Rangpur', 1000000, 'active', true, CURRENT_DATE + 30),
('Sustainable Seeds Program', 'sustainable-seeds-program', 'Heritage seeds for 500 indigenous farmers to ensure food security.', 'Supporting smallholder farmers with sustainable heritage seeds, training, and tools to build long-term food security in their communities.', 'Food Security', 'Dhaka', 500000, 'active', true, CURRENT_DATE + 60),
('Sylhet Safe Water Network', 'sylhet-safe-water', 'Installing deep tube wells in 5 arsenic-affected villages.', 'Clean drinking water is a fundamental right. We are installing deep tube wells in five villages where arsenic contamination threatens public health.', 'Health & Water', 'Sylhet', 800000, 'active', false, CURRENT_DATE + 90),
('Digital Classroom Initiative', 'digital-classroom', 'Tablets and learning materials for street children.', 'Bringing digital education to underprivileged street children through tablets, learning content, and mentorship.', 'Education', 'Chittagong', 600000, 'active', false, CURRENT_DATE + 45);

INSERT INTO public.organogram (name, position, department, responsibilities, level, order_index) VALUES
('Md. Abdur Rahman', 'Chairman', 'Board', 'Overall strategic vision, board leadership, and final decision authority on foundation policies.', 0, 0);

INSERT INTO public.organogram (name, position, department, responsibilities, parent_id, level, order_index)
SELECT 'Fatima Begum', 'Managing Director', 'Operations', 'Day-to-day operations, project execution oversight, and team management across all districts.', id, 1, 0
FROM public.organogram WHERE position = 'Chairman';

INSERT INTO public.organogram (name, position, department, responsibilities, parent_id, level, order_index)
SELECT 'Karim Hossain', 'Chief Treasurer', 'Finance', 'Financial integrity, audit coordination, donor fund management, and transparency reporting.', id, 1, 1
FROM public.organogram WHERE position = 'Chairman';

INSERT INTO public.organogram (name, position, department, responsibilities, parent_id, level, order_index)
SELECT 'Nusrat Jahan', 'Project Manager', 'Operations', 'Leading active social work projects, field coordination, and impact measurement.', id, 2, 0
FROM public.organogram WHERE position = 'Managing Director';

INSERT INTO public.organogram (name, position, department, responsibilities, parent_id, level, order_index)
SELECT 'Sabbir Ahmed', 'District Coordinator', 'Operations', 'Managing volunteer teams and on-ground operations in assigned districts.', id, 2, 1
FROM public.organogram WHERE position = 'Managing Director';

INSERT INTO public.organogram (name, position, department, responsibilities, parent_id, level, order_index)
SELECT 'Ayesha Siddiqua', 'Senior Auditor', 'Finance', 'Independent audit of fund usage, donor reporting, and compliance.', id, 2, 0
FROM public.organogram WHERE position = 'Chief Treasurer';
