-- Add direct policies for recipe_ingredients so authenticated users
-- can read ingredients for recipes in their family
-- The existing policy uses nested subqueries that may hang or fail

CREATE POLICY "Users can view ingredients for their family recipes"
  ON recipe_ingredients FOR SELECT
  USING (
    recipe_id IN (
      SELECT r.id FROM recipes r
      WHERE r.family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      )
      OR r.is_public = true
    )
  );

-- Also add a direct INSERT policy
CREATE POLICY "Users can insert ingredients for their recipes"
  ON recipe_ingredients FOR INSERT
  WITH CHECK (
    recipe_id IN (
      SELECT r.id FROM recipes r
      WHERE r.family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      )
    )
  );

-- Add direct policy on ingredients table for anon/authenticated reads
CREATE POLICY "Authenticated can view all ingredients"
  ON ingredients FOR SELECT
  USING (true);
