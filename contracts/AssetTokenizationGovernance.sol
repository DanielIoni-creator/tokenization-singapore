// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AssetTokenizationGovernance
 * @dev Smart Contract for real estate asset tokenization, fractional ownership, transfer, and governance.
 * Resolves Issue #20 (Smart Contract per Tokenizzazione)
 */
contract AssetTokenizationGovernance {
    // Custom Errors
    error Unauthorized();
    error AssetAlreadyExists(uint256 assetId);
    error AssetNotFound(uint256 assetId);
    error InsufficientFractions(uint256 requested, uint256 available);
    error ProposalEnded();
    error AlreadyVoted();
    error ProposalNotApproved();

    // Structs
    struct Asset {
        uint256 id;
        string name;
        string location;
        uint256 totalFractions;
        uint256 pricePerFraction; // in wei
        bool isFractionalized;
        address owner;
    }

    struct Proposal {
        uint256 id;
        uint256 assetId;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
    }

    // State Variables
    address public admin;
    uint256 public assetCount;
    uint256 public proposalCount;

    // Mappings
    mapping(uint256 => Asset) public assets;
    mapping(uint256 => mapping(address => uint256)) public fractionBalances;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // Events
    event AssetRegistered(uint256 indexed assetId, string name, string location, uint256 totalFractions, uint256 pricePerFraction);
    event AssetFractionalized(uint256 indexed assetId, uint256 totalFractions);
    event FractionTransferred(uint256 indexed assetId, address indexed from, address indexed to, uint256 amount);
    event ProposalCreated(uint256 indexed proposalId, uint256 indexed assetId, string description, uint256 deadline);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId, bool approved);

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Register a new real estate asset for tokenization
     */
    function registerAsset(
        uint256 _id,
        string calldata _name,
        string calldata _location,
        uint256 _totalFractions,
        uint256 _pricePerFraction
    ) external onlyAdmin {
        if (assets[_id].id != 0) revert AssetAlreadyExists(_id);

        assets[_id] = Asset({
            id: _id,
            name: _name,
            location: _location,
            totalFractions: _totalFractions,
            pricePerFraction: _pricePerFraction,
            isFractionalized: true,
            owner: msg.sender
        });

        fractionBalances[_id][msg.sender] = _totalFractions;
        assetCount++;

        emit AssetRegistered(_id, _name, _location, _totalFractions, _pricePerFraction);
        emit AssetFractionalized(_id, _totalFractions);
    }

    /**
     * @dev Transfer fractional ownership tokens of an asset
     */
    function transferFraction(uint256 _assetId, address _to, uint256 _amount) external {
        if (assets[_assetId].id == 0) revert AssetNotFound(_assetId);
        if (fractionBalances[_assetId][msg.sender] < _amount) {
            revert InsufficientFractions(_amount, fractionBalances[_assetId][msg.sender]);
        }

        fractionBalances[_assetId][msg.sender] -= _amount;
        fractionBalances[_assetId][_to] += _amount;

        emit FractionTransferred(_assetId, msg.sender, _to, _amount);
    }

    /**
     * @dev Create a governance proposal for a tokenized asset
     */
    function createProposal(
        uint256 _assetId,
        string calldata _description,
        uint256 _durationSeconds
    ) external returns (uint256) {
        if (assets[_assetId].id == 0) revert AssetNotFound(_assetId);
        if (fractionBalances[_assetId][msg.sender] == 0) revert Unauthorized();

        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            assetId: _assetId,
            description: _description,
            votesFor: 0,
            votesAgainst: 0,
            deadline: block.timestamp + _durationSeconds,
            executed: false
        });

        emit ProposalCreated(proposalCount, _assetId, _description, block.timestamp + _durationSeconds);
        return proposalCount;
    }

    /**
     * @dev Vote on an asset governance proposal using fractional weight
     */
    function voteOnProposal(uint256 _proposalId, bool _support) external {
        Proposal storage proposal = proposals[_proposalId];
        if (proposal.id == 0) revert AssetNotFound(_proposalId);
        if (block.timestamp > proposal.deadline) revert ProposalEnded();
        if (hasVoted[_proposalId][msg.sender]) revert AlreadyVoted();

        uint256 weight = fractionBalances[proposal.assetId][msg.sender];
        if (weight == 0) revert Unauthorized();

        hasVoted[_proposalId][msg.sender] = true;

        if (_support) {
            proposal.votesFor += weight;
        } else {
            proposal.votesAgainst += weight;
        }

        emit Voted(_proposalId, msg.sender, _support, weight);
    }

    /**
     * @dev Execute a governance proposal after deadline
     */
    function executeProposal(uint256 _proposalId) external onlyAdmin {
        Proposal storage proposal = proposals[_proposalId];
        if (proposal.id == 0) revert AssetNotFound(_proposalId);
        if (block.timestamp <= proposal.deadline) revert Unauthorized();
        if (proposal.executed) revert ProposalEnded();

        proposal.executed = true;
        bool approved = proposal.votesFor > proposal.votesAgainst;

        emit ProposalExecuted(_proposalId, approved);
    }
}
