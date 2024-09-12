const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RealEstate", () => {
  let RealEstate, realEstate, owner, buyer, other;

  beforeEach(async () => {
    [owner, buyer, other] = await ethers.getSigners();

    RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.connect(owner).deploy();
    await realEstate.deployed();
  });

  describe("Deployment", () => {
    it("Should set the right owner", async () => {
      // Assuming RealEstate is Ownable
      expect(await realEstate.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", () => {
    it("Should allow owner to mint a new property using IPFS CID", async () => {
      const ipfsHash = "QmNrkK4mZqNyjQaohnapsq6kqTSv2FSZio5redFSypNFfg"; // Example IPFS CID

      await realEstate.connect(owner).mint(ipfsHash);
      expect(await realEstate.totalSupply()).to.equal(1);

      const tokenURI = await realEstate.tokenURI(1);
      expect(tokenURI).to.equal(ipfsHash);
    });

    it("Should revert if non-owner tries to mint a new property", async () => {
      const ipfsHash = "QmZ1qEg8ppy9YcKZxL1LC3QeGypAeCEw9Rkns4mrCiJQRR"; // Example IPFS CID

      await expect(realEstate.connect(buyer).mint(ipfsHash)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("Ownership", () => {
    beforeEach(async () => {
      const ipfsHash = "QmNrkK4mZqNyjQaohnapsq6kqTSv2FSZio5redFSypNFfg";
      await realEstate.connect(owner).mint(ipfsHash);
    });

    it("Should correctly transfer ownership upon minting", async () => {
      expect(await realEstate.ownerOf(1)).to.equal(owner.address);
    });

    it("Should allow owner to transfer ownership", async () => {
      await realEstate
        .connect(owner)
        .transferFrom(owner.address, buyer.address, 1);
      expect(await realEstate.ownerOf(1)).to.equal(buyer.address);
    });

    it("Should revert if non-owner tries to transfer ownership", async () => {
      await expect(
        realEstate.connect(other).transferFrom(owner.address, buyer.address, 1)
      ).to.be.revertedWith("ERC721: caller is not token owner nor approved");
    });
  });
});
