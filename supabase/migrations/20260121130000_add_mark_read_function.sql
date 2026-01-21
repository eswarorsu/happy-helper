-- Create a function to mark messages as read securely (bypassing RLS)
-- This function is SECURITY DEFINER, meaning it runs with the privileges of the creator (postgres/admin)
-- It updates all unread messages in a chat request where the sender is NOT the current user

create or replace function mark_messages_as_read(p_chat_request_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.messages
  set is_read = true
  where chat_request_id = p_chat_request_id
  and sender_id != auth.uid()
  and is_read = false;
end;
$$;
