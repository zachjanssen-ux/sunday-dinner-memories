-- Server-side function to create a recipe, bypassing RLS SELECT issues
-- after INSERT. Returns the new recipe ID.
CREATE OR REPLACE FUNCTION create_recipe(
  p_family_id uuid,
  p_contributed_by uuid,
  p_original_cook_id uuid,
  p_title text,
  p_description text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_cuisine text DEFAULT NULL,
  p_difficulty text DEFAULT NULL,
  p_dietary_labels text[] DEFAULT NULL,
  p_prep_time_min integer DEFAULT NULL,
  p_cook_time_min integer DEFAULT NULL,
  p_servings integer DEFAULT NULL,
  p_instructions jsonb DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_source text DEFAULT 'manual',
  p_source_url text DEFAULT NULL,
  p_original_image_url text DEFAULT NULL,
  p_scan_status text DEFAULT NULL,
  p_blog_content jsonb DEFAULT NULL,
  p_is_public boolean DEFAULT false,
  p_public_slug text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipe_id uuid;
BEGIN
  INSERT INTO recipes (
    family_id, contributed_by, original_cook_id, title, description,
    category, cuisine, difficulty, dietary_labels,
    prep_time_min, cook_time_min, servings, instructions, notes,
    source, source_url, original_image_url, scan_status,
    blog_content, is_public, public_slug
  ) VALUES (
    p_family_id, p_contributed_by, p_original_cook_id, p_title, p_description,
    p_category, p_cuisine, p_difficulty, p_dietary_labels,
    p_prep_time_min, p_cook_time_min, p_servings, p_instructions, p_notes,
    p_source, p_source_url, p_original_image_url, p_scan_status,
    p_blog_content, p_is_public, p_public_slug
  )
  RETURNING id INTO v_recipe_id;

  RETURN v_recipe_id;
END;
$$;

-- Also add a direct SELECT policy for recipes so users can see their family's recipes
-- This helps after INSERT when we need to fetch the new recipe
CREATE POLICY "Users can view recipes in their family directly"
  ON recipes FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
    OR is_public = true
  );
