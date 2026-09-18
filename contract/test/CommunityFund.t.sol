// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CommunityFund} from "../src/CommunityFund.sol";

contract CommunityFundTest is Test {
    CommunityFund internal fund;
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");
    address internal recipient = makeAddr("recipient");
    uint256 internal constant TARGET = 10 ether;

    function setUp() public {
        fund = new CommunityFund("Community solar", "ipfs://community-fund-metadata", TARGET, block.timestamp + 30 days);
        vm.deal(alice, 20 ether);
        vm.deal(bob, 20 ether);
        vm.deal(carol, 20 ether);
    }

    function testCreationStoresConfigurationAndStartsFunding() public view {
        assertEq(fund.creator(), address(this));
        assertEq(fund.title(), "Community solar");
        assertEq(fund.metadataUri(), "ipfs://community-fund-metadata");
        assertEq(fund.fundingTarget(), TARGET);
        assertEq(uint8(fund.status()), uint8(CommunityFund.FundStatus.Funding));
        assertEq(fund.amountRaised(), 0);
        assertEq(fund.contributorCount(), 0);
    }

    function testRejectsInvalidCreation() public {
        vm.expectRevert(CommunityFund.InvalidTitle.selector);
        new CommunityFund("", "ipfs://metadata", TARGET, block.timestamp + 1 days);

        vm.expectRevert(CommunityFund.InvalidTarget.selector);
        new CommunityFund("Title", "ipfs://metadata", 0, block.timestamp + 1 days);

        vm.expectRevert(CommunityFund.InvalidDeadline.selector);
        new CommunityFund("Title", "ipfs://metadata", TARGET, block.timestamp);
    }

    function testContributionTracksContributorAndAmount() public {
        vm.expectEmit(false, true, false, true);
        emit CommunityFund.ContributionMade(alice, 3 ether, 3 ether);
        vm.prank(alice);
        fund.contribute{value: 3 ether}();

        vm.prank(alice);
        fund.contribute{value: 2 ether}();
        vm.prank(bob);
        fund.contribute{value: 5 ether}();

        assertEq(fund.contributions(alice), 5 ether);
        assertEq(fund.contributions(bob), 5 ether);
        assertEq(fund.amountRaised(), TARGET);
        assertEq(fund.contributorCount(), 2);
        assertEq(fund.getContributors().length, 2);
    }

    function testRejectsZeroLateAndExcessContributions() public {
        vm.prank(alice);
        vm.expectRevert(CommunityFund.InvalidAmount.selector);
        fund.contribute{value: 0}();

        vm.prank(alice);
        vm.expectRevert(CommunityFund.ExceedsTarget.selector);
        fund.contribute{value: TARGET + 1}();

        vm.warp(block.timestamp + 30 days);
        vm.prank(alice);
        vm.expectRevert(CommunityFund.DeadlinePassed.selector);
        fund.contribute{value: 1 ether}();
    }

    function testReachingGoalSetsFundedAndApprovalThreshold() public {
        vm.prank(alice);
        fund.contribute{value: 4 ether}();
        vm.expectEmit(false, false, false, true);
        emit CommunityFund.FundingGoalReached(TARGET, 2);
        vm.prank(bob);
        fund.contribute{value: 6 ether}();

        assertEq(uint8(fund.status()), uint8(CommunityFund.FundStatus.Funded));
        assertEq(fund.requiredApprovals(), 2);

        vm.prank(carol);
        vm.expectRevert(CommunityFund.WrongStatus.selector);
        fund.contribute{value: 1 ether}();
    }

    function testAnyoneCanMarkFailedAfterDeadlineAndContributorsCanRefund() public {
        vm.prank(alice);
        fund.contribute{value: 3 ether}();
        vm.warp(fund.fundingDeadline() - 1);
        vm.expectRevert(CommunityFund.DeadlineNotReached.selector);
        fund.markFundingFailed();

        vm.warp(fund.fundingDeadline());
        fund.markFundingFailed();
        assertEq(uint8(fund.status()), uint8(CommunityFund.FundStatus.Failed));

        uint256 balanceBefore = alice.balance;
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit CommunityFund.RefundClaimed(alice, 3 ether);
        fund.claimRefund();
        assertEq(alice.balance, balanceBefore + 3 ether);

        vm.prank(alice);
        vm.expectRevert(CommunityFund.AlreadyRefunded.selector);
        fund.claimRefund();
    }

    function testCreatorCanCancelFundingAndRefundsRemainAvailable() public {
        vm.prank(alice);
        fund.contribute{value: 2 ether}();
        fund.cancelFund();
        assertEq(uint8(fund.status()), uint8(CommunityFund.FundStatus.Cancelled));

        vm.prank(alice);
        fund.claimRefund();
    }

    function testRefundIsProtectedFromReentrancy() public {
        ReentrantContributor attacker = new ReentrantContributor(fund);
        attacker.contribute{value: 3 ether}();
        vm.warp(fund.fundingDeadline());
        fund.markFundingFailed();

        attacker.claimRefund();
        assertTrue(fund.refunded(address(attacker)));
        assertEq(address(attacker).balance, 3 ether);
    }

    function testOnlyCreatorCanCancelOrCreateSpendingRequest() public {
        vm.prank(alice);
        vm.expectRevert(CommunityFund.NotCreator.selector);
        fund.cancelFund();

        vm.prank(alice);
        vm.expectRevert(CommunityFund.NotCreator.selector);
        fund.createSpendingRequest(recipient, 1 ether, "ipfs://expense");
    }

    function testSpendingRequestRequiresFundedStateAndValidRecipientAmount() public {
        vm.expectRevert(CommunityFund.WrongStatus.selector);
        fund.createSpendingRequest(recipient, 1 ether, "ipfs://expense");

        _reachGoal();
        vm.expectRevert(CommunityFund.InvalidRecipient.selector);
        fund.createSpendingRequest(address(0), 1 ether, "ipfs://expense");
        vm.expectRevert(CommunityFund.InvalidAmount.selector);
        fund.createSpendingRequest(recipient, 0, "ipfs://expense");

        uint256 requestId = fund.createSpendingRequest(recipient, 2 ether, "ipfs://expense");
        CommunityFund.SpendingRequest memory request = fund.getSpendingRequest(requestId);
        assertEq(request.recipient, recipient);
        assertEq(request.amount, 2 ether);
        assertEq(request.metadataUri, "ipfs://expense");
    }

    function testContributorApprovalIsEqualWeightAndUnique() public {
        _reachGoal();
        uint256 requestId = fund.createSpendingRequest(recipient, 2 ether, "ipfs://expense");

        vm.prank(carol);
        vm.expectRevert(CommunityFund.NotContributor.selector);
        fund.approveSpendingRequest(requestId);

        vm.prank(alice);
        fund.approveSpendingRequest(requestId);
        assertTrue(fund.approvals(requestId, alice));

        vm.prank(alice);
        vm.expectRevert(CommunityFund.AlreadyApproved.selector);
        fund.approveSpendingRequest(requestId);

        CommunityFund.SpendingRequest memory request = fund.getSpendingRequest(requestId);
        assertEq(request.approvalCount, 1);
    }

    function testCannotExecuteWithoutThresholdAndCanExecuteAfterThreshold() public {
        _reachGoal();
        uint256 requestId = fund.createSpendingRequest(recipient, 2 ether, "ipfs://expense");

        vm.prank(alice);
        fund.approveSpendingRequest(requestId);
        vm.expectRevert(CommunityFund.RequestNotExecutable.selector);
        fund.executeSpendingRequest(requestId);

        vm.prank(bob);
        fund.approveSpendingRequest(requestId);
        uint256 recipientBefore = recipient.balance;
        fund.executeSpendingRequest(requestId);
        assertEq(recipient.balance, recipientBefore + 2 ether);

        CommunityFund.SpendingRequest memory request = fund.getSpendingRequest(requestId);
        assertTrue(request.executed);
        vm.expectRevert(CommunityFund.RequestNotExecutable.selector);
        fund.executeSpendingRequest(requestId);
    }

    function testFullSpendCompletesFund() public {
        _reachGoal();
        uint256 requestId = fund.createSpendingRequest(recipient, TARGET, "ipfs://full-expense");
        vm.prank(alice);
        fund.approveSpendingRequest(requestId);
        vm.prank(bob);
        fund.approveSpendingRequest(requestId);
        fund.executeSpendingRequest(requestId);
        assertEq(uint8(fund.status()), uint8(CommunityFund.FundStatus.Completed));
    }

    function testInsufficientBalancePreventsExecution() public {
        _reachGoal();
        uint256 requestId = fund.createSpendingRequest(recipient, 2 ether, "ipfs://expense");
        vm.prank(alice);
        fund.approveSpendingRequest(requestId);
        vm.prank(bob);
        fund.approveSpendingRequest(requestId);
        vm.deal(address(fund), 1 ether);
        vm.expectRevert(CommunityFund.InsufficientBalance.selector);
        fund.executeSpendingRequest(requestId);
    }

    function testCancelledRequestCannotBeApprovedOrExecuted() public {
        _reachGoal();
        uint256 requestId = fund.createSpendingRequest(recipient, 2 ether, "ipfs://expense");
        fund.cancelSpendingRequest(requestId);
        vm.prank(alice);
        vm.expectRevert(CommunityFund.RequestNotExecutable.selector);
        fund.approveSpendingRequest(requestId);
        vm.expectRevert(CommunityFund.RequestNotExecutable.selector);
        fund.executeSpendingRequest(requestId);
    }

    function testUnauthorizedExecutionAndRefundStatesAreRejected() public {
        _reachGoal();
        uint256 requestId = fund.createSpendingRequest(recipient, 2 ether, "ipfs://expense");
        vm.prank(alice);
        vm.expectRevert(CommunityFund.RequestNotExecutable.selector);
        fund.executeSpendingRequest(requestId);

        vm.prank(alice);
        vm.expectRevert(CommunityFund.WrongStatus.selector);
        fund.claimRefund();
    }

    function _reachGoal() internal {
        vm.prank(alice);
        fund.contribute{value: 4 ether}();
        vm.prank(bob);
        fund.contribute{value: 6 ether}();
    }
}

contract ReentrantContributor {
    CommunityFund internal fund;

    constructor(CommunityFund fund_) {
        fund = fund_;
    }

    function contribute() external payable {
        fund.contribute{value: msg.value}();
    }

    function claimRefund() external {
        fund.claimRefund();
    }

    receive() external payable {
        try fund.claimRefund() {} catch {}
    }
}
