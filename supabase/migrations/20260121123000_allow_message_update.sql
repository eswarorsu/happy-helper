-- Allow users to update messages if they are part of the chat request
create policy "Allow update for chat participants"
on "public"."messages"
as permissive
for update
to public
using (
  auth.uid() in (
    select founder_id from chat_requests where id = chat_request_id
    union
    select investor_id from chat_requests where id = chat_request_id
  )
)
with check (
  auth.uid() in (
    select founder_id from chat_requests where id = chat_request_id
    union
    select investor_id from chat_requests where id = chat_request_id
  )
);
