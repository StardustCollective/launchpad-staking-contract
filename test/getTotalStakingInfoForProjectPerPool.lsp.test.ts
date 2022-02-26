import { DateTime, DurationLike, Duration } from "luxon";
import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";
import { LatticeToken, LatticeStakingPool } from "./../typechain-types";
import { ProjectDisabledEvent } from "./../typechain-types/LatticeStakingPool";

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

describe("LatticeStakingPool: getTotalStakingInfoForProjectPerPool", () => {
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

  let stakeAmount: number;
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

    await increaseChainTime({ hours: 2 });

    stakeAmount = 3000 * 1e8;

    await makeDeposit(0, 1, stakeAmount, accounts[1]);
  });

  it("Returns correct data", async () => {
    const response = await stakingContract
      .connect(accounts[0])
      .getTotalStakingInfoForProjectPerPool(0, 1, 1, 20);

    expect(response.length).to.equal(1);
    expect(response[0].userAddress).to.equal(await accounts[1].getAddress());
    expect(response[0].poolId.toNumber()).to.equal(1);
    expect(response[0].percentageOfTokensStakedInPool.toNumber()).to.equal(1e8);
    expect(response[0].amountOfTokensStakedInPool.toNumber()).to.equal(
      stakeAmount
    );
  });

  it("Returns correct paginated data", async () => {
    await transferLtx(accounts[0], await accounts[2].getAddress(), 10000 * 1e8);
    await approveLtx(accounts[2], stakingContract.address, 8000 * 1e8);

    stakeAmount = 3000 * 1e8;

    await makeDeposit(0, 1, stakeAmount, accounts[2]);

    const assertValidResponse = async (pagenumber: number, account: string) => {
      const response = await stakingContract
        .connect(accounts[0])
        .getTotalStakingInfoForProjectPerPool(0, 1, pagenumber, 1);

      expect(response.length).to.equal(1);
      expect(response[0].userAddress).to.equal(account);
      expect(response[0].poolId.toNumber()).to.equal(1);
      expect(response[0].percentageOfTokensStakedInPool.toNumber()).to.equal(
        1e8 / 2
      );
      expect(response[0].amountOfTokensStakedInPool.toNumber()).to.equal(
        stakeAmount
      );
    };

    await assertValidResponse(1, await accounts[1].getAddress());
    await assertValidResponse(2, await accounts[2].getAddress());
  });

  it("Rejects non-owner calls", async () => {
    try {
      const response =
        await stakingContract.connect(accounts[1]).getTotalStakingInfoForProjectPerPool(
          0,
          0,
          1,
          20,
        );
          
      throw new Error("Method should throw");
    } catch (e) {
      if (e instanceof Error) {
        expect(e.message).to.match(
          /getTotalStakingInfoForProjectPerPool: Caller is not the owner/i
        );
      } else {
        throw new Error("Method should throw an Error");
      }
    }
  });

  it("Rejects invalid project ID", async () => {
    try {
      const response =
        await stakingContract.connect(accounts[0]).getTotalStakingInfoForProjectPerPool(
          1,
          0,
          1,
          20
        );
      throw new Error("Method should throw");
    } catch (e) {
      if (e instanceof Error) {
        expect(e.message).to.match(
          /getTotalStakingInfoForProjectPerPool: Invalid project ID/i
        );
      } else {
        throw new Error("Method should throw an Error");
      }
    }
  });

  it("Rejects invalid pool ID", async () => {
    try {
      const response = await stakingContract
        .connect(accounts[0])
        .getTotalStakingInfoForProjectPerPool(0, 3, 1, 20);
      throw new Error("Method should throw");
    } catch (e) {
      if (e instanceof Error) {
        expect(e.message).to.match(
          /getTotalStakingInfoForProjectPerPool: Invalid pool ID/i
        );
      } else {
        throw new Error("Method should throw an Error");
      }
    }
  });

  it("Rejects empty pool", async () => {
    try {
      const response = await stakingContract
        .connect(accounts[0])
        .getTotalStakingInfoForProjectPerPool(0, 0, 1, 20);
      throw new Error("Method should throw");
    } catch (e) {
      if (e instanceof Error) {
        expect(e.message).to.match(
          /getTotalStakingInfoForProjectPerPool: Nobody staked in this pool/i
        );
      } else {
        throw new Error("Method should throw an Error");
      }
    }
  });

  it("Rejects invalid page size", async () => {
    try {
      const response = await stakingContract
        .connect(accounts[0])
        .getTotalStakingInfoForProjectPerPool(0, 1, 0, 0);
      throw new Error("Method should throw");
    } catch (e) {
      if (e instanceof Error) {
        expect(e.message).to.match(
          /getTotalStakingInfoForProjectPerPool: Invalid page size/i
        );
      } else {
        throw new Error("Method should throw an Error");
      }
    }
  });

  it("Rejects invalid page number", async () => {
    try {
      const response = await stakingContract
        .connect(accounts[0])
        .getTotalStakingInfoForProjectPerPool(0, 1, 0, 20);
      throw new Error("Method should throw");
    } catch (e) {
      if (e instanceof Error) {
        expect(e.message).to.match(
          /getTotalStakingInfoForProjectPerPool: Invalid page number/i
        );
      } else {
        throw new Error("Method should throw an Error");
      }
    }
  });

  it("Rejects params exceed number of users", async () => {
    try {
      const response = await stakingContract
        .connect(accounts[0])
        .getTotalStakingInfoForProjectPerPool(0, 1, 2, 20);
      throw new Error("Method should throw");
    } catch (e) {
      if (e instanceof Error) {
        expect(e.message).to.match(
          /getTotalStakingInfoForProjectPerPool: Specified parameters exceed number of users in the pool/i
        );
      } else {
        throw new Error("Method should throw an Error");
      }
    }
  });
});
