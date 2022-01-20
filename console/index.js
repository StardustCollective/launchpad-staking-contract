module.exports = {
  initializeUtils: async (g) => {
    const moduleExports = g.require("./console/utils.ts");
    for (const key of Object.keys(moduleExports)) {
      Object.defineProperty(g, key, {
        get: () => moduleExports[key],
      });
    }

    await moduleExports.initializeEnv(g);
  },
};
