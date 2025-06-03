-- Enable row level security for storage.objects
alter table storage.objects enable row level security;

-- Create a policy to allow public reads
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'registration-files' );

-- Create a policy to allow anyone to upload files
create policy "Allow Uploads"
  on storage.objects for insert
  with check ( 
    bucket_id = 'registration-files' 
    and (storage.extension(name) = 'jpg' 
      or storage.extension(name) = 'jpeg'
      or storage.extension(name) = 'png'
      or storage.extension(name) = 'webp')
    and length(name) < 255
);

-- Create a policy to allow updates to own files
create policy "Allow Updates"
  on storage.objects for update
  using ( bucket_id = 'registration-files' )
  with check ( bucket_id = 'registration-files' );

-- Create a policy to allow file deletion
create policy "Allow Deletes"
  on storage.objects for delete
  using ( bucket_id = 'registration-files' );
