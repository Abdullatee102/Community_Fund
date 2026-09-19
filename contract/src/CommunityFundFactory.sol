// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CommunityFund} from "./CommunityFund.sol";

/// @title CommunityFundFactory
/// @notice Creates and tracks multiple CommunityFund instances.
/// @dev The factory is responsible only for fund creation and discovery.
///      Each CommunityFund instance retains its own funding and spending logic.
contract CommunityFundFactory {
    address[] private funds;
    mapping(address creator => address[]) private fundsByCreator;

    event FundCreated(
        address indexed fund,
        address indexed creator,
        string title,
        string metadataUri,
        uint256 target,
        uint256 deadline
    );

    error InvalidTitle();
    error InvalidTarget();
    error InvalidDeadline();

    /// @notice Creates a new CommunityFund for the caller.
    /// @param title_ The title of the community project.
    /// @param metadataUri_ Metadata URI describing the project.
    /// @param fundingTarget_ Amount of BOT required to fully fund the project.
    /// @param fundingDeadline_ Unix timestamp when funding ends.
    /// @return fund The address of the newly created CommunityFund.
    function createFund(
        string calldata title_,
        string calldata metadataUri_,
        uint256 fundingTarget_,
        uint256 fundingDeadline_
    ) external returns (address fund) {
        if (bytes(title_).length == 0) revert InvalidTitle();
        if (fundingTarget_ == 0) revert InvalidTarget();
        if (fundingDeadline_ <= block.timestamp) revert InvalidDeadline();

        CommunityFund newFund = new CommunityFund(
            title_,
            metadataUri_,
            fundingTarget_,
            fundingDeadline_,
            msg.sender
        );

        fund = address(newFund);

        funds.push(fund);
        fundsByCreator[msg.sender].push(fund);

        emit FundCreated(
            fund,
            msg.sender,
            title_,
            metadataUri_,
            fundingTarget_,
            fundingDeadline_
        );
    }

    /// @notice Returns every fund created through this factory.
    function getFunds() external view returns (address[] memory) {
        return funds;
    }

    /// @notice Returns all funds created by a specific creator.
    function getFundsByCreator(
        address creator
    ) external view returns (address[] memory) {
        return fundsByCreator[creator];
    }

    /// @notice Returns the total number of funds created through this factory.
    function fundCount() external view returns (uint256) {
        return funds.length;
    }

    /// @notice Returns the fund address at a specific index.
    function getFund(uint256 index) external view returns (address) {
        return funds[index];
    }
}