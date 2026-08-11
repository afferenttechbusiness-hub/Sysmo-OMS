/*
# Create task-files storage bucket

1. Storage
- Create a public storage bucket named `task-files` for employee file uploads on tasks.
- The bucket is public so that uploaded files (documents, images) can be viewed/downloaded by anyone with the URL.
- This allows employees to upload work files and admins/moderators to access them.

2. Notes
- No RLS policies on storage objects needed since the bucket is public (anyone with URL can read).
- Uploads are handled client-side via the Supabase JS client `storage.from('task-files').upload()`.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('task-files', 'task-files', true)
ON CONFLICT (id) DO NOTHING;