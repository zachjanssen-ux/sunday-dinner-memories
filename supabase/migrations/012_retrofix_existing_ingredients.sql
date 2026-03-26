-- Retroactively parse all existing ingredients that have null quantity_numeric
-- This fixes recipes imported before the ingredient parser was deployed

DO $$
DECLARE
  v_row RECORD;
  v_parsed jsonb;
  v_new_name text;
  v_new_ing_id uuid;
BEGIN
  -- Find all recipe_ingredients where quantity is empty and ingredient has a name with numbers
  FOR v_row IN
    SELECT ri.id, ri.ingredient_id, i.name AS ing_name
    FROM recipe_ingredients ri
    LEFT JOIN ingredients i ON ri.ingredient_id = i.id
    WHERE ri.quantity_numeric IS NULL
      AND i.name IS NOT NULL
      AND i.name ~ '^\d'  -- starts with a digit
  LOOP
    -- Parse the ingredient text
    v_parsed := parse_ingredient_text(v_row.ing_name);
    v_new_name := v_parsed->>'name';

    -- Skip if parsing didn't extract a name
    IF v_new_name IS NULL OR v_new_name = '' THEN
      CONTINUE;
    END IF;

    -- Look up or create the clean ingredient name
    SELECT id INTO v_new_ing_id FROM ingredients WHERE lower(name) = lower(v_new_name) LIMIT 1;
    IF v_new_ing_id IS NULL THEN
      INSERT INTO ingredients (name) VALUES (v_new_name) RETURNING id INTO v_new_ing_id;
    END IF;

    -- Update the recipe_ingredient with parsed data
    UPDATE recipe_ingredients
    SET
      ingredient_id = v_new_ing_id,
      quantity = COALESCE(v_parsed->>'quantity', ''),
      quantity_numeric = (v_parsed->>'quantity_numeric')::decimal,
      unit = COALESCE(v_parsed->>'unit', '')
    WHERE id = v_row.id;
  END LOOP;
END $$;
