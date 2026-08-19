CREATE TABLE conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_session_id VARCHAR(128) NOT NULL,
  brand_id VARCHAR(64) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  turn_count INTEGER NOT NULL DEFAULT 0 CHECK (turn_count >= 0),
  follow_up_count INTEGER NOT NULL DEFAULT 0 CHECK (follow_up_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT conversation_sessions_brand_client_session_unique
    UNIQUE (brand_id, client_session_id)
);

CREATE INDEX conversation_sessions_brand_id_idx
  ON conversation_sessions (brand_id);

CREATE INDEX conversation_sessions_last_activity_at_idx
  ON conversation_sessions (last_activity_at);

CREATE TABLE conversation_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES conversation_sessions (id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL CHECK (turn_number >= 1),
  user_message TEXT NOT NULL,
  ava_response TEXT,
  structured_response JSONB,
  ai_provider VARCHAR(32) NOT NULL,
  ai_model VARCHAR(128),
  response_duration_ms INTEGER CHECK (response_duration_ms IS NULL OR response_duration_ms >= 0),
  request_status VARCHAR(32) NOT NULL,
  error_code VARCHAR(64),
  search_used BOOLEAN NOT NULL DEFAULT false,
  search_intent VARCHAR(64),
  search_status VARCHAR(32),
  search_provider VARCHAR(32),
  search_result_count INTEGER NOT NULL DEFAULT 0 CHECK (search_result_count >= 0),
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT conversation_turns_session_turn_unique UNIQUE (session_id, turn_number)
);

CREATE INDEX conversation_turns_session_id_idx
  ON conversation_turns (session_id);

CREATE INDEX conversation_turns_created_at_idx
  ON conversation_turns (created_at);

CREATE INDEX conversation_turns_request_status_idx
  ON conversation_turns (request_status);
