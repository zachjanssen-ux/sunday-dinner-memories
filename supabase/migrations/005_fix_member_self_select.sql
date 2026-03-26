-- Add a direct policy so users can always see their OWN family_members row
-- This bypasses the get_user_family_ids function for the self-lookup case
-- which is the most common query (fetchMember on login)
CREATE POLICY "Users can view their own member record"
  ON family_members FOR SELECT
  USING (user_id = auth.uid());

-- Also add a direct self-view policy on families
-- so users can see their family after the member lookup succeeds
CREATE POLICY "Users can view family they belong to directly"
  ON families FOR SELECT
  USING (
    id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );
