-- Helper function to parse ingredient text like "1 1/2 cups flour" into
-- separate quantity, unit, and name parts
-- This enables the scaling feature to work with imported recipes

CREATE OR REPLACE FUNCTION parse_ingredient_text(raw_text text)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_text text;
  v_qty text := '';
  v_qty_numeric decimal := null;
  v_unit text := '';
  v_name text := '';
  v_match text[];
  v_units text[] := ARRAY[
    'cups', 'cup', 'tablespoons', 'tablespoon', 'tbsp', 'Tbsp', 'Tablespoons', 'Tablespoon',
    'teaspoons', 'teaspoon', 'tsp', 'Tsp',
    'ounces', 'ounce', 'oz',
    'pounds', 'pound', 'lbs', 'lb',
    'grams', 'gram', 'g',
    'kilograms', 'kilogram', 'kg',
    'milliliters', 'milliliter', 'ml', 'mL',
    'liters', 'liter', 'l', 'L',
    'pinch', 'dash', 'piece', 'pieces',
    'cloves', 'clove', 'slices', 'slice',
    'cans', 'can', 'sticks', 'stick',
    'packages', 'package', 'pkg'
  ];
  v_unit_check text;
  v_remainder text;
BEGIN
  v_text := trim(raw_text);

  -- Try to match: number (with optional fraction) + unit + name
  -- Pattern: "1 1/2 cups flour" or "2 tablespoons sugar" or "1/2 cup butter"

  -- First, extract leading number (integer, fraction, mixed number, or decimal)
  -- Match patterns like: 1, 1/2, 1 1/2, 2.5, 1/3
  IF v_text ~ '^(\d+\s+\d+/\d+)\s+' THEN
    -- Mixed number: "1 1/2 cups flour"
    v_qty := (regexp_match(v_text, '^(\d+\s+\d+/\d+)'))[1];
    v_remainder := trim(substring(v_text from length(v_qty) + 1));
    -- Parse mixed number
    v_qty_numeric := (split_part(v_qty, ' ', 1))::decimal +
                     (split_part(split_part(v_qty, ' ', 2), '/', 1))::decimal /
                     (split_part(split_part(v_qty, ' ', 2), '/', 2))::decimal;
  ELSIF v_text ~ '^(\d+/\d+)\s+' THEN
    -- Fraction: "1/2 cup butter"
    v_qty := (regexp_match(v_text, '^(\d+/\d+)'))[1];
    v_remainder := trim(substring(v_text from length(v_qty) + 1));
    v_qty_numeric := (split_part(v_qty, '/', 1))::decimal / (split_part(v_qty, '/', 2))::decimal;
  ELSIF v_text ~ '^(\d+\.?\d*)\s+' THEN
    -- Integer or decimal: "2 cups" or "2.5 oz"
    v_qty := (regexp_match(v_text, '^(\d+\.?\d*)'))[1];
    v_remainder := trim(substring(v_text from length(v_qty) + 1));
    v_qty_numeric := v_qty::decimal;
  ELSE
    -- No leading number found, return as-is
    RETURN jsonb_build_object('quantity', '', 'quantity_numeric', null, 'unit', '', 'name', v_text);
  END IF;

  -- Now check if the next word is a known unit
  -- Handle parenthetical content after the number: "1 cup (16 Tbsp; 226g) unsalted butter"
  -- Strip the parenthetical first for unit matching
  v_remainder := trim(v_remainder);

  -- Check for unit
  FOREACH v_unit_check IN ARRAY v_units LOOP
    IF v_remainder ~* ('^' || v_unit_check || '(\s|$|\()') THEN
      v_unit := lower(v_unit_check);
      v_name := trim(substring(v_remainder from length(v_unit_check) + 1));
      -- Normalize common units
      IF v_unit IN ('cups', 'cup') THEN v_unit := 'cup';
      ELSIF v_unit IN ('tablespoons', 'tablespoon', 'tbsp') THEN v_unit := 'tbsp';
      ELSIF v_unit IN ('teaspoons', 'teaspoon', 'tsp') THEN v_unit := 'tsp';
      ELSIF v_unit IN ('ounces', 'ounce', 'oz') THEN v_unit := 'oz';
      ELSIF v_unit IN ('pounds', 'pound', 'lbs', 'lb') THEN v_unit := 'lb';
      ELSIF v_unit IN ('grams', 'gram', 'g') THEN v_unit := 'g';
      END IF;

      -- Clean up name: remove leading parenthetical like "(200g)"
      v_name := regexp_replace(v_name, '^\([^)]*\)\s*', '');

      RETURN jsonb_build_object(
        'quantity', v_qty,
        'quantity_numeric', v_qty_numeric,
        'unit', v_unit,
        'name', trim(v_name)
      );
    END IF;
  END LOOP;

  -- No unit found — the rest is the name
  v_name := v_remainder;

  RETURN jsonb_build_object(
    'quantity', v_qty,
    'quantity_numeric', v_qty_numeric,
    'unit', '',
    'name', trim(v_name)
  );
END;
$$;

-- Update create_recipe to parse ingredient text when name contains the full text
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
  v_idx integer := 0;
  v_parsed jsonb;
  v_ing_name text;
  v_ing_id uuid;
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
      v_ing_name := v_ingredient->>'name';

      -- If ingredient has a name but no quantity, parse the full text
      IF v_ing_name IS NOT NULL AND v_ing_name != ''
         AND (v_ingredient->>'quantity' IS NULL OR v_ingredient->>'quantity' = '') THEN
        -- Parse "1 cup (200g) butter" into quantity=1, unit=cup, name=butter
        v_parsed := parse_ingredient_text(v_ing_name);

        -- Look up or create the ingredient by the parsed name
        v_ing_name := v_parsed->>'name';
        IF v_ing_name = '' THEN
          v_ing_name := v_ingredient->>'name'; -- fallback to original
        END IF;
      ELSE
        v_parsed := jsonb_build_object(
          'quantity', COALESCE(v_ingredient->>'quantity', ''),
          'quantity_numeric', (v_ingredient->>'quantity_numeric')::decimal,
          'unit', COALESCE(v_ingredient->>'unit', ''),
          'name', v_ing_name
        );
      END IF;

      -- Look up or create ingredient
      v_ing_id := NULL;
      IF v_ing_name IS NOT NULL AND v_ing_name != '' THEN
        SELECT id INTO v_ing_id FROM ingredients WHERE lower(name) = lower(v_ing_name) LIMIT 1;
        IF v_ing_id IS NULL THEN
          INSERT INTO ingredients (name) VALUES (v_ing_name) RETURNING id INTO v_ing_id;
        END IF;
      END IF;

      INSERT INTO recipe_ingredients (
        recipe_id, ingredient_id, quantity, quantity_numeric, unit, notes, sort_order
      ) VALUES (
        v_recipe_id,
        v_ing_id,
        COALESCE(v_parsed->>'quantity', ''),
        (v_parsed->>'quantity_numeric')::decimal,
        COALESCE(v_parsed->>'unit', ''),
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
