curPath=$(dirname "$0")
cd $curPath

mv  ../contracts/htlc/lib/HTLCLib.sol.org ../contracts/htlc/lib/HTLCLib.sol
mv  ../contracts/htlc/lib/HTLCTypes.sol.org ../contracts/htlc/lib/HTLCTypes.sol
mv  ../contracts/tokenManager/TokenManagerStorage.sol.org ../contracts/tokenManager/TokenManagerStorage.sol
