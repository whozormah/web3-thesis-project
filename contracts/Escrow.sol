//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {
    address public nftAddress;
    address payable public seller;
    address public inspector;
    address public lender;

    // Events to track actions
    event PropertyListed(uint256 nftID, address buyer, uint256 price, uint256 escrowAmount);
    event SaleApproved(uint256 nftID, address approver);
    event SaleFinalized(uint256 nftID, address buyer, address seller);
    event SaleCancelled(uint256 nftID);

    // Modifiers
    modifier onlyBuyer(uint256 _nftID) {
        require(msg.sender == buyer[_nftID], "Only buyer can call this method");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this method");
        _;
    }

    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector can call this method");
        _;
    }

    // Mappings
    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionPassed;
    mapping(uint256 => mapping(address => bool)) public approval;

    constructor(
        address _nftAddress,
        address payable _seller,
        address _inspector,
        address _lender
    ) {
        nftAddress = _nftAddress;
        seller = _seller;
        inspector = _inspector;
        lender = _lender;
    }

    // List the property (NFT) on the Escrow contract
    function list(
        uint256 _nftID,
        address _buyer,
        uint256 _purchasePrice,
        uint256 _escrowAmount
    ) public payable onlySeller {
        // Transfer NFT from seller to this contract
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);

        isListed[_nftID] = true;
        purchasePrice[_nftID] = _purchasePrice;
        escrowAmount[_nftID] = _escrowAmount;
        buyer[_nftID] = _buyer;

        emit PropertyListed(_nftID, _buyer, _purchasePrice, _escrowAmount);
    }

    // Buyer deposits earnest money
    function depositEarnest(uint256 _nftID) public payable onlyBuyer(_nftID) {
        require(msg.value >= escrowAmount[_nftID], "Insufficient escrow amount");
    }

    // Inspector updates inspection status
    function updateInspectionStatus(uint256 _nftID, bool _passed) public onlyInspector {
        inspectionPassed[_nftID] = _passed;
    }

    // Approve the sale
    function approveSale(uint256 _nftID) public {
        approval[_nftID][msg.sender] = true;
        emit SaleApproved(_nftID, msg.sender);
    }

    // Finalize the sale when all conditions are met
    function finalizeSale(uint256 _nftID) public {
        require(inspectionPassed[_nftID], "Inspection has not been passed");
        require(approval[_nftID][buyer[_nftID]], "Buyer has not approved");
        require(approval[_nftID][seller], "Seller has not approved");
        require(approval[_nftID][lender], "Lender has not approved");
        require(address(this).balance >= purchasePrice[_nftID], "Insufficient funds to finalize");

        isListed[_nftID] = false;

        (bool success, ) = payable(seller).call{value: address(this).balance}("");
        require(success, "Transfer to seller failed");

        // Transfer NFT to the buyer
        IERC721(nftAddress).transferFrom(address(this), buyer[_nftID], _nftID);

        emit SaleFinalized(_nftID, buyer[_nftID], seller);
    }

    // Cancel the sale and handle earnest deposit refund
    function cancelSale(uint256 _nftID) public {
        if (!inspectionPassed[_nftID]) {
            payable(buyer[_nftID]).transfer(address(this).balance);
        } else {
            payable(seller).transfer(address(this).balance);
        }

        emit SaleCancelled(_nftID);
    }

    // Allow contract to receive Ether
    receive() external payable {}

    // Get the balance of the contract (total escrow funds)
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
