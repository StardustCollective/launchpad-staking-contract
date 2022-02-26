import { DateTime, DurationLike, Duration } from "luxon";
import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";
import { LatticeToken, LatticeStakingPool } from "./../typechain-types";
import { DepositEvent } from "./../typechain-types/LatticeStakingPool";

const epochFromDateTime = (datetime: DateTime) =>
  Math.floor(datetime.toMillis() / 1000);

const totalIncreasedChainTime = (increaseBy?: number) => {
  if (global.totalIncreasedChainTime === undefined) {
    global.totalIncreasedChainTime = 0;
  }
  if (increaseBy !== undefined) {
    global.totalIncreasedChainTime += increaseBy;
  }
  return global.totalIncreasedChainTime;
};

describe("LatticeStakingPool: deposit", () => {
  let accounts: Signer[];
  let stakingContract: LatticeStakingPool, ltxContract: LatticeToken;

  beforeEach(async () => {
    accounts = await ethers.getSigners();

    const LatticeTokenFactory = await ethers.getContractFactory("LatticeToken");

    const LatticeStakingPoolFactory = await ethers.getContractFactory(
      "LatticeStakingPool"
    );

    ltxContract = await LatticeTokenFactory.deploy();
    stakingContract = await LatticeStakingPoolFactory.deploy(
      ltxContract.address
    );
  });

  const getProject = async (projectId: number) => {
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
  };

  const createProject = async (
    name: string,
    start: DateTime,
    end: DateTime
  ) => {
    const trxResponse = await stakingContract
      .connect(accounts[0])
      .addProject(name, epochFromDateTime(start), epochFromDateTime(end));

    const trxReceipt = await trxResponse.wait();

    const projectId = (await stakingContract.numberOfProjects()).toNumber() - 1;

    return {
      trxResponse,
      trxReceipt,
      events:
        trxReceipt.events?.filter(
          (ev) => ev.address === stakingContract.address
        ) ?? [],
      response: await getProject(projectId),
    };
  };

  const getStakingPool = async (projectId: number, poolId: number) => {
    const response = await stakingContract.stakingPoolInfo(projectId, poolId);

    return {
      maxStakingAmountPerUser: response.maxStakingAmountPerUser.toNumber(),
      totalAmountStaked: response.totalAmountStaked.toNumber(),
    };
  };

  const createStakingPool = async (
    projectId: number,
    maxStakingAmountPerUser: number
  ) => {
    const trxResponse = await stakingContract
      .connect(accounts[0])
      .addStakingPool(projectId, maxStakingAmountPerUser);
    const trxReceipt = await trxResponse.wait();

    const poolId =
      (await stakingContract.numberOfPools(projectId)).toNumber() - 1;

    return {
      trxResponse,
      trxReceipt,
      events:
        trxReceipt.events?.filter(
          (ev) => ev.address === stakingContract.address
        ) ?? [],
      response: await getStakingPool(projectId, poolId),
    };
  };

  const makeDeposit = async (
    projectId: number,
    poolId: number,
    amount: number,
    from: Signer
  ) => {
    const trxResponse = await stakingContract
      .connect(from)
      .deposit(projectId, poolId, amount);
    const trxReceipt = await trxResponse.wait();

    const userStakedAmount = (
      await stakingContract.userStakedAmount(
        projectId,
        poolId,
        await from.getAddress()
      )
    ).toNumber();

    const project = await getProject(projectId);
    const pool = await getStakingPool(projectId, poolId);

    return {
      trxResponse,
      trxReceipt,
      events:
        trxReceipt.events?.filter(
          (ev) => ev.address === stakingContract.address
        ) ?? [],
      userStakedAmount,
      project,
      pool,
    };
  };

  const withdrawFunds = async (
    projectId: number,
    poolId: number,
    from: Signer
  ) => {
    const trxResponse = await stakingContract
      .connect(from)
      .withdraw(projectId, poolId);

    const trxReceipt = await trxResponse.wait();

    const didUserWithdrawFunds = await stakingContract.didUserWithdrawFunds(
      projectId,
      poolId,
      await from.getAddress()
    );

    return {
      trxResponse,
      trxReceipt,
      events:
        trxReceipt.events?.filter(
          (ev) => ev.address === stakingContract.address
        ) ?? [],
      didUserWithdrawFunds,
    };
  };

  const increaseChainTime = async (durationLike: DurationLike) => {
    try {
      const duration = Duration.fromDurationLike(durationLike);
      const increaseBy = Math.floor(duration.as("seconds"));
      await ethers.provider.send("evm_increaseTime", [increaseBy]);
      totalIncreasedChainTime(increaseBy);
      return;
    } catch (e) {
      throw new Error(`Unable to set chain timestamp ->\n${e}`);
    }
  };

  const approveLtx = async (from: Signer, to: string, amount: number) => {
    await (await ltxContract.connect(from).approve(to, amount)).wait();
  };

  const transferLtx = async (from: Signer, to: string, amount: number) => {
    await (await ltxContract.connect(from).transfer(to, amount)).wait();
  };

  const allowanceLtx = async (from: Signer, to: string) => {
    return (
      await ltxContract.allowance(await from.getAddress(), to)
    ).toNumber();
  };

  const balanceLtx = async (account: Signer) => {
    return (await ltxContract.balanceOf(await account.getAddress())).toNumber();
  };

  let project: Awaited<ReturnType<typeof createProject>>;
  let pools: Awaited<ReturnType<typeof createStakingPool>>[] = [];
  beforeEach(async () => {
    const name = "project-a";
    const now = DateTime.now()
      .plus({ hours: 1 })
      .plus({ seconds: totalIncreasedChainTime() });
    const after = now.plus({ days: 7 });

    project = await createProject(name, now, after);
    for (let i = 0; i < 3; i++) {
      pools.push(await createStakingPool(0, i * 4000 * 1e8));
    }

    await transferLtx(accounts[0], await accounts[1].getAddress(), 10000 * 1e8);
    await approveLtx(accounts[1], stakingContract.address, 8000 * 1e8);
  });

  describe("Makes a deposit", () => {
    it("User has not staked before", async () => {
      await increaseChainTime({ hours: 2 });

      const amount = 3000 * 1e8;

      const response = await makeDeposit(0, 1, amount, accounts[1]);

      expect(response.userStakedAmount).to.equal(amount);
      expect(response.project.totalAmountStaked).to.equal(amount);
      expect(response.pool.totalAmountStaked).to.equal(amount);

      const balance = await balanceLtx(accounts[1]);
      expect(balance).to.equal(7000 * 1e8);

      expect(response.events.length).to.equal(1);
      expect(response.events[0].event).to.equal("Deposit");
      expect((response.events[0] as DepositEvent).args._user).to.equal(
        await accounts[1].getAddress()
      );
      expect(
        (response.events[0] as DepositEvent).args._projectId.toNumber()
      ).to.equal(0);
      expect(
        (response.events[0] as DepositEvent).args._poolId.toNumber()
      ).to.equal(1);
      expect(
        (response.events[0] as DepositEvent).args._amount.toNumber()
      ).to.equal(amount);
    });

    it("User has staked before", async () => {
      await increaseChainTime({ hours: 2 });

      const previouslyStaked = 2000 * 1e8;

      await makeDeposit(0, 2, previouslyStaked, accounts[1]);

      const amount = 3000 * 1e8;

      const response = await makeDeposit(0, 2, amount, accounts[1]);

      const totalStaked = amount + previouslyStaked;

      expect(response.userStakedAmount).to.equal(totalStaked);
      expect(response.project.totalAmountStaked).to.equal(totalStaked);
      expect(response.pool.totalAmountStaked).to.equal(totalStaked);

      const balance = await balanceLtx(accounts[1]);
      expect(balance).to.equal(5000 * 1e8);

      expect(response.events.length).to.equal(1);
      expect(response.events[0].event).to.equal("Deposit");
      expect((response.events[0] as DepositEvent).args._user).to.equal(
        await accounts[1].getAddress()
      );
      expect(
        (response.events[0] as DepositEvent).args._projectId.toNumber()
      ).to.equal(0);
      expect(
        (response.events[0] as DepositEvent).args._poolId.toNumber()
      ).to.equal(2);
      expect(
        (response.events[0] as DepositEvent).args._amount.toNumber()
      ).to.equal(amount);
    });
  });

  it("Rejects 0 value amounts", async () => {
    try {
      const response = await stakingContract
        .connect(accounts[1])
        .deposit(0, 0, 0);
      await response.wait();

      throw new Error("Method should throw");
    } catch (e) {
      if (e instanceof Error) {
        expect(e.message).to.match(/deposit: Amount not specified/i);
      } else {
        throw new Error("Method should throw an Error");
      }
    }
  });

  it("Rejects invalid project ID", async () => {
    try {
      const response = await stakingContract
        .connect(accounts[1])
        .deposit(1, 0, 1000 * 1e8);
      await response.wait();

      throw new Error("Method should throw");
    } catch (e) {
      if (e instanceof Error) {
        expect(e.message).to.match(/deposit: Invalid project ID/i);
      } else {
        throw new Error("Method should throw an Error");
      }
    }
  });

  it("Rejects invalid pool ID", async () => {
    try {
      const response = await stakingContract
        .connect(accounts[1])
        .deposit(0, 3, 1000 * 1e8);
      await response.wait();

      throw new Error("Method should throw");
    } catch (e) {
      if (e instanceof Error) {
        expect(e.message).to.match(/deposit: Invalid pool ID/i);
      } else {
        throw new Error("Method should throw an Error");
      }
    }
  });

  it("Rejects invalid stake time (endTimestamp)", async () => {
    await increaseChainTime({ year: 1 });
    try {
      const response = await stakingContract
        .connect(accounts[1])
        .deposit(0, 0, 1000 * 1e8);
      await response.wait();

      throw new Error("Method should throw");
    } catch (e) {
      if (e instanceof Error) {
        expect(e.message).to.match(
          /deposit: Staking no longer permitted for this project/i
        );
      } else {
        throw new Error("Method should throw an Error");
      }
    }
  });

  it("Rejects invalid stake time (startTimestamp)", async () => {
    try {
      const response = await stakingContract
        .connect(accounts[1])
        .deposit(0, 0, 1000 * 1e8);
      await response.wait();

      throw new Error("Method should throw");
    } catch (e) {
      if (e instanceof Error) {
        expect(e.message).to.match(
          /deposit: Staking is not yet permitted for this project/i
        );
      } else {
        throw new Error("Method should throw an Error");
      }
    }
  });

  describe("Rejects user cannot stake more than max amount", () => {
    it("User has not staked before", async () => {
      await increaseChainTime({ hours: 2 });
      try {
        const response = await stakingContract
          .connect(accounts[1])
          .deposit(0, 1, 5000 * 1e8);
        await response.wait();

        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          expect(e.message).to.match(
            /deposit: Cannot exceed max staking amount per user/i
          );
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });

    it("User has staked before", async () => {
      await increaseChainTime({ hours: 2 });

      await makeDeposit(0, 1, 3000 * 1e8, accounts[1]);

      try {
        const response = await stakingContract
          .connect(accounts[1])
          .deposit(0, 1, 2000 * 1e8);
        await response.wait();

        throw new Error("Method should throw");
      } catch (e) {
        if (e instanceof Error) {
          expect(e.message).to.match(
            /deposit: Cannot exceed max staking amount per user/i
          );
        } else {
          throw new Error("Method should throw an Error");
        }
      }
    });
  });
});
