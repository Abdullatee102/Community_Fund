// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title CommunityFund
/// @notice A single-purpose community fund with contributor-approved spending.
/// @dev One contract instance represents one fund. Contributors have equal voting
///      weight; contribution size never changes approval power.
contract CommunityFund is ReentrancyGuard {
    enum FundStatus {
        Funding,
        Funded,
        Failed,
        Completed,
        Cancelled
    }

    struct SpendingRequest {
        address recipient;
        uint256 amount;
        string metadataUri;
        uint256 approvalCount;
        bool executed;
        bool cancelled;
    }

    address public immutable creator;
    string public title;
    string public metadataUri;
    uint256 public immutable fundingTarget;
    uint256 public immutable fundingDeadline;
    uint256 public amountRaised;
    uint256 public contributorCount;
    uint256 public requiredApprovals;
    FundStatus public status;

    mapping(address contributor => uint256 amount) public contributions;
    mapping(address contributor => bool refunded) public refunded;
    address[] private contributors;
    SpendingRequest[] private spendingRequests;
    mapping(uint256 requestId => mapping(address contributor => bool approved)) public approvals;

    error InvalidTarget();
    error InvalidDeadline();
    error InvalidTitle();
    error InvalidRecipient();
    error InvalidAmount();
    error NotCreator();
    error WrongStatus();
    error DeadlinePassed();
    error DeadlineNotReached();
    error GoalReached();
    error ExceedsTarget();
    error NotContributor();
    error AlreadyApproved();
    error AlreadyRefunded();
    error RequestNotFound();
    error RequestNotExecutable();
    error InsufficientBalance();
    error TransferFailed();

    event FundCreated(
        address indexed fund,
        address indexed creator,
        string title,
        string metadataUri,
        uint256 target,
        uint256 deadline
    );
    event ContributionMade(address indexed contributor, uint256 amount, uint256 totalRaised);
    event FundingGoalReached(uint256 totalRaised, uint256 requiredApprovals);
    event FundingFailed();
    event SpendingRequestCreated(uint256 indexed requestId, address indexed recipient, uint256 amount, string metadataUri);
    event SpendingRequestApproved(uint256 indexed requestId, address indexed contributor, uint256 approvalCount);
    event SpendingRequestExecuted(uint256 indexed requestId, address indexed recipient, uint256 amount);
    event RefundClaimed(address indexed contributor, uint256 amount);
    event FundCompleted();
    event FundCancelled();

    constructor(
        string memory title_,
        string memory metadataUri_,
        uint256 fundingTarget_,
        uint256 fundingDeadline_
    ) {
        if (bytes(title_).length == 0) revert InvalidTitle();
        if (fundingTarget_ == 0) revert InvalidTarget();
        if (fundingDeadline_ <= block.timestamp) revert InvalidDeadline();

        creator = msg.sender;
        title = title_;
        metadataUri = metadataUri_;
        fundingTarget = fundingTarget_;
        fundingDeadline = fundingDeadline_;
        status = FundStatus.Funding;

        emit FundCreated(address(this), msg.sender, title_, metadataUri_, fundingTarget_, fundingDeadline_);
    }

    function contribute() external payable nonReentrant {
        if (status != FundStatus.Funding) revert WrongStatus();
        if (block.timestamp >= fundingDeadline) revert DeadlinePassed();
        if (msg.value == 0) revert InvalidAmount();
        if (amountRaised == fundingTarget) revert GoalReached();
        if (amountRaised + msg.value > fundingTarget) revert ExceedsTarget();

        if (contributions[msg.sender] == 0) {
            contributors.push(msg.sender);
            contributorCount += 1;
        }
        contributions[msg.sender] += msg.value;
        amountRaised += msg.value;
        emit ContributionMade(msg.sender, msg.value, amountRaised);

        if (amountRaised == fundingTarget) {
            status = FundStatus.Funded;
            requiredApprovals = contributorCount / 2 + 1;
            emit FundingGoalReached(amountRaised, requiredApprovals);
        }
    }

    function markFundingFailed() external {
        if (status != FundStatus.Funding) revert WrongStatus();
        if (block.timestamp < fundingDeadline) revert DeadlineNotReached();
        status = FundStatus.Failed;
        emit FundingFailed();
    }

    function cancelFund() external {
        if (msg.sender != creator) revert NotCreator();
        if (status != FundStatus.Funding) revert WrongStatus();
        status = FundStatus.Cancelled;
        emit FundCancelled();
    }

    function createSpendingRequest(
        address recipient,
        uint256 amount,
        string calldata metadataUri_
    ) external returns (uint256 requestId) {
        if (msg.sender != creator) revert NotCreator();
        if (status != FundStatus.Funded) revert WrongStatus();
        if (recipient == address(0)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();

        requestId = spendingRequests.length;
        spendingRequests.push(
            SpendingRequest({
                recipient: recipient,
                amount: amount,
                metadataUri: metadataUri_,
                approvalCount: 0,
                executed: false,
                cancelled: false
            })
        );
        emit SpendingRequestCreated(requestId, recipient, amount, metadataUri_);
    }

    function approveSpendingRequest(uint256 requestId) external {
        if (status != FundStatus.Funded) revert WrongStatus();
        if (requestId >= spendingRequests.length) revert RequestNotFound();
        SpendingRequest storage request = spendingRequests[requestId];
        if (request.executed || request.cancelled) revert RequestNotExecutable();
        if (contributions[msg.sender] == 0) revert NotContributor();
        if (approvals[requestId][msg.sender]) revert AlreadyApproved();

        approvals[requestId][msg.sender] = true;
        request.approvalCount += 1;
        emit SpendingRequestApproved(requestId, msg.sender, request.approvalCount);
    }

    function cancelSpendingRequest(uint256 requestId) external {
        if (msg.sender != creator) revert NotCreator();
        if (status != FundStatus.Funded) revert WrongStatus();
        if (requestId >= spendingRequests.length) revert RequestNotFound();
        SpendingRequest storage request = spendingRequests[requestId];
        if (request.executed || request.cancelled) revert RequestNotExecutable();
        request.cancelled = true;
    }

    function executeSpendingRequest(uint256 requestId) external nonReentrant {
        if (status != FundStatus.Funded) revert WrongStatus();
        if (requestId >= spendingRequests.length) revert RequestNotFound();
        SpendingRequest storage request = spendingRequests[requestId];
        if (request.executed || request.cancelled || request.approvalCount < requiredApprovals) {
            revert RequestNotExecutable();
        }
        if (address(this).balance < request.amount) revert InsufficientBalance();

        request.executed = true;
        (bool success,) = request.recipient.call{value: request.amount}("");
        if (!success) revert TransferFailed();
        emit SpendingRequestExecuted(requestId, request.recipient, request.amount);

        if (address(this).balance == 0) {
            status = FundStatus.Completed;
            emit FundCompleted();
        }
    }

    function claimRefund() external nonReentrant {
        if (status != FundStatus.Failed && status != FundStatus.Cancelled) revert WrongStatus();
        uint256 amount = contributions[msg.sender];
        if (amount == 0) revert NotContributor();
        if (refunded[msg.sender]) revert AlreadyRefunded();

        refunded[msg.sender] = true;
        (bool success,) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();
        emit RefundClaimed(msg.sender, amount);
    }

    function getContributors() external view returns (address[] memory) {
        return contributors;
    }

    function getSpendingRequest(uint256 requestId) external view returns (SpendingRequest memory) {
        if (requestId >= spendingRequests.length) revert RequestNotFound();
        return spendingRequests[requestId];
    }

    function spendingRequestCount() external view returns (uint256) {
        return spendingRequests.length;
    }
}
