CREATE OR REPLACE FUNCTION update_user_rank()
RETURNS TRIGGER AS $$
BEGIN
  SELECT id INTO NEW.current_rank_id
  FROM ranks
  WHERE NEW.xp BETWEEN min_xp AND max_xp
  LIMIT 1;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_rank
BEFORE INSERT OR UPDATE ON user_stats
FOR EACH ROW
EXECUTE FUNCTION update_user_rank();
