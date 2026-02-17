-- Add 'sprint_purchase' to subscription_events event_type CHECK constraint
ALTER TABLE subscription_events DROP CONSTRAINT IF EXISTS subscription_events_event_type_check;
ALTER TABLE subscription_events ADD CONSTRAINT subscription_events_event_type_check
  CHECK (event_type IN ('created', 'paid', 'canceled', 'payment_failed', 'reactivated', 'sprint_purchase'));
