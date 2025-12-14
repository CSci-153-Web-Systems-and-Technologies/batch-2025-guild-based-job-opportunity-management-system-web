CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  current_rank_id BIGINT REFERENCES ranks(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
