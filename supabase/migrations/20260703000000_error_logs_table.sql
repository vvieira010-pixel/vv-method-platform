CREATE TABLE IF NOT EXISTS error_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message text NOT NULL,
  source text DEFAULT '',
  stack text DEFAULT '',
  url text DEFAULT '',
  user_agent text DEFAULT '',
  auth_uid text DEFAULT '',
  role text DEFAULT '',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can read error logs"
  ON error_logs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM teacher_settings WHERE teacher_id = auth.uid()));

CREATE POLICY "Authenticated users can insert error logs"
  ON error_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
