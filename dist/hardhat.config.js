"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomicfoundation/hardhat-toolbox");
const config = {
    solidity: "0.8.26",
    networks: {
        hardhat: {
            chainId: 31337
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337
        }
    }
};
exports.default = config;
