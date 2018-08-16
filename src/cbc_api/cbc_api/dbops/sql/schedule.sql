CREATE TABLE IF NOT EXISTS cbc_schedule.schedule (
  userId text,
  orderedActivities json,
  distanceMatrix json,
  days json,
  dayMap json,
  scheduleStart json,
  scheduleEnd json,
  insert_timestamp timestamp
);
