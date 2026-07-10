
-- Revoke public execute on internal SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_active_subscription(UUID) FROM PUBLIC, anon, authenticated;
-- Storage bucket RLS: users can manage only their own folder inside 'chat-uploads'
CREATE POLICY "Users read own chat uploads" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users insert own chat uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own chat uploads" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
