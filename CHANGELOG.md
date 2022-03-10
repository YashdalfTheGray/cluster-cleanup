# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [3.0.0](https://github.com/YashdalfTheGray/cluster-cleanup/tree/v3.0.0) (2022-03-09)

### BREAKING CHANGES

- The `ClusterCleanup` class can take AWS service clients as arguments.
- The `ClusterCleanupEvents` uses standard `on` and `emit` methods with type overloads.
- The `ClusterCleanup::deleteClusterAndResources` function is now async and returns a list of cleaned up resources.
- The `ClusterCleanup::deleteClusterAndResources` function now takes an optional stack name and a verbosity level. Additionally, it takes an options object that you can use to tune the timings.
- Verbosity across the library is now an integer and can range from 0 to 2, inclusive.

### Added

- Added a CLI support script and changed the API to support using a CLI.
- Added a script that supports `npm install --global` executable script.
- Added running under Docker support.
- Updated versions of packages.

## [v2.1.0](https://github.com/YashdalfTheGray/cluster-cleanup/tree/v2.1.0) (2021-09-17)

### Added

- Upgraded to the aws-sdk Javascript version 3 and switched to the new command/send syntax.
- Updated most of the dependencies to the newest versions.

## [v2.0.0](https://github.com/YashdalfTheGray/cluster-cleanup/tree/v2.0.0) (2020-10-27)

### Added

- `cluster-cleanup` no longer suppors Node.js v8, minumum supported version is Node.js v10.

## [v1.1.2](https://github.com/YashdalfTheGray/cluster-cleanup/tree/v1.1.2) (2019-06-07)

### Added

- Updated dependencies to the newest versions
- Updated Typescript version to 3.5.

## [v1.1.1](https://github.com/YashdalfTheGray/cluster-cleanup/tree/v1.1.1) (2018-06-24)

### Added

- Tests to make sure a listener exists for each `ClusterCleanupEvents` event
- Tasks running outside of a service are now stopped before deleting the cluster

### Fixed

- [#1](https://github.com/YashdalfTheGray/cluster-cleanup/issues/1) - Clusters with `awsvpc` tasks deletes properly now

## [v1.0.0](https://github.com/YashdalfTheGray/cluster-cleanup/tree/v1.0.0) (2018-06-10)

First release of the `cluster-cleanup`
