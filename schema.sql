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
CREATE POLICY "Allow public read on regions" ON public.regions 
    FOR SELECT USING (true);

-- 2. Districts: Readable by everyone authenticated
CREATE POLICY "Allow public read on districts" ON public.districts 
    FOR SELECT USING (true);

-- 3. Profiles: Readable by all authenticated users. Editable by profile owner.
CREATE POLICY "Allow authenticated read on profiles" ON public.profiles 
    FOR SELECT USING (true);
CREATE POLICY "Allow owners to update their profile" ON public.profiles 
    FOR UPDATE USING (auth.uid() = id);

-- 4. Reports: Scoped RLS
-- District Secretaries: Can see/modify their own district reports
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
('dist-2-1', 'region-2', 'Ayetoro'),
('dist-2-2', 'region-2', 'Ogun Waterside'),
('dist-2-3', 'region-2', 'Ijebu Ode'),
('dist-1-1', 'region-1', 'Lagos Island'),
('dist-1-2', 'region-1', 'Ikeja'),
('dist-3-1', 'region-3', 'Ibadan North')
ON CONFLICT (id) DO NOTHING;
