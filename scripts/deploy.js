const hre = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

async function main() {
  // Setup accounts
  const [buyer, seller, inspector, lender] = await ethers.getSigners();

  // Deploy Real Estate
  const RealEstate = await ethers.getContractFactory("RealEstate");
  const realEstate = await RealEstate.deploy();
  await realEstate.deployed();

  console.log(`Deployed Real Estate Contract at: ${realEstate.address}`);
  console.log(`Minting 6 properties...\n`);

  for (let i = 0; i < 6; i++) {
    const transaction = await realEstate
      .connect(seller)
      .mint(
        `https://gateway.pinata.cloud/ipfs/QmUUFH2f6LowkJ1P97v4x6K687S5CbdtYQ93vviGYw7NKg/${
          i + 1
        }.json`
      );
    await transaction.wait();
  }

  // Deploy Escrow
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(
    realEstate.address,
    seller.address,
    inspector.address,
    lender.address
  );
  await escrow.deployed();

  console.log(`Deployed Escrow Contract at: ${escrow.address}`);
  console.log(`Listing 6 properties...\n`);

  for (let i = 0; i < 6; i++) {
    // Approve properties...
    let transaction = await realEstate
      .connect(seller)
      .approve(escrow.address, i + 1);
    await transaction.wait();
  }

  // Listing properties...
  transaction = await escrow
    .connect(seller)
    .list(1, buyer.address, tokens(80), tokens(40));
  await transaction.wait();

  transaction = await escrow
    .connect(seller)
    .list(2, buyer.address, tokens(70), tokens(35));
  await transaction.wait();

  transaction = await escrow
    .connect(seller)
    .list(3, buyer.address, tokens(60), tokens(30));
  await transaction.wait();

  transaction = await escrow
    .connect(seller)
    .list(4, buyer.address, tokens(50), tokens(25));
  await transaction.wait();

  transaction = await escrow
    .connect(seller)
    .list(5, buyer.address, tokens(45), tokens(22));
  await transaction.wait();

  transaction = await escrow
    .connect(seller)
    .list(6, buyer.address, tokens(55), tokens(27));
  await transaction.wait();

  console.log(`Finished.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
