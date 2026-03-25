-- ============================================================
-- Fix infinite recursion in RLS policies
-- The issue: family_members SELECT policy references family_members
-- itself, causing Postgres to detect infinite recursion.
-- Fix: Use a security definer function that bypasses RLS.
-- ============================================================

-- Create a helper function that runs with elevated privileges
-- to get the user's family_id without triggering RLS on family_members
CREATE OR REPLACE FUNCTION get_user_family_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id FROM family_members WHERE user_id = p_user_id;
$$;

-- Create a helper to check if user is active/admin in their family
CREATE OR REPLACE FUNCTION get_user_active_family_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id FROM family_members WHERE user_id = p_user_id AND role IN ('admin', 'active');
$$;

-- Create a helper to check if user is admin in their family
CREATE OR REPLACE FUNCTION get_user_admin_family_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id FROM family_members WHERE user_id = p_user_id AND role = 'admin';
$$;

-- ============================================================
-- Drop and recreate ALL policies that reference family_members
-- ============================================================

-- 1. family_members policies (the source of the recursion)
DROP POLICY IF EXISTS "Members can view same family members" ON family_members;
DROP POLICY IF EXISTS "Admins can update family members" ON family_members;
DROP POLICY IF EXISTS "Admins can delete family members" ON family_members;

CREATE POLICY "Members can view same family members"
  ON family_members FOR SELECT
  USING (
    family_id IN (SELECT get_user_family_ids(auth.uid()))
  );

CREATE POLICY "Admins can update family members"
  ON family_members FOR UPDATE
  USING (
    family_id IN (SELECT get_user_admin_family_ids(auth.uid()))
  );

CREATE POLICY "Admins can delete family members"
  ON family_members FOR DELETE
  USING (
    family_id IN (SELECT get_user_admin_family_ids(auth.uid()))
  );

-- 2. families policies
DROP POLICY IF EXISTS "Family members can view their family" ON families;
DROP POLICY IF EXISTS "Admins can update their family" ON families;

CREATE POLICY "Family members can view their family"
  ON families FOR SELECT
  USING (
    id IN (SELECT get_user_family_ids(auth.uid()))
    OR viewer_share_token IS NOT NULL
    OR invite_code IS NOT NULL
  );

CREATE POLICY "Admins can update their family"
  ON families FOR UPDATE
  USING (
    id IN (SELECT get_user_admin_family_ids(auth.uid()))
  );

-- 3. cooks policies
DROP POLICY IF EXISTS "Family members can view cooks" ON cooks;
DROP POLICY IF EXISTS "Active/admin can insert cooks" ON cooks;
DROP POLICY IF EXISTS "Active/admin can update cooks" ON cooks;
DROP POLICY IF EXISTS "Active/admin can delete cooks" ON cooks;

CREATE POLICY "Family members can view cooks"
  ON cooks FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids(auth.uid())));

CREATE POLICY "Active/admin can insert cooks"
  ON cooks FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_active_family_ids(auth.uid())));

CREATE POLICY "Active/admin can update cooks"
  ON cooks FOR UPDATE
  USING (family_id IN (SELECT get_user_active_family_ids(auth.uid())));

CREATE POLICY "Active/admin can delete cooks"
  ON cooks FOR DELETE
  USING (family_id IN (SELECT get_user_active_family_ids(auth.uid())));

-- 4. recipes policies
DROP POLICY IF EXISTS "Family members can view recipes" ON recipes;
DROP POLICY IF EXISTS "Active/admin can insert recipes" ON recipes;
DROP POLICY IF EXISTS "Contributor can update their recipe" ON recipes;
DROP POLICY IF EXISTS "Contributor or admin can delete recipe" ON recipes;

CREATE POLICY "Family members can view recipes"
  ON recipes FOR SELECT
  USING (
    is_public = true
    OR family_id IN (SELECT get_user_family_ids(auth.uid()))
  );

CREATE POLICY "Active/admin can insert recipes"
  ON recipes FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_active_family_ids(auth.uid())));

CREATE POLICY "Contributor can update their recipe"
  ON recipes FOR UPDATE
  USING (
    contributed_by IN (
      SELECT id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Contributor or admin can delete recipe"
  ON recipes FOR DELETE
  USING (
    contributed_by IN (
      SELECT id FROM family_members WHERE user_id = auth.uid()
    )
    OR family_id IN (SELECT get_user_admin_family_ids(auth.uid()))
  );

-- 5. recipe_ingredients policies
DROP POLICY IF EXISTS "Family members can view recipe ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Active/admin can insert recipe ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Active/admin can update recipe ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Active/admin can delete recipe ingredients" ON recipe_ingredients;

CREATE POLICY "Family members can view recipe ingredients"
  ON recipe_ingredients FOR SELECT
  USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE family_id IN (SELECT get_user_family_ids(auth.uid())) OR is_public = true
    )
  );

CREATE POLICY "Active/admin can insert recipe ingredients"
  ON recipe_ingredients FOR INSERT
  WITH CHECK (
    recipe_id IN (
      SELECT id FROM recipes WHERE family_id IN (SELECT get_user_active_family_ids(auth.uid()))
    )
  );

CREATE POLICY "Active/admin can update recipe ingredients"
  ON recipe_ingredients FOR UPDATE
  USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE family_id IN (SELECT get_user_active_family_ids(auth.uid()))
    )
  );

CREATE POLICY "Active/admin can delete recipe ingredients"
  ON recipe_ingredients FOR DELETE
  USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE family_id IN (SELECT get_user_active_family_ids(auth.uid()))
    )
  );

-- 6. family_invites policies
DROP POLICY IF EXISTS "Active/admin can create invites" ON family_invites;

CREATE POLICY "Active/admin can create invites"
  ON family_invites FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_active_family_ids(auth.uid())));

-- 7. recipe_saves policies
DROP POLICY IF EXISTS "Family members can view saves" ON recipe_saves;
DROP POLICY IF EXISTS "Active/admin can insert saves" ON recipe_saves;
DROP POLICY IF EXISTS "Active/admin can delete saves" ON recipe_saves;

CREATE POLICY "Family members can view saves"
  ON recipe_saves FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids(auth.uid())));

CREATE POLICY "Active/admin can insert saves"
  ON recipe_saves FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_active_family_ids(auth.uid())));

CREATE POLICY "Active/admin can delete saves"
  ON recipe_saves FOR DELETE
  USING (family_id IN (SELECT get_user_active_family_ids(auth.uid())));

-- 8. tags policies
DROP POLICY IF EXISTS "Family members can view tags" ON tags;
DROP POLICY IF EXISTS "Active/admin can insert tags" ON tags;
DROP POLICY IF EXISTS "Active/admin can delete tags" ON tags;

CREATE POLICY "Family members can view tags"
  ON tags FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids(auth.uid())));

CREATE POLICY "Active/admin can insert tags"
  ON tags FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_active_family_ids(auth.uid())));

CREATE POLICY "Active/admin can delete tags"
  ON tags FOR DELETE
  USING (family_id IN (SELECT get_user_active_family_ids(auth.uid())));

-- 9. recipe_tags policies
DROP POLICY IF EXISTS "Family members can view recipe tags" ON recipe_tags;
DROP POLICY IF EXISTS "Active/admin can insert recipe tags" ON recipe_tags;
DROP POLICY IF EXISTS "Active/admin can delete recipe tags" ON recipe_tags;

CREATE POLICY "Family members can view recipe tags"
  ON recipe_tags FOR SELECT
  USING (recipe_id IN (SELECT id FROM recipes WHERE family_id IN (SELECT get_user_family_ids(auth.uid()))));

CREATE POLICY "Active/admin can insert recipe tags"
  ON recipe_tags FOR INSERT
  WITH CHECK (recipe_id IN (SELECT id FROM recipes WHERE family_id IN (SELECT get_user_active_family_ids(auth.uid()))));

CREATE POLICY "Active/admin can delete recipe tags"
  ON recipe_tags FOR DELETE
  USING (recipe_id IN (SELECT id FROM recipes WHERE family_id IN (SELECT get_user_active_family_ids(auth.uid()))));

-- 10. cookbooks policies
DROP POLICY IF EXISTS "Family members can view cookbooks" ON cookbooks;
DROP POLICY IF EXISTS "Active/admin can insert cookbooks" ON cookbooks;
DROP POLICY IF EXISTS "Active/admin can update cookbooks" ON cookbooks;
DROP POLICY IF EXISTS "Active/admin can delete cookbooks" ON cookbooks;

CREATE POLICY "Family members can view cookbooks"
  ON cookbooks FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids(auth.uid())));

CREATE POLICY "Active/admin can insert cookbooks"
  ON cookbooks FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_active_family_ids(auth.uid())));

CREATE POLICY "Active/admin can update cookbooks"
  ON cookbooks FOR UPDATE
  USING (family_id IN (SELECT get_user_active_family_ids(auth.uid())));

CREATE POLICY "Active/admin can delete cookbooks"
  ON cookbooks FOR DELETE
  USING (family_id IN (SELECT get_user_active_family_ids(auth.uid())));

-- 11-24: All remaining tables follow the same pattern
-- cookbook_recipes
DROP POLICY IF EXISTS "Family members can view cookbook recipes" ON cookbook_recipes;
DROP POLICY IF EXISTS "Active/admin can insert cookbook recipes" ON cookbook_recipes;
DROP POLICY IF EXISTS "Active/admin can update cookbook recipes" ON cookbook_recipes;
DROP POLICY IF EXISTS "Active/admin can delete cookbook recipes" ON cookbook_recipes;

CREATE POLICY "Family members can view cookbook recipes" ON cookbook_recipes FOR SELECT
  USING (cookbook_id IN (SELECT id FROM cookbooks WHERE family_id IN (SELECT get_user_family_ids(auth.uid()))));
CREATE POLICY "Active/admin can insert cookbook recipes" ON cookbook_recipes FOR INSERT
  WITH CHECK (cookbook_id IN (SELECT id FROM cookbooks WHERE family_id IN (SELECT get_user_active_family_ids(auth.uid()))));
CREATE POLICY "Active/admin can update cookbook recipes" ON cookbook_recipes FOR UPDATE
  USING (cookbook_id IN (SELECT id FROM cookbooks WHERE family_id IN (SELECT get_user_active_family_ids(auth.uid()))));
CREATE POLICY "Active/admin can delete cookbook recipes" ON cookbook_recipes FOR DELETE
  USING (cookbook_id IN (SELECT id FROM cookbooks WHERE family_id IN (SELECT get_user_active_family_ids(auth.uid()))));

-- audio_memories
DROP POLICY IF EXISTS "Family members can view audio memories" ON audio_memories;
DROP POLICY IF EXISTS "Active/admin can insert audio memories" ON audio_memories;
DROP POLICY IF EXISTS "Active/admin can update audio memories" ON audio_memories;
DROP POLICY IF EXISTS "Active/admin can delete audio memories" ON audio_memories;

CREATE POLICY "Family members can view audio memories" ON audio_memories FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids(auth.uid())));
CREATE POLICY "Active/admin can insert audio memories" ON audio_memories FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_active_family_ids(auth.uid())));
CREATE POLICY "Active/admin can update audio memories" ON audio_memories FOR UPDATE
  USING (family_id IN (SELECT get_user_active_family_ids(auth.uid())));
CREATE POLICY "Active/admin can delete audio memories" ON audio_memories FOR DELETE
  USING (family_id IN (SELECT get_user_active_family_ids(auth.uid())));

-- printable_cookbooks
DROP POLICY IF EXISTS "Family members can view printable cookbooks" ON printable_cookbooks;
DROP POLICY IF EXISTS "Active/admin can insert printable cookbooks" ON printable_cookbooks;
DROP POLICY IF EXISTS "Active/admin can update printable cookbooks" ON printable_cookbooks;
DROP POLICY IF EXISTS "Active/admin can delete printable cookbooks" ON printable_cookbooks;

CREATE POLICY "Family members can view printable cookbooks" ON printable_cookbooks FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids(auth.uid())));
CREATE POLICY "Active/admin can insert printable cookbooks" ON printable_cookbooks FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_active_family_ids(auth.uid())));
CREATE POLICY "Active/admin can update printable cookbooks" ON printable_cookbooks FOR UPDATE
  USING (family_id IN (SELECT get_user_active_family_ids(auth.uid())));
CREATE POLICY "Active/admin can delete printable cookbooks" ON printable_cookbooks FOR DELETE
  USING (family_id IN (SELECT get_user_active_family_ids(auth.uid())));

-- printable_cookbook_pages
DROP POLICY IF EXISTS "Family members can view printable pages" ON printable_cookbook_pages;
DROP POLICY IF EXISTS "Active/admin can insert printable pages" ON printable_cookbook_pages;
DROP POLICY IF EXISTS "Active/admin can update printable pages" ON printable_cookbook_pages;
DROP POLICY IF EXISTS "Active/admin can delete printable pages" ON printable_cookbook_pages;

CREATE POLICY "Family members can view printable pages" ON printable_cookbook_pages FOR SELECT
  USING (cookbook_id IN (SELECT id FROM printable_cookbooks WHERE family_id IN (SELECT get_user_family_ids(auth.uid()))));
CREATE POLICY "Active/admin can insert printable pages" ON printable_cookbook_pages FOR INSERT
  WITH CHECK (cookbook_id IN (SELECT id FROM printable_cookbooks WHERE family_id IN (SELECT get_user_active_family_ids(auth.uid()))));
CREATE POLICY "Active/admin can update printable pages" ON printable_cookbook_pages FOR UPDATE
  USING (cookbook_id IN (SELECT id FROM printable_cookbooks WHERE family_id IN (SELECT get_user_active_family_ids(auth.uid()))));
CREATE POLICY "Active/admin can delete printable pages" ON printable_cookbook_pages FOR DELETE
  USING (cookbook_id IN (SELECT id FROM printable_cookbooks WHERE family_id IN (SELECT get_user_active_family_ids(auth.uid()))));

-- meal_plans
DROP POLICY IF EXISTS "Family members can view meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Active/admin can insert meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Active/admin can update meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Active/admin can delete meal plans" ON meal_plans;

CREATE POLICY "Family members can view meal plans" ON meal_plans FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids(auth.uid())));
CREATE POLICY "Active/admin can insert meal plans" ON meal_plans FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_active_family_ids(auth.uid())));
CREATE POLICY "Active/admin can update meal plans" ON meal_plans FOR UPDATE
  USING (family_id IN (SELECT get_user_active_family_ids(auth.uid())));
CREATE POLICY "Active/admin can delete meal plans" ON meal_plans FOR DELETE
  USING (family_id IN (SELECT get_user_active_family_ids(auth.uid())));

-- meal_plan_items
DROP POLICY IF EXISTS "Family members can view meal plan items" ON meal_plan_items;
DROP POLICY IF EXISTS "Active/admin can insert meal plan items" ON meal_plan_items;
DROP POLICY IF EXISTS "Active/admin can update meal plan items" ON meal_plan_items;
DROP POLICY IF EXISTS "Active/admin can delete meal plan items" ON meal_plan_items;

CREATE POLICY "Family members can view meal plan items" ON meal_plan_items FOR SELECT
  USING (meal_plan_id IN (SELECT id FROM meal_plans WHERE family_id IN (SELECT get_user_family_ids(auth.uid()))));
CREATE POLICY "Active/admin can insert meal plan items" ON meal_plan_items FOR INSERT
  WITH CHECK (meal_plan_id IN (SELECT id FROM meal_plans WHERE family_id IN (SELECT get_user_active_family_ids(auth.uid()))));
CREATE POLICY "Active/admin can update meal plan items" ON meal_plan_items FOR UPDATE
  USING (meal_plan_id IN (SELECT id FROM meal_plans WHERE family_id IN (SELECT get_user_active_family_ids(auth.uid()))));
CREATE POLICY "Active/admin can delete meal plan items" ON meal_plan_items FOR DELETE
  USING (meal_plan_id IN (SELECT id FROM meal_plans WHERE family_id IN (SELECT get_user_active_family_ids(auth.uid()))));

-- shopping_lists
DROP POLICY IF EXISTS "Family members can view shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "Active/admin can insert shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "Active/admin can update shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "Active/admin can delete shopping lists" ON shopping_lists;

CREATE POLICY "Family members can view shopping lists" ON shopping_lists FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids(auth.uid())));
CREATE POLICY "Active/admin can insert shopping lists" ON shopping_lists FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_active_family_ids(auth.uid())));
CREATE POLICY "Active/admin can update shopping lists" ON shopping_lists FOR UPDATE
  USING (family_id IN (SELECT get_user_active_family_ids(auth.uid())));
CREATE POLICY "Active/admin can delete shopping lists" ON shopping_lists FOR DELETE
  USING (family_id IN (SELECT get_user_active_family_ids(auth.uid())));

-- shopping_list_items (viewers CAN update for checking off)
DROP POLICY IF EXISTS "Family members can view shopping list items" ON shopping_list_items;
DROP POLICY IF EXISTS "Active/admin can insert shopping list items" ON shopping_list_items;
DROP POLICY IF EXISTS "Family members can update shopping list items" ON shopping_list_items;
DROP POLICY IF EXISTS "Active/admin can delete shopping list items" ON shopping_list_items;

CREATE POLICY "Family members can view shopping list items" ON shopping_list_items FOR SELECT
  USING (shopping_list_id IN (SELECT id FROM shopping_lists WHERE family_id IN (SELECT get_user_family_ids(auth.uid()))));
CREATE POLICY "Active/admin can insert shopping list items" ON shopping_list_items FOR INSERT
  WITH CHECK (shopping_list_id IN (SELECT id FROM shopping_lists WHERE family_id IN (SELECT get_user_active_family_ids(auth.uid()))));
CREATE POLICY "Family members can update shopping list items" ON shopping_list_items FOR UPDATE
  USING (shopping_list_id IN (SELECT id FROM shopping_lists WHERE family_id IN (SELECT get_user_family_ids(auth.uid()))));
CREATE POLICY "Active/admin can delete shopping list items" ON shopping_list_items FOR DELETE
  USING (shopping_list_id IN (SELECT id FROM shopping_lists WHERE family_id IN (SELECT get_user_active_family_ids(auth.uid()))));

-- user_subscriptions
DROP POLICY IF EXISTS "Family members can view subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can insert subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can update subscription" ON user_subscriptions;

CREATE POLICY "Family members can view subscription" ON user_subscriptions FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids(auth.uid())));
CREATE POLICY "Admins can insert subscription" ON user_subscriptions FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_admin_family_ids(auth.uid())));
CREATE POLICY "Admins can update subscription" ON user_subscriptions FOR UPDATE
  USING (family_id IN (SELECT get_user_admin_family_ids(auth.uid())));

-- usage_tracking
DROP POLICY IF EXISTS "Family members can view usage" ON usage_tracking;
DROP POLICY IF EXISTS "Active/admin can insert usage" ON usage_tracking;
DROP POLICY IF EXISTS "Active/admin can update usage" ON usage_tracking;

CREATE POLICY "Family members can view usage" ON usage_tracking FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids(auth.uid())));
CREATE POLICY "Active/admin can insert usage" ON usage_tracking FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_active_family_ids(auth.uid())));
CREATE POLICY "Active/admin can update usage" ON usage_tracking FOR UPDATE
  USING (family_id IN (SELECT get_user_active_family_ids(auth.uid())));

-- usage_log
DROP POLICY IF EXISTS "Family members can view usage log" ON usage_log;
DROP POLICY IF EXISTS "Active/admin can insert usage log" ON usage_log;

CREATE POLICY "Family members can view usage log" ON usage_log FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids(auth.uid())));
CREATE POLICY "Active/admin can insert usage log" ON usage_log FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_active_family_ids(auth.uid())));

-- print_orders
DROP POLICY IF EXISTS "Family members can view print orders" ON print_orders;
DROP POLICY IF EXISTS "Active/admin can insert print orders" ON print_orders;
DROP POLICY IF EXISTS "Active/admin can update print orders" ON print_orders;

CREATE POLICY "Family members can view print orders" ON print_orders FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids(auth.uid())));
CREATE POLICY "Active/admin can insert print orders" ON print_orders FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_active_family_ids(auth.uid())));
CREATE POLICY "Active/admin can update print orders" ON print_orders FOR UPDATE
  USING (family_id IN (SELECT get_user_active_family_ids(auth.uid())));
