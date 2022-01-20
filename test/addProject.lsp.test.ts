import { DateTime } from "luxon";
import sinon, { SinonSandbox } from "sinon";
import { LatticeTokenInstance } from "../types/truffle-contracts";
import {
  LatticeStakingPoolInstance,
  ProjectAdded,
} from "../types/truffle-contracts/LatticeStakingPool";

const LatticeToken = artifacts.require("LatticeToken");
const LatticeStakingPool = artifacts.require("LatticeStakingPool");

const epochFromDateTime = (datetime: DateTime) =>
  Math.floor(datetime.toMillis() / 1000);

contract("LatticeStakingPool: addProject", (accounts) => {
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
      (trxResponse.logs[0] as Truffle.TransactionLog<ProjectAdded>).args
        ._projectName,
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
