import { DateTime } from "luxon";
import sinon, { SinonSandbox } from "sinon";
import { LatticeTokenInstance } from "../types/truffle-contracts";
import {
  LatticeStakingPoolInstance,
  Deposit,
  PoolAdded,
  ProjectAdded,
  ProjectDisabled,
  Withdraw,
} from "../types/truffle-contracts/LatticeStakingPool";

const LatticeToken = artifacts.require("LatticeToken");
const LatticeStakingPool = artifacts.require("LatticeStakingPool");

const epochFromDateTime = (datetime: DateTime) =>
  Math.floor(datetime.toMillis() / 1000);

contract("LatticeStakingPool", (accounts) => {
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

  describe("addProject", () => {
    it("Creates a project", async () => {
      const name = "project-a";
      const now = DateTime.now().plus({ hours: 1 });
      const after = now.plus({ days: 7 });

      const { trxResponse, response } = await createProject(name, now, after);

      // Assert Events
      assert.equal(trxResponse.logs.length, 1);
      assert.equal(trxResponse.logs[0].event, "ProjectAdded");
      assert.equal(
        (
          trxResponse.logs[0] as Truffle.TransactionLog<ProjectAdded>
        ).args._projectId.toNumber(),
        0
      );
      assert.equal(
        (trxResponse.logs[0] as Truffle.TransactionLog<ProjectAdded>).args[1],
        "project-a"
      );

      // Assert Project
      assert.equal(response.name, "project-a");
      assert.equal(response.totalAmountStaked, 0);
      assert.equal(response.numberOfPools, 0);
      assert.equal(
        epochFromDateTime(response.startTimestamp),
        epochFromDateTime(now)
      );
      assert.equal(
        epochFromDateTime(response.endTimestamp),
        epochFromDateTime(after)
      );
    });

    it("Rejects non-owner calls", async () => {
      const now = DateTime.now().plus({ hours: 1 });
      const after = now.plus({ days: 7 });

      try {
        const response = await stakingContract.addProject(
          "project-a",
          epochFromDateTime(now),
          epochFromDateTime(after),
          {
            from: accounts[1],
          }
        );
        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          assert.match(e.message, /addNewProject: Caller is not the owner/i);
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });

    it("Rejects empty project names", async () => {
      const now = DateTime.now().plus({ hours: 1 });
      const after = now.plus({ days: 7 });

      try {
        const response = await stakingContract.addProject(
          "",
          epochFromDateTime(now),
          epochFromDateTime(after),
          {
            from: accounts[0],
          }
        );
        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          assert.match(
            e.message,
            /addNewProject: Project name cannot be empty string/i
          );
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });

    it("Rejects invalid project startTimestamp", async () => {
      const now = DateTime.now().minus({ days: 3 });
      const after = now.plus({ days: 7 });

      try {
        const response = await stakingContract.addProject(
          "project-a",
          epochFromDateTime(now),
          epochFromDateTime(after),
          {
            from: accounts[0],
          }
        );
        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          assert.match(
            e.message,
            /addNewProject: startTimestamp is less than the current block timestamp/i
          );
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });

    it("Rejects invalid project endTimestamp", async () => {
      const now = DateTime.now().plus({ hours: 1 });
      const after = now.minus({ days: 7 });

      try {
        const response = await stakingContract.addProject(
          "project-a",
          epochFromDateTime(now),
          epochFromDateTime(after),
          {
            from: accounts[0],
          }
        );
        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          assert.match(
            e.message,
            /addNewProject: startTimestamp is greater than or equal to the endTimestamp/i
          );
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });

    it("Rejects project name taken", async () => {
      const now = DateTime.now().plus({ hours: 1 });
      const after = now.plus({ days: 7 });

      await stakingContract.addProject(
        "project-a",
        epochFromDateTime(now),
        epochFromDateTime(after),
        {
          from: accounts[0],
        }
      );

      try {
        await stakingContract.addProject(
          "project-a",
          epochFromDateTime(now),
          epochFromDateTime(after),
          {
            from: accounts[0],
          }
        );
        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          assert.match(e.message, /addNewProject: project name already taken/i);
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });
  });

  describe("addStakingPool", () => {
    let project: Awaited<ReturnType<typeof createProject>>;
    beforeEach(async () => {
      const name = "project-a";
      const now = DateTime.now().plus({ hours: 1 });
      const after = now.plus({ days: 7 });

      project = await createProject(name, now, after);
    });

    it("Creates a staking pool", async () => {
      const projectId = 0;
      const maxStakingAmountPerUser = 1000 * 1e8;

      const { trxResponse, response } = await createStakingPool(
        projectId,
        maxStakingAmountPerUser
      );

      // Assert Events
      assert.equal(trxResponse.logs.length, 1);
      assert.equal(trxResponse.logs[0].event, "PoolAdded");
      assert.equal(
        (
          trxResponse.logs[0] as Truffle.TransactionLog<PoolAdded>
        ).args._projectId.toNumber(),
        0
      );
      assert.equal(
        (
          trxResponse.logs[0] as Truffle.TransactionLog<PoolAdded>
        ).args._poolId.toNumber(),
        1
      );

      // Assert Pool
      assert.equal(response.maxStakingAmountPerUser, maxStakingAmountPerUser);
      assert.equal(response.totalAmountStaked, 0);
    });

    it("Rejects non-owner calls", async () => {
      try {
        const response = await stakingContract.addStakingPool(0, 0, {
          from: accounts[1],
        });
        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          assert.match(e.message, /addStakingPool: Caller is not the owner/i);
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });

    it("Rejects invalid project ID", async () => {
      try {
        const response = await stakingContract.addStakingPool(1, 0, {
          from: accounts[0],
        });
        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          assert.match(e.message, /addStakingPool: Invalid project ID/i);
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });
  });

  describe("disableProject", () => {
    let project: Awaited<ReturnType<typeof createProject>>;
    beforeEach(async () => {
      const name = "project-a";
      const now = DateTime.now().plus({ hours: 1 });
      const after = now.plus({ days: 7 });

      project = await createProject(name, now, after);
    });

    it("Disables a project", async () => {
      const trxResponse = await stakingContract.disableProject(0, {
        from: accounts[0],
      });

      // Assert Events
      assert.equal(trxResponse.logs.length, 1);
      assert.equal(trxResponse.logs[0].event, "ProjectDisabled");
      assert.equal(
        (
          trxResponse.logs[0] as Truffle.TransactionLog<ProjectDisabled>
        ).args._projectId.toNumber(),
        0
      );

      const block = await web3.eth.getBlock(
        (trxResponse.receipt as TransactionReceipt).blockHash
      );

      const project = (await stakingContract.projects(0)) as any;
      assert.equal(
        (project.endTimestamp as BN).toNumber(),
        parseInt(String(block.timestamp))
      );
    });

    it("Rejects non-owner calls", async () => {
      try {
        const response = await stakingContract.disableProject(0, {
          from: accounts[1],
        });
        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          assert.match(e.message, /disableProject: Caller is not the owner/i);
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });

    it("Rejects invalid project ID", async () => {
      try {
        const response = await stakingContract.disableProject(1, {
          from: accounts[0],
        });
        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          assert.match(e.message, /disableProject: Invalid project ID/i);
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });
  });

  describe("deposit", () => {
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
          ).args[3].toNumber(),
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
          ).args[3].toNumber(),
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

  describe("numberOfProjects", () => {
    let project: Awaited<ReturnType<typeof createProject>>;
    beforeEach(async () => {
      const name = "project-a";
      const now = DateTime.now().plus({ hours: 1 });
      const after = now.plus({ days: 7 });

      project = await createProject(name, now, after);
    });

    it("Returns correct count", async () => {
      const trxResponse = await stakingContract.numberOfProjects({
        from: accounts[0],
      });

      assert.equal(trxResponse.toNumber(), 1);
    });
  });

  describe("numberOfPools", () => {
    let project: Awaited<ReturnType<typeof createProject>>;
    beforeEach(async () => {
      const name = "project-a";
      const now = DateTime.now().plus({ hours: 1 });
      const after = now.plus({ days: 7 });

      project = await createProject(name, now, after);
    });

    it("Returns correct count", async () => {
      await createStakingPool(0, 0);

      const trxResponse = await stakingContract.numberOfPools(0, {
        from: accounts[0],
      });

      assert.equal(trxResponse.toNumber(), 1);
    });
  });

  describe("getTotalAmountStakedInProject", () => {
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

    it("Returns correct amount", async () => {
      await timeTravel(DateTime.now().plus({ hours: 2 }));

      await makeDeposit(0, 0, 3000 * 1e8, accounts[1]);

      const totalAmountStaked = (
        await stakingContract.getTotalAmountStakedInProject(0)
      ).toNumber();

      assert.equal(totalAmountStaked, 3000 * 1e8);
    });

    it("Rejects invalid project ID", async () => {
      await timeTravel(DateTime.now().plus({ hours: 2 }));

      await makeDeposit(0, 0, 3000 * 1e8, accounts[1]);

      try {
        await stakingContract.getTotalAmountStakedInProject(1);

        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          assert.match(
            e.message,
            /getTotalAmountStakedInProject: Invalid project ID/i
          );
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });
  });

  describe("getTotalAmountStakedInPool", () => {
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

    it("Returns correct amount", async () => {
      await timeTravel(DateTime.now().plus({ hours: 2 }));

      await makeDeposit(0, 0, 3000 * 1e8, accounts[1]);

      const totalAmountStaked = (
        await stakingContract.getTotalAmountStakedInPool(0, 0)
      ).toNumber();

      assert.equal(totalAmountStaked, 3000 * 1e8);
    });

    it("Rejects invalid project ID", async () => {
      await timeTravel(DateTime.now().plus({ hours: 2 }));

      await makeDeposit(0, 0, 3000 * 1e8, accounts[1]);

      try {
        await stakingContract.getTotalAmountStakedInPool(1, 0);

        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          assert.match(
            e.message,
            /getTotalAmountStakedInPool: Invalid project ID/i
          );
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });

    it("Rejects invalid pool ID", async () => {
      await timeTravel(DateTime.now().plus({ hours: 2 }));

      await makeDeposit(0, 0, 3000 * 1e8, accounts[1]);

      try {
        await stakingContract.getTotalAmountStakedInPool(0, 3);

        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          assert.match(
            e.message,
            /getTotalAmountStakedInPool: Invalid pool ID/i
          );
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });
  });

  describe("getAmountStakedByUserInPool", () => {
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

    it("Returns correct amount", async () => {
      await timeTravel(DateTime.now().plus({ hours: 2 }));

      await makeDeposit(0, 0, 3000 * 1e8, accounts[1]);

      const totalAmountStaked = (
        await stakingContract.getAmountStakedByUserInPool(0, 0, accounts[1])
      ).toNumber();

      assert.equal(totalAmountStaked, 3000 * 1e8);
    });

    it("Rejects invalid project ID", async () => {
      await timeTravel(DateTime.now().plus({ hours: 2 }));

      await makeDeposit(0, 0, 3000 * 1e8, accounts[1]);

      try {
        await stakingContract.getAmountStakedByUserInPool(1, 0, accounts[1]);

        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          assert.match(
            e.message,
            /getAmountStakedByUserInPool: Invalid project ID/i
          );
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });

    it("Rejects invalid pool ID", async () => {
      await timeTravel(DateTime.now().plus({ hours: 2 }));

      await makeDeposit(0, 0, 3000 * 1e8, accounts[1]);

      try {
        await stakingContract.getAmountStakedByUserInPool(0, 3, accounts[1]);

        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          assert.match(
            e.message,
            /getAmountStakedByUserInPool: Invalid pool ID/i
          );
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });
  });

  describe("getPercentageAmountStakedByUserInPool", () => {
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

    it("Returns correct amount", async () => {
      await timeTravel(DateTime.now().plus({ hours: 2 }));

      await makeDeposit(0, 0, 3000 * 1e8, accounts[1]);

      const percentageStaked = (
        await stakingContract.getPercentageAmountStakedByUserInPool(
          0,
          0,
          accounts[1]
        )
      ).toNumber();

      assert.equal(percentageStaked, 1e8);
    });

    it("Rejects invalid project ID", async () => {
      await timeTravel(DateTime.now().plus({ hours: 2 }));

      await makeDeposit(0, 0, 3000 * 1e8, accounts[1]);

      try {
        await stakingContract.getPercentageAmountStakedByUserInPool(
          1,
          0,
          accounts[1]
        );

        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          assert.match(
            e.message,
            /getPercentageAmountStakedByUserInPool: Invalid project ID/i
          );
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });

    it("Rejects invalid pool ID", async () => {
      await timeTravel(DateTime.now().plus({ hours: 2 }));

      await makeDeposit(0, 0, 3000 * 1e8, accounts[1]);

      try {
        await stakingContract.getPercentageAmountStakedByUserInPool(
          0,
          3,
          accounts[1]
        );

        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          assert.match(
            e.message,
            /getPercentageAmountStakedByUserInPool: Invalid pool ID/i
          );
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });
  });
});
