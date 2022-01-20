import { DateTime } from "luxon";

import {
  LatticeStakingPoolContract,
  LatticeStakingPoolInstance,
  LatticeTokenContract,
  LatticeTokenInstance,
} from "../types/truffle-contracts";

declare global {
  var LatticeToken: LatticeTokenContract;
  var LatticeStakingPool: LatticeStakingPoolContract;
  var ltxContract: LatticeTokenInstance;
  var stakingContract: LatticeStakingPoolInstance;
  var accounts: Truffle.Accounts;
}

let web3: Web3;
let ltxContract: LatticeTokenInstance;
let stakingContract: LatticeStakingPoolInstance;
let accounts: Truffle.Accounts;

export const initializeEnv = async (g: typeof globalThis) => {
  web3 = (g as any).web3;

  ltxContract = await g.LatticeToken.deployed();
  stakingContract = await g.LatticeStakingPool.deployed();
  accounts = await web3.eth.getAccounts();

  g.ltxContract = ltxContract;
  g.stakingContract = stakingContract;
  g.accounts = accounts;
};

export const epochFromDateTime = (datetime: DateTime) =>
  Math.floor(datetime.toMillis() / 1000);

export const getProject = async (projectId: number) => {
  const response = (await stakingContract.projects(projectId)) as any;

  return {
    name: response.name,
    totalAmountStaked: (response.totalAmountStaked as BN).toNumber(),
    numberOfPools: (response.numberOfPools as BN).toNumber(),
    startTimestamp: DateTime.fromMillis(
      (response.startTimestamp as BN).toNumber() * 1000
    ),
    endTimestamp: DateTime.fromMillis(
      (response.endTimestamp as BN).toNumber() * 1000
    ),
  };
};

export const createProject = async (
  name: string,
  start: DateTime,
  end: DateTime
) => {
  const trxResponse = await stakingContract.addProject(
    name,
    epochFromDateTime(start),
    epochFromDateTime(end),
    {
      from: accounts[0],
    }
  );

  const projectId = (await stakingContract.numberOfProjects()).toNumber() - 1;

  return {
    trxResponse,
    response: await getProject(projectId),
  };
};

export const getStakingPool = async (projectId: number, poolId: number) => {
  const response = (await stakingContract.stakingPoolInfo(
    projectId,
    poolId
  )) as any;

  return {
    maxStakingAmountPerUser: (
      response.maxStakingAmountPerUser as BN
    ).toNumber(),
    totalAmountStaked: (response.totalAmountStaked as BN).toNumber(),
  };
};

export const createStakingPool = async (
  projectId: number,
  maxStakingAmountPerUser: number
) => {
  const trxResponse = await stakingContract.addStakingPool(
    projectId,
    maxStakingAmountPerUser,
    {
      from: accounts[0],
    }
  );

  const poolId =
    (await stakingContract.numberOfPools(projectId)).toNumber() - 1;

  return {
    trxResponse,
    response: await getStakingPool(projectId, poolId),
  };
};

export const makeDeposit = async (
  projectId: number,
  poolId: number,
  amount: number,
  from: string
) => {
  await stakingContract.deposit(projectId, poolId, amount, {
    from,
  });

  const userStakedAmount = (
    await stakingContract.userStakedAmount(projectId, poolId, from)
  ).toNumber();

  const project = await getProject(projectId);
  const pool = await getStakingPool(projectId, poolId);

  return {
    userStakedAmount,
    project,
    pool,
  };
};

export const setChainTimestamp = async (timestamp: DateTime) => {
  return await new Promise((rs, rj) => {
    if (
      typeof web3.currentProvider === "object" &&
      web3.currentProvider !== null &&
      web3.currentProvider.send !== undefined
    ) {
      web3.currentProvider.send(
        {
          jsonrpc: "2.0",
          method: "evm_mine",
          id: Date.now(),
          params: [epochFromDateTime(timestamp)],
        },
        (error, res) => (error ? rj(error) : rs(res))
      );
    } else {
      rj(Error("Unable to set chain timestamp"));
    }
  });
};

export const approveLtx = async (from: string, to: string, amount: number) => {
  await ltxContract.approve(to, amount, { from });
};

export const transferLtx = async (from: string, to: string, amount: number) => {
  await ltxContract.transfer(to, amount, { from });
};

export const allowanceLtx = async (from: string, to: string) => {
  return (await ltxContract.allowance(from, to)).toNumber();
};

export const balanceLtx = async (account: string) => {
  return (await ltxContract.balanceOf(account)).toNumber();
};

export const prepareEnvironment = async (type: 'project-a') => {
  if(type === 'project-a'){
    await transferLtx(accounts[0], accounts[1], 10000 * 1e8);
    await approveLtx(accounts[1], stakingContract.address, 8000 * 1e8);

    await createProject(
      "project-a",
      DateTime.now(),
      DateTime.now().plus({ hours: 4 })
    );
    await createStakingPool(0, 0);
    await createStakingPool(0, 4000 * 1e8);
    await createStakingPool(0, 8000 * 1e8);

    console.log('project-a environment ready')
  }
}

export { DateTime };

console.log("Lattice Staking Utils Loaded");
