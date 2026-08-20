// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AssetTokenization
/// @notice ERC-20 compatible fractional asset token with issuer reserve,
/// transfer controls, valuation metadata, and lightweight token-holder governance.
contract AssetTokenization {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;

    uint256 public immutable totalSupply;
    uint256 public immutable totalFractions;
    uint256 public immutable issuerReserve;

    address public owner;
    address public treasury;

    uint256 public assetValuation;
    string public currencyCode;
    string public assetUri;

    bool public transfersRestricted = true;
    uint256 public votingPeriod;
    uint256 public quorumBps;
    uint256 public proposalCount;
    uint256 public activeProposalCount;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public transferAllowed;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    struct Proposal {
        address proposer;
        string description;
        bytes32 executionDataHash;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        bool canceled;
    }

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TreasuryUpdated(address indexed previousTreasury, address indexed newTreasury);
    event TransferPolicyUpdated(bool restricted);
    event TransferAllowedUpdated(address indexed account, bool allowed);
    event AssetValuationUpdated(uint256 previousValuation, uint256 newValuation, string currencyCode);
    event AssetUriUpdated(string previousUri, string newUri);
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        bytes32 executionDataHash,
        uint256 startTime,
        uint256 endTime
    );
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);
    event ProposalCanceled(uint256 indexed proposalId);

    modifier onlyOwner() {
        require(msg.sender == owner, "AssetTokenization: caller is not owner");
        _;
    }

    modifier validAddress(address account) {
        require(account != address(0), "AssetTokenization: zero address");
        _;
    }

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 fractionCount,
        address saleTreasury,
        uint16 issuerReserveBps,
        uint256 initialAssetValuation,
        string memory initialCurrencyCode,
        string memory initialAssetUri,
        uint256 initialVotingPeriod,
        uint256 initialQuorumBps
    ) validAddress(saleTreasury) {
        require(bytes(tokenName).length > 0, "AssetTokenization: name required");
        require(bytes(tokenSymbol).length > 0, "AssetTokenization: symbol required");
        require(fractionCount > 0, "AssetTokenization: fractions required");
        require(issuerReserveBps <= 10_000, "AssetTokenization: reserve too high");
        require(initialQuorumBps <= 10_000, "AssetTokenization: quorum too high");
        require(initialVotingPeriod >= 1 hours, "AssetTokenization: voting period too short");

        name = tokenName;
        symbol = tokenSymbol;
        owner = msg.sender;
        treasury = saleTreasury;
        totalFractions = fractionCount;
        totalSupply = fractionCount * 10 ** decimals;
        issuerReserve = (totalSupply * issuerReserveBps) / 10_000;
        assetValuation = initialAssetValuation;
        currencyCode = initialCurrencyCode;
        assetUri = initialAssetUri;
        votingPeriod = initialVotingPeriod;
        quorumBps = initialQuorumBps;

        uint256 investorAllocation = totalSupply - issuerReserve;
        balanceOf[msg.sender] = issuerReserve;
        balanceOf[saleTreasury] = investorAllocation;

        transferAllowed[msg.sender] = true;
        transferAllowed[saleTreasury] = true;

        emit Transfer(address(0), msg.sender, issuerReserve);
        emit Transfer(address(0), saleTreasury, investorAllocation);
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function tokenPrice() external view returns (uint256) {
        if (assetValuation == 0) {
            return 0;
        }

        return assetValuation / totalFractions;
    }

    function investorSupply() external view returns (uint256) {
        return totalSupply - issuerReserve;
    }

    function quorumVotes() public view returns (uint256) {
        return (totalSupply * quorumBps) / 10_000;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external validAddress(spender) returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        require(currentAllowance >= value, "AssetTokenization: allowance exceeded");

        unchecked {
            allowance[from][msg.sender] = currentAllowance - value;
        }

        emit Approval(from, msg.sender, allowance[from][msg.sender]);
        _transfer(from, to, value);
        return true;
    }

    function setTransferAllowed(address account, bool allowed) external onlyOwner validAddress(account) {
        transferAllowed[account] = allowed;
        emit TransferAllowedUpdated(account, allowed);
    }

    function setTransfersRestricted(bool restricted) external onlyOwner {
        transfersRestricted = restricted;
        emit TransferPolicyUpdated(restricted);
    }

    function updateTreasury(address newTreasury) external onlyOwner validAddress(newTreasury) {
        address previousTreasury = treasury;
        treasury = newTreasury;
        transferAllowed[newTreasury] = true;
        emit TreasuryUpdated(previousTreasury, newTreasury);
    }

    function updateAssetValuation(uint256 newValuation, string calldata newCurrencyCode) external onlyOwner {
        uint256 previousValuation = assetValuation;
        assetValuation = newValuation;
        currencyCode = newCurrencyCode;
        emit AssetValuationUpdated(previousValuation, newValuation, newCurrencyCode);
    }

    function updateAssetUri(string calldata newAssetUri) external onlyOwner {
        string memory previousUri = assetUri;
        assetUri = newAssetUri;
        emit AssetUriUpdated(previousUri, newAssetUri);
    }

    function updateGovernanceSettings(uint256 newVotingPeriod, uint256 newQuorumBps) external onlyOwner {
        require(newVotingPeriod >= 1 hours, "AssetTokenization: voting period too short");
        require(newQuorumBps <= 10_000, "AssetTokenization: quorum too high");

        votingPeriod = newVotingPeriod;
        quorumBps = newQuorumBps;
    }

    function transferOwnership(address newOwner) external onlyOwner validAddress(newOwner) {
        address previousOwner = owner;
        owner = newOwner;
        transferAllowed[newOwner] = true;
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    function propose(string calldata description, bytes32 executionDataHash) external returns (uint256) {
        require(balanceOf[msg.sender] > 0, "AssetTokenization: proposer has no voting power");
        require(bytes(description).length > 0, "AssetTokenization: description required");
        require(activeProposalCount == 0, "AssetTokenization: proposal already active");

        proposalCount += 1;
        uint256 proposalId = proposalCount;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + votingPeriod;

        proposals[proposalId] = Proposal({
            proposer: msg.sender,
            description: description,
            executionDataHash: executionDataHash,
            startTime: startTime,
            endTime: endTime,
            forVotes: 0,
            againstVotes: 0,
            executed: false,
            canceled: false
        });

        activeProposalCount += 1;

        emit ProposalCreated(proposalId, msg.sender, description, executionDataHash, startTime, endTime);
        return proposalId;
    }

    function castVote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.proposer != address(0), "AssetTokenization: proposal not found");
        require(!proposal.canceled, "AssetTokenization: proposal canceled");
        require(!proposal.executed, "AssetTokenization: proposal executed");
        require(block.timestamp >= proposal.startTime, "AssetTokenization: voting not started");
        require(block.timestamp <= proposal.endTime, "AssetTokenization: voting ended");
        require(!hasVoted[proposalId][msg.sender], "AssetTokenization: already voted");

        uint256 weight = balanceOf[msg.sender];
        require(weight > 0, "AssetTokenization: no voting power");

        hasVoted[proposalId][msg.sender] = true;
        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    function executeProposal(uint256 proposalId) external returns (bool passed) {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.proposer != address(0), "AssetTokenization: proposal not found");
        require(!proposal.canceled, "AssetTokenization: proposal canceled");
        require(!proposal.executed, "AssetTokenization: already executed");
        require(block.timestamp > proposal.endTime, "AssetTokenization: voting still active");

        proposal.executed = true;
        activeProposalCount -= 1;

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        passed = proposal.forVotes > proposal.againstVotes && totalVotes >= quorumVotes();

        emit ProposalExecuted(proposalId, passed);
    }

    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.proposer != address(0), "AssetTokenization: proposal not found");
        require(!proposal.canceled, "AssetTokenization: already canceled");
        require(!proposal.executed, "AssetTokenization: already executed");
        require(msg.sender == owner || msg.sender == proposal.proposer, "AssetTokenization: cannot cancel");

        proposal.canceled = true;
        activeProposalCount -= 1;

        emit ProposalCanceled(proposalId);
    }

    function _transfer(address from, address to, uint256 value) internal validAddress(to) {
        require(activeProposalCount == 0, "AssetTokenization: governance vote active");
        require(balanceOf[from] >= value, "AssetTokenization: balance too low");

        if (transfersRestricted) {
            require(
                transferAllowed[from] || transferAllowed[to],
                "AssetTokenization: transfer not allowed"
            );
        }

        unchecked {
            balanceOf[from] -= value;
        }
        balanceOf[to] += value;

        emit Transfer(from, to, value);
    }
}
