declare var debug: Function;

declare namespace Truffle {
  interface Deployer {
    link(
      library: Truffle.Contract<any>,
      destination: Truffle.Contract<any>
    ): Deployer;
    link(
      library: Truffle.Contract<any>,
      destinations: Array<Truffle.Contract<any>>
    ): Deployer;
    deploy<T extends any[]>(c: ContractNew<T>, ...args: T): Promise<any>;
  }
}
