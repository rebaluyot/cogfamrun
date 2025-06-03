-- Create storage bucket for registration files if it doesn't exist
insert into storage.buckets (id, name, public) 
values ('registration-files', 'registration-files', true)
on conflict (id) do nothing;

-- Update registrations table to add payment proof URL column
alter table public.registrations 
add column if not exists payment_proof_url text;

-- Create a single policy to allow all operations
drop policy if exists "Allow All" on storage.objects;
create policy "Allow All"
  on storage.objects
  using ( bucket_id = 'registration-files' )
  with check ( bucket_id = 'registration-files' );
