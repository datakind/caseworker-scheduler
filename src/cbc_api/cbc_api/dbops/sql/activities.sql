CREATE TABLE IF NOT EXISTS cbc_schedule.activities (
  userId text,
  id integer,
  caseName text,
  activityType text,
  expectedDuration numeric,
  address text,
  city text,
  state text,
  zipCode text,
  xCoordinate decimal(15,13),
  yCoordinate decimal(15,13),
  completed boolean,
  insert_timestamp timestamp
)
