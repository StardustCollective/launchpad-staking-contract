const { DateTime } = require("luxon");

let ltxContract;
let stakingContract;
let accounts;

module.exports = {
  DateTime,
  /* ltxContract: () => ltxContract,
  stakingContract: () => stakingContract,
  accounts: () => accounts, */

  initializeUtils: async (g) => {
    const moduleExports = g.require("./console/utils.ts");
    for (const key of Object.keys(moduleExports)) {
      Object.defineProperty(g, key, {
        get: () => moduleExports[key],
      });
    }

    await moduleExports.initializeEnv(g);
  },

  /* initializeEnv: async (g) => {
    ltxContract = await g.LatticeToken.deployed();
    stakingContract = await g.LatticeStakingPool.deployed();
    accounts = await web3.eth.getAccounts();

    g.ltxContract = ltxContract;
    g.stakingContract = stakingContract;
    g.accounts = accounts;
  },

  epochFromDateTime: (datetime) => Math.floor(datetime.toMillis() / 1000),

  getProject: async (projectId) => {
    const response = await stakingContract.projects(projectId);

    return {
      name: response.name,
      totalAmountStaked: response.totalAmountStaked.toNumber(),
      numberOfPools: response.numberOfPools.toNumber(),
      startTimestamp: DateTime.fromMillis(
        response.startTimestamp.toNumber() * 1000
      ),
      endTimestamp: DateTime.fromMillis(
        response.endTimestamp.toNumber() * 1000
      ),
    };
  },

  createProject: async (name, start, end) => {
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
  },

  getStakingPool: async (projectId, poolId) => {
    const response = await stakingContract.stakingPoolInfo(projectId, poolId);

    return {
      maxStakingAmountPerUser: response.maxStakingAmountPerUser.toNumber(),
      totalAmountStaked: response.totalAmountStaked.toNumber(),
    };
  },

  createStakingPool: async (projectId, maxStakingAmountPerUser) => {
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
  },

  makeDeposit: async (projectId, poolId, amount, from) => {
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
  },

  setChainTimestamp: async (timestamp) => {
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
  },

  approveLtx: async (from, to, amount) => {
    await ltxContract.approve(to, amount, { from });
  },

  transferLtx: async (from, to, amount) => {
    await ltxContract.transfer(to, amount, { from });
  },

  allowanceLtx: async (from, to) => {
    return (await ltxContract.allowance(from, to)).toNumber();
  },

  balanceLtx: async (account) => {
    return (await ltxContract.balanceOf(account)).toNumber();
  }, */
};
