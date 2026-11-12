export const SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  position TEXT NOT NULL,
  what_you_tried TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('yes', 'no', 'partly')),
  why TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;
