"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
async function main() {
    const [deployer] = await hardhat_1.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    const token = await hardhat_1.ethers.deployContract("TestToken");
    await token.waitForDeployment();
    console.log("Token address:", await token.getAddress());
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
