import { config } from "dotenv"
import { createPublicClient, http, createWalletClient, formatEther } from "viem"
import { hardhat } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import fastify from "fastify"
import cors from "@fastify/cors"
import { abi as erc20Abi } from "./../artifacts/contracts/TestToken.sol/TestToken.json"

config()

const app = fastify()
app.register(cors)

const publicClient = createPublicClient({
  chain: hardhat,
  transport: http()
})

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`)

const walletClient = createWalletClient({
  account,
  chain: hardhat,
  transport: http()
})

const tokenAddress = process.env.TOKEN_ADDRESS as `0x${string}`
if (!tokenAddress) {
  throw new Error("TOKEN_ADDRESS is not set")
}

app.get("/token-info", async (_, reply) => {
  try {
    const [name, symbol, totalSupply] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "name"
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "symbol"
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "totalSupply"
      })
    ])

    return {
      name,
      symbol,
      totalSupply: formatEther(totalSupply as bigint)
    }
  } catch (error) {
    reply.status(500).send({ error: "Failed to fetch token info" })
  }
})

app.get("/balance/:address", async (request, reply) => {
  try {
    const params = request.params as { address: string }
    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [params.address as `0x${string}`]
    })

    return {
      balance: formatEther(balance as bigint)
    }
  } catch (error) {
    reply.status(500).send({ error: "Failed to fetch balance" })
  }
})

app.post("/transfer", async (request, reply) => {
  try {
    const body = request.body as { from: string; to: string; amount: string }
    const { from, to, amount } = body

    if (!from || !to || !amount) {
      reply.status(400).send({ error: "Invalid request body" })
      return
    }

    try {
      const approveHash = await walletClient.writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [
          account.address,
          BigInt(amount)
        ]
      })

      await publicClient.waitForTransactionReceipt({ hash: approveHash })

      const transferHash = await walletClient.writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "transferFrom",
        args: [
          from as `0x${string}`,
          to as `0x${string}`,
          BigInt(amount)
        ]
      })

      return {
        success: true,
        approvalHash: approveHash,
        transferHash: transferHash
      }
    } catch (error) {
      console.error("Transfer error:", error)
      reply.status(500).send({ error: "Failed to execute transferFrom" })
    }
  } catch (error) {
    console.error("Transfer error:", error)
    reply.status(500).send({ error: "Failed to execute transferFrom" })
  }
})

app.post("/mint", async (request, reply) => {
  try {
    const body = request.body as { to: string; amount: string }
    const { to, amount } = body

    if (!to || !amount) {
      reply.status(400).send({ error: "Invalid request body" })
      return
    }

    const hash = await walletClient.writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "mint",
      args: [
        to as `0x${string}`,
        BigInt(amount)
      ]
    })

    return {
      success: true,
      transactionHash: hash
    }
  } catch (error) {
    console.error("Mint error:", error)
    reply.status(500).send({ error: "Failed to mint tokens" })
  }
})

app.post("/burn", async (request, reply) => {
  try {
    const body = request.body as { amount: string }
    const { amount } = body

    if (!amount) {
      reply.status(400).send({ error: "Invalid request body" })
      return
    }

    const hash = await walletClient.writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "burn",
      args: [BigInt(amount)]
    })

    return {
      success: true,
      transactionHash: hash
    }
  } catch (error) {
    console.error("Burn error:", error)
    reply.status(500).send({ error: "Failed to burn tokens" })
  }
})

app.post("/blacklist", async (request, reply) => {
  try {
    const body = request.body as { address: string }
    const { address } = body

    if (!address) {
      reply.status(400).send({ error: "Invalid request body" })
      return
    }

    const hash = await walletClient.writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "blacklist",
      args: [address as `0x${string}`]
    })

    return {
      success: true,
      transactionHash: hash
    }
  } catch (error) {
    console.error("Blacklist error:", error)
    reply.status(500).send({ error: "Failed to blacklist address" })
  }
})

app.post("/unblacklist", async (request, reply) => {
  try {
    const body = request.body as { address: string }
    const { address } = body

    if (!address) {
      reply.status(400).send({ error: "Invalid request body" })
      return
    }

    const hash = await walletClient.writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "unblacklist",
      args: [address as `0x${string}`]
    })

    return {
      success: true,
      transactionHash: hash
    }
  } catch (error) {
    console.error("Unblacklist error:", error)
    reply.status(500).send({ error: "Failed to unblacklist address" })
  }
})

app.get("/is-blacklisted/:address", async (request, reply) => {
  try {
    const params = request.params as { address: string }
    const isBlacklisted = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "isBlacklisted",
      args: [params.address as `0x${string}`]
    })

    return {
      isBlacklisted
    }
  } catch (error) {
    console.error("IsBlacklisted error:", error)
    reply.status(500).send({ error: "Failed to check blacklist status" })
  }
})

app.get("/max-supply", async (_, reply) => {
  try {
    const maxSupply = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "maxSupply"
    })

    return {
      maxSupply: formatEther(maxSupply as bigint)
    }
  } catch (error) {
    console.error("Max supply error:", error)
    reply.status(500).send({ error: "Failed to get max supply" })
  }
})

const PORT = process.env.PORT || 3000
app.listen({ port: Number(PORT) }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server running on ${address}`)
})
