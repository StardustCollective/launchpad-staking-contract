import { DateTime } from "luxon";
import sinon, { SinonSandbox } from "sinon";
import { LatticeTokenInstance } from "../types/truffle-contracts";
import {
  LatticeStakingPoolInstance,
  Deposit,
} from "../types/truffle-contracts/LatticeStakingPool";

const LatticeToken = artifacts.require("LatticeToken");
const LatticeStakingPool = artifacts.require("LatticeStakingPool");

const epochFromDateTime = (datetime: DateTime) =>
  Math.floor(datetime.toMillis() / 1000);

contract("LatticeStakingPool: deposit", (accounts) => {
  let stakingContract: LatticeStakingPoolInstance,
    ltxContract: LatticeTokenInstance;

  const getProject = async (projectId: number) => {
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

  const createProject = async (
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

  const getStakingPool = async (projectId: number, poolId: number) => {
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

  const createStakingPool = async (
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

  const makeDeposit = async (
    projectId: number,
    poolId: number,
    amount: number,
    from: string
  ) => {
    const trxResponse = await stakingContract.deposit(
      projectId,
      poolId,
      amount,
      {
        from,
      }
    );

    const userStakedAmount = (
      await stakingContract.userStakedAmount(projectId, poolId, from)
    ).toNumber();

    const project = await getProject(projectId);
    const pool = await getStakingPool(projectId, poolId);

    return {
      trxResponse,
      userStakedAmount,
      project,
      pool,
    };
  };

  const withdrawFunds = async (
    projectId: number,
    poolId: number,
    from: string
  ) => {
    const trxResponse = await stakingContract.withdraw(projectId, poolId, {
      from,
    });

    const didUserWithdrawFunds = await stakingContract.didUserWithdrawFunds(
      projectId,
      poolId,
      from
    );

    return {
      trxResponse,
      didUserWithdrawFunds,
    };
  };

  const setChainTimestamp = async (timestamp: DateTime) => {
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

  const approveLtx = async (from: string, to: string, amount: number) => {
    await ltxContract.approve(to, amount, { from });
  };

  const transferLtx = async (from: string, to: string, amount: number) => {
    await ltxContract.transfer(to, amount, { from });
  };

  const allowanceLtx = async (from: string, to: string) => {
    return (await ltxContract.allowance(from, to)).toNumber();
  };

  const balanceLtx = async (account: string) => {
    return (await ltxContract.balanceOf(account)).toNumber();
  };

  // Reset contract states
  beforeEach(async () => {
    ltxContract = await LatticeToken.new();
    stakingContract = await LatticeStakingPool.new(ltxContract.address);
  });

  // Time traveling code /*--
  let futureSandbox: SinonSandbox,
    originalTime: DateTime | null = null;

  beforeEach(async () => {
    futureSandbox = sinon.createSandbox();
  });

  afterEach(async () => {
    if (originalTime) {
      futureSandbox.restore();
      originalTime = null;
      await setChainTimestamp(DateTime.now());
    }
  });

  const timeTravel = async (timestamp: DateTime) => {
    originalTime = DateTime.fromJSDate(new Date());
    futureSandbox.restore();
    futureSandbox.stub(DateTime, "now").callsFake(() => {
      if (originalTime) {
        return timestamp.plus(
          DateTime.fromJSDate(new Date()).diff(originalTime)
        );
      } else {
        throw new Error("Unable to produce future date");
      }
    });
    await setChainTimestamp(timestamp);
  };
  // Time traveling code --*/

  let project: Awaited<ReturnType<typeof createProject>>;
  let pools: Awaited<ReturnType<typeof createStakingPool>>[] = [];
  beforeEach(async () => {
    const name = "project-a";
    const now = DateTime.now().plus({ hours: 1 });
    const after = now.plus({ days: 7 });

    project = await createProject(name, now, after);
    for (let i = 0; i < 3; i++) {
      pools.push(await createStakingPool(0, i * 4000 * 1e8));
    }

    await transferLtx(accounts[0], accounts[1], 10000 * 1e8);
    await approveLtx(accounts[1], stakingContract.address, 8000 * 1e8);
  });

  describe("Makes a deposit", () => {
    it("User has not staked before", async () => {
      await timeTravel(DateTime.now().plus({ hours: 2 }));

      const amount = 3000 * 1e8;

      const response = await makeDeposit(0, 1, amount, accounts[1]);

      assert.equal(response.userStakedAmount, amount);
      assert.equal(response.project.totalAmountStaked, amount);
      assert.equal(response.pool.totalAmountStaked, amount);

      const balance = await balanceLtx(accounts[1]);
      assert.equal(balance, 7000 * 1e8);

      assert.equal(response.trxResponse.logs.length, 1);
      assert.equal(response.trxResponse.logs[0].event, "Deposit");
      assert.equal(
        (response.trxResponse.logs[0] as Truffle.TransactionLog<Deposit>).args
          ._user,
        accounts[1]
      );
      assert.equal(
        (
          response.trxResponse.logs[0] as Truffle.TransactionLog<Deposit>
        ).args._projectId.toNumber(),
        0
      );
      assert.equal(
        (
          response.trxResponse.logs[0] as Truffle.TransactionLog<Deposit>
        ).args._poolId.toNumber(),
        1
      );
      assert.equal(
        (
          response.trxResponse.logs[0] as Truffle.TransactionLog<Deposit>
        ).args._amount.toNumber(),
        amount
      );
    });

    it("User has staked before", async () => {
      await timeTravel(DateTime.now().plus({ hours: 2 }));

      const previouslyStaked = 2000 * 1e8;

      await makeDeposit(0, 2, previouslyStaked, accounts[1]);

      const amount = 3000 * 1e8;

      const response = await makeDeposit(0, 2, amount, accounts[1]);

      const totalStaked = amount + previouslyStaked;

      assert.equal(response.userStakedAmount, totalStaked);
      assert.equal(response.project.totalAmountStaked, totalStaked);
      assert.equal(response.pool.totalAmountStaked, totalStaked);

      const balance = await balanceLtx(accounts[1]);
      assert.equal(balance, 5000 * 1e8);

      assert.equal(response.trxResponse.logs.length, 1);
      assert.equal(response.trxResponse.logs[0].event, "Deposit");
      assert.equal(
        (response.trxResponse.logs[0] as Truffle.TransactionLog<Deposit>).args
          ._user,
        accounts[1]
      );
      assert.equal(
        (
          response.trxResponse.logs[0] as Truffle.TransactionLog<Deposit>
        ).args._projectId.toNumber(),
        0
      );
      assert.equal(
        (
          response.trxResponse.logs[0] as Truffle.TransactionLog<Deposit>
        ).args._poolId.toNumber(),
        2
      );
      assert.equal(
        (
          response.trxResponse.logs[0] as Truffle.TransactionLog<Deposit>
        ).args._amount.toNumber(),
        amount
      );
    });
  });

  it("Rejects 0 value amounts", async () => {
    try {
      const response = await stakingContract.deposit(0, 0, 0, {
        from: accounts[1],
      });
      throw new Error("Method should throw");
    } catch (e) {
      if (e instanceof Error) {
        assert.match(e.message, /deposit: Amount not specified/i);
      } else {
        throw new Error("Method should throw an Error");
      }
    }
  });

  it("Rejects invalid project ID", async () => {
    try {
      const response = await stakingContract.deposit(1, 0, 1000 * 1e8, {
        from: accounts[1],
      });
      throw new Error("Method should throw");
    } catch (e) {
      if (e instanceof Error) {
        assert.match(e.message, /deposit: Invalid project ID/i);
      } else {
        throw new Error("Method should throw an Error");
      }
    }
  });

  it("Rejects invalid pool ID", async () => {
    try {
      const response = await stakingContract.deposit(0, 3, 1000 * 1e8, {
        from: accounts[1],
      });
      throw new Error("Method should throw");
    } catch (e) {
      if (e instanceof Error) {
        assert.match(e.message, /deposit: Invalid pool ID/i);
      } else {
        throw new Error("Method should throw an Error");
      }
    }
  });

  it("Rejects invalid stake time (endTimestamp)", async () => {
    await timeTravel(DateTime.now().plus({ year: 1 }));
    try {
      const response = await stakingContract.deposit(0, 0, 1000 * 1e8, {
        from: accounts[1],
      });
      throw new Error("Method should throw");
    } catch (e) {
      if (e instanceof Error) {
        assert.match(
          e.message,
          /deposit: Staking no longer permitted for this project/i
        );
      } else {
        throw new Error("Method should throw an Error");
      }
    }
  });

  it("Rejects invalid stake time (startTimestamp)", async () => {
    try {
      const response = await stakingContract.deposit(0, 0, 1000 * 1e8, {
        from: accounts[1],
      });
      throw new Error("Method should throw");
    } catch (e) {
      if (e instanceof Error) {
        assert.match(
          e.message,
          /deposit: Staking is not yet permitted for this project/i
        );
      } else {
        throw new Error("Method should throw an Error");
      }
    }
  });

  describe("Rejects user cannot stake more than max amount", () => {
    it("User has not staked before", async () => {
      await timeTravel(DateTime.now().plus({ hours: 2 }));
      try {
        const response = await stakingContract.deposit(0, 1, 5000 * 1e8, {
          from: accounts[1],
        });
        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          assert.match(
            e.message,
            /deposit: Cannot exceed max staking amount per user/i
          );
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });

    it("User has staked before", async () => {
      await timeTravel(DateTime.now().plus({ hours: 2 }));

      await makeDeposit(0, 1, 3000 * 1e8, accounts[1]);

      try {
        const response = await stakingContract.deposit(0, 1, 2000 * 1e8, {
          from: accounts[1],
        });
        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          assert.match(
            e.message,
            /deposit: Cannot exceed max staking amount per user/i
          );
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });
  });
});
