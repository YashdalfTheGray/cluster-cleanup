export class MockAWSClient {
  public constructor(
    private commandLogger: <E extends object>(command: E) => void
  ) {}

  public send<I extends object, O extends object>(command: I): Promise<O> {
    this.commandLogger(command);
    return Promise.resolve({} as O);
  }
}
