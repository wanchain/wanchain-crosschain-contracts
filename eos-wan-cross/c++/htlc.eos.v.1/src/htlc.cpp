#include "../include/type.hpp"
#include "../include/tools.hpp"
#include "../include/htlc.hpp"

#include <eosio/system.hpp>
#include <cstdlib>

#include "./htlcDebug.cpp"
#include "./htlcHelp.cpp"

namespace htlc {

/* register signature verification info, by htlc-self */
	ACTION htlc::regsig(eosio::name code, eosio::name action) {
		eosio::require_auth(eosio::permission_level{get_self(), hPermission::level::active});

#ifdef _DEBUG_PRINT
		eosio::print("\t[regsig => code:", code, ", action:", action, "]\t");
#endif
		signer sig_table(get_self(), get_self().value);
		auto dItr = sig_table.find(code.value);
		eosio::check(dItr == sig_table.end(), hError::error::REDUPLICATIVE_RECORD.data());

		sig_table.emplace(get_self(), [&](auto &s) {
			s.code = code;
			s.action = action;
#ifdef _DEBUG_PRINT
			eosio::print("\t[regsig => code ", s.code, " and action ", s.action, "]\t");
#endif
		});
	}

	ACTION htlc::updatesig(eosio::name code, eosio::name nCode, eosio::name nAction) {
		eosio::require_auth(eosio::permission_level{get_self(), hPermission::level::active});

		signer sig_table(get_self(), get_self().value);
		auto dItr = sig_table.find(code.value);
		eosio::check(dItr != sig_table.end(), hError::error::NOT_FOUND_SIGNATURE_RECORD.data());

		sig_table.modify(dItr, get_self(), [&](auto &s) {
			s.code = nCode;
			s.action = nAction;
#ifdef _DEBUG_PRINT
			eosio::print("\t[updatesig => code ", s.code, " and action ", s.action, "]\t");
#endif
		});
	}

	ACTION htlc::unregsig(eosio::name code) {
		eosio::require_auth(eosio::permission_level{get_self(), hPermission::level::active});

		signer sig_table(get_self(), get_self().value);
		auto dItr = sig_table.find(code.value);
		eosio::check(dItr != sig_table.end(), hError::error::NOT_FOUND_SIGNATURE_RECORD.data());

		dItr = sig_table.erase(dItr);
	}

	/* debt, by storeman-self and the storeman-match */
	ACTION htlc::lockdebt(eosio::name storeman, std::string npk, eosio::name account, \
							eosio::asset quantity,std::string xHash, \
							std::string pk, std::string r, std::string s) {

#ifdef _DEBUG_PRINT
		eosio::print("\t[lockdebt => storeman:", storeman, ", account:", account, \
        ", quantity:", quantity, ", npk:", npk, ", xHash:", xHash, ", pk:", pk, ", r:", r, ", s:", s, "]\t");
#endif
		eosio::check(eosio::is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());
		eosio::require_auth(storeman);
		eosio::check(eosio::is_account(account) and account != get_self(), hError::error::INVALID_TOKEN_ACCOUNT.data());
		//eosio::check(existTokenAccount(account.value), hError::error::NOT_FOUND_TOKEN_ACCOUNT_RECORD.data());

		/* lockdebt */
		{

			htlc::pk_t pkInfo;
			eosio::check(findPK(pk, &pkInfo), hError::error::NOT_FOUND_PK_RECORD.data());
#ifdef _DEBUG_PRINT
			eosio::print("\t[lockdebt => pk => id:", pkInfo.id, ", pk:", pkInfo.pk, ", pkHash:", pkInfo.pkHash, "]\t");
#endif
			htlc::pk_t npkInfo;
			eosio::checksum256 npkHash = hashMsg(npk);
			if (!findPK(npkHash, &npkInfo)) {
				savePk(npk, npkHash, &npkInfo);
			}
#ifdef _DEBUG_PRINT
			eosio::print("\t[lockdebt => npk => id:", npkInfo.id, ", pk:", npkInfo.pk, ", pkHash:", npkInfo.pkHash,
						 "]\t");
#endif
			/* check debts table by xHash */
			eosio::checksum256 xHashValue = parseXHash(xHash);
			/* should be no debt-record by xHash */
			debts debt_table(get_self(), get_self().value);
			auto dXHashTable = debt_table.get_index<hTable::key::xHash>();
			auto dItr = dXHashTable.find(xHashValue);
			eosio::check(dItr == dXHashTable.end(), hError::error::REDUPLICATIVE_XHASH.data());

			/* check pk from table pks if pk has enough asset */
			eosio::asset totalAsset(0, quantity.symbol);
			getAssetFrom(pkInfo.id, account, &totalAsset);
#ifdef _DEBUG_PRINT
			eosio::print("\t[lockdebt => asset: ", totalAsset, "]\t");
#endif
			// eosio::check(totalAsset >= quantity, hError::error::NOE_ENOUGH_QUANTITY.data());

			eosio::asset outPendAsset(0, quantity.symbol);
			getOutPendAssetFrom(pkInfo.id, account, &outPendAsset);
#ifdef _DEBUG_PRINT
			eosio::print("\t[lockdebt => pend asset: ", outPendAsset, "]\t");
#endif
			eosio::check(totalAsset >= (outPendAsset + quantity), hError::error::NOE_ENOUGH_QUANTITY.data());

			lockDebtTx(npkInfo.id, pkInfo.id, account, quantity, xHashValue);
		}

		/* signature verification */
		{
			std::vector<std::string_view> v;

			v.push_back(npk);
			v.push_back(account.to_string());
			v.push_back(quantity.to_string());
			v.push_back(xHash);

			verifySignature(hStatus::status::lockdebt, pk, r, s, v);
		}
	}

/// @notice               type        comment
/// @param storeman       name        storeman account name
/// @param x              string      HTLC random number
/// coin flow: htlc -> storeman
	ACTION htlc::redeemdebt(eosio::name storeman, std::string x) {
#ifdef _DEBUG_PRINT
		eosio::print("\t[redeemdebt => storeman:", storeman, ", x:", x, " ]\t");
#endif
		eosio::check(eosio::is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());
		eosio::require_auth(storeman);

		/* redeemdebt */
		{
			/* check debts table by xHash */
			eosio::checksum256 xHashValue = hashHexMsg(x);
			debts debt_table(get_self(), get_self().value);
			auto dXHashTable = debt_table.get_index<hTable::key::xHash>();
			auto dItr = dXHashTable.find(xHashValue);
			eosio::check(dItr != dXHashTable.end() and \
            eosio::name(dItr->status).value == eosio::name(hStatus::status::lockdebt).value, \
            hError::error::NOT_FOUND_RECORD.data());

#ifdef _DEBUG_PRINT
			eosio::print("\t[redeemdebt => beginTime:", dItr->beginTime.sec_since_epoch(), ", lockedTime:",
						 dItr->lockedTime, \
            ", status:", dItr->status, ", id:", dItr->id, ", pid:", dItr->pid, ", npid:", dItr->npid, \
            ", xHash:", dItr->xHash, ", quantity:", dItr->quantity, " ]\t");
#endif

			// check lockedTime
			auto nowTime = eosio::time_point_sec(eosio::current_time_point());
			eosio::check((dItr->beginTime + dItr->lockedTime) >= nowTime, hError::error::REDEEM_TIMEOUT.data());
#ifdef _DEBUG_PRINT
			eosio::print("\t[redeemdebt => eosio::current_time_point:", nowTime.sec_since_epoch(), \
            ", beginTime: ", dItr->beginTime.sec_since_epoch(), ", lockedTime: ", dItr->lockedTime, "]\t");
#endif

			/* check pks table */
			eosio::check(hasPK(dItr->pid), hError::error::NOT_FOUND_PK_RECORD.data());
			eosio::check(hasPK(dItr->npid), hError::error::NOT_FOUND_PK_RECORD.data());

			/* clean pk from table pks if pk is not used */
			subAssetFrom(dItr->pid, dItr->account, dItr->quantity);
			addAssetTo(dItr->npid, dItr->account, dItr->quantity);

			uint64_t pid = dItr->pid;
			/* delete row (by xHash) from table debts */
			dItr = dXHashTable.erase(dItr);
			cleanPk(pid);
		}
	}

	ACTION htlc::revokedebt(std::string xHash) {
		htlc::pk_t pkInfo;
		{
			/* check xHash */
			eosio::checksum256 xHashValue = parseXHash(xHash);
#ifdef _DEBUG_PRINT
			eosio::print("\t [revokedebt => xHash: ", xHash, "]\t");
#endif

			debts debt_table(get_self(), get_self().value);
			auto dXHashTable = debt_table.get_index<hTable::key::xHash>();
			auto dItr = dXHashTable.find(xHashValue);
			eosio::check(dItr != dXHashTable.end() and \
            eosio::name(dItr->status).value == eosio::name(hStatus::status::lockdebt).value, \
            hError::error::NOT_FOUND_RECORD.data());

			// check lockedTime
			auto nowTime = eosio::time_point_sec(eosio::current_time_point());
			eosio::check((dItr->beginTime + dItr->lockedTime) < nowTime, hError::error::REVOKE_TIMEOUT.data());

			/* find from pks table by pk id */
			eosio::check(findPK(dItr->pid, &pkInfo), hError::error::NOT_FOUND_RECORD.data());

#ifdef _DEBUG_PRINT
			eosio::print("\t[revokedebt => beginTime:", dItr->beginTime.sec_since_epoch(), ", lockedTime:",
						 dItr->lockedTime, \
            ", status:", dItr->status, ", id:", dItr->id, ", pid:", dItr->pid, \
            ", npid:", dItr->npid, ", xHash:", dItr->xHash, ", sym:", dItr->quantity, "]\t");
#endif
			dItr = dXHashTable.erase(dItr);
		}
	}

/* withdraw fee, by storeman-self */
	ACTION htlc::withdraw(eosio::name storeman, std::string account, std::string sym, std::string pk, std::string timeStamp,
			eosio::name receiver,std::string r,std::string s) {
#ifdef _DEBUG_PRINT
		eosio::print("\t[withdraw => storeman:", storeman, ", account:", account, ", sym:", sym, ", pk:", pk, ", r:", r,
					 ", s:", s, " ]\t");
#endif
		eosio::check(eosio::is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());
		eosio::require_auth(storeman);
		eosio::check(eosio::is_account(receiver) and receiver != get_self(), hError::error::INVALID_RECEIVER_ACCOUNT.data());

		// check now < timeStamp + smgFeeReceiverTimeout

		auto nowTimeTps = eosio::time_point_sec(eosio::current_time_point());
		auto smgTimeoutTps = eosio::time_point_sec(hLimit::smgFeeReceiverTimeout);
		auto ts = std::strtoul(timeStamp.c_str(),NULL,10);
		eosio::check(ts < std::numeric_limits<uint32_t>::max() and ts > std::numeric_limits<uint32_t>::min(), \
		hError::error::TIMESTAMP_TOO_BIG.data());

		auto tsTps = eosio::time_point_sec(ts);
		tsTps += smgTimeoutTps;
		eosio::check((nowTimeTps < tsTps), hError::error::TIMESTAMP_TIMEOUT.data());

		/* withdraw */
		{
			htlc::pk_t pkInfo;
			eosio::check(findPK(pk, &pkInfo), hError::error::NOT_FOUND_PK_RECORD.data());
			issueFeeFrom(pkInfo.id, receiver, account, sym, hStatus::status::withdraw);
		}

		/* signature verification */
		{
			std::vector<std::string_view> v;

			v.push_back(timeStamp);
			v.push_back(receiver.to_string());
			v.push_back(account);
			v.push_back(sym);

			verifySignature(hStatus::status::withdraw, pk, r, s, v);
		}
	}

/* HTLC reference, by whoever */
/// @notice                    type        comment
/// @param user                name        account name of user initiated the Tx
/// @param quantity            asset       exchange quantity
/// @param memo                string      status(6):xHash(64):wanAddr(40):storeman(130):eosTokenAccount(12) => 256 bytes
/// coin flow: user -> htlc
	ACTION htlc::inlock(eosio::name user, eosio::name htlc, eosio::asset quantity, std::string memo) {

		eosio::check(eosio::is_account(user) and user != get_self(), hError::error::INVALID_USER_ACCOUNT.data());
		eosio::require_auth(user);

		eosio::check(eosio::is_account(htlc) and htlc == get_self(), hError::error::INVALID_HTLC_ACCOUNT.data());
		eosio::check(quantity.is_valid() and quantity.amount > 0, hError::error::INVALID_QUANTITY.data());

#ifdef _DEBUG_PRINT
		eosio::print("\t[inlock => user:", user, ", quantity:", quantity, ", memo:", memo, "]\t");
#endif
		std::vector <std::string_view> v;
		common::split(memo, tMemo::separator, v);

		eosio::name account = eosio::name(v[tMemo::inlock::account]);
		eosio::check(eosio::is_account(account) and account != get_self(), hError::error::INVALID_TOKEN_ACCOUNT.data());
		//eosio::check(existTokenAccount(account.value), hError::error::NOT_FOUND_TOKEN_ACCOUNT_RECORD.data());

		std::string_view xHashView = v[tMemo::inlock::xHash];
		std::string_view wanAddrView = v[tMemo::inlock::wanAddr];
		std::string_view pkView = v[tMemo::inlock::pk];

		// eosio::check(xHashView.size() == hLimit::xHash, hError::error::INVALID_XHASH);
		// eosio::check(wanAddrView.size() == hLimit::wanAddr, hError::error::INVALID_WAN_ADDR);
		// eosio::check(and pkView.size() == hLimit::pk, hError::error::INVALID_PK);

		htlc::pk_t pkInfo;
		eosio::checksum256 pkHash = hashMsg(pkView);

		if (!findPK(pkHash, &pkInfo)) {
			savePk(pkView, pkHash, &pkInfo);
		}
#ifdef _DEBUG_PRINT
		eosio::print("\t[inlock => pks => id:", pkInfo.id, "]\t");
#endif

		eosio::check(!isPkDebt(pkInfo.id, account, quantity.symbol), hError::error::BUSY_PK.data());

#ifdef _DEBUG_PRINT
		eosio::print("\t [inlock => user:", user, ", quantity:", quantity, \
        ", xHash:", static_cast<std::string>(xHashView), \
        ", xHash size:", xHashView.size(), \
        ", wanAddr:", static_cast<std::string>(wanAddrView), \
        ", pk:", static_cast<std::string>(pkView), "]\t");
#endif

		eosio::checksum256 xHashValue = parseXHash(xHashView);

#ifdef _DEBUG_PRINT
		eosio::print("\t [inlock => parseXHash:", xHashValue, "]\t");
#endif
		inlockTx(pkInfo.id, user, account, quantity, xHashValue, wanAddrView);
	}

/// @notice               	type        comment
/// @param storeman  		name        storeman account name
/// @param xHash          	string      hash of HTLC random number
/// @param x              	string      HTLC random number
/// coin flow: htlc -> storeman
	ACTION htlc::inredeem(eosio::name storeman, std::string x) {
#ifdef _DEBUG_PRINT
		eosio::print("\t[inredeem => storeman:", storeman, ", x:", x, " ]\t");
#endif
		eosio::check(eosio::is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());
		eosio::require_auth(storeman);

		htlc::pk_t pkInfo;
		/* inredeem */
		{
			/* get record by xHash */
			eosio::checksum256 xHashValue = hashHexMsg(x);

			transfers transfers_table(get_self(), get_self().value);
			auto tXHashTable = transfers_table.get_index<hTable::key::xHash>();
			auto tItr = tXHashTable.find(xHashValue);
			eosio::check(tItr != tXHashTable.end() and \
            eosio::name(tItr->status).value == eosio::name(hStatus::status::inlock).value, \
            hError::error::NOT_FOUND_RECORD.data());

			/* check lockedTime */
			auto nowTime = eosio::time_point_sec(eosio::current_time_point());
			eosio::check((tItr->beginTime + tItr->lockedTime) >= nowTime, hError::error::REDEEM_TIMEOUT.data());

			/* find from pks table by pk id */
			eosio::check(findPK(tItr->pid, &pkInfo), hError::error::NOT_FOUND_PK_RECORD.data());
#ifdef _DEBUG_PRINT
			eosio::print("\t[inredeem => pks(id:", pkInfo.id, ", pk:", pkInfo.pk, ", pkHash:", pkInfo.pkHash, ")]\t");
#endif

			addAssetTo(tItr->pid, tItr->account, tItr->quantity);
#ifdef _DEBUG_PRINT
			eosio::print("\t[inredeem => beginTime:", tItr->beginTime.sec_since_epoch(), ", lockedTime:",
						 tItr->lockedTime, \
            ", status:", tItr->status, ", id:", tItr->id, ", pid:", tItr->pid, \
            ", quantity:", tItr->quantity, ", xHash:", tItr->xHash, ", wanAddr:", tItr->wanAddr, " ]\t");
#endif
			tItr = tXHashTable.erase(tItr);
		}

	}

/// @notice               type        comment
/// @param user           name        account name of user initiated the Tx
/// @param xHash          string      hash of HTLC random number
/// coin flow: htlc -> user
	ACTION htlc::inrevoke(std::string xHash) {
		eosio::checksum256 xHashValue = parseXHash(xHash);

#ifdef _DEBUG_PRINT
		eosio::print("\t [inrevoke => xHash:", xHash, "]\t");
#endif

		transfers transfers_table(get_self(), get_self().value);
		auto tXHashTable = transfers_table.get_index<hTable::key::xHash>();
		auto tItr = tXHashTable.find(xHashValue);
		eosio::check(tItr != tXHashTable.end() and \
        eosio::name(tItr->status).value == eosio::name(hStatus::status::inlock).value, \
        hError::error::NOT_FOUND_RECORD.data());

		// check lockedTime
		auto nowTime = eosio::time_point_sec(eosio::current_time_point());
		eosio::check((tItr->beginTime + tItr->lockedTime) < nowTime, hError::error::REVOKE_TIMEOUT.data());

		uint64_t revokeRatio;
		getRatio(revokeRatio);
#ifdef _DEBUG_PRINT
		eosio::print("\t[inrevoke => revokeRatio:", revokeRatio, "]\t");
#endif

		eosio::asset fee = (tItr->quantity * revokeRatio) / hLimit::ratioPrecise;
		eosio::check(fee.is_valid() and fee.amount >= 0 and fee <= tItr->quantity, hError::error::FEE_OVERFLOW.data());
		eosio::asset left = tItr->quantity - fee;
		eosio::check(left.is_valid() and left.amount >= 0 and left <= tItr->quantity,
					 hError::error::LEFT_OVERFLOW.data());
#ifdef _DEBUG_PRINT
		eosio::print("\t[inrevoke => fee:", fee, ", left:", left, "]\t");
#endif

		// if revokeRatio != 0 and quantity too small cause fee == 0, all quantity will be treated as fee
		if (revokeRatio != 0 and fee.amount == 0) {
			fee += left;
			left -= left;
		}

		auto tItrData = *tItr;
		auto tItrRet = tXHashTable.erase(tItr);

		if (left.amount > 0) {
			std::string memo = static_cast<std::string>(hStatus::status::inrevoke);

#ifdef _DEBUG_PRINT
			eosio::print("\t [inrevoke => quantity left memo:", memo, "]\t");
#endif
			// eosio.token's action [transfer] will notify user that user inrevoked by memo
			eosio::action(eosio::permission_level{this->get_self(), hPermission::level::active}, tItrData.account,
						  TRANSFER_NAME,
						  std::make_tuple(this->get_self(), tItrData.user, left, memo)).send();
		}
		// else {
		// 	// notify user that user inrevoked when not enough quantity left to give back
		// 	eosio::require_recipient(tItrData.user);
		// }

		if (fee.amount > 0) {
			// record fee for storeman, then storeman will get it by withdraw
#ifdef _DEBUG_PRINT
			eosio::print("\t [inrevoke => cost fee:", fee, "]\t");
#endif

			addFeeTo(tItrData.pid, tItrData.account, fee);
		}
#ifdef _DEBUG_PRINT
		eosio::print("\t[inrevoke => beginTime:", tItrData.beginTime.sec_since_epoch(), ", lockedTime:", tItrData.lockedTime, \
        ", status:", tItrData.status, ", id:", tItrData.id, ", user:", tItrData.user, ", pid:", tItrData.pid, \
        ", quantity:", tItrData.quantity, ", left:", left, ", fee:", fee, ", xHash:", tItrData.xHash, \
        ", wanAddr:", tItrData.wanAddr, " ]\t");
#endif
		return;
	}

/// @notice               type        comment
/// @param user           name        account name of user initiated the Tx
/// @param storeman  name        storeman account name
/// @param quantity       asset       exchange quantity
/// @param memo           string      xHash:wanAddr:user:status
/// coin flow: storeman -> htlc
	ACTION htlc::outlock(eosio::name storeman, eosio::name user, eosio::name account, eosio::asset quantity, \
    std::string xHash, std::string pk, std::string r, std::string s) {
#ifdef _DEBUG_PRINT
		eosio::print("\t[outlock => storeman:", storeman, ", user:", user, ", account:", account, ", quantity:", \
					 quantity, ", xHash:", xHash, ", pk:", pk, ", r:", r, ", s:", s, "]\t");
#endif
		eosio::check(eosio::is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());
		// eosio::require_auth(storeman);
		eosio::require_auth(eosio::permission_level{storeman, hPermission::level::active});

		eosio::check(eosio::is_account(user) and user != get_self(), hError::error::INVALID_USER_ACCOUNT.data());
		eosio::check(quantity.is_valid() and quantity.amount > 0, hError::error::INVALID_QUANTITY.data());
		eosio::check(eosio::is_account(account) and account != get_self(), hError::error::INVALID_TOKEN_ACCOUNT.data());
		//eosio::check(existTokenAccount(account.value), hError::error::NOT_FOUND_TOKEN_ACCOUNT_RECORD.data());
		/* outlock */
		{
			eosio::checksum256 xHashValue = parseXHash(xHash);
#ifdef _DEBUG_PRINT
			eosio::print("\t [ outlock => xHashValue:", xHashValue, "]\t");
#endif

			transfers transfers_table(get_self(), get_self().value);
			auto tXHashTable = transfers_table.get_index<hTable::key::xHash>();
			auto tItr = tXHashTable.find(xHashValue);
			eosio::check(tItr == tXHashTable.end(), hError::error::REDUPLICATIVE_XHASH.data());

			htlc::pk_t pkInfo;
			eosio::check(findPK(pk, &pkInfo), hError::error::NOT_FOUND_PK_RECORD.data());
			eosio::check(!isPkDebt(pkInfo.id, account, quantity.symbol), hError::error::BUSY_PK.data());

#ifdef _DEBUG_PRINT
			eosio::print("\t [ outlock => storeman: ", storeman, ", user: ", user, \
            ", account: ", account, ", quantity: ", quantity, ", xHash: ", xHash, " ]\t");
#endif

			/* pk asset should be more than cross-quantity */
			// eosio::asset totalAsset = quantity - quantity;
			eosio::asset totalAsset(0, quantity.symbol);
			getAssetFrom(pkInfo.id, account, &totalAsset);
#ifdef _DEBUG_PRINT
			eosio::print("\t[outlock => asset: ", totalAsset, "]\t");
#endif
			// eosio::check(totalAsset >= quantity, hError::error::NOE_ENOUGH_QUANTITY.data());

			/* pk asset should be more than (cross-quantity add all pendingAsset) */
			// eosio::asset outPendQuantity = quantity - quantity;
			eosio::asset outPendAsset(0, quantity.symbol);
			getOutPendAssetFrom(pkInfo.id, account, &outPendAsset);
#ifdef _DEBUG_PRINT
			eosio::print("\t[outlock => pend asset: ", outPendAsset, "]\t");
#endif
			eosio::check(totalAsset >= (outPendAsset + quantity), hError::error::NOE_ENOUGH_QUANTITY.data());

			outlockTx(pkInfo.id, user, account, quantity, xHashValue);

			// eosio::require_recipient(user, storeman);
		}

		/* signature verification */
		{
			std::vector<std::string_view> v;
			v.push_back(user.to_string());
			v.push_back(account.to_string());
			v.push_back(quantity.to_string());
			v.push_back(xHash);

			verifySignature(hStatus::status::outlock, pk, r, s, v);
		}
	}

/// @notice               type        comment
/// @param user           name        account name of user initiated the Tx
/// @param storeman       name        storeman account name
/// @param xHash          string      hash of HTLC random number
/// @param x              string      HTLC random number
/// coin flow: htlc -> user
	ACTION htlc::outredeem(eosio::name user, std::string x) {

		eosio::check(eosio::is_account(user) and user != get_self(), hError::error::INVALID_USER_ACCOUNT.data());
		eosio::require_auth(user);

		{
#ifdef _DEBUG_PRINT
			eosio::print("\t [outredeem => user:", user, ", x:", x, "]\t");
#endif

			eosio::checksum256 xHashValue = hashHexMsg(x);
			transfers transfers_table(get_self(), get_self().value);
			auto tXHashTable = transfers_table.get_index<hTable::key::xHash>();
			auto tItr = tXHashTable.find(xHashValue);
			eosio::check(tItr != tXHashTable.end() and \
            eosio::name(tItr->status).value == eosio::name(hStatus::status::outlock).value and \
            tItr->user == user, hError::error::NOT_FOUND_RECORD.data());
#ifdef _DEBUG_PRINT
			eosio::print("\t[outredeem => beginTime:", tItr->beginTime.sec_since_epoch(), ", lockedTime:",
						 tItr->lockedTime, \
            ", status:", tItr->status, ", id:", tItr->id, ", user:", tItr->user, ", account:", tItr->account, "\
            , quantity:", tItr->quantity, ", xHash:", tItr->xHash, ", wanAddr:", tItr->wanAddr, " ]\t");
#endif

			//  check lockedTime
			auto nowTime = eosio::time_point_sec(eosio::current_time_point());
			eosio::check((tItr->beginTime + tItr->lockedTime) >= nowTime, hError::error::REDEEM_TIMEOUT.data());
#ifdef _DEBUG_PRINT
			eosio::print("\t[outredeem => eosio::current_time_point: ", nowTime.sec_since_epoch(), ", beginTime: ",
						 tItr->beginTime.sec_since_epoch(), \
            ", lockedTime: ", tItr->lockedTime, "]\t");
#endif
			/*quota reduce*/
			subAssetFrom(tItr->pid, tItr->account, tItr->quantity);
			/*end for quota reduce*/

			// make memo
			std::string memo = static_cast<std::string>(hStatus::status::outredeem);

#ifdef _DEBUG_PRINT
			eosio::print("\t [outredeem => memo: ", memo, "]\t");
#endif
			auto quantityTemp 	= tItr->quantity;
			auto userTemp 		= tItr->user;
			auto accountTemp 	= tItr->account;

			tItr = tXHashTable.erase(tItr);

			eosio::action(eosio::permission_level{this->get_self(), hPermission::level::active}, accountTemp,
						  TRANSFER_NAME,
						  std::make_tuple(this->get_self(), userTemp, quantityTemp, memo)).send();
		}
	}

/// @notice               type        comment
/// @param xHash          string      hash of HTLC random number
/// coin flow: htlc -> storeman
	ACTION htlc::outrevoke(std::string xHash) {

		eosio::checksum256 xHashValue = parseXHash(xHash);
#ifdef _DEBUG_PRINT
		eosio::print("\t [outrevoke => xHash: ", xHash, "]\t");
#endif

		transfers transfers_table(get_self(), get_self().value);
		auto tXHashTable = transfers_table.get_index<hTable::key::xHash>();
		auto tItr = tXHashTable.find(xHashValue);
		eosio::check(tItr != tXHashTable.end() and \
        eosio::name(tItr->status).value == eosio::name(hStatus::status::outlock).value, \
        hError::error::NOT_FOUND_RECORD.data());

		// check lockedTime
		auto nowTime = eosio::time_point_sec(eosio::current_time_point());
		eosio::check((tItr->beginTime + tItr->lockedTime) < nowTime, hError::error::REVOKE_TIMEOUT.data());

		// notify user that storeman outrevoked
		// eosio::require_recipient(tItr->user);
#ifdef _DEBUG_PRINT
		eosio::print("\t[outrevoke => beginTime:", tItr->beginTime.sec_since_epoch(), ", lockedTime:", tItr->lockedTime, \
        ", status:", tItr->status, ", id:", tItr->id, ", user:", tItr->user, ", pid:", tItr->pid, \
        ", quantity:", tItr->quantity, ", xHash:", tItr->xHash, ", account:", tItr->account, "]\t");
#endif
		tItr = tXHashTable.erase(tItr);
	}

	ACTION htlc::setratio(uint64_t ratio) {
		eosio::require_auth(eosio::permission_level{get_self(), hPermission::level::active});

		longlongs ll_table(get_self(), get_self().value);
		auto lItr = ll_table.find(hTable::key::ratio.value);

		if (lItr == ll_table.end()) {
			ll_table.emplace(get_self(), [&](auto &s) {
				s.flag = hTable::key::ratio;
				s.value = ratio;
#ifdef _DEBUG_PRINT
				eosio::print("\t[setratio => flag:", s.flag, ", value:", s.value, "]\t");
#endif
			});
		} else {
			ll_table.modify(lItr, get_self(), [&](auto &s) {
				s.value = ratio;
#ifdef _DEBUG_PRINT
				eosio::print("\t[setratio => flag:", s.flag, ", value:", s.value, "]\t");
#endif
			});
		}
	}

extern "C" {

	void applyTransferAction(uint64_t receiver, uint64_t code, uint64_t action) {
		auto self = receiver;
		/* eosio.token -> transfer */
		/* eosio.token call htlc */
		// unpack action arguments, need check if something wrong happened while eosio::unpack_action_data, would htlc rollback?
		const htlc::transfer_data &unpackData = eosio::unpack_action_data<htlc::transfer_data>();
		// eosio::check(unpackData.to.value == self, "invalid calling");
		/* transfer(from, to, quantity, memo) */
		/* if to is htlc, need to process */
		if (unpackData.to.value == self) {
#ifdef _DEBUG_PRINT
			eosio::print("\t[applyTransferAction => from:", unpackData.from, ", to:", unpackData.to, \
                ", quantity:", unpackData.quantity, ", memo size:", unpackData.memo.size(), \
                ", tMemo::size::inlock::min:", tMemo::size::inlock::min, \
                ", tMemo::size::inlock::max:", tMemo::size::inlock::max, "]\t");
#endif

			// optimize code for getting status
			std::string status;
			common::split(unpackData.memo, tMemo::separator, tMemo::inlock::status, status);
#ifdef _DEBUG_PRINT
			eosio::print("\t[parse memo for status:", status.data(), ", size:", status.size(), \
                ", status.value:", eosio::name(status).value, "]\t");
#endif

			switch (eosio::name(status).value) {
				case eosio::name(hStatus::status::inlock).value: {
					/// memo max size <= 256 bytes by eosio.token transfer, status:xHash:wanAddr:pk
					eosio::check(unpackData.memo.size() >= tMemo::size::inlock::min and \
                            unpackData.memo.size() <= tMemo::size::inlock::max, hError::error::INVALID_MEMO.data());

					eosio::execute_action(eosio::name(self), eosio::name(code), &htlc::inlock);
					break;
				}
					// default: {
					//     /* the action such as sellram will enter here, and will interrupt those actions, so delete */
					//     eosio::check(false, "invalid status, it should be one of [inlock, inredeem, inrevoke, outlock, outredeem, outrevoke]");
					// }
			}
		}
	}
}

	extern "C" void apply(uint64_t receiver, uint64_t code, uint64_t action) {

#ifdef _DEBUG_PRINT
		eosio::print("\t[C Api => apply running => receiver:", eosio::name(receiver), ", code:", eosio::name(code), \
        ", action:", eosio::name(action), "]\t");
#endif

		eosio::check(action != "onerror"_n.value, hError::error::SYSTEM_ERROR.data());

		auto self = receiver;
		htlc::signature_t sigInfo;
		//htlc::account_t tokenAccountInfo;

		htlc _htlc(eosio::name(receiver), eosio::name(code), eosio::datastream<const char *>(nullptr, 0));

		if (action == TRANSFER_NAME.value) {
#ifdef _DEBUG_PRINT
			//eosio::print(tokenAccountInfo.code, " => ACTION");
			eosio::print(TRANSFER_NAME, " => ACTION");
#endif
			/* eosio.token transfer trigger htlc action */
			/* inlock */
			/* Originator is user wallet */
			applyTransferAction(receiver, code, action);

		} else if (self == code) {
#ifdef _DEBUG_PRINT
			eosio::print("COMMON ACTION");
#endif
			/* call common htlc action */
			switch (action) {
#ifdef _DEBUG_API
				EOSIO_DISPATCH_HELPER(htlc, (inredeem)(inrevoke)(outlock)(outredeem)(outrevoke)(withdraw)\
                (lockdebt)(redeemdebt)(revokedebt)(regsig)(updatesig)(unregsig) \
                (setratio)(printratio)(query)(truncate)(leftlocktime)(gethash))
#else
				EOSIO_DISPATCH_HELPER(htlc, (inredeem)(inrevoke)(outlock)(outredeem)(outrevoke)(withdraw)\
				(lockdebt)(redeemdebt)(revokedebt)(regsig)(updatesig)(unregsig) \
				(setratio))
#endif
			}
		}
	}

} // namespace htlc
