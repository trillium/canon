# Module: Migration Allocator

## Check

- [ ] `scripts/next-migration.sh` exists and is executable
- [ ] Script supports `--reserve "description"` flag for atomic reservation
- [ ] Script uses `flock` on a shared lock file for atomicity
- [ ] Script computes max migration number from: current worktree, main worktree, and shared reservations
- [ ] Reservation file tracks agent ID, timestamp, and description per entry
- [ ] Script creates placeholder `.sql` file in `supabase/migrations/` on reserve
- [ ] Lock file path is `.git/migration-reservations.lock`
- [ ] Reservation log path is `.git/migration-reservations`
- [ ] Script prints the next available number when called without flags
- [ ] Script is compatible with parallel worktree setups (resolves main worktree path)

## Apply

1. Copy `next-migration.sh` from this module to `scripts/next-migration.sh`
2. Run `chmod +x scripts/next-migration.sh`
3. Verify `supabase/migrations/` directory exists (create if not)
4. Test: `scripts/next-migration.sh` should print the next migration number
5. Test: `scripts/next-migration.sh --reserve "test"` should create a placeholder file and log the reservation

### Orchestration pattern for parallel agents

```bash
# Reserve numbers before dispatching agents to avoid collisions
NUM_A=$(scripts/next-migration.sh --reserve "add_users_index")
NUM_B=$(scripts/next-migration.sh --reserve "add_posts_table")
# Dispatch agent A with NUM_A, agent B with NUM_B
```

## Conflicts

- If project does not use Supabase migrations, adjust the migration directory path in the script
- If project uses a migration tool other than raw SQL files (e.g., Drizzle, Prisma), the placeholder creation may need adaptation but the number allocation logic still applies
- On macOS, `flock` is not available by default — the script includes a fallback using `mkdir`-based locking
