import { DateTime } from "luxon";
import { LatticeStakingPoolInstance } from "../types/truffle-contracts";

const LatticeToken = artifacts.require("LatticeToken");
const LatticeStakingPool = artifacts.require("LatticeStakingPool");

const epochFromDateTime = (datetime: DateTime) =>
  Math.floor(datetime.toMillis() / 1000);

contract("LatticeStakingPool", (accounts) => {
  let contract: LatticeStakingPoolInstance;

  const createProject = async (
    name: string,
    start: DateTime,
    end: DateTime
  ) => {
    await contract.addProject(
      name,
      epochFromDateTime(start),
      epochFromDateTime(end),
      {
        from: accounts[0],
      }
    );

    const response = (await contract.projects(0)) as any;

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

  const createStakingPool = async (
    projectId: number,
    maxStakingAmountPerUser: number
  ) => {
    await contract.addStakingPool(projectId, maxStakingAmountPerUser, {
      from: accounts[0],
    });

    const response = (await contract.stakingPoolInfo(projectId, 0)) as any;

    return {
      maxStakingAmountPerUser: (
        response.maxStakingAmountPerUser as BN
      ).toNumber(),
      totalAmountStaked: (response.totalAmountStaked as BN).toNumber(),
    };
  };

  beforeEach(async () => {
    contract = await LatticeStakingPool.new(
      (
        await LatticeToken.deployed()
      ).address
    );
  });

  describe("addProject", () => {
    it("Creates a project", async () => {
      const name = "project-a";
      const now = DateTime.now().plus({ hours: 1 });
      const after = now.plus({ days: 7 });

      const response = await createProject(name, now, after);

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
        const response = await contract.addProject(
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
        const response = await contract.addProject(
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
        const response = await contract.addProject(
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
        const response = await contract.addProject(
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

      await contract.addProject(
        "project-a",
        epochFromDateTime(now),
        epochFromDateTime(after),
        {
          from: accounts[0],
        }
      );

      try {
        await contract.addProject(
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

      const response = await createStakingPool(
        projectId,
        maxStakingAmountPerUser
      );

      assert.equal(response.maxStakingAmountPerUser, maxStakingAmountPerUser);
      assert.equal(response.totalAmountStaked, 0);
    });

    it("Rejects non-owner calls", async () => {
      try {
        const response = await contract.addStakingPool(0, 0, {
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
        const response = await contract.addStakingPool(1, 0, {
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
});
