#ifndef __HTLC_TYPE_H
#define __HTLC_TYPE_H

#include <cstring>
#include <string_view>
#include <string>
#include <vector>

#include <eosio/eosio.hpp>
#include <eosio/asset.hpp>
#include <eosio/time.hpp>
#include <eosio/crypto.hpp>

#include "./debugFlag.hpp"

namespace htlc {
	static constexpr eosio::name TRANSFER_NAME = "transfer"_n;
	// if time_t is defined in namespace hash, using hTime::time_t in eosio contract table,
	// it will report "invalid type time_t" when query table,
	// so, all self-defined types define here, but not in other namespace
	// typedef unsigned long long time_t;
	typedef uint32_t time_t;

	namespace internal {
		typedef struct Uint256_t {
			uint8_t data[32];
		} Uint256_t;
	};

	namespace hPermission {
		typedef struct level_t {
			/* should less than 12 charapters */
			static constexpr eosio::name active 	= eosio::name("active");
			static constexpr eosio::name outlock 	= eosio::name("outlock");
		} level;
	};

	namespace sysLimit {
		typedef struct account_t {
			static constexpr int32_t min = 1;
			static constexpr int32_t max = 12;
		} account;
	};

	namespace hLimit {
		static constexpr int xHash 		= 64;
		static constexpr int wanAddr 	= 40; // wan address without '0x'
		static constexpr int pk 		= 130; // pk
		static constexpr int status 	= 6; // inlock

		static constexpr uint64_t ratioPrecise = 10000;

#ifndef _DEBUG_UT
		#ifdef _DEBUG_HTLC
				static constexpr time_t lockedTime 	= time_t(3600);
		#else
				static constexpr time_t lockedTime 	= time_t(3600 * 36);
				// static constexpr time_t lockedTime 	= time_t(3600);
		#endif
#else
		static constexpr time_t lockedTime 	= time_t(20);
#endif
		static constexpr time_t doubleLockedTime = lockedTime * 2;

#ifndef _DEBUG_UT
		static constexpr time_t smgFeeReceiverTimeout = time_t(600);
#else
		static constexpr time_t smgFeeReceiverTimeout = time_t(20);
#endif
	}

	// htlc status description
	namespace hStatus {
		typedef struct status_t {
			/* should less than 12 charapters */
			static constexpr std::string_view inlock 		= "inlock";
			static constexpr std::string_view inredeem 		= "inredeem";
			static constexpr std::string_view inrevoke 		= "inrevoke";
			static constexpr std::string_view outlock 		= "outlock";
			static constexpr std::string_view outredeem 	= "outredeem";
			static constexpr std::string_view outrevoke 	= "outrevoke";
			static constexpr std::string_view withdraw 		= "withdraw";
			static constexpr std::string_view lockdebt 		= "lockdebt";
			static constexpr std::string_view redeemdebt 	= "redeemdebt";
			static constexpr std::string_view revokedebt 	= "revokedebt";
		} status;
	};

	namespace hTable {
		typedef struct table_t {
			static constexpr eosio::name transfers 			= eosio::name("transfers");
			static constexpr eosio::name pks 				= eosio::name("pks");
			static constexpr eosio::name assets 			= eosio::name("assets");
			static constexpr eosio::name fees 				= eosio::name("fees");
			static constexpr eosio::name debts 				= eosio::name("debts");
			static constexpr eosio::name signer 			= eosio::name("signer");
			static constexpr eosio::name longlongs 			= eosio::name("longlongs");
		} table;

		typedef struct key_t {
			/* should less than 12 charapters */
			static constexpr eosio::name pid 				= eosio::name("pid");
			static constexpr eosio::name npid 				= eosio::name("npid");
			static constexpr eosio::name pkHash 			= eosio::name("pkhash");
			static constexpr eosio::name xHash 				= eosio::name("xhash");
			static constexpr eosio::name acct 				= eosio::name("acct");
			static constexpr eosio::name sym_acct 			= eosio::name("sym.acct");
			static constexpr eosio::name pid_acct 			= eosio::name("pid.acct");
			static constexpr eosio::name npid_acct 			= eosio::name("npid.acct");
			static constexpr eosio::name ratio 				= eosio::name("ratio");
		} key;
	};

	namespace hError {
		typedef struct error_t {
			static constexpr std::string_view NOT_FOUND_RECORD 					= "not found valid record";
			static constexpr std::string_view NOT_FOUND_PK_RECORD 				= "not found the pk record";
			static constexpr std::string_view NOT_FOUND_SIGNATURE_RECORD 		= "not found the signature record";
			static constexpr std::string_view NOT_FOUND_TOKEN_ACCOUNT_RECORD 	= "not found the token account record";
			static constexpr std::string_view NOT_FOUND_TOKEN_RECORD 			= "not found the token record";

			static constexpr std::string_view INVALID_HTLC_ACCOUNT 				= "invalid htlc account";
			static constexpr std::string_view INVALID_SG_ACCOUNT 				= "invalid storeman account";
			static constexpr std::string_view INVALID_USER_ACCOUNT 				= "invalid user account";
			static constexpr std::string_view INVALID_TOKEN_ACCOUNT 			= "invalid token account";
			static constexpr std::string_view INVALID_RECEIVER_ACCOUNT 			= "invalid receiver account";

#ifdef _DEBUG_API
			static constexpr std::string_view INVALID_TABLE 					= "invalid table";
#endif

			static constexpr std::string_view INVALID_MEMO 						= "invalid memo";

			static constexpr std::string_view REDEEM_TIMEOUT 					= "redeem timeout, only can redeem in lockedTime";
			static constexpr std::string_view REVOKE_TIMEOUT 					= "only can revoke after lockedTime";

			static constexpr std::string_view INVALID_X 						= "invalid x";
			static constexpr std::string_view INVALID_XHASH 					= "invalid xHash";
			// static constexpr std::string_view INVALID_WAN_ADDR 				= "invalid WAN address";
			// static constexpr std::string_view INVALID_PK 					= "invalid pk";

			static constexpr std::string_view REDUPLICATIVE_RECORD 				= "reduplicative record";
			static constexpr std::string_view REDUPLICATIVE_XHASH 				= "reduplicative xHash";

			static constexpr std::string_view INVALID_PARAM 					= "Invalid parameter";
			static constexpr std::string_view INVALID_QUANTITY 					= "invalid quantity";
			static constexpr std::string_view INVALID_HEX_CHAR 					= "Invalid hex character";

			static constexpr std::string_view NOE_ENOUGH_QUANTITY 				= "not enough quantity";
			static constexpr std::string_view FEE_OVERFLOW 						= "asset fee overflow";
			static constexpr std::string_view LEFT_OVERFLOW 					= "asset left overflow";

			static constexpr std::string_view SYSTEM_ERROR 						= "onerror occured before htlc";

			static constexpr std::string_view EXIST_FEE_RECORD 					= "fee exists";
			static constexpr std::string_view EXIST_ASSET_RECORD 				= "asset exists";
			static constexpr std::string_view BUSY_PK 							= "pk is busy";

			static constexpr std::string_view TIMESTAMP_TOO_BIG 				= "time stamp (uint:s) is too big";
			static constexpr std::string_view TIMESTAMP_TIMEOUT 				= "timeout for store man receiver key during withdraw";

		} error;
	};

	// eosio.token transfer memo description
	namespace tMemo {
		constexpr char separator 			= ':';
		constexpr char outSeparator 		= '-';

		typedef struct inlock_t {
			static constexpr int status		= 0;
			static constexpr int xHash 		= 1;
			static constexpr int wanAddr 	= 2;
			static constexpr int pk 		= 3;
			static constexpr int account 	= 4;
		} inlock;

		typedef struct memo_size_t {
			struct inlock {
				static constexpr int min 	= 4 + hLimit::xHash + hLimit::wanAddr + hLimit::pk + sysLimit::account::min +
										   sysLimit::account::min;
				static constexpr int max 	= 4 + hLimit::xHash + hLimit::wanAddr + hLimit::pk + sysLimit::account::max +
										   sysLimit::account::max;
			};
		} size;
	};

	namespace hSymbol {
		constexpr char separator 			= ',';
		typedef struct item_t {
			static constexpr int precision 	= 0;
			static constexpr int symCode 	= 1;
			static constexpr int total 		= 2;
		} item;
	}

	namespace hAsset {
		constexpr char separator 			= ' ';
		constexpr char dot 					= '.';
		typedef struct item_t {
			static constexpr int value 		= 0;
			static constexpr int symCode 	= 1;
			static constexpr int total 		= 2;
		} item;

		typedef struct amount_t {
			static constexpr int integer 	= 0;
			static constexpr int decimal 	= 1;
			static constexpr int total 		= 2;
		} amount;
	}
};
#endif