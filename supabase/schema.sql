-- ================================================
-- BarakahSpend Database Schema
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- ENUMS
-- ================================================

CREATE TYPE expense_category AS ENUM (
  'makanan_halal',
  'nafkah_keluarga',
  'sedekah',
  'wakaf',
  'hutang',
  'simpanan',
  'hiburan'
);

CREATE TYPE org_role AS ENUM ('admin', 'treasurer', 'viewer');

CREATE TYPE ramadan_meal AS ENUM ('sahur', 'iftar');

CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'synced', 'failed');

-- ================================================
-- USERS (extends Supabase auth.users)
-- ================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- EXPENSES
-- ================================================

CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  category expense_category NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_ramadan BOOLEAN DEFAULT FALSE,
  ramadan_meal ramadan_meal,
  offline_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_date ON public.expenses(date);
CREATE INDEX idx_expenses_category ON public.expenses(category);

-- ================================================
-- SEDEKAH RECORDS
-- ================================================

CREATE TABLE public.sedekah_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  recipient TEXT,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  offline_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sedekah_user_id ON public.sedekah_records(user_id);
CREATE INDEX idx_sedekah_date ON public.sedekah_records(date);

-- ================================================
-- ZAKAT RECORDS
-- ================================================

CREATE TABLE public.zakat_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_savings DECIMAL(14,2) NOT NULL,
  gold_value DECIMAL(14,2) DEFAULT 0,
  zakat_amount DECIMAL(14,2) NOT NULL,
  nisab_eligible BOOLEAN NOT NULL,
  year INTEGER NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  offline_id TEXT UNIQUE,
  UNIQUE(user_id, year)
);

CREATE INDEX idx_zakat_user_id ON public.zakat_records(user_id);

-- ================================================
-- ORGANIZATIONS (Masjid Mini SaaS)
-- ================================================

CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'masjid',
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- ORGANIZATION MEMBERS
-- ================================================

CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'viewer',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);

-- ================================================
-- DONATIONS
-- ================================================

CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  donor_name TEXT,
  donor_user_id UUID REFERENCES public.users(id),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL DEFAULT 'general',
  qr_ref TEXT,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  offline_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_donations_org ON public.donations(organization_id);
CREATE INDEX idx_donations_date ON public.donations(date);

-- ================================================
-- COMMUNITY CHALLENGES
-- ================================================

CREATE TABLE public.community_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participants JSONB DEFAULT '[]'::jsonb,
  leaderboard JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_challenges_active ON public.community_challenges(is_active);

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sedekah_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zakat_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_challenges ENABLE ROW LEVEL SECURITY;

-- Users: own data only
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Expenses: own data only
CREATE POLICY "Users can view own expenses" ON public.expenses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Sedekah: own data only
CREATE POLICY "Users can view own sedekah" ON public.sedekah_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sedekah" ON public.sedekah_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sedekah" ON public.sedekah_records
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sedekah" ON public.sedekah_records
  FOR DELETE USING (auth.uid() = user_id);

-- Zakat: own data only
CREATE POLICY "Users can view own zakat" ON public.zakat_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own zakat" ON public.zakat_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Organizations: members can view
CREATE POLICY "Members can view organizations" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can update organizations" ON public.organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Organization Members
CREATE POLICY "Members can view membership" ON public.organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_id AND om.user_id = auth.uid()
    )
  );
CREATE POLICY "Admins can manage members" ON public.organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_id AND om.user_id = auth.uid() AND om.role = 'admin'
    )
  );

-- Donations: org members can view
CREATE POLICY "Members can view org donations" ON public.donations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = donations.organization_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Members can insert donations" ON public.donations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = donations.organization_id AND user_id = auth.uid()
    ) OR donor_user_id = auth.uid()
  );

-- Community Challenges: all authenticated users can view
CREATE POLICY "Authenticated users can view challenges" ON public.community_challenges
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create challenges" ON public.community_challenges
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update challenges" ON public.community_challenges
  FOR UPDATE USING (auth.uid() = created_by);

-- ================================================
-- FUNCTIONS
-- ================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
