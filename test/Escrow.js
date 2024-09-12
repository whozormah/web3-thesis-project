const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow", () => {
  let RealEstate, realEstate, Escrow, escrow;
  let governmentAgent, lender, owner1, owner2, contractOwner;

  // URLs for metadata of the six properties
  const tokenURIs = [
    "https://ipfs.io/ipfs/QmUUFH2f6LowkJ1P97v4x6K687S5CbdtYQ93vviGYw7NKg/1.json",
    "https://ipfs.io/ipfs/QmUUFH2f6LowkJ1P97v4x6K687S5CbdtYQ93vviGYw7NKg/2.json",
    "https://ipfs.io/ipfs/QmUUFH2f6LowkJ1P97v4x6K687S5CbdtYQ93vviGYw7NKg/3.json",
    "https://ipfs.io/ipfs/QmUUFH2f6LowkJ1P97v4x6K687S5CbdtYQ93vviGYw7NKg/4.json",
    "https://ipfs.io/ipfs/QmUUFH2f6LowkJ1P97v4x6K687S5CbdtYQ93vviGYw7NKg/5.json",
    "https://ipfs.io/ipfs/QmUUFH2f6LowkJ1P97v4x6K687S5CbdtYQ93vviGYw7NKg/6.json",
  ];

  beforeEach(async () => {
    // Get the signers for the government agent, lender, owners, and contract owner
    [contractOwner, governmentAgent, lender, owner1, owner2] =
      await ethers.getSigners();

    // Deploy RealEstate Contract using contractOwner (Account #0)
    RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.connect(contractOwner).deploy();
    await realEstate.deployed();

    // Mint the first 3 properties for owner1 by the contractOwner
    for (let i = 0; i < 3; i++) {
      await realEstate.connect(contractOwner).mint(tokenURIs[i]);
      await realEstate
        .connect(contractOwner)
        .transferFrom(contractOwner.address, owner1.address, i + 1); // Transfer to owner1
    }

    // Mint the last 3 properties for owner2 by the contractOwner
    for (let i = 3; i < 6; i++) {
      await realEstate.connect(contractOwner).mint(tokenURIs[i]);
      await realEstate
        .connect(contractOwner)
        .transferFrom(contractOwner.address, owner2.address, i + 1); // Transfer to owner2
    }

    // Deploy Escrow Contract with the correct roles
    Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      realEstate.address,
      owner1.address, // Owner of first 3 properties
      governmentAgent.address, // Government agent
      lender.address // Lender
    );
    await escrow.deployed();

    // Owner1 lists the first property (property 1)
    await realEstate.connect(owner1).approve(escrow.address, 1);
    await escrow.connect(owner1).list(
      1,
      owner2.address, // The buyer is owner2 for this test
      ethers.utils.parseUnits("100", "ether"),
      ethers.utils.parseUnits("10", "ether")
    );
  });

  // Test to confirm properties are listed
  it("Should list the property correctly", async () => {
    const listed = await escrow.isListed(1);
    expect(listed).to.equal(true);

    const purchasePrice = await escrow.purchasePrice(1);
    expect(purchasePrice).to.equal(ethers.utils.parseUnits("100", "ether"));
  });

  // Test to allow buyer (owner2) to deposit earnest money
  it("Should allow buyer to deposit earnest money", async () => {
    await escrow
      .connect(owner2) // Buyer deposits earnest money
      .depositEarnest(1, { value: ethers.utils.parseUnits("10", "ether") });
    const balance = await escrow.getBalance();
    expect(balance).to.equal(ethers.utils.parseUnits("10", "ether"));
  });

  // Test to allow government agent to update inspection status
  it("Should allow government agent to update inspection status", async () => {
    await escrow.connect(governmentAgent).updateInspectionStatus(1, true);
    const inspectionPassed = await escrow.inspectionPassed(1);
    expect(inspectionPassed).to.equal(true);
  });

  // Test to allow all parties to approve the sale
  it("Should allow all parties to approve the sale", async () => {
    await escrow.connect(owner2).approveSale(1); // Buyer approves
    await escrow.connect(owner1).approveSale(1); // Seller approves
    await escrow.connect(lender).approveSale(1); // Lender approves

    const buyerApproval = await escrow.approval(1, owner2.address);
    const sellerApproval = await escrow.approval(1, owner1.address);
    const lenderApproval = await escrow.approval(1, lender.address);

    expect(buyerApproval).to.equal(true);
    expect(sellerApproval).to.equal(true);
    expect(lenderApproval).to.equal(true);
  });

  // Test to finalize the sale after all approvals
  it("Should finalize the sale after approvals", async () => {
    // Government agent completes inspection
    await escrow.connect(governmentAgent).updateInspectionStatus(1, true);

    // All parties approve the sale
    await escrow.connect(owner2).approveSale(1); // Buyer approves
    await escrow.connect(owner1).approveSale(1); // Seller approves
    await escrow.connect(lender).approveSale(1); // Lender approves

    // Buyer deposits the full purchase price (100 ETH)
    await escrow
      .connect(owner2)
      .depositEarnest(1, { value: ethers.utils.parseUnits("100", "ether") });

    // Finalize the sale
    await escrow.connect(owner2).finalizeSale(1);

    const newOwner = await realEstate.ownerOf(1);
    expect(newOwner).to.equal(owner2.address); // Buyer (owner2) should now own the property
  });

  // Test for refunding the buyer if sale is canceled after failed inspection
  it("Should refund the buyer if the sale is canceled after failed inspection", async () => {
    // Government agent fails the inspection
    await escrow.connect(governmentAgent).updateInspectionStatus(1, false);

    // Buyer deposits earnest money
    await escrow
      .connect(owner2)
      .depositEarnest(1, { value: ethers.utils.parseUnits("10", "ether") });

    // Cancel the sale
    await escrow.connect(owner2).cancelSale(1);

    const escrowBalance = await escrow.getBalance();
    expect(escrowBalance).to.equal(0); // Should be refunded

    const buyerBalanceAfterRefund = await ethers.provider.getBalance(
      owner2.address
    );
    console.log(
      `Buyer balance after refund: ${buyerBalanceAfterRefund.toString()}`
    );
  });
});
