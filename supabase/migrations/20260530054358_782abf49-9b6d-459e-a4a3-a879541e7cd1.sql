
-- ========== SITE SETTINGS ==========
CREATE TABLE public.site_settings (
  id int PRIMARY KEY DEFAULT 1,
  foundation_name text NOT NULL DEFAULT 'Qudrat Foundation',
  tagline text,
  about text,
  address text,
  phone text,
  email text,
  logo_url text,
  facebook_url text,
  youtube_url text,
  instagram_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_single_row CHECK (id = 1)
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings public read" ON public.site_settings
  FOR SELECT USING (true);
CREATE POLICY "Admins manage site settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (id, tagline, about, address, phone, email)
VALUES (1,
  'Empowering Bangladesh',
  'A transparency-first foundation building sustainable futures through direct community action across 64 districts.',
  'Dhaka, Bangladesh',
  '+880 1700 000000',
  'info@qudrat.com.bd'
);

-- ========== NEWS ==========
CREATE TYPE news_media_type AS ENUM ('image', 'video', 'text');

CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  cover_image_url text,
  youtube_url text,
  media_type news_media_type NOT NULL DEFAULT 'text',
  category text NOT NULL DEFAULT 'News',
  is_published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX news_published_idx ON public.news (is_published, published_at DESC);

GRANT SELECT ON public.news TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published news visible to all" ON public.news
  FOR SELECT USING (is_published = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage news" ON public.news
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER news_updated_at BEFORE UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== STORAGE BUCKETS ==========
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('news-media', 'news-media', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read site-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-assets');
CREATE POLICY "Admins insert site-assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update site-assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete site-assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read news-media" ON storage.objects
  FOR SELECT USING (bucket_id = 'news-media');
CREATE POLICY "Admins insert news-media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'news-media' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update news-media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'news-media' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete news-media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'news-media' AND has_role(auth.uid(), 'admin'));

-- ========== ADMIN USER ==========
DO $$
DECLARE
  v_uid uuid;
  v_existing uuid;
BEGIN
  SELECT id INTO v_existing FROM auth.users WHERE email = 'admin@qudrat.com.bd';

  IF v_existing IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid,
      'authenticated', 'authenticated', 'admin@qudrat.com.bd',
      crypt('Admin@1234', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Foundation Admin"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', 'admin@qudrat.com.bd', 'email_verified', true),
      'email', v_uid::text,
      now(), now(), now()
    );

    INSERT INTO public.profiles (user_id, full_name)
      VALUES (v_uid, 'Foundation Admin')
      ON CONFLICT DO NOTHING;
  ELSE
    v_uid := v_existing;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
    VALUES (v_uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
END $$;
