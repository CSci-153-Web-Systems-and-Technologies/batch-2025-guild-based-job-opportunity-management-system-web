CREATE TABLE roles (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

INSERT INTO roles (name, description)
VALUES ('student', 'Default role for all users'),
       ('admin', 'Administrative access');
