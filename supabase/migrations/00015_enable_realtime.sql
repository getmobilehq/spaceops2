-- Enable Supabase Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE room_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE deficiencies;
