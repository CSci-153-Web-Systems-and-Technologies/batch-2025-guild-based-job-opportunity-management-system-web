ALTER TABLE parties
  ADD COLUMN category TEXT,
  ADD COLUMN min_rank_id BIGINT REFERENCES ranks(id);

CREATE INDEX IF NOT EXISTS idx_parties_min_rank_id ON parties(min_rank_id);
