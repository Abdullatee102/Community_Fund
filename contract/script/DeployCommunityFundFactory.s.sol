// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {CommunityFundFactory} from "../src/CommunityFundFactory.sol";

contract DeployCommunityFundFactory is Script {
    function run() external returns (CommunityFundFactory factory) {
        string memory rpcUrl = vm.envString("BOT_RPC_URL");
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        factory = new CommunityFundFactory();

        vm.stopBroadcast();

        console2.log("Network RPC", rpcUrl);
        console2.log("Chain ID", block.chainid);
        console2.log("Deployer", deployer);
        console2.log("CommunityFundFactory", address(factory));

        string memory explorerUrl = vm.envOr(
            "BOHR_EXPLORER_URL",
            string("https://scan.bohr.life/")
        );

        if (
            bytes(explorerUrl).length > 0 &&
            bytes(explorerUrl)[bytes(explorerUrl).length - 1] == "/"
        ) {
            assembly {
                mstore(explorerUrl, sub(mload(explorerUrl), 1))
            }
        }

        console2.log(
            "Explorer",
            string.concat(
                explorerUrl,
                "/address/",
                vm.toString(address(factory))
            )
        );
    }
}