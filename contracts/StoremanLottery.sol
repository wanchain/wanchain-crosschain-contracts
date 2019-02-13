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

import "./SafeMath.sol";
import "./Halt.sol";

contract StoremanLottery is Halt{

    using SafeMath for uint;

    ///the hash of block that's created at stakingEndTime
    bytes32 public stakingEndBlockhash;

    ///the address of storeman group sc
    address public storemanGroupAddr;
    
    ///the random seed generated based on stakingEndBlockhash and other info
    uint256 public storemanRandomSeed;
    
    ///the total lottery bonus 
    uint public totalLotteryBonus;

    ///the total lotter numbers
    uint public totalLotterNum;

    ///the sequence of lotter random that has been generated
    uint public recoredNum;

    ///the lottery bonus that has been distributed
    uint public recoredBonus;

    ///the array of random that has been generated
    uint[] public seededRandomArray;

    ///the struct to record lottery rank, just include bonus and number for this rank
    struct LotterBonuInfo{
        uint lotterBonus;
        uint lotterNum;
    }

    ///the lotter info map: map(randomHash = > lotterBonusInfo)
    mapping(uint => LotterBonuInfo) public    mapSmgLotteryBonus;

    /// @notice                           event for smg to refeem total bonus from admin
    /// @param _smgAddr                   the address of smg
    /// @param _seed                      the seed for random 
    event LotteryRandomSeedLogger(address indexed _smgAddr, uint256 _seed);

    /// @notice                           event for smg to refeem total bonus from admin
    /// @param _smgAddr                   the address of smg
    /// @param _rank                      the rank for lottery 
    /// @param _random                    the seeded random 
    event LotterySeededRandomLogger(address indexed _smgAddr, uint256 _rank, uint256 _random);

    /// @dev `owner` is the only address that can call a function with this
    /// modifier
    modifier onlyStoremanGroup() {
        require(msg.sender == storemanGroupAddr);
        _;
    }
  
    /// @notice                         to set storemangroup address
    /// @param _smgAddr                 the address of storeman group
    function setStoremanGroupAddr(address _smgAddr)
    public
    onlyOwner    
    {
        require(address(0) != _smgAddr, "Invalid storeman group object");
        storemanGroupAddr = _smgAddr;
    }

    /// @notice                         to set block hash when staking end time 
    /// @param _blockHash               the hask of block
    function setStakingEndBlockHash(bytes32 _blockHash)
    public
    onlyOwner
    {
        require(bytes32(0) != _blockHash, "BlockHash can't be 0");
        stakingEndBlockhash = _blockHash;
    }

    /// @notice                         to set block hash when staking end time
    /// @param _bonus                   the bonus value of this lotter rank 
    /// @param _num                     the lotter number of this lotter rank 
    function setSmgLotteryInfo(uint256 _bonus, uint256 _num)
    external
    onlyStoremanGroup
    {
        require((0 != _bonus) && (0 != _num), "Invalid lottery");
        
        totalLotteryBonus = _bonus;
        totalLotterNum = _num; 
    }

    /// @notice                         to get random seed for lottery
    function genLotteryRandomSeed()  
    public
    onlyOwner
    {
        storemanRandomSeed = uint256(keccak256(abi.encodePacked(stakingEndBlockhash, msg.sender)));
        emit LotteryRandomSeedLogger(storemanGroupAddr, storemanRandomSeed);
    }

    /// @notice                         to get random seed for lottery
    /// @param _rank                    the rank of  lotter  
    /// @param _num                     the number of this lotter rank 
    /// @param _bonus                   the bonus of this lotter rank 
    function genSeededRandom(uint256 _rank, uint256 _num, uint256 _bonus)
    public
    onlyOwner
    {
        require(0 == mapSmgLotteryBonus[_rank].lotterNum, "This lotter rank has been generated");

        uint restBonus;
        restBonus = totalLotteryBonus.sub(recoredBonus).sub(_num.mul(_bonus));
        require(restBonus >= 0, "The lottery bonus is not enough");
        require(totalLotterNum >= recoredNum.add(_num), "exceed the max lotters number");

        for(uint i = 0; i < _num; i++ ){
            recoredNum = recoredNum.add(1);

            uint random = uint(keccak256(abi.encodePacked(storemanRandomSeed, recoredNum, _bonus))) % totalLotterNum;
            emit LotterySeededRandomLogger(storemanGroupAddr, _rank, random);

            seededRandomArray.push(random);
            recoredBonus = recoredBonus.add(_bonus);
        }

        setSmgLotterRule(_rank, _bonus, _num);
    }

    /// @notice                         to set block hash when staking end time 
    /// @param _rank                    lotter rank
    /// @param _bonus                   the bonus value of this lotter rank 
    /// @param _num                     the lotter number of this lotter rank 
    function setSmgLotterRule(uint256 _rank, uint256 _bonus, uint256 _num)
    private
    {
        mapSmgLotteryBonus[_rank].lotterBonus = _bonus;
        mapSmgLotteryBonus[_rank].lotterNum = _num;        
    }

    function kill() 
    public
    isHalted
    onlyOwner
    {
        selfdestruct(owner);
    } 

    /// @notice If token coin is sent to this address, send it back.
    /// @dev If token coin is sent to this address, send it back.
    function () 
    public
    payable 
    {
        revert();
    } 

}

