curPath=$(dirname "$0")
cd $curPath

if [ ! -f "../contracts/htlc/lib/HTLCLib.sol.org" ];then
	cp ../contracts/htlc/lib/HTLCLib.sol ../contracts/htlc/lib/HTLCLib.sol.org
fi

#cp ../contracts/htlc/lib/HTLCLib.sol ../contracts/htlc/lib/HTLCLib.sol.org
sed -i 's/DEF_LOCKED_TIME[ \t]*=.*\;/DEF_LOCKED_TIME = 6;/' ../contracts/htlc/lib/HTLCLib.sol

if [ ! -f "../contracts/htlc/lib/commonLib.sol.org" ];then
	cp ../contracts/htlc/lib/commonLib.sol ../contracts/htlc/lib/commonLib.sol.org
fi
#cp ../contracts/htlc/lib/commonLib.sol ../contracts/htlc/lib/commonLib.sol.org
sed -i '/.*SchnorrVerifier\.verify/d'  ../contracts/htlc/lib/commonLib.sol

if [ ! -f "../contracts/tokenManager/TokenManagerStorage.sol.org" ];then
	cp ../contracts/tokenManager/TokenManagerStorage.sol ../contracts/tokenManager/TokenManagerStorage.sol.org
fi
sed -i 's/MIN_WITHDRAW_WINDOW[ \t]*=.*\;/MIN_WITHDRAW_WINDOW = 10;/' ../contracts/tokenManager/TokenManagerStorage.sol
