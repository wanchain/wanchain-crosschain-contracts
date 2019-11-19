PROJECT_ROOT="/home/jacob/wanchain/wanchain-crosschain-contracts/eos-wan-cross/solidity"
cd ${PROJECT_ROOT}"/contracts/htlc/lib" 

cp HTLCLib.sol HTLCLib.sol.org

sed -i 's/DEF_LOCKED_TIME[ \t]*=.*\;/DEF_LOCKED_TIME = 60;/' HTLCLib.sol
