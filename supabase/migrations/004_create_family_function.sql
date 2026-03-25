-- Create a server-side function to create a family + add the creator as admin
-- This bypasses RLS issues with INSERT → SELECT chains
CREATE OR REPLACE FUNCTION create_family_with_admin(
  p_family_name text,
  p_invite_code text,
  p_viewer_share_token text,
  p_user_id uuid,
  p_display_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_id uuid;
  v_member_id uuid;
BEGIN
  -- Create the family
  INSERT INTO families (name, invite_code, viewer_share_token)
  VALUES (p_family_name, p_invite_code, p_viewer_share_token)
  RETURNING id INTO v_family_id;

  -- Add the user as admin
  INSERT INTO family_members (family_id, user_id, display_name, role)
  VALUES (v_family_id, p_user_id, p_display_name, 'admin')
  RETURNING id INTO v_member_id;

  -- Return the results
  RETURN json_build_object(
    'family_id', v_family_id,
    'member_id', v_member_id,
    'family_name', p_family_name,
    'invite_code', p_invite_code,
    'viewer_share_token', p_viewer_share_token
  );
END;
$$;
