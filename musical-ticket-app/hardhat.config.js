require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.17",
  paths: {
    sources: "./solidity",
    tests: "./src/Tests",
    cache: "./cache",
    artifacts: "./src/artifacts"
  },
  networks: {
    hardhat: {
      chainId: 1337
    }
  }
};