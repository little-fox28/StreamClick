-- Initialize PostgreSQL Speed Layer / Serving Tables
CREATE TABLE IF NOT EXISTS realtime_event_stats (
    event_type VARCHAR(50) NOT NULL,
    window_start TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    window_end TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    event_count BIGINT DEFAULT 0,
    unique_users BIGINT DEFAULT 0,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_type, window_start, window_end)
);

CREATE TABLE IF NOT EXISTS realtime_product_views (
    product_id VARCHAR(100) NOT NULL,
    view_count BIGINT DEFAULT 0,
    last_viewed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id)
);
