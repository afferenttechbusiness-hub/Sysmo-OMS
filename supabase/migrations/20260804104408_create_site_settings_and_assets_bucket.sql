-- Site-wide settings (logo, org name, etc.)
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_select_all" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "site_settings_insert_all" ON site_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "site_settings_update_all" ON site_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "site_settings_delete_all" ON site_settings FOR DELETE
  TO anon, authenticated USING (true);

-- Public bucket for site-wide assets (logo, favicon, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "site_assets_upload_anyone"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'site-assets');

CREATE POLICY "site_assets_read_anyone"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'site-assets');

CREATE POLICY "site_assets_update_anyone"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'site-assets')
  WITH CHECK (bucket_id = 'site-assets');

CREATE POLICY "site_assets_delete_anyone"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'site-assets');

-- Seed default settings
INSERT INTO site_settings (key, value) VALUES
  ('logo', '{"url": null}'::jsonb),
  ('branding', '{"name": "Sysmobyte", "subtitle": "OMS Platform"}'::jsonb)
ON CONFLICT (key) DO NOTHING;