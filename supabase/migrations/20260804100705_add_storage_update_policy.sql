-- Add UPDATE policies for storage so upsert works for anon users

CREATE POLICY "dept_icons_update_anyone"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'department-icons')
  WITH CHECK (bucket_id = 'department-icons');

CREATE POLICY "task_files_update_anyone"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'task-files')
  WITH CHECK (bucket_id = 'task-files');