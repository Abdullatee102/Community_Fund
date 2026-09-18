// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {CommunityFund} from "../src/CommunityFund.sol";

contract DeployCommunityFund is Script {
    function run() external returns (CommunityFund fund) {
        string memory rpcUrl = vm.envString("BOT_RPC_URL");
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        string memory title = vm.envString("COMMUNITY_FUND_TITLE");
        string memory metadataUri = vm.envString("COMMUNITY_FUND_METADATA_URI");
        uint256 fundingTarget = vm.envUint("COMMUNITY_FUND_TARGET");
        uint256 fundingDeadline = vm.envUint("COMMUNITY_FUND_DEADLINE");

        vm.startBroadcast(deployerPrivateKey);
        fund = new CommunityFund(title, metadataUri, fundingTarget, fundingDeadline);
        vm.stopBroadcast();

        console2.log("Network RPC", rpcUrl);
        console2.log("Chain ID", block.chainid);
        console2.log("Deployer", vm.addr(deployerPrivateKey));
        console2.log("CommunityFund", address(fund));
        string memory explorerUrl = vm.envOr("BOHR_EXPLORER_URL", string("https://scan.bohr.life/"));
        if (bytes(explorerUrl).length > 0 && bytes(explorerUrl)[bytes(explorerUrl).length - 1] == "/") {
            assembly {
                mstore(explorerUrl, sub(mload(explorerUrl), 1))
            }
        }
        console2.log("Explorer", string.concat(explorerUrl, "/address/", vm.toString(address(fund))));
    }
}
