# Search Integration Tests

This folder contains integration tests for the search functionality using a real local Supabase instance.

## Test Files

- `search.service.test.ts` - Main search service integration tests covering:
  - Fuzzy text search
  - Tag filtering (OR, AND, NOT operators)
  - Community filtering
  - Combined filters
  - Pagination
  - Sorting (relevance vs time)

## Running Tests

The search tests automatically manage the Supabase lifecycle:

```bash
npm run test:search
```

This command will:
1. **Start Supabase** if it's not already running
2. **Run the tests** against the local Supabase instance
3. **Stop Supabase** after tests complete (only if it wasn't already running)

### Manual Testing

If you prefer to manage Supabase manually:

```bash
# Start Supabase
npx supabase start

# Run tests only (without lifecycle management)
npm run test:search:run

# Stop Supabase when done
npx supabase stop
```

## Test Data

Tests use fixed UUIDs defined in `TEST_UUIDS` constant:
- Users, Communities, Tags, and Posts with predictable IDs
- Data is inserted at test startup and persists in the local Supabase instance
- No automatic teardown (data remains for inspection/debugging)

## Local Supabase Configuration

- **URL**: `http://127.0.0.1:54321`
- **Service Role Key**: Standard local development key
- All test data uses UUIDs in the format `00000000-0000-0000-XXXX-YYYYYYYYYYYY`

## Troubleshooting

If tests fail:

1. Check if Supabase is running: `npx supabase status`
2. Check logs: `npx supabase logs`
3. Reset local DB: `npx supabase db reset`
4. Verify migrations are applied: `npx supabase db diff`

## Test Results

All 21 tests should pass:
- ✓ 2 basic fuzzy search tests
- ✓ 2 empty query tests
- ✓ 2 OR tag filtering tests
- ✓ 2 AND tag filtering tests
- ✓ 2 NOT tag filtering tests
- ✓ 2 combined tag filters tests
- ✓ 2 community filtering tests
- ✓ 2 community + tags combination tests
- ✓ 2 pagination tests
- ✓ 3 sorting tests
