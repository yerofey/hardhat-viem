"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const accounts_1 = require("viem/accounts");
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const TestToken_json_1 = require("./../artifacts/contracts/TestToken.sol/TestToken.json");
(0, dotenv_1.config)();
const app = (0, fastify_1.default)();
app.register(cors_1.default);
const publicClient = (0, viem_1.createPublicClient)({
    chain: chains_1.hardhat,
    transport: (0, viem_1.http)()
});
const account = (0, accounts_1.privateKeyToAccount)(process.env.PRIVATE_KEY);
const walletClient = (0, viem_1.createWalletClient)({
    account,
    chain: chains_1.hardhat,
    transport: (0, viem_1.http)()
});
const tokenAddress = process.env.TOKEN_ADDRESS;
if (!tokenAddress) {
    throw new Error("TOKEN_ADDRESS is not set");
}
app.get("/token-info", async (_, reply) => {
    try {
        const [name, symbol, totalSupply] = await Promise.all([
            publicClient.readContract({
                address: tokenAddress,
                abi: TestToken_json_1.abi,
                functionName: "name"
            }),
            publicClient.readContract({
                address: tokenAddress,
                abi: TestToken_json_1.abi,
                functionName: "symbol"
            }),
            publicClient.readContract({
                address: tokenAddress,
                abi: TestToken_json_1.abi,
                functionName: "totalSupply"
            })
        ]);
        return {
            name,
            symbol,
            totalSupply: (0, viem_1.formatEther)(totalSupply)
        };
    }
    catch (error) {
        reply.status(500).send({ error: "Failed to fetch token info" });
    }
});
app.get("/balance/:address", async (request, reply) => {
    try {
        const params = request.params;
        const balance = await publicClient.readContract({
            address: tokenAddress,
            abi: TestToken_json_1.abi,
            functionName: "balanceOf",
            args: [params.address]
        });
        return {
            balance: (0, viem_1.formatEther)(balance)
        };
    }
    catch (error) {
        reply.status(500).send({ error: "Failed to fetch balance" });
    }
});
app.post("/transfer", async (request, reply) => {
    try {
        const body = request.body;
        const { from, to, amount } = body;
        if (!from || !to || !amount) {
            reply.status(400).send({ error: "Invalid request body" });
            return;
        }
        try {
            const approveHash = await walletClient.writeContract({
                address: tokenAddress,
                abi: TestToken_json_1.abi,
                functionName: "approve",
                args: [
                    account.address,
                    BigInt(amount)
                ]
            });
            await publicClient.waitForTransactionReceipt({ hash: approveHash });
            const transferHash = await walletClient.writeContract({
                address: tokenAddress,
                abi: TestToken_json_1.abi,
                functionName: "transferFrom",
                args: [
                    from,
                    to,
                    BigInt(amount)
                ]
            });
            return {
                success: true,
                approvalHash: approveHash,
                transferHash: transferHash
            };
        }
        catch (error) {
            console.error("Transfer error:", error);
            reply.status(500).send({ error: "Failed to execute transferFrom" });
        }
    }
    catch (error) {
        console.error("Transfer error:", error);
        reply.status(500).send({ error: "Failed to execute transferFrom" });
    }
});
app.post("/mint", async (request, reply) => {
    try {
        const body = request.body;
        const { to, amount } = body;
        if (!to || !amount) {
            reply.status(400).send({ error: "Invalid request body" });
            return;
        }
        const hash = await walletClient.writeContract({
            address: tokenAddress,
            abi: TestToken_json_1.abi,
            functionName: "mint",
            args: [
                to,
                BigInt(amount)
            ]
        });
        return {
            success: true,
            transactionHash: hash
        };
    }
    catch (error) {
        console.error("Mint error:", error);
        reply.status(500).send({ error: "Failed to mint tokens" });
    }
});
app.post("/burn", async (request, reply) => {
    try {
        const body = request.body;
        const { amount } = body;
        if (!amount) {
            reply.status(400).send({ error: "Invalid request body" });
            return;
        }
        const hash = await walletClient.writeContract({
            address: tokenAddress,
            abi: TestToken_json_1.abi,
            functionName: "burn",
            args: [BigInt(amount)]
        });
        return {
            success: true,
            transactionHash: hash
        };
    }
    catch (error) {
        console.error("Burn error:", error);
        reply.status(500).send({ error: "Failed to burn tokens" });
    }
});
app.post("/blacklist", async (request, reply) => {
    try {
        const body = request.body;
        const { address } = body;
        if (!address) {
            reply.status(400).send({ error: "Invalid request body" });
            return;
        }
        const hash = await walletClient.writeContract({
            address: tokenAddress,
            abi: TestToken_json_1.abi,
            functionName: "blacklist",
            args: [address]
        });
        return {
            success: true,
            transactionHash: hash
        };
    }
    catch (error) {
        console.error("Blacklist error:", error);
        reply.status(500).send({ error: "Failed to blacklist address" });
    }
});
app.post("/unblacklist", async (request, reply) => {
    try {
        const body = request.body;
        const { address } = body;
        if (!address) {
            reply.status(400).send({ error: "Invalid request body" });
            return;
        }
        const hash = await walletClient.writeContract({
            address: tokenAddress,
            abi: TestToken_json_1.abi,
            functionName: "unblacklist",
            args: [address]
        });
        return {
            success: true,
            transactionHash: hash
        };
    }
    catch (error) {
        console.error("Unblacklist error:", error);
        reply.status(500).send({ error: "Failed to unblacklist address" });
    }
});
app.get("/is-blacklisted/:address", async (request, reply) => {
    try {
        const params = request.params;
        const isBlacklisted = await publicClient.readContract({
            address: tokenAddress,
            abi: TestToken_json_1.abi,
            functionName: "isBlacklisted",
            args: [params.address]
        });
        return {
            isBlacklisted
        };
    }
    catch (error) {
        console.error("IsBlacklisted error:", error);
        reply.status(500).send({ error: "Failed to check blacklist status" });
    }
});
app.get("/max-supply", async (_, reply) => {
    try {
        const maxSupply = await publicClient.readContract({
            address: tokenAddress,
            abi: TestToken_json_1.abi,
            functionName: "maxSupply"
        });
        return {
            maxSupply: (0, viem_1.formatEther)(maxSupply)
        };
    }
    catch (error) {
        console.error("Max supply error:", error);
        reply.status(500).send({ error: "Failed to get max supply" });
    }
});
const PORT = process.env.PORT || 3000;
app.listen({ port: Number(PORT) }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server running on ${address}`);
});
