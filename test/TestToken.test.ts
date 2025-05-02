import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { TestToken } from "../typechain-types";

describe("TestToken", function () {
  let token: TestToken;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  const initialSupply = ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("TestToken");
    token = await Token.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(await token.totalSupply()).to.equal(ownerBalance);
    });

    it("Should set the correct max supply", async function () {
      expect(await token.maxSupply()).to.equal(initialSupply);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      await token.transfer(addr1.address, 50);
      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await token.balanceOf(owner.address);
      await expect(
        token.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
      expect(await token.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await token.balanceOf(owner.address);
      await token.transfer(addr1.address, 100);
      await token.transfer(addr2.address, 50);

      const finalOwnerBalance = await token.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance - 150n);

      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(100);

      const addr2Balance = await token.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint new tokens", async function () {
      // First burn some tokens to make room for minting
      await token.burn(100);
      await token.mint(addr1.address, 100);
      expect(await token.balanceOf(addr1.address)).to.equal(100);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      await expect(
        token.connect(addr1).mint(addr1.address, 100)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("Should not allow minting beyond max supply", async function () {
      await expect(
        token.mint(addr1.address, initialSupply + 1n)
      ).to.be.revertedWith("Exceeds max supply");
    });
  });

  describe("Burning", function () {
    it("Should allow owner to burn tokens", async function () {
      await token.burn(50);
      expect(await token.balanceOf(owner.address)).to.equal(initialSupply - 50n);
    });

    it("Should not allow burning more tokens than balance", async function () {
      await expect(
        token.connect(addr1).burn(1)
      ).to.be.revertedWithCustomError(token, "InsufficientBalance");
    });
  });

  describe("Blacklist", function () {
    it("Should allow owner to blacklist addresses", async function () {
      await token.blacklist(addr1.address);
      expect(await token.isBlacklisted(addr1.address)).to.be.true;
    });

    it("Should not allow non-owner to blacklist addresses", async function () {
      await expect(
        token.connect(addr1).blacklist(addr2.address)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("Should prevent blacklisted addresses from transferring", async function () {
      await token.transfer(addr1.address, 100);
      await token.blacklist(addr1.address);
      await expect(
        token.connect(addr1).transfer(addr2.address, 50)
      ).to.be.revertedWithCustomError(token, "BlacklistedAddress");
    });

    it("Should allow owner to unblacklist addresses", async function () {
      await token.blacklist(addr1.address);
      await token.unblacklist(addr1.address);
      expect(await token.isBlacklisted(addr1.address)).to.be.false;
    });
  });
});
