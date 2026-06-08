-- ==============================================================================
-- Sherlock — Seed Incidents Dataset (Past 6 Months)
-- Simulated production incident logs to seed the Microsoft Fabric semantic model.
-- Demonstrates MTTR reduction over time from 3.4h down to 0.78h.
-- ==============================================================================

-- Ensure table structure matches schema.sql
INSERT INTO incidents (service_name, severity, trigger_type, root_cause, confidence, status, affected_services, created_at, resolved_at) VALUES
('auth-service', 'high', 'github_actions', '{"category": "dependency_mismatch", "detail": "jsonwebtoken major version bump 8.5.1 -> 9.0.0 uses deprecated signature"}', 0.91, 'resolved', ARRAY['auth-service', 'api-gateway', 'payment-service'], NOW() - INTERVAL '1 hour', NOW()) ,
('api-gateway', 'high', 'datadog_alert', '{"category": "memory_leak", "detail": "Node heap limit exceeded due to unclosed socket connections under load"}', 0.84, 'resolved', ARRAY['api-gateway', 'user-service'], NOW() - INTERVAL '2 days' - INTERVAL '4 hours', NOW() - INTERVAL '2 days' - INTERVAL '3 hours'),
('payment-service', 'critical', 'pagerduty_alert', '{"category": "database_drift", "detail": "Missing schema index on transaction_id causing connection pool starvation"}', 0.95, 'resolved', ARRAY['payment-service'], NOW() - INTERVAL '12 days' - INTERVAL '5 hours', NOW() - INTERVAL '12 days' - INTERVAL '4 hours'),
('auth-service', 'high', 'ci_failure', '{"category": "signature_drift", "detail": "jsonwebtoken API drift after sub-dependency auto-update"}', 0.88, 'resolved', ARRAY['auth-service', 'api-gateway'], NOW() - INTERVAL '52 days' - INTERVAL '1 hour', NOW() - INTERVAL '52 days' - INTERVAL '52 minutes'),
('user-service', 'medium', 'datadog_alert', '{"category": "rate_limit", "detail": "M365 Work IQ API rate limiting due to missing caching header"}', 0.76, 'resolved', ARRAY['user-service'], NOW() - INTERVAL '60 days' - INTERVAL '2 hours', NOW() - INTERVAL '60 days' - INTERVAL '1 hour'),

-- Historical incidents (Before Sherlock deployment: MTTR averages 3.4 hours)
('payment-service', 'critical', 'pagerduty_alert', '{"category": "database_drift", "detail": "Lock contention on ledger table due to unindexed foreign keys"}', 0.45, 'resolved', ARRAY['payment-service'], NOW() - INTERVAL '160 days' - INTERVAL '4 hours', NOW() - INTERVAL '160 days'),
('api-gateway', 'high', 'datadog_alert', '{"category": "config_error", "detail": "Corrupt nginx.conf syntax on auto-deploy reload"}', 0.55, 'resolved', ARRAY['api-gateway', 'auth-service', 'user-service'], NOW() - INTERVAL '150 days' - INTERVAL '6 hours', NOW() - INTERVAL '150 days' - INTERVAL '2 hours'),
('auth-service', 'high', 'datadog_alert', '{"category": "dependency_mismatch", "detail": "Token validation mismatch on local sessions store"}', 0.38, 'resolved', ARRAY['auth-service'], NOW() - INTERVAL '140 days' - INTERVAL '5 hours', NOW() - INTERVAL '140 days' - INTERVAL '1 hour'),
('data-service', 'medium', 'datadog_alert', '{"category": "io_saturation", "detail": "Disk IOPS limit reached on Azure Postgres read replica"}', 0.61, 'resolved', ARRAY['data-service'], NOW() - INTERVAL '130 days' - INTERVAL '3 hours', NOW() - INTERVAL '130 days'),
('notification-service', 'low', 'manual_trigger', '{"category": "queue_backlog", "detail": "RabbitMQ dead letter queue overflow due to malformed payload"}', 0.70, 'resolved', ARRAY['notification-service'], NOW() - INTERVAL '120 days' - INTERVAL '8 hours', NOW() - INTERVAL '120 days' - INTERVAL '5 hours'),
('payment-service', 'critical', 'pagerduty_alert', '{"category": "network_partition", "detail": "Stripe sandbox API DNS resolution timeout"}', 0.40, 'resolved', ARRAY['payment-service'], NOW() - INTERVAL '110 days' - INTERVAL '4 hours', NOW() - INTERVAL '110 days' - INTERVAL '1 hour'),
('user-service', 'high', 'datadog_alert', '{"category": "out_of_memory", "detail": "Node process OOM on processing profile image attachments"}', 0.50, 'resolved', ARRAY['user-service'], NOW() - INTERVAL '100 days' - INTERVAL '5 hours', NOW() - INTERVAL '100 days' - INTERVAL '2 hours'),
('api-gateway', 'high', 'pagerduty_alert', '{"category": "certificate_expiry", "detail": "SSL certificate expired on wildcard gateway domain"}', 0.35, 'resolved', ARRAY['api-gateway'], NOW() - INTERVAL '90 days' - INTERVAL '7 hours', NOW() - INTERVAL '90 days' - INTERVAL '3 hours'),

-- Seed service metrics for Watch Mode anomaly checks
INSERT INTO service_metrics (service_name, metric_name, value, baseline_value, anomaly_score) VALUES
('auth-service', 'response_time_ms', 109.0, 82.0, 1.84),
('api-gateway', 'error_rate_pct', 0.31, 0.12, 1.58),
('payment-service', 'response_time_ms', 45.0, 44.2, 0.05),
('user-service', 'cpu_usage_pct', 78.5, 45.0, 0.98),
('notification-service', 'queue_depth', 12.0, 8.5, 0.22);
