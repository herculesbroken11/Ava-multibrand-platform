ALTER TABLE conversation_turns
  ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS completion_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS total_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS search_duration_ms INTEGER;

ALTER TABLE conversation_turns
  DROP CONSTRAINT IF EXISTS conversation_turns_prompt_tokens_check;
ALTER TABLE conversation_turns
  ADD CONSTRAINT conversation_turns_prompt_tokens_check
  CHECK (prompt_tokens IS NULL OR prompt_tokens >= 0);

ALTER TABLE conversation_turns
  DROP CONSTRAINT IF EXISTS conversation_turns_completion_tokens_check;
ALTER TABLE conversation_turns
  ADD CONSTRAINT conversation_turns_completion_tokens_check
  CHECK (completion_tokens IS NULL OR completion_tokens >= 0);

ALTER TABLE conversation_turns
  DROP CONSTRAINT IF EXISTS conversation_turns_total_tokens_check;
ALTER TABLE conversation_turns
  ADD CONSTRAINT conversation_turns_total_tokens_check
  CHECK (total_tokens IS NULL OR total_tokens >= 0);

ALTER TABLE conversation_turns
  DROP CONSTRAINT IF EXISTS conversation_turns_search_duration_ms_check;
ALTER TABLE conversation_turns
  ADD CONSTRAINT conversation_turns_search_duration_ms_check
  CHECK (search_duration_ms IS NULL OR search_duration_ms >= 0);
