-- Allow anyone (anon + authenticated) to upload, read, and delete objects
-- in the task-files and department-icons public storage buckets.

-- task-files: INSERT
CREATE POLICY "task_files_upload_anyone"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'task-files');

-- task-files: SELECT (read/download)
CREATE POLICY "task_files_read_anyone"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'task-files');

-- task-files: DELETE
CREATE POLICY "task_files_delete_anyone"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'task-files');

-- department-icons: INSERT
CREATE POLICY "dept_icons_upload_anyone"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'department-icons');

-- department-icons: SELECT (read/download)
CREATE POLICY "dept_icons_read_anyone"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'department-icons');

-- department-icons: DELETE
CREATE POLICY "dept_icons_delete_anyone"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'department-icons');