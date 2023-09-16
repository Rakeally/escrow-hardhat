// require('@nomicfoundation/hardhat-toolbox');

// module.exports = {
//   solidity: "0.8.17",
//   paths: {
//     artifacts: "./app/src/artifacts",
//   }
// };


require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.17",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111
    },
  },

};
