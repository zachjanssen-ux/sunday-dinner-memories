-- Update create_recipe to resolve ingredient names into ingredient_id values.
-- When a "name" field is provided but no "ingredient_id", look up or create the ingredient.
DROP FUNCTION IF EXISTS create_recipe(jsonb);

CREATE OR REPLACE FUNCTION create_recipe(recipe_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipe_id uuid;
  v_ingredient jsonb;
  v_ingredient_id uuid;
  v_ingredient_name text;
  v_idx integer := 0;
BEGIN
  -- Insert the recipe
  INSERT INTO recipes (
    family_id, contributed_by, original_cook_id, title, description,
    category, cuisine, difficulty, dietary_labels,
    prep_time_min, cook_time_min, servings, instructions, notes,
    source, source_url, original_image_url, scan_status
  ) VALUES (
    (recipe_data->>'family_id')::uuid,
    (recipe_data->>'contributed_by')::uuid,
    NULLIF(recipe_data->>'original_cook_id', '')::uuid,
    recipe_data->>'title',
    recipe_data->>'description',
    recipe_data->>'category',
    recipe_data->>'cuisine',
    recipe_data->>'difficulty',
    CASE WHEN recipe_data->'dietary_labels' IS NOT NULL AND jsonb_typeof(recipe_data->'dietary_labels') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(recipe_data->'dietary_labels'))
      ELSE NULL END,
    (recipe_data->>'prep_time_min')::integer,
    (recipe_data->>'cook_time_min')::integer,
    (recipe_data->>'servings')::integer,
    recipe_data->'instructions',
    recipe_data->>'notes',
    COALESCE(recipe_data->>'source', 'manual'),
    recipe_data->>'source_url',
    recipe_data->>'original_image_url',
    recipe_data->>'scan_status'
  )
  RETURNING id INTO v_recipe_id;

  -- Insert ingredients if provided
  IF recipe_data->'ingredients' IS NOT NULL AND jsonb_typeof(recipe_data->'ingredients') = 'array' THEN
    FOR v_ingredient IN SELECT * FROM jsonb_array_elements(recipe_data->'ingredients')
    LOOP
      -- Resolve ingredient_id: use provided ID, or look up / create by name
      v_ingredient_id := NULLIF(v_ingredient->>'ingredient_id', '')::uuid;
      v_ingredient_name := NULLIF(TRIM(v_ingredient->>'name'), '');

      IF v_ingredient_id IS NULL AND v_ingredient_name IS NOT NULL THEN
        -- Try to find existing ingredient by name (case-insensitive)
        SELECT id INTO v_ingredient_id
        FROM ingredients
        WHERE LOWER(name) = LOWER(v_ingredient_name)
        LIMIT 1;

        -- If not found, create it
        IF v_ingredient_id IS NULL THEN
          INSERT INTO ingredients (name) VALUES (v_ingredient_name)
          RETURNING id INTO v_ingredient_id;
        END IF;
      END IF;

      INSERT INTO recipe_ingredients (
        recipe_id, ingredient_id, quantity, quantity_numeric, unit, notes, sort_order
      ) VALUES (
        v_recipe_id,
        v_ingredient_id,
        COALESCE(v_ingredient->>'quantity', ''),
        (v_ingredient->>'quantity_numeric')::decimal,
        COALESCE(v_ingredient->>'unit', ''),
        COALESCE(v_ingredient->>'notes', ''),
        v_idx
      );
      v_idx := v_idx + 1;
    END LOOP;
  END IF;

  -- Insert tags if provided
  IF recipe_data->'tag_ids' IS NOT NULL AND jsonb_typeof(recipe_data->'tag_ids') = 'array' THEN
    INSERT INTO recipe_tags (recipe_id, tag_id)
    SELECT v_recipe_id, (tag_value)::uuid
    FROM jsonb_array_elements_text(recipe_data->'tag_ids') AS tag_value;
  END IF;

  RETURN v_recipe_id;
END;
$$;
