-- ============================================================
-- Sunday Dinner Memories — Initial Schema
-- 25 tables + RLS policies
-- ============================================================
-- Restructured into 3 sections:
--   SECTION 1: Create ALL tables (FK-dependency order)
--   SECTION 2: Enable RLS on ALL tables
--   SECTION 3: Create ALL policies
-- ============================================================


-- ############################################################
-- SECTION 1: CREATE ALL TABLES
-- ############################################################

-- ============================================================
-- 1. families (no FK deps)
-- ============================================================
CREATE TABLE families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text UNIQUE,
  viewer_share_token text UNIQUE,
  max_active_members integer DEFAULT 5,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. family_members (refs families, auth.users)
-- ============================================================
CREATE TABLE family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'active', 'viewer')),
  joined_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. cooks (refs families, family_members)
-- ============================================================
CREATE TABLE cooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name text NOT NULL,
  bio text,
  photo_url text,
  created_by uuid REFERENCES family_members(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(family_id, name)
);

-- ============================================================
-- 4. recipes (refs families, family_members, cooks)
-- ============================================================
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  contributed_by uuid REFERENCES family_members(id),
  original_cook_id uuid REFERENCES cooks(id),
  title text NOT NULL,
  description text,
  category text,
  cuisine text,
  difficulty text,
  dietary_labels text[],
  prep_time_min integer,
  cook_time_min integer,
  servings integer,
  instructions jsonb,
  notes text,
  blog_content jsonb,
  is_public boolean DEFAULT false,
  public_slug text UNIQUE,
  source_url text,
  original_image_url text,
  scan_status text,
  source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 5. ingredients (no FK deps)
-- ============================================================
CREATE TABLE ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

-- ============================================================
-- 6. recipe_ingredients (refs recipes, ingredients)
-- ============================================================
CREATE TABLE recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id uuid REFERENCES ingredients(id),
  quantity text,
  quantity_numeric decimal,
  unit text,
  notes text,
  sort_order integer
);

-- ============================================================
-- 7. family_invites (refs families, family_members)
-- ============================================================
CREATE TABLE family_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  invite_token text UNIQUE NOT NULL,
  invited_email text,
  invited_by uuid REFERENCES family_members(id),
  invited_role text DEFAULT 'active',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

-- ============================================================
-- 8. recipe_saves (refs recipes, families, family_members)
-- ============================================================
CREATE TABLE recipe_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  saved_by uuid REFERENCES family_members(id),
  saved_at timestamptz DEFAULT now()
);

-- ============================================================
-- 9. tags (refs families, family_members)
-- ============================================================
CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_by uuid REFERENCES family_members(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(family_id, name)
);

-- ============================================================
-- 10. recipe_tags (refs recipes, tags, family_members)
-- ============================================================
CREATE TABLE recipe_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  tagged_by uuid REFERENCES family_members(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(recipe_id, tag_id)
);

-- ============================================================
-- 11. favorites (refs auth.users, recipes)
-- ============================================================
CREATE TABLE favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- ============================================================
-- 12. cookbooks (refs families, family_members)
-- ============================================================
CREATE TABLE cookbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by uuid REFERENCES family_members(id),
  title text NOT NULL,
  description text,
  cover_image_url text,
  is_shared boolean DEFAULT true,
  sort_order integer,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 13. cookbook_recipes (refs cookbooks, recipes, family_members)
-- ============================================================
CREATE TABLE cookbook_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cookbook_id uuid NOT NULL REFERENCES cookbooks(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  added_by uuid REFERENCES family_members(id),
  sort_order integer,
  added_at timestamptz DEFAULT now(),
  UNIQUE(cookbook_id, recipe_id)
);

-- ============================================================
-- 14. audio_memories (refs recipes, cooks, families, family_members)
-- ============================================================
CREATE TABLE audio_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
  cook_id uuid REFERENCES cooks(id) ON DELETE SET NULL,
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES family_members(id),
  title text,
  audio_url text,
  duration_seconds integer,
  transcript text,
  qr_code_url text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 15. printable_cookbooks (refs families, family_members)
-- ============================================================
CREATE TABLE printable_cookbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by uuid REFERENCES family_members(id),
  title text NOT NULL,
  subtitle text,
  description text,
  theme text,
  cover_image_url text,
  cover_source text,
  dedication_text text,
  family_history_text text,
  family_history_photos jsonb,
  include_recipe_images boolean DEFAULT true,
  include_qr_codes boolean DEFAULT true,
  include_audio_qr boolean DEFAULT true,
  collaborators uuid[],
  status text,
  export_format text,
  page_count integer,
  is_public boolean DEFAULT false,
  price decimal,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 16. printable_cookbook_pages (refs printable_cookbooks, recipes, audio_memories)
-- ============================================================
CREATE TABLE printable_cookbook_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cookbook_id uuid NOT NULL REFERENCES printable_cookbooks(id) ON DELETE CASCADE,
  page_type text,
  recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
  title text,
  content text,
  photos jsonb,
  audio_memory_id uuid REFERENCES audio_memories(id) ON DELETE SET NULL,
  sort_order integer,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 17. meal_plans (refs families, family_members)
-- ============================================================
CREATE TABLE meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by uuid REFERENCES family_members(id),
  title text,
  start_date date,
  end_date date,
  is_shared boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 18. meal_plan_items (refs meal_plans, recipes, family_members)
-- ============================================================
CREATE TABLE meal_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id uuid NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  date date,
  meal_slot text,
  servings_multiplier decimal DEFAULT 1.0,
  notes text,
  sort_order integer,
  added_by uuid REFERENCES family_members(id),
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 19. shopping_lists (refs families, meal_plans, family_members)
-- ============================================================
CREATE TABLE shopping_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  meal_plan_id uuid REFERENCES meal_plans(id) ON DELETE SET NULL,
  created_by uuid REFERENCES family_members(id),
  title text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 20. shopping_list_items (refs shopping_lists, ingredients)
-- ============================================================
CREATE TABLE shopping_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id uuid NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_id uuid REFERENCES ingredients(id),
  name text,
  quantity decimal,
  unit text,
  recipe_sources jsonb,
  aisle_category text,
  is_checked boolean DEFAULT false,
  is_manual boolean DEFAULT false,
  sort_order integer,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 21. user_subscriptions (refs families)
-- ============================================================
CREATE TABLE user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL UNIQUE REFERENCES families(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_tier text,
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 22. usage_tracking (refs families)
-- ============================================================
CREATE TABLE usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  billing_period_start date,
  scan_count integer DEFAULT 0,
  api_credit_spent decimal DEFAULT 0.00,
  image_gen_count integer DEFAULT 0,
  image_gen_charges decimal DEFAULT 0.00,
  last_updated timestamptz DEFAULT now()
);

-- ============================================================
-- 23. usage_log (refs families, auth.users, recipes)
-- ============================================================
CREATE TABLE usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  action_type text,
  api_cost decimal,
  model_used text,
  recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 24. print_orders (refs printable_cookbooks, families, family_members)
-- ============================================================
CREATE TABLE print_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cookbook_id uuid NOT NULL REFERENCES printable_cookbooks(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  ordered_by uuid REFERENCES family_members(id),
  lulu_print_job_id text,
  cover_type text,
  quantity integer,
  lulu_base_cost decimal,
  markup_amount decimal,
  shipping_cost decimal,
  total_charged decimal,
  stripe_payment_id text,
  shipping_address jsonb,
  is_gift boolean DEFAULT false,
  gift_message text,
  status text,
  lulu_tracking_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 25. beta_feedback (refs auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS beta_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  rating integer,
  feature text,
  message text,
  created_at timestamptz DEFAULT now()
);


-- ############################################################
-- SECTION 2: ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ############################################################

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookbook_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE printable_cookbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE printable_cookbook_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;


-- ############################################################
-- SECTION 3: CREATE ALL POLICIES
-- ############################################################

-- ----------------------------------------------------------
-- families policies
-- ----------------------------------------------------------

-- Family members can view their own family
CREATE POLICY "Family members can view their family"
  ON families FOR SELECT
  USING (
    id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Anyone can view a family by viewer_share_token (for join flows)
CREATE POLICY "Anyone can view family by viewer token"
  ON families FOR SELECT
  USING (viewer_share_token IS NOT NULL);

-- Anyone can view family by invite_code (for join flows)
CREATE POLICY "Anyone can view family by invite code"
  ON families FOR SELECT
  USING (invite_code IS NOT NULL);

-- Authenticated users can create families
CREATE POLICY "Authenticated users can create families"
  ON families FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can update their family
CREATE POLICY "Admins can update their family"
  ON families FOR UPDATE
  USING (
    id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------
-- family_members policies
-- ----------------------------------------------------------

CREATE POLICY "Members can view same family members"
  ON family_members FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert themselves as members"
  ON family_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update family members"
  ON family_members FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete family members"
  ON family_members FOR DELETE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------
-- cooks policies
-- ----------------------------------------------------------

CREATE POLICY "Family members can view cooks"
  ON cooks FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Active/admin can insert cooks"
  ON cooks FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

CREATE POLICY "Active/admin can update cooks"
  ON cooks FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

CREATE POLICY "Active/admin can delete cooks"
  ON cooks FOR DELETE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

-- ----------------------------------------------------------
-- recipes policies
-- ----------------------------------------------------------

-- Family members can view their family's recipes + public recipes
CREATE POLICY "Family members can view recipes"
  ON recipes FOR SELECT
  USING (
    is_public = true
    OR family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Active/admin can insert recipes
CREATE POLICY "Active/admin can insert recipes"
  ON recipes FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

-- Only the contributor can update their recipe
CREATE POLICY "Contributor can update their recipe"
  ON recipes FOR UPDATE
  USING (
    contributed_by IN (
      SELECT id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Contributor or admin can delete
CREATE POLICY "Contributor or admin can delete recipe"
  ON recipes FOR DELETE
  USING (
    contributed_by IN (
      SELECT id FROM family_members WHERE user_id = auth.uid()
    )
    OR family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------
-- ingredients policies
-- ----------------------------------------------------------

CREATE POLICY "Anyone can view ingredients"
  ON ingredients FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert ingredients"
  ON ingredients FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ----------------------------------------------------------
-- recipe_ingredients policies
-- ----------------------------------------------------------

CREATE POLICY "Family members can view recipe ingredients"
  ON recipe_ingredients FOR SELECT
  USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      ) OR is_public = true
    )
  );

CREATE POLICY "Active/admin can insert recipe ingredients"
  ON recipe_ingredients FOR INSERT
  WITH CHECK (
    recipe_id IN (
      SELECT id FROM recipes WHERE family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'active')
      )
    )
  );

CREATE POLICY "Active/admin can update recipe ingredients"
  ON recipe_ingredients FOR UPDATE
  USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'active')
      )
    )
  );

CREATE POLICY "Active/admin can delete recipe ingredients"
  ON recipe_ingredients FOR DELETE
  USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'active')
      )
    )
  );

-- ----------------------------------------------------------
-- family_invites policies
-- ----------------------------------------------------------

-- Anyone can view invites by token (for redemption)
CREATE POLICY "Anyone can view invite by token"
  ON family_invites FOR SELECT
  USING (true);

CREATE POLICY "Active/admin can create invites"
  ON family_invites FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

CREATE POLICY "Authenticated users can update invites"
  ON family_invites FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ----------------------------------------------------------
-- recipe_saves policies
-- ----------------------------------------------------------

CREATE POLICY "Family members can view saves"
  ON recipe_saves FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Active/admin can insert saves"
  ON recipe_saves FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

CREATE POLICY "Active/admin can delete saves"
  ON recipe_saves FOR DELETE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

-- ----------------------------------------------------------
-- tags policies
-- ----------------------------------------------------------

CREATE POLICY "Family members can view tags"
  ON tags FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Active/admin can insert tags"
  ON tags FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

CREATE POLICY "Active/admin can delete tags"
  ON tags FOR DELETE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

-- ----------------------------------------------------------
-- recipe_tags policies
-- ----------------------------------------------------------

CREATE POLICY "Family members can view recipe tags"
  ON recipe_tags FOR SELECT
  USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Active/admin can insert recipe tags"
  ON recipe_tags FOR INSERT
  WITH CHECK (
    recipe_id IN (
      SELECT id FROM recipes WHERE family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'active')
      )
    )
  );

CREATE POLICY "Active/admin can delete recipe tags"
  ON recipe_tags FOR DELETE
  USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'active')
      )
    )
  );

-- ----------------------------------------------------------
-- favorites policies
-- ----------------------------------------------------------

-- Personal scope: users see only their own favorites
CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own favorites"
  ON favorites FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE
  USING (user_id = auth.uid());

-- ----------------------------------------------------------
-- cookbooks policies
-- ----------------------------------------------------------

CREATE POLICY "Family members can view cookbooks"
  ON cookbooks FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Active/admin can insert cookbooks"
  ON cookbooks FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

CREATE POLICY "Active/admin can update cookbooks"
  ON cookbooks FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

CREATE POLICY "Active/admin can delete cookbooks"
  ON cookbooks FOR DELETE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

-- ----------------------------------------------------------
-- cookbook_recipes policies
-- ----------------------------------------------------------

CREATE POLICY "Family members can view cookbook recipes"
  ON cookbook_recipes FOR SELECT
  USING (
    cookbook_id IN (
      SELECT id FROM cookbooks WHERE family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Active/admin can insert cookbook recipes"
  ON cookbook_recipes FOR INSERT
  WITH CHECK (
    cookbook_id IN (
      SELECT id FROM cookbooks WHERE family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'active')
      )
    )
  );

CREATE POLICY "Active/admin can update cookbook recipes"
  ON cookbook_recipes FOR UPDATE
  USING (
    cookbook_id IN (
      SELECT id FROM cookbooks WHERE family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'active')
      )
    )
  );

CREATE POLICY "Active/admin can delete cookbook recipes"
  ON cookbook_recipes FOR DELETE
  USING (
    cookbook_id IN (
      SELECT id FROM cookbooks WHERE family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'active')
      )
    )
  );

-- ----------------------------------------------------------
-- audio_memories policies
-- ----------------------------------------------------------

CREATE POLICY "Family members can view audio memories"
  ON audio_memories FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Active/admin can insert audio memories"
  ON audio_memories FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

CREATE POLICY "Active/admin can update audio memories"
  ON audio_memories FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

CREATE POLICY "Active/admin can delete audio memories"
  ON audio_memories FOR DELETE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

-- ----------------------------------------------------------
-- printable_cookbooks policies
-- ----------------------------------------------------------

CREATE POLICY "Family members can view printable cookbooks"
  ON printable_cookbooks FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Active/admin can insert printable cookbooks"
  ON printable_cookbooks FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

CREATE POLICY "Active/admin can update printable cookbooks"
  ON printable_cookbooks FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

CREATE POLICY "Active/admin can delete printable cookbooks"
  ON printable_cookbooks FOR DELETE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

-- ----------------------------------------------------------
-- printable_cookbook_pages policies
-- ----------------------------------------------------------

CREATE POLICY "Family members can view printable pages"
  ON printable_cookbook_pages FOR SELECT
  USING (
    cookbook_id IN (
      SELECT id FROM printable_cookbooks WHERE family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Active/admin can insert printable pages"
  ON printable_cookbook_pages FOR INSERT
  WITH CHECK (
    cookbook_id IN (
      SELECT id FROM printable_cookbooks WHERE family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'active')
      )
    )
  );

CREATE POLICY "Active/admin can update printable pages"
  ON printable_cookbook_pages FOR UPDATE
  USING (
    cookbook_id IN (
      SELECT id FROM printable_cookbooks WHERE family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'active')
      )
    )
  );

CREATE POLICY "Active/admin can delete printable pages"
  ON printable_cookbook_pages FOR DELETE
  USING (
    cookbook_id IN (
      SELECT id FROM printable_cookbooks WHERE family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'active')
      )
    )
  );

-- ----------------------------------------------------------
-- meal_plans policies
-- ----------------------------------------------------------

CREATE POLICY "Family members can view meal plans"
  ON meal_plans FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Active/admin can insert meal plans"
  ON meal_plans FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

CREATE POLICY "Active/admin can update meal plans"
  ON meal_plans FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

CREATE POLICY "Active/admin can delete meal plans"
  ON meal_plans FOR DELETE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

-- ----------------------------------------------------------
-- meal_plan_items policies
-- ----------------------------------------------------------

CREATE POLICY "Family members can view meal plan items"
  ON meal_plan_items FOR SELECT
  USING (
    meal_plan_id IN (
      SELECT id FROM meal_plans WHERE family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Active/admin can insert meal plan items"
  ON meal_plan_items FOR INSERT
  WITH CHECK (
    meal_plan_id IN (
      SELECT id FROM meal_plans WHERE family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'active')
      )
    )
  );

CREATE POLICY "Active/admin can update meal plan items"
  ON meal_plan_items FOR UPDATE
  USING (
    meal_plan_id IN (
      SELECT id FROM meal_plans WHERE family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'active')
      )
    )
  );

CREATE POLICY "Active/admin can delete meal plan items"
  ON meal_plan_items FOR DELETE
  USING (
    meal_plan_id IN (
      SELECT id FROM meal_plans WHERE family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'active')
      )
    )
  );

-- ----------------------------------------------------------
-- shopping_lists policies
-- ----------------------------------------------------------

CREATE POLICY "Family members can view shopping lists"
  ON shopping_lists FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Active/admin can insert shopping lists"
  ON shopping_lists FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

CREATE POLICY "Active/admin can update shopping lists"
  ON shopping_lists FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

CREATE POLICY "Active/admin can delete shopping lists"
  ON shopping_lists FOR DELETE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

-- ----------------------------------------------------------
-- shopping_list_items policies
-- ----------------------------------------------------------

-- All family members (including viewers) can view shopping list items
CREATE POLICY "Family members can view shopping list items"
  ON shopping_list_items FOR SELECT
  USING (
    shopping_list_id IN (
      SELECT id FROM shopping_lists WHERE family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Active/admin can insert shopping list items"
  ON shopping_list_items FOR INSERT
  WITH CHECK (
    shopping_list_id IN (
      SELECT id FROM shopping_lists WHERE family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'active')
      )
    )
  );

-- Viewers CAN update is_checked (all family members can update)
CREATE POLICY "Family members can update shopping list items"
  ON shopping_list_items FOR UPDATE
  USING (
    shopping_list_id IN (
      SELECT id FROM shopping_lists WHERE family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Active/admin can delete shopping list items"
  ON shopping_list_items FOR DELETE
  USING (
    shopping_list_id IN (
      SELECT id FROM shopping_lists WHERE family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'active')
      )
    )
  );

-- ----------------------------------------------------------
-- user_subscriptions policies
-- ----------------------------------------------------------

CREATE POLICY "Family members can view subscription"
  ON user_subscriptions FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert subscription"
  ON user_subscriptions FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update subscription"
  ON user_subscriptions FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------
-- usage_tracking policies
-- ----------------------------------------------------------

CREATE POLICY "Family members can view usage"
  ON usage_tracking FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Active/admin can insert usage"
  ON usage_tracking FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

CREATE POLICY "Active/admin can update usage"
  ON usage_tracking FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

-- ----------------------------------------------------------
-- usage_log policies
-- ----------------------------------------------------------

CREATE POLICY "Family members can view usage log"
  ON usage_log FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Active/admin can insert usage log"
  ON usage_log FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

-- ----------------------------------------------------------
-- print_orders policies
-- ----------------------------------------------------------

CREATE POLICY "Family members can view print orders"
  ON print_orders FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Active/admin can insert print orders"
  ON print_orders FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

CREATE POLICY "Active/admin can update print orders"
  ON print_orders FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'active')
    )
  );

-- ----------------------------------------------------------
-- beta_feedback policies
-- ----------------------------------------------------------

CREATE POLICY "Users can insert feedback"
  ON beta_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own feedback"
  ON beta_feedback FOR SELECT
  USING (auth.uid() = user_id);
