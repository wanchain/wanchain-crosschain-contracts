/*

  Copyright 2018 Wanchain Foundation.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

//                            _           _           _
//  __      ____ _ _ __   ___| |__   __ _(_)_ __   __| | _____   __
//  \ \ /\ / / _` | '_ \ / __| '_ \ / _` | | '_ \@/ _` |/ _ \ \ / /
//   \ V  V / (_| | | | | (__| | | | (_| | | | | | (_| |  __/\ V /
//    \_/\_/ \__,_|_| |_|\___|_| |_|\__,_|_|_| |_|\__,_|\___| \_/
//
//  Code style according to: https://github.com/wanchain/wanchain-token/blob/master/style-guide.rst

pragma solidity ^0.4.24;

contract SmgAdminInterface {
    function mapCoinSmgInfo(uint, address) public view returns(uint, bytes, uint, uint, uint, address, uint);
}

contract CoinAdminInterface {
    function DEFAULT_PRECISE() public view returns(uint);
    function mapCoinInfo(uint) public view returns(uint, uint, uint, bytes, address, address, uint, bool, uint, uint, uint, uint);
    function isInitialized(uint)   public view  returns (bool);
    function mapCoinPunishReceiver(uint) public view returns(address);
    function mapCoinExponent(uint) public view returns(uint);
}

