-- ==========================================
-- LAJNA WELFARE APP - DATABASE SCHEMA
-- ==========================================

-- 1. REGIONS TABLE
CREATE TABLE IF NOT EXISTS public.regions (
    id TEXT PRIMARY KEY, -- e.g., 'region-2'
    name TEXT NOT NULL,  -- e.g., 'Region 2 (Ogun)'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DISTRICTS TABLE
CREATE TABLE IF NOT EXISTS public.districts (
    id TEXT PRIMARY KEY, -- e.g., 'dist-2-1'
    region_id TEXT NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,  -- e.g., 'Ayetoro'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER PROFILES TABLE (Linked to Supabase Auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- References auth.users(id) in production
    username TEXT NOT NULL UNIQUE,
    user_name_display TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('district', 'region', 'national')),
    region_id TEXT REFERENCES public.regions(id) ON DELETE SET NULL,
    district_id TEXT REFERENCES public.districts(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to automatically create a public profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, user_name_display, role, region_id, district_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'user_name_display', 'Welfare Secretary'),
    COALESCE(new.raw_user_meta_data->>'role', 'district'),
    COALESCE(new.raw_user_meta_data->>'region_id', 'region-2'),
    COALESCE(new.raw_user_meta_data->>'district_id', 'dist-2-1')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution link (if not already existing)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 4. MONTHLY WELFARE REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY, -- e.g., 'rep-2-1-2026-05'
    region_id TEXT NOT NULL REFERENCES public.regions(id) ON DELETE RESTRICT,
    district_id TEXT NOT NULL REFERENCES public.districts(id) ON DELETE RESTRICT,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'revision')),
    submitted_by TEXT NOT NULL,
    president_name TEXT,
    email TEXT,
    submitted_date DATE,
    revision_comments TEXT,
    data JSONB NOT NULL, -- Contains membership stats, financials, assistance logs, events, and projects arrays
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SUPPLEMENTARY REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.supplementary_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    creator_role TEXT NOT NULL CHECK (creator_role IN ('region', 'national')),
    creator_id TEXT NOT NULL, -- region_id or 'national'
    submitted_date DATE NOT NULL,
    fields JSONB NOT NULL, -- Dynamic question-answer schema & response values
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BENEFICIARIES REGISTRY TABLE
CREATE TABLE IF NOT EXISTS public.beneficiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id TEXT NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER,
    category TEXT NOT NULL,
    contact TEXT,
    family_size INTEGER DEFAULT 1,
    address TEXT,
    monthly_assistance_needed NUMERIC(15, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. NOTIFICATIONS FEED TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_role TEXT NOT NULL CHECK (recipient_role IN ('district', 'region', 'national')),
    recipient_id TEXT, -- district_id, region_id, or NULL for national/all
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'danger')),
    read BOOLEAN NOT NULL DEFAULT false,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplementary_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Regions: Readable by everyone authenticated
DROP POLICY IF EXISTS "Allow public read on regions" ON public.regions;
CREATE POLICY "Allow public read on regions" ON public.regions 
    FOR SELECT USING (true);

-- 2. Districts: Readable by everyone authenticated
DROP POLICY IF EXISTS "Allow public read on districts" ON public.districts;
CREATE POLICY "Allow public read on districts" ON public.districts 
    FOR SELECT USING (true);

-- 3. Profiles: Readable by all authenticated users. Editable by profile owner or national admin.
DROP POLICY IF EXISTS "Allow authenticated read on profiles" ON public.profiles;
CREATE POLICY "Allow authenticated read on profiles" ON public.profiles 
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow owners to update their profile" ON public.profiles;
CREATE POLICY "Allow owners to update their profile" ON public.profiles 
    FOR UPDATE USING (
        auth.uid() = id OR 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'national'
    );

-- 4. Reports: Scoped RLS
-- District Secretaries: Can see/modify their own district reports
DROP POLICY IF EXISTS "Districts report access" ON public.reports;
CREATE POLICY "Districts report access" ON public.reports
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = auth.uid() 
            AND public.profiles.role = 'district' 
            AND public.profiles.district_id = public.reports.district_id
        )
    );

-- Regional Secretaries: Can read all reports inside their region and update status
DROP POLICY IF EXISTS "Regions report access" ON public.reports;
CREATE POLICY "Regions report access" ON public.reports
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = auth.uid() 
            AND (
                (public.profiles.role = 'region' AND public.profiles.region_id = public.reports.region_id)
                OR public.profiles.role = 'national'
            )
        )
    );

DROP POLICY IF EXISTS "Regions report status updates" ON public.reports;
CREATE POLICY "Regions report status updates" ON public.reports
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = auth.uid() 
            AND (
                (public.profiles.role = 'region' AND public.profiles.region_id = public.reports.region_id)
                OR public.profiles.role = 'national'
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = auth.uid() 
            AND (
                (public.profiles.role = 'region' AND public.profiles.region_id = public.reports.region_id)
                OR public.profiles.role = 'national'
            )
        )
    );

-- 5. Beneficiaries: Scoped access
DROP POLICY IF EXISTS "District beneficiary access" ON public.beneficiaries;
CREATE POLICY "District beneficiary access" ON public.beneficiaries
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = auth.uid() 
            AND public.profiles.role = 'district' 
            AND public.profiles.district_id = public.beneficiaries.district_id
        )
    );

DROP POLICY IF EXISTS "Regional and National beneficiary read" ON public.beneficiaries;
CREATE POLICY "Regional and National beneficiary read" ON public.beneficiaries
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = auth.uid() 
            AND (
                (public.profiles.role = 'region' AND public.profiles.region_id = (SELECT region_id FROM public.districts WHERE id = public.beneficiaries.district_id))
                OR public.profiles.role = 'national'
            )
        )
    );

-- 6. Notifications: Scoped access
DROP POLICY IF EXISTS "User notifications access" ON public.notifications;
CREATE POLICY "User notifications access" ON public.notifications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = auth.uid() 
            AND (
                (public.profiles.role = 'district' AND public.profiles.district_id = public.notifications.recipient_id)
                OR (public.profiles.role = 'region' AND public.profiles.region_id = public.notifications.recipient_id)
                OR (public.profiles.role = 'national' AND public.notifications.recipient_id IS NULL)
            )
        )
    );


-- ==========================================
-- SEED DATA SETUP
-- ==========================================

-- Populate Regions
INSERT INTO public.regions (id, name) VALUES 
('region-1', 'Region 1 (Lagos)'),
('region-2', 'Region 2 (Ogun)'),
('region-3', 'Region 3 (Oyo)'),
('region-4', 'Region 4 (Osun/Osogbo)'),
('region-5', 'Region 5 (Ekiti/Akoko)'),
('region-6', 'Region 6 (Port Harcout/Owerri/Ikot)'),
('region-7', 'Region 7 (Abuja/Bauchi/Jos)'),
('region-8', 'Region 8 (Edo/Delta/Warri)'),
('region-9', 'Region 9 (Kogi/Lokoja)'),
('region-10', 'Region 10 (Kwara/Ilorin/Lafiaji)'),
('region-11', 'Region 11 (Sokoto/Kebbi)')
ON CONFLICT (id) DO NOTHING;

-- Populate Districts
INSERT INTO public.districts (id, region_id, name) VALUES
-- Region 1 (Lagos)
('dist-1-1', 'region-1', 'Lagos Mainland'),
('dist-1-2', 'region-1', 'Lagos Island'),
('dist-1-3', 'region-1', 'Ikeja'),
('dist-1-4', 'region-1', 'Apapa'),
('dist-1-5', 'region-1', 'Surulere'),
-- Region 2 (Ogun)
('dist-2-1', 'region-2', 'Ayetoro'),
('dist-2-2', 'region-2', 'Ogun Waterside'),
('dist-2-3', 'region-2', 'Abeokuta'),
('dist-2-4', 'region-2', 'Ijebu Ode'),
('dist-2-5', 'region-2', 'Sagamu'),
-- Region 3 (Oyo)
('dist-3-1', 'region-3', 'Ibadan North'),
('dist-3-2', 'region-3', 'Ibadan South'),
('dist-3-3', 'region-3', 'Oyo Town'),
('dist-3-4', 'region-3', 'Ogbomoso'),
('dist-3-5', 'region-3', 'Eruwa'),
-- Region 4 (Osun/Osogbo)
('dist-4-1', 'region-4', 'Osogbo'),
('dist-4-2', 'region-4', 'Ile-Ife'),
('dist-4-3', 'region-4', 'Ilesa'),
('dist-4-4', 'region-4', 'Ede'),
('dist-4-5', 'region-4', 'Ikirun'),
-- Region 5 (Ekiti/Akoko)
('dist-5-1', 'region-5', 'Ado Ekiti'),
('dist-5-2', 'region-5', 'Ikole'),
('dist-5-3', 'region-5', 'Oye'),
('dist-5-4', 'region-5', 'Ikere'),
('dist-5-5', 'region-5', 'Akoko Town'),
-- Region 6 (Port Harcout/Owerri/Ikot)
('dist-6-1', 'region-6', 'Port Harcourt'),
('dist-6-2', 'region-6', 'Owerri'),
('dist-6-3', 'region-6', 'Ikot Ekpene'),
('dist-6-4', 'region-6', 'Aba'),
('dist-6-5', 'region-6', 'Uyo'),
-- Region 7 (Abuja/Bauchi/Jos)
('dist-7-1', 'region-7', 'Abuja Central'),
('dist-7-2', 'region-7', 'Gwagwalada'),
('dist-7-3', 'region-7', 'Bauchi Town'),
('dist-7-4', 'region-7', 'Jos North'),
('dist-7-5', 'region-7', 'Jos South'),
-- Region 8 (Edo/Delta/Warri)
('dist-8-1', 'region-8', 'Benin City'),
('dist-8-2', 'region-8', 'Warri'),
('dist-8-3', 'region-8', 'Asaba'),
('dist-8-4', 'region-8', 'Sapele'),
('dist-8-5', 'region-8', 'Uromi'),
-- Region 9 (Kogi/Lokoja)
('dist-9-1', 'region-9', 'Lokoja'),
('dist-9-2', 'region-9', 'Okene'),
('dist-9-3', 'region-9', 'Kabba'),
('dist-9-4', 'region-9', 'Idah'),
('dist-9-5', 'region-9', 'Ankpa'),
-- Region 10 (Kwara/Ilorin/Lafiaji)
('dist-10-1', 'region-10', 'Ilorin'),
('dist-10-2', 'region-10', 'Lafiaji'),
('dist-10-3', 'region-10', 'Offa'),
('dist-10-4', 'region-10', 'Omu-Aran'),
('dist-10-5', 'region-10', 'Patigi'),
-- Region 11 (Sokoto/Kebbi)
('dist-11-1', 'region-11', 'Sokoto Central'),
('dist-11-2', 'region-11', 'Birnin Kebbi'),
('dist-11-3', 'region-11', 'Argungu'),
('dist-11-4', 'region-11', 'Wurno'),
('dist-11-5', 'region-11', 'Gwandu')
ON CONFLICT (id) DO NOTHING;


-- ==========================================
-- 8. REPORT COMMENTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.report_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.report_comments ENABLE ROW LEVEL SECURITY;

-- 1. Read comments policy:
-- District, Regional, and National users can read comments for reports they have access to
DROP POLICY IF EXISTS "Allow read access to report comments" ON public.report_comments;
CREATE POLICY "Allow read access to report comments" ON public.report_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.reports
            WHERE public.reports.id = public.report_comments.report_id
        )
    );

-- 2. Insert comments policy:
-- Users can insert comments if they have access to the report
DROP POLICY IF EXISTS "Allow insert access to report comments" ON public.report_comments;
CREATE POLICY "Allow insert access to report comments" ON public.report_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.reports
            WHERE public.reports.id = public.report_comments.report_id
        )
    );

