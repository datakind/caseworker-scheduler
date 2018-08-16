CREATE TABLE IF NOT EXISTS cbc_schedule.endpoint (
  userId text,
  endpoint text,
  address text,
  city text,
  state text,
  zipCode text,
  xCoordinate decimal(15,13),
  yCoordinate decimal(15,13),
  insert_timestamp timestamp
)
