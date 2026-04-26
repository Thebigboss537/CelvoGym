// Disable cross-class parallelization in this assembly: every test class uses
// WebApplicationFactory<Program>, and concurrent factories racing on the same
// entry point can fail bootstrap with "The entry point exited without ever
// building an IHost." Tests within a class still run sequentially per xUnit
// defaults; this only forces classes themselves to run one-at-a-time.
[assembly: Xunit.CollectionBehavior(DisableTestParallelization = true)]
