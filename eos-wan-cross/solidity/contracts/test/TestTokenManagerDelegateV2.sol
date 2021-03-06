/*

  Copyright 2019 Wanchain Foundation.

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
//

pragma solidity ^0.4.24;

import "../tokenManager/TokenManagerDelegate.sol";

contract TestTokenManagerDelegateV2 is TokenManagerDelegate {

    function setTokenFlag(bytes key, bytes tokenOrigAccount, string flag)
        external
        onlyOwner
        onlyValidAccount(tokenOrigAccount)
    {
        stringData.setStorage(key, tokenOrigAccount, flag);
    }

    function getTokenFlag(bytes key, bytes tokenOrigAccount)
        external
        view
        onlyOwner
        onlyValidAccount(tokenOrigAccount)
        returns (string)
    {
        return stringData.getStorage(key, tokenOrigAccount);
    }

    function delTokenFlag(bytes key, bytes tokenOrigAccount)
        external
        onlyOwner
        onlyValidAccount(tokenOrigAccount)
    {
        stringData.delStorage(key, tokenOrigAccount);
    }
}