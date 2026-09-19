// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CommunityFund} from "../src/CommunityFund.sol";
import {CommunityFundFactory} from "../src/CommunityFundFactory.sol";

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