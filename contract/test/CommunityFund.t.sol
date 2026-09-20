// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CommunityFund, CommunityFundFactory} from "../src/CommunityFund.sol";

contract CommunityFundTest is Test {
    CommunityFund internal fund;

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");
    address internal recipient = makeAddr("recipient");

    uint256 internal constant TARGET = 10 ether;

    function setUp() public {
        fund = new CommunityFund(
            "Community solar",
            "ipfs://community-fund-metadata",
            TARGET,
            block.timestamp + 30 days,
            address(this)
        );

        vm.deal(alice, 20 ether);
        vm.deal(bob, 20 ether);
        vm.deal(carol, 20 ether);
    }

    function testCreationStoresConfigurationAndStartsFunding() public view {
        assertEq(fund.creator(), address(this));
        assertEq(fund.title(), "Community solar");
        assertEq(fund.metadataUri(), "ipfs://community-fund-metadata");
        assertEq(fund.fundingTarget(), TARGET);
        assertEq(
            uint8(fund.status()),
            uint8(CommunityFund.FundStatus.Funding)
        );
        assertEq(fund.amountRaised(), 0);
        assertEq(fund.contributorCount(), 0);
    }

    function testRejectsInvalidCreation() public {
        vm.expectRevert(CommunityFund.InvalidTitle.selector);
        new CommunityFund(
            "",
            "ipfs://metadata",
            TARGET,
            block.timestamp + 1 days,
            address(this)
        );

        vm.expectRevert(CommunityFund.InvalidTarget.selector);
        new CommunityFund(
            "Title",
            "ipfs://metadata",
            0,
            block.timestamp + 1 days,
            address(this)
        );

        vm.expectRevert(CommunityFund.InvalidDeadline.selector);
        new CommunityFund(
            "Title",
            "ipfs://metadata",
            TARGET,
            block.timestamp,
            address(this)
        );

        vm.expectRevert(CommunityFund.InvalidCreator.selector);
        new CommunityFund(
            "Title",
            "ipfs://metadata",
            TARGET,
            block.timestamp + 1 days,
            address(0)
        );
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

        assertEq(
            uint8(fund.status()),
            uint8(CommunityFund.FundStatus.Funded)
        );
        assertEq(fund.requiredApprovals(), 2);

        vm.prank(carol);
        vm.expectRevert(CommunityFund.WrongStatus.selector);
        fund.contribute{value: 1 ether}();
    }

    function testAnyoneCanMarkFailedAfterDeadlineAndContributorsCanRefund()
        public
    {
        vm.prank(alice);
        fund.contribute{value: 3 ether}();

        vm.warp(fund.fundingDeadline() - 1);

        vm.expectRevert(CommunityFund.DeadlineNotReached.selector);
        fund.markFundingFailed();

        vm.warp(fund.fundingDeadline());

        fund.markFundingFailed();

        assertEq(
            uint8(fund.status()),
            uint8(CommunityFund.FundStatus.Failed)
        );

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

        assertEq(
            uint8(fund.status()),
            uint8(CommunityFund.FundStatus.Cancelled)
        );

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
        fund.createSpendingRequest(
            recipient,
            1 ether,
            "ipfs://expense"
        );
    }

    function testSpendingRequestRequiresFundedStateAndValidRecipientAmount()
        public
    {
        vm.expectRevert(CommunityFund.WrongStatus.selector);
        fund.createSpendingRequest(
            recipient,
            1 ether,
            "ipfs://expense"
        );

        _reachGoal();

        vm.expectRevert(CommunityFund.InvalidRecipient.selector);
        fund.createSpendingRequest(
            address(0),
            1 ether,
            "ipfs://expense"
        );

        vm.expectRevert(CommunityFund.InvalidAmount.selector);
        fund.createSpendingRequest(
            recipient,
            0,
            "ipfs://expense"
        );

        uint256 requestId = fund.createSpendingRequest(
            recipient,
            2 ether,
            "ipfs://expense"
        );

        CommunityFund.SpendingRequest memory request =
            fund.getSpendingRequest(requestId);

        assertEq(request.recipient, recipient);
        assertEq(request.amount, 2 ether);
        assertEq(request.metadataUri, "ipfs://expense");
    }

    function testContributorApprovalIsEqualWeightAndUnique() public {
        _reachGoal();

        uint256 requestId = fund.createSpendingRequest(
            recipient,
            2 ether,
            "ipfs://expense"
        );

        vm.prank(carol);
        vm.expectRevert(CommunityFund.NotContributor.selector);
        fund.approveSpendingRequest(requestId);

        vm.prank(alice);
        fund.approveSpendingRequest(requestId);

        assertTrue(fund.approvals(requestId, alice));

        vm.prank(alice);
        vm.expectRevert(CommunityFund.AlreadyApproved.selector);
        fund.approveSpendingRequest(requestId);

        CommunityFund.SpendingRequest memory request =
            fund.getSpendingRequest(requestId);

        assertEq(request.approvalCount, 1);
    }

    function testCannotExecuteWithoutThresholdAndCanExecuteAfterThreshold()
        public
    {
        _reachGoal();

        uint256 requestId = fund.createSpendingRequest(
            recipient,
            2 ether,
            "ipfs://expense"
        );

        vm.prank(alice);
        fund.approveSpendingRequest(requestId);

        vm.expectRevert(CommunityFund.RequestNotExecutable.selector);
        fund.executeSpendingRequest(requestId);

        vm.prank(bob);
        fund.approveSpendingRequest(requestId);

        uint256 recipientBefore = recipient.balance;

        fund.executeSpendingRequest(requestId);

        assertEq(
            recipient.balance,
            recipientBefore + 2 ether
        );

        CommunityFund.SpendingRequest memory request =
            fund.getSpendingRequest(requestId);

        assertTrue(request.executed);

        vm.expectRevert(CommunityFund.RequestNotExecutable.selector);
        fund.executeSpendingRequest(requestId);
    }

    function testFullSpendCompletesFund() public {
        _reachGoal();

        uint256 requestId = fund.createSpendingRequest(
            recipient,
            TARGET,
            "ipfs://full-expense"
        );

        vm.prank(alice);
        fund.approveSpendingRequest(requestId);

        vm.prank(bob);
        fund.approveSpendingRequest(requestId);

        fund.executeSpendingRequest(requestId);

        assertEq(
            uint8(fund.status()),
            uint8(CommunityFund.FundStatus.Completed)
        );
    }

    function testInsufficientBalancePreventsExecution() public {
        _reachGoal();

        uint256 requestId = fund.createSpendingRequest(
            recipient,
            2 ether,
            "ipfs://expense"
        );

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

        uint256 requestId = fund.createSpendingRequest(
            recipient,
            2 ether,
            "ipfs://expense"
        );

        fund.cancelSpendingRequest(requestId);

        vm.prank(alice);
        vm.expectRevert(CommunityFund.RequestNotExecutable.selector);
        fund.approveSpendingRequest(requestId);

        vm.expectRevert(CommunityFund.RequestNotExecutable.selector);
        fund.executeSpendingRequest(requestId);
    }

    function testUnauthorizedExecutionAndRefundStatesAreRejected() public {
        _reachGoal();

        uint256 requestId = fund.createSpendingRequest(
            recipient,
            2 ether,
            "ipfs://expense"
        );

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


contract CommunityFundFactoryTest is Test {
    CommunityFundFactory internal factory;

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");

    uint256 internal constant TARGET = 10 ether;

    function setUp() public {
        factory = new CommunityFundFactory();
    }

    function testFactoryStartsEmpty() public view {
        assertEq(factory.fundCount(), 0);
        assertEq(factory.getFunds().length, 0);
        assertEq(factory.getFundsByCreator(alice).length, 0);
    }

    function testCreateFundStoresFundAndCreator() public {
        vm.prank(alice);

        address fundAddress = factory.createFund(
            "Alice Project",
            "ipfs://alice-project",
            TARGET,
            block.timestamp + 30 days
        );

        CommunityFund fund = CommunityFund(fundAddress);

        assertEq(factory.fundCount(), 1);
        assertEq(factory.getFunds().length, 1);
        assertEq(factory.getFunds()[0], fundAddress);

        assertEq(factory.getFundsByCreator(alice).length, 1);
        assertEq(factory.getFundsByCreator(alice)[0], fundAddress);

        assertEq(fund.creator(), alice);
        assertEq(fund.title(), "Alice Project");
        assertEq(fund.metadataUri(), "ipfs://alice-project");
        assertEq(fund.fundingTarget(), TARGET);
        assertEq(
            uint8(fund.status()),
            uint8(CommunityFund.FundStatus.Funding)
        );
    }

    function testSameWalletCanCreateMultipleFunds() public {
        vm.startPrank(alice);

        address firstFund = factory.createFund(
            "Alice Project One",
            "ipfs://alice-one",
            5 ether,
            block.timestamp + 30 days
        );

        address secondFund = factory.createFund(
            "Alice Project Two",
            "ipfs://alice-two",
            8 ether,
            block.timestamp + 60 days
        );

        address thirdFund = factory.createFund(
            "Alice Project Three",
            "ipfs://alice-three",
            12 ether,
            block.timestamp + 90 days
        );

        vm.stopPrank();

        assertEq(factory.fundCount(), 3);

        address[] memory allFunds = factory.getFunds();

        assertEq(allFunds.length, 3);
        assertEq(allFunds[0], firstFund);
        assertEq(allFunds[1], secondFund);
        assertEq(allFunds[2], thirdFund);

        address[] memory aliceFunds = factory.getFundsByCreator(alice);

        assertEq(aliceFunds.length, 3);
        assertEq(aliceFunds[0], firstFund);
        assertEq(aliceFunds[1], secondFund);
        assertEq(aliceFunds[2], thirdFund);

        assertEq(CommunityFund(firstFund).creator(), alice);
        assertEq(CommunityFund(secondFund).creator(), alice);
        assertEq(CommunityFund(thirdFund).creator(), alice);
    }

    function testDifferentWalletsCanCreateTheirOwnFunds() public {
        vm.prank(alice);
        address aliceFund = factory.createFund(
            "Alice Project",
            "ipfs://alice",
            TARGET,
            block.timestamp + 30 days
        );

        vm.prank(bob);
        address bobFund = factory.createFund(
            "Bob Project",
            "ipfs://bob",
            TARGET,
            block.timestamp + 30 days
        );

        assertEq(factory.fundCount(), 2);

        address[] memory allFunds = factory.getFunds();

        assertEq(allFunds.length, 2);
        assertEq(allFunds[0], aliceFund);
        assertEq(allFunds[1], bobFund);

        address[] memory aliceFunds = factory.getFundsByCreator(alice);
        address[] memory bobFunds = factory.getFundsByCreator(bob);

        assertEq(aliceFunds.length, 1);
        assertEq(aliceFunds[0], aliceFund);

        assertEq(bobFunds.length, 1);
        assertEq(bobFunds[0], bobFund);

        assertEq(CommunityFund(aliceFund).creator(), alice);
        assertEq(CommunityFund(bobFund).creator(), bob);
    }

    function testEachFundIsIndependent() public {
        vm.prank(alice);
        address firstFund = factory.createFund(
            "First Project",
            "ipfs://first",
            5 ether,
            block.timestamp + 30 days
        );

        vm.prank(alice);
        address secondFund = factory.createFund(
            "Second Project",
            "ipfs://second",
            10 ether,
            block.timestamp + 30 days
        );

        CommunityFund first = CommunityFund(firstFund);
        CommunityFund second = CommunityFund(secondFund);

        vm.deal(bob, 20 ether);

        vm.prank(bob);
        first.contribute{value: 5 ether}();

        assertEq(first.amountRaised(), 5 ether);
        assertEq(
            uint8(first.status()),
            uint8(CommunityFund.FundStatus.Funded)
        );

        assertEq(second.amountRaised(), 0);
        assertEq(
            uint8(second.status()),
            uint8(CommunityFund.FundStatus.Funding)
        );
    }

    function testOnlyFundCreatorControlsThatFund() public {
        vm.prank(alice);
        address aliceFundAddress = factory.createFund(
            "Alice Project",
            "ipfs://alice",
            TARGET,
            block.timestamp + 30 days
        );

        CommunityFund aliceFund = CommunityFund(aliceFundAddress);

        vm.prank(bob);
        vm.expectRevert(CommunityFund.NotCreator.selector);
        aliceFund.cancelFund();

        vm.prank(alice);
        aliceFund.cancelFund();

        assertEq(
            uint8(aliceFund.status()),
            uint8(CommunityFund.FundStatus.Cancelled)
        );
    }

    function testInvalidFundCreationIsRejected() public {
        vm.prank(alice);
        vm.expectRevert(CommunityFundFactory.InvalidTitle.selector);
        factory.createFund(
            "",
            "ipfs://metadata",
            TARGET,
            block.timestamp + 30 days
        );

        vm.prank(alice);
        vm.expectRevert(CommunityFundFactory.InvalidTarget.selector);
        factory.createFund(
            "Project",
            "ipfs://metadata",
            0,
            block.timestamp + 30 days
        );

        vm.prank(alice);
        vm.expectRevert(CommunityFundFactory.InvalidDeadline.selector);
        factory.createFund(
            "Project",
            "ipfs://metadata",
            TARGET,
            block.timestamp
        );

        assertEq(factory.fundCount(), 0);
    }

    function testGetFundReturnsCorrectFund() public {
        vm.prank(alice);
        address firstFund = factory.createFund(
            "First Project",
            "ipfs://first",
            TARGET,
            block.timestamp + 30 days
        );

        vm.prank(alice);
        address secondFund = factory.createFund(
            "Second Project",
            "ipfs://second",
            TARGET,
            block.timestamp + 30 days
        );

        assertEq(factory.getFund(0), firstFund);
        assertEq(factory.getFund(1), secondFund);
    }

    function testFundsByCreatorAreTrackedSeparately() public {
        vm.prank(alice);
        address aliceFundOne = factory.createFund(
            "Alice One",
            "ipfs://alice-one",
            TARGET,
            block.timestamp + 30 days
        );

        vm.prank(bob);
        address bobFund = factory.createFund(
            "Bob One",
            "ipfs://bob-one",
            TARGET,
            block.timestamp + 30 days
        );

        vm.prank(alice);
        address aliceFundTwo = factory.createFund(
            "Alice Two",
            "ipfs://alice-two",
            TARGET,
            block.timestamp + 30 days
        );

        address[] memory aliceFunds = factory.getFundsByCreator(alice);
        address[] memory bobFunds = factory.getFundsByCreator(bob);
        address[] memory carolFunds = factory.getFundsByCreator(carol);

        assertEq(aliceFunds.length, 2);
        assertEq(aliceFunds[0], aliceFundOne);
        assertEq(aliceFunds[1], aliceFundTwo);

        assertEq(bobFunds.length, 1);
        assertEq(bobFunds[0], bobFund);

        assertEq(carolFunds.length, 0);
    }
}