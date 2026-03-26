-- Fix: create_recipe RPC should auto-compute quantity_numeric from quantity text
-- when quantity_numeric is not explicitly provided

-- Helper function to parse quantity text to numeric
CREATE OR REPLACE FUNCTION parse_quantity_to_numeric(qty_text text)
RETURNS decimal
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_text text;
  v_whole decimal;
  v_num decimal;
  v_den decimal;
  v_match text[];
BEGIN
  IF qty_text IS NULL OR trim(qty_text) = '' THEN
    RETURN NULL;
  END IF;

  v_text := trim(qty_text);

  -- Mixed number: "1 1/2", "2 3/4"
  v_match := regexp_match(v_text, '^(\d+)\s+(\d+)/(\d+)$');
  IF v_match IS NOT NULL THEN
    v_whole := v_match[1]::decimal;
    v_num := v_match[2]::decimal;
    v_den := v_match[3]::decimal;
    IF v_den = 0 THEN RETURN NULL; END IF;
    RETURN v_whole + v_num / v_den;
  END IF;

  -- Fraction: "1/2", "3/4"
  v_match := regexp_match(v_text, '^(\d+)/(\d+)$');
  IF v_match IS NOT NULL THEN
    v_num := v_match[1]::decimal;
    v_den := v_match[2]::decimal;
    IF v_den = 0 THEN RETURN NULL; END IF;
    RETURN v_num / v_den;
  END IF;

  -- Integer or decimal: "2", "2.5"
  IF v_text ~ '^\d+\.?\d*$' THEN
    RETURN v_text::decimal;
  END IF;

  RETURN NULL;
END;
$$;

-- Update ALL existing recipe_ingredients that have a quantity but no quantity_numeric
UPDATE recipe_ingredients
SET quantity_numeric = parse_quantity_to_numeric(quantity)
WHERE quantity IS NOT NULL
  AND quantity != ''
  AND quantity_numeric IS NULL;

-- Update create_recipe to auto-compute quantity_numeric
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
  v_qty_text text;
  v_qty_numeric decimal;
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

  -- Insert ingredients
  IF recipe_data->'ingredients' IS NOT NULL AND jsonb_typeof(recipe_data->'ingredients') = 'array' THEN
    FOR v_ingredient IN SELECT * FROM jsonb_array_elements(recipe_data->'ingredients')
    LOOP
      v_ing_name := v_ingredient->>'name';
      v_qty_text := COALESCE(v_ingredient->>'quantity', '');

      -- If ingredient has a name but no quantity, try parsing the full name text
      IF v_ing_name IS NOT NULL AND v_ing_name != '' AND v_qty_text = '' THEN
        v_parsed := parse_ingredient_text(v_ing_name);
        v_ing_name := NULLIF(v_parsed->>'name', '');
        IF v_ing_name IS NULL OR v_ing_name = '' THEN
          v_ing_name := v_ingredient->>'name';
        END IF;
        v_qty_text := COALESCE(v_parsed->>'quantity', '');
      END IF;

      -- Auto-compute quantity_numeric from quantity text if not provided
      v_qty_numeric := (v_ingredient->>'quantity_numeric')::decimal;
      IF v_qty_numeric IS NULL AND v_qty_text != '' THEN
        v_qty_numeric := parse_quantity_to_numeric(v_qty_text);
      END IF;

      -- Look up or create ingredient by name
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
        v_qty_text,
        v_qty_numeric,
        COALESCE(v_ingredient->>'unit', COALESCE(v_parsed->>'unit', '')),
        COALESCE(v_ingredient->>'notes', ''),
        v_idx
      );
      v_idx := v_idx + 1;
    END LOOP;
  END IF;

  -- Insert tags
  IF recipe_data->'tag_ids' IS NOT NULL AND jsonb_typeof(recipe_data->'tag_ids') = 'array' THEN
    INSERT INTO recipe_tags (recipe_id, tag_id)
    SELECT v_recipe_id, (tag_value)::uuid
    FROM jsonb_array_elements_text(recipe_data->'tag_ids') AS tag_value;
  END IF;

  RETURN v_recipe_id;
END;
$$;
