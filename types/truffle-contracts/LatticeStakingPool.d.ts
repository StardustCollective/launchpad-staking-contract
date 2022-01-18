/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import BN from "bn.js";
import { EventData, PastEventOptions } from "web3-eth-contract";

export interface LatticeStakingPoolContract
  extends Truffle.Contract<LatticeStakingPoolInstance> {
  "new"(
    _stakingToken: string,
    meta?: Truffle.TransactionDetails
  ): Promise<LatticeStakingPoolInstance>;
}

export interface Deposit {
  name: "Deposit";
  args: {
    _user: string;
    _projectId: BN;
    _poolId: BN;
    _amount: BN;
    0: string;
    1: BN;
    2: BN;
    3: BN;
  };
}

export interface PoolAdded {
  name: "PoolAdded";
  args: {
    _projectId: BN;
    _poolId: BN;
    0: BN;
    1: BN;
  };
}

export interface ProjectAdded {
  name: "ProjectAdded";
  args: {
    _projectId: BN;
    _projectName: string;
    0: BN;
    1: string;
  };
}

export interface ProjectDisabled {
  name: "ProjectDisabled";
  args: {
    _projectId: BN;
    0: BN;
  };
}

export interface Withdraw {
  name: "Withdraw";
  args: {
    _user: string;
    _projectId: BN;
    _poolId: BN;
    _amount: BN;
    0: string;
    1: BN;
    2: BN;
    3: BN;
  };
}

type AllEvents =
  | Deposit
  | PoolAdded
  | ProjectAdded
  | ProjectDisabled
  | Withdraw;

export interface LatticeStakingPoolInstance extends Truffle.ContractInstance {
  /**
   * ProjectID => Pool ID => User Address => didUserWithdrawFunds
   */
  didUserWithdrawFunds(
    arg0: number | BN | string,
    arg1: number | BN | string,
    arg2: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<boolean>;

  /**
   * ProjectName => isProjectNameTaken
   */
  isProjectNameTaken(
    arg0: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<boolean>;

  /**
   * ProjectID => WhitelistedAddress
   */
  projectIdToWhitelistedAddress(
    arg0: number | BN | string,
    arg1: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<boolean>;

  /**
   * ProjectName => ProjectID
   */
  projectNameToProjectId(
    arg0: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<BN>;

  projects(
    arg0: number | BN | string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<{ 0: string; 1: BN; 2: BN; 3: BN; 4: BN }>;

  /**
   * ProjectID => Pool ID => StakingPool
   */
  stakingPoolInfo(
    arg0: number | BN | string,
    arg1: number | BN | string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<{ 0: BN; 1: BN }>;

  stakingToken(txDetails?: Truffle.TransactionDetails): Promise<string>;

  /**
   * ProjectID => Pool ID => User Address => amountStaked
   */
  userStakedAmount(
    arg0: number | BN | string,
    arg1: number | BN | string,
    arg2: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<BN>;

  addProject: {
    (
      _name: string,
      _startBlock: number | BN | string,
      _endBlock: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      _name: string,
      _startBlock: number | BN | string,
      _endBlock: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      _name: string,
      _startBlock: number | BN | string,
      _endBlock: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      _name: string,
      _startBlock: number | BN | string,
      _endBlock: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  addStakingPool: {
    (
      _projectId: number | BN | string,
      _maxStakingAmountPerUser: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      _projectId: number | BN | string,
      _maxStakingAmountPerUser: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      _projectId: number | BN | string,
      _maxStakingAmountPerUser: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      _projectId: number | BN | string,
      _maxStakingAmountPerUser: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  disableProject: {
    (
      _projectId: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      _projectId: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      _projectId: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      _projectId: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  deposit: {
    (
      _projectId: number | BN | string,
      _poolId: number | BN | string,
      _amount: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      _projectId: number | BN | string,
      _poolId: number | BN | string,
      _amount: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      _projectId: number | BN | string,
      _poolId: number | BN | string,
      _amount: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      _projectId: number | BN | string,
      _poolId: number | BN | string,
      _amount: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  withdraw: {
    (
      _projectId: number | BN | string,
      _poolId: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      _projectId: number | BN | string,
      _poolId: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      _projectId: number | BN | string,
      _poolId: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      _projectId: number | BN | string,
      _poolId: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  whitelistAddresses: {
    (
      _projectId: number | BN | string,
      _newAddressesToWhitelist: string[],
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      _projectId: number | BN | string,
      _newAddressesToWhitelist: string[],
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      _projectId: number | BN | string,
      _newAddressesToWhitelist: string[],
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      _projectId: number | BN | string,
      _newAddressesToWhitelist: string[],
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  getWhitelistedAddressesForProject(
    _projectId: number | BN | string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<string[]>;

  isAddressWhitelisted(
    _projectId: number | BN | string,
    _address: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<boolean>;

  getTotalStakingInfoForProjectPerPool(
    _projectId: number | BN | string,
    _poolId: number | BN | string,
    _pageNumber: number | BN | string,
    _pageSize: number | BN | string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<
    {
      userAddress: string;
      poolId: BN;
      percentageOfTokensStakedInPool: BN;
      amountOfTokensStakedInPool: BN;
    }[]
  >;

  numberOfProjects(txDetails?: Truffle.TransactionDetails): Promise<BN>;

  numberOfPools(
    _projectId: number | BN | string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<BN>;

  getTotalAmountStakedInProject(
    _projectId: number | BN | string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<BN>;

  getTotalAmountStakedInPool(
    _projectId: number | BN | string,
    _poolId: number | BN | string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<BN>;

  getAmountStakedByUserInPool(
    _projectId: number | BN | string,
    _poolId: number | BN | string,
    _address: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<BN>;

  getPercentageAmountStakedByUserInPool(
    _projectId: number | BN | string,
    _poolId: number | BN | string,
    _address: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<BN>;

  methods: {
    /**
     * ProjectID => Pool ID => User Address => didUserWithdrawFunds
     */
    didUserWithdrawFunds(
      arg0: number | BN | string,
      arg1: number | BN | string,
      arg2: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<boolean>;

    /**
     * ProjectName => isProjectNameTaken
     */
    isProjectNameTaken(
      arg0: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<boolean>;

    /**
     * ProjectID => WhitelistedAddress
     */
    projectIdToWhitelistedAddress(
      arg0: number | BN | string,
      arg1: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<boolean>;

    /**
     * ProjectName => ProjectID
     */
    projectNameToProjectId(
      arg0: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<BN>;

    projects(
      arg0: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<{ 0: string; 1: BN; 2: BN; 3: BN; 4: BN }>;

    /**
     * ProjectID => Pool ID => StakingPool
     */
    stakingPoolInfo(
      arg0: number | BN | string,
      arg1: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<{ 0: BN; 1: BN }>;

    stakingToken(txDetails?: Truffle.TransactionDetails): Promise<string>;

    /**
     * ProjectID => Pool ID => User Address => amountStaked
     */
    userStakedAmount(
      arg0: number | BN | string,
      arg1: number | BN | string,
      arg2: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<BN>;

    addProject: {
      (
        _name: string,
        _startBlock: number | BN | string,
        _endBlock: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        _name: string,
        _startBlock: number | BN | string,
        _endBlock: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        _name: string,
        _startBlock: number | BN | string,
        _endBlock: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        _name: string,
        _startBlock: number | BN | string,
        _endBlock: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    addStakingPool: {
      (
        _projectId: number | BN | string,
        _maxStakingAmountPerUser: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        _projectId: number | BN | string,
        _maxStakingAmountPerUser: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        _projectId: number | BN | string,
        _maxStakingAmountPerUser: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        _projectId: number | BN | string,
        _maxStakingAmountPerUser: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    disableProject: {
      (
        _projectId: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        _projectId: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        _projectId: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        _projectId: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    deposit: {
      (
        _projectId: number | BN | string,
        _poolId: number | BN | string,
        _amount: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        _projectId: number | BN | string,
        _poolId: number | BN | string,
        _amount: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        _projectId: number | BN | string,
        _poolId: number | BN | string,
        _amount: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        _projectId: number | BN | string,
        _poolId: number | BN | string,
        _amount: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    withdraw: {
      (
        _projectId: number | BN | string,
        _poolId: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        _projectId: number | BN | string,
        _poolId: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        _projectId: number | BN | string,
        _poolId: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        _projectId: number | BN | string,
        _poolId: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    whitelistAddresses: {
      (
        _projectId: number | BN | string,
        _newAddressesToWhitelist: string[],
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        _projectId: number | BN | string,
        _newAddressesToWhitelist: string[],
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        _projectId: number | BN | string,
        _newAddressesToWhitelist: string[],
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        _projectId: number | BN | string,
        _newAddressesToWhitelist: string[],
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    getWhitelistedAddressesForProject(
      _projectId: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string[]>;

    isAddressWhitelisted(
      _projectId: number | BN | string,
      _address: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<boolean>;

    getTotalStakingInfoForProjectPerPool(
      _projectId: number | BN | string,
      _poolId: number | BN | string,
      _pageNumber: number | BN | string,
      _pageSize: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<
      {
        userAddress: string;
        poolId: BN;
        percentageOfTokensStakedInPool: BN;
        amountOfTokensStakedInPool: BN;
      }[]
    >;

    numberOfProjects(txDetails?: Truffle.TransactionDetails): Promise<BN>;

    numberOfPools(
      _projectId: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<BN>;

    getTotalAmountStakedInProject(
      _projectId: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<BN>;

    getTotalAmountStakedInPool(
      _projectId: number | BN | string,
      _poolId: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<BN>;

    getAmountStakedByUserInPool(
      _projectId: number | BN | string,
      _poolId: number | BN | string,
      _address: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<BN>;

    getPercentageAmountStakedByUserInPool(
      _projectId: number | BN | string,
      _poolId: number | BN | string,
      _address: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<BN>;
  };

  getPastEvents(event: string): Promise<EventData[]>;
  getPastEvents(
    event: string,
    options: PastEventOptions,
    callback: (error: Error, event: EventData) => void
  ): Promise<EventData[]>;
  getPastEvents(event: string, options: PastEventOptions): Promise<EventData[]>;
  getPastEvents(
    event: string,
    callback: (error: Error, event: EventData) => void
  ): Promise<EventData[]>;
}
