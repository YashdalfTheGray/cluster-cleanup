import * as chalk from 'chalk';
import { ClusterCleanup } from '.';
export declare function decorateClusterCleanup(instance: ClusterCleanup, verbose?: boolean): ClusterCleanup;
export declare function generateCliList<T extends Object>(things: T[], color?: chalk.Chalk, stringifier?: (t: T) => string): string;
