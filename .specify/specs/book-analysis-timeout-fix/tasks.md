# Tasks: Book Analysis Timeout Fix

- [x] Add sampleEvenly helper and max-chunk limit in book-analyze
- [x] Replace sequential loop with parallel batch processing (5 at a time)
- [x] Add maxDuration = 120 to admin/books page
- [x] Update analysis metadata with chunksAnalyzed/chunksTotal
- [ ] Test: Analyze 111k-word book; verify completion in ~2 min
