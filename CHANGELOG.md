# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

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
