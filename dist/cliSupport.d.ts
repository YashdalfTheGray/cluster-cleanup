import * as chalk from 'chalk';
import { Command } from 'commander';
import { ClusterCleanup, ClusterCleanupConfig, KnownCliOptions } from '.';
export declare function setupCliOptions(program: Command): Command;
export declare function buildClientConfigObject(cliOptions: KnownCliOptions): ClusterCleanupConfig;
export declare function decorateClusterCleanup(instance: ClusterCleanup, verbose?: number): ClusterCleanup;
export declare function generateCliList<T extends Object>(things: T[], color?: chalk.Chalk, stringifier?: (t: T) => string): string;
