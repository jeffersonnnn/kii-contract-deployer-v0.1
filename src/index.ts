#!/usr/bin/env node

import { main } from './deploy';
import { logger } from './logger';

main().catch((error: Error) => {
  logger.error("Unhandled error in main:", error);
  process.exit(1);
});
