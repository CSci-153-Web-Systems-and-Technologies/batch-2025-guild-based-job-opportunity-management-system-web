CREATE TABLE ranks (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  min_xp INTEGER NOT NULL,
  max_xp INTEGER NOT NULL
);

INSERT INTO ranks (name, min_xp, max_xp)
VALUES
('Beginner', 0, 149),
('Apprentice', 150, 499),
('Specialist', 500, 999),
('Expert', 1000, 1749),
('Master', 1750, 2499),
('Grandmaster', 2500, 999999);

