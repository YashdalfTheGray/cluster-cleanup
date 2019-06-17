# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

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
