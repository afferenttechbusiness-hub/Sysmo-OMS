/*
# Add icon_url to departments + create department-icons storage bucket

1. Schema
- Add `icon_url` text column to `departments` (nullable) for custom uploaded icons.

2. Storage
- Create a public storage bucket named `department-icons` for custom department icon uploads.
*/

ALTER TABLE departments ADD COLUMN IF NOT EXISTS icon_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('department-icons', 'department-icons', true)
ON CONFLICT (id) DO NOTHING;