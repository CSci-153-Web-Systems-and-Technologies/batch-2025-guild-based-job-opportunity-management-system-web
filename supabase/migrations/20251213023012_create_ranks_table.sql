CREATE TABLE ranks (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  min_xp INTEGER NOT NULL,
  max_xp INTEGER NOT NULL
);

INSERT INTO ranks (name, min_xp, max_xp)
VALUES
('Beginner', 0, 149),
('Apprentice', 150, 349),
('Journeyman', 350, 599),
('Adept', 600, 999),
('Specialist', 1000, 1499),
('Expert', 1500, 2499),
('Master', 2500, 4999),
('Grandmaster', 5000, 999999);
