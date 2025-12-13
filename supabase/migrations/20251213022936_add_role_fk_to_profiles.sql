ALTER TABLE profiles
ADD COLUMN role_id BIGINT REFERENCES roles(id) DEFAULT 1;

UPDATE profiles SET role_id = 1 WHERE role_id IS NULL;
