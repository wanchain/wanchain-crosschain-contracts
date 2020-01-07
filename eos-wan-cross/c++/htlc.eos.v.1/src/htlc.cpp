#include "../include/type.hpp"
#include "../include/tools.hpp"
#include "../include/htlc.hpp"

#include <eosio/system.hpp>
#include <cstdlib>

#include "./htlcHelp.cpp"

namespace htlc {

#ifdef _DEBUG_API

	ACTION htlc::gethash(std::string value) {
		eosio::checksum256 hashValue = hashHexMsg(value);
		eosio::print("\t[gethash => hashHexMsg(", value, ") is :", hashValue, "]\t");
	}

	ACTION htlc::truncate(eosio::name table, std::string scope) {
		eosio::require_auth(get_self());

		switch (table.value) {
			case hTable::table::transfers.value: {
				transfers transfers_table(get_self(), eosio::name(scope).value);
				auto tItr = transfers_table.begin();
				while (tItr != transfers_table.end()) {
					tItr = transfers_table.erase(tItr);
				}
				break;
			}
			case hTable::table::pks.value: {
				pks pk_table(get_self(), eosio::name(scope).value);
				auto pItr = pk_table.begin();
				while (pItr != pk_table.end()) {
					pItr = pk_table.erase(pItr);
				}
				break;
			}
			case hTable::table::assets.value: {
				uint64_t scopeValue = std::atoll(scope.data());
				assets asset_table(get_self(), scopeValue);
				auto aItr = asset_table.begin();
				while (aItr != asset_table.end()) {
					aItr = asset_table.erase(aItr);
				}
				break;
			}
			case hTable::table::fees.value: {
				uint64_t scopeValue = std::atoll(scope.data());
				fees fee_table(get_self(), scopeValue);
				auto fItr = fee_table.begin();
				while (fItr != fee_table.end()) {
					fItr = fee_table.erase(fItr);
				}
				break;
			}
			case hTable::table::debts.value: {
				debts debt_table(get_self(), eosio::name(scope).value);
				auto dItr = debt_table.begin();
				while (dItr != debt_table.end()) {
					dItr = debt_table.erase(dItr);
				}
				break;
			}
			case hTable::table::signer.value: {
				signer signer_table(get_self(), eosio::name(scope).value);
				auto sItr = signer_table.begin();
				while (sItr != signer_table.end()) {
					sItr = signer_table.erase(sItr);
				}
				break;
			}
			case hTable::table::longlongs.value: {
				longlongs ll_table(get_self(), eosio::name(scope).value);
				auto lItr = ll_table.begin();
				while (lItr != ll_table.end()) {
					lItr = ll_table.erase(lItr);
				}
				break;
			}
			default:
				eosio::check(false, hError::error::INVALID_TABLE.data());
		}
	}

	ACTION htlc::query(eosio::name table, std::string scope) {
		eosio::print("\t[query => table:", table);
		switch (table.value) {
			case hTable::table::transfers.value: {
				eosio::print(",scope:", eosio::name(scope).value, "]\t");
				transfers transfers_table(get_self(), eosio::name(scope).value);
				auto tItr = transfers_table.begin();
				while (tItr != transfers_table.end()) {
					eosio::print("\t[beginTime:", (*tItr).beginTime.sec_since_epoch(), \
                    ", lockedTime:", (*tItr).lockedTime, \
                    ", status:", (*tItr).status, ", id:", (*tItr).id, \
                    ", user:", (*tItr).user, ", pid:", (*tItr).pid, \
                    ", quantity:", (*tItr).quantity, \
                    ", xHash:", (*tItr).xHash, \
                    ", wanAddr:", (*tItr).wanAddr, \
                    ", account:", (*tItr).account, "]\t");
					++tItr;
				}
				break;
			}
			case hTable::table::pks.value: {
				eosio::print(",scope:", eosio::name(scope).value, "]\t");
				pks pk_table(get_self(), eosio::name(scope).value);
				auto pItr = pk_table.begin();
				while (pItr != pk_table.end()) {
					eosio::print("\t[id:", (*pItr).id, ", pk:", (*pItr).pk, ", pkHash:", (*pItr).pkHash, "]\t");
					++pItr;
				}
				break;
			}
			case hTable::table::assets.value: {
				uint64_t scopeValue = std::atoll(scope.data());
				eosio::print(",scope:", scopeValue, "]\t");
				assets asset_table(get_self(), scopeValue);
				auto aItr = asset_table.begin();
				while (aItr != asset_table.end()) {
					eosio::print("\t[id:", (*aItr).id, ", account:", (*aItr).account, ", balance:", (*aItr).balance,
								 "]\t");
					++aItr;
				}
				break;
			}
			case hTable::table::fees.value: {
				uint64_t scopeValue = std::atoll(scope.data());
				eosio::print(",scope:", scopeValue, "]\t");
				fees fee_table(get_self(), scopeValue);
				auto fItr = fee_table.begin();
				while (fItr != fee_table.end()) {
					eosio::print("\t[id:", (*fItr).id, ", account:", (*fItr).account, ", fee:", (*fItr).fee, "]\t");
					++fItr;
				}
				break;
			}

			case hTable::table::signer.value: {
				eosio::print(",scope:", eosio::name(scope).value, "]\t");
				signer signer_table(get_self(), eosio::name(scope).value);
				auto sItr = signer_table.begin();
				while (sItr != signer_table.end()) {
					eosio::print("\t[code:", (*sItr).code, ", action:", (*sItr).action, "]\t");
					++sItr;
				}
				break;
			}
			case hTable::table::longlongs.value: {
				eosio::print(",scope:", eosio::name(scope).value, "]\t");
				longlongs ll_table(get_self(), eosio::name(scope).value);
				auto lItr = ll_table.begin();
				while (lItr != ll_table.end()) {
					eosio::print("\t[flag:", (*lItr).flag, ", value:", (*lItr).value, "]\t");
					++lItr;
				}
				break;
			}
			default:
				eosio::check(false, hError::error::INVALID_TABLE.data());
		}
	}

/* debug, would be removed */
	ACTION htlc::leftlocktime(eosio::name table, std::string xHash) {
		eosio::checksum256 xHashValue = parseXHash(xHash);
		eosio::print("\t[leftlocktime => xHash", xHash, ", xHashValue:", xHashValue, " s]\t");

		switch (table.value) {
			case hTable::table::transfers.value: {
				transfers transfers_table(get_self(), get_self().value);
				auto tXHashTable = transfers_table.get_index<hTable::key::xHash>();
				auto tItr = tXHashTable.find(xHashValue);
				eosio::check(tItr != tXHashTable.end(), hError::error::NOT_FOUND_RECORD.data());

				auto nowTime = eosio::time_point_sec(eosio::current_time_point());
				auto leftTime = (tItr->beginTime + tItr->lockedTime) - nowTime;
#ifdef _DEBUG_PRINT
				eosio::print("\t[left lock time: ", (leftTime.count() > 0) ? leftTime.to_seconds() : 0, " s]\t");
#endif
				break;
			}
			case hTable::table::debts.value: {
				debts debt_table(get_self(), get_self().value);
				auto dXHashTable = debt_table.get_index<hTable::key::xHash>();
				auto dItr = dXHashTable.find(xHashValue);
				eosio::check(dItr != dXHashTable.end(), hError::error::NOT_FOUND_RECORD.data());

				auto nowTime = eosio::time_point_sec(eosio::current_time_point());
				auto leftTime = (dItr->beginTime + dItr->lockedTime) - nowTime;
#ifdef _DEBUG_PRINT
				eosio::print("\t[left lock time: ", (leftTime.count() > 0) ? leftTime.to_seconds() : 0, " s]\t");
#endif

				break;
			}
			default: {
				eosio::check(false, hError::error::INVALID_TABLE.data());
			}
		}
	}

#endif

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
	ACTION htlc::lockdebt(eosio::name storeman, eosio::name account, \
							eosio::asset quantity, std::string npk, std::string xHash, \
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
			eosio::check(totalAsset >= quantity, hError::error::NOE_ENOUGH_QUANTITY.data());

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
			std::string_view storemanView = storeman.to_string();
			std::string_view acctView = account.to_string();
			std::string_view qView = quantity.to_string();
			std::string_view npkView = npk;
			std::string_view xHashView = xHash;

			int32_t maxSize = storemanView.size() + acctView.size() + qView.size() + npkView.size() + xHashView.size() +
							  tMemo::lockDebt::total - 1;
			verifySignature(hStatus::status::lockdebt, pk, r, s, maxSize, &storemanView, &acctView, &qView, \
            &npkView, &xHashView, &common::strEOF);
		}
	}

/// @notice               type        comment
/// @param storeman       name        storeman account name
/// @param x              string      HTLC random number
/// @param r              string      randoms for signature verification
/// @param s              string      signature for signature verification
/// coin flow: htlc -> storeman
	ACTION htlc::redeemdebt(eosio::name storeman, std::string x, std::string r, std::string s) {
#ifdef _DEBUG_PRINT
		eosio::print("\t[redeemdebt => storeman:", storeman, ", x:", x, ", r:", r, ", s:", s, " ]\t");
#endif
		eosio::check(eosio::is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());
		eosio::require_auth(storeman);

		htlc::pk_t npkInfo;
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
			eosio::check((dItr->beginTime + dItr->lockedTime) > nowTime, hError::error::REDEEM_TIMEOUT.data());
#ifdef _DEBUG_PRINT
			eosio::print("\t[redeemdebt => eosio::current_time_point:", nowTime.sec_since_epoch(), \
            ", beginTime: ", dItr->beginTime.sec_since_epoch(), ", lockedTime: ", dItr->lockedTime, "]\t");
#endif

			/* check pks table */
			eosio::check(hasPK(dItr->pid), hError::error::NOT_FOUND_PK_RECORD.data());
			eosio::check(findPK(dItr->npid, &npkInfo), hError::error::NOT_FOUND_PK_RECORD.data());

#ifdef _DEBUG_PRINT
			eosio::print("\t[redeemdebt => find pk id:", npkInfo.id, ", pk:", npkInfo.pk, ", pkHash:", npkInfo.pkHash,
						 "]\t");
#endif

			/* clean pk from table pks if pk is not used */
			subAssetFrom(dItr->pid, dItr->account, dItr->quantity);
			addAssetTo(dItr->npid, dItr->account, dItr->quantity);
			cleanPk(dItr->pid);

			/* delete row (by xHash) from table debts */
			dItr = dXHashTable.erase(dItr);
			// dXHashTable.modify(dItr, get_self(), [&](auto &s) {
			//     s.status = hStatus::status::redeemdebt;
			// });
		}

		/* signature verification */
		{
			std::string_view storemanView = storeman.to_string();
			std::string_view xView = x;
			int32_t maxSize = storemanView.size() + xView.size() + tMemo::redeemDebt::total - 1;

			verifySignature(hStatus::status::redeemdebt, npkInfo.pk, r, s, maxSize, &storemanView, &xView,
							&common::strEOF);
		}
	}

	ACTION htlc::revokedebt(std::string xHash, std::string r, std::string s) {
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
			// dXHashTable.modify(dItr, get_self(), [&](auto &s) {
			//     s.status = hStatus::status::revokedebt;
			// });
		}

		/* signature verification */
		{
			std::string_view xHashView = xHash;
			int32_t maxSize = +xHashView.size() + tMemo::revokeDebt::total - 1;

			verifySignature(hStatus::status::revokedebt, pkInfo.pk, r, s, maxSize, &xHashView, &common::strEOF);
		}
	}

/* withdraw fee, by storeman-self */
	ACTION htlc::withdraw(eosio::name storeman, std::string account, std::string sym, std::string pk, std::string r,
						  std::string s) {
#ifdef _DEBUG_PRINT
		eosio::print("\t[withdraw => storeman:", storeman, ", account:", account, ", sym:", sym, ", pk:", pk, ", r:", r,
					 ", s:", s, " ]\t");
#endif
		eosio::check(eosio::is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());
		eosio::require_auth(storeman);

		/* withdraw */
		{
			htlc::pk_t pkInfo;
			eosio::check(findPK(pk, &pkInfo), hError::error::NOT_FOUND_PK_RECORD.data());
			issueFeeFrom(pkInfo.id, storeman, account, sym, hStatus::status::withdraw);
		}

		/* signature verification */
		{
			std::string_view storemanView = storeman.to_string();
			std::string_view acctView = account;
			std::string_view symView = sym;
			int32_t maxSize = storemanView.size() + acctView.size() + symView.size() + tMemo::withdraw::total - 1;
			// check sym and fee
			if (acctView.empty() || symView.empty()) {
				if (acctView.empty()) {
					maxSize -= 2;
				} else {
					--maxSize;
				}
			}

			verifySignature(hStatus::status::withdraw, pk, r, s, maxSize, &storemanView, &acctView, &symView,
							&common::strEOF);
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

/// @notice               type        comment
/// @param storeman  name        storeman account name
/// @param xHash          string      hash of HTLC random number
/// @param x              string      HTLC random number
/// @param r              string      randoms for signature verification
/// @param s              string      signature for signature verification
/// coin flow: htlc -> storeman
	ACTION htlc::inredeem(eosio::name storeman, std::string x, std::string r, std::string s) {
#ifdef _DEBUG_PRINT
		eosio::print("\t[inredeem => storeman:", storeman, ", x:", x, ", r:", r, ", s:", s, " ]\t");
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
			eosio::check((tItr->beginTime + tItr->lockedTime) > nowTime, hError::error::REDEEM_TIMEOUT.data());

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
			// tXHashTable.modify(tItr, get_self(), [&](auto &s) {
			//     s.status = hStatus::status::inredeem;
			// });
		}

		/* signature verification */
		{
			std::string_view storemanView = storeman.to_string();
			std::string_view xView = x;
			int32_t maxSize = storemanView.size() + xView.size() + tMemo::inredeem::total - 1;

			verifySignature(hStatus::status::inredeem, pkInfo.pk, r, s, maxSize, &storemanView, &xView,
							&common::strEOF);
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
		eosio::check((tItr->beginTime + tItr->lockedTime) <= nowTime, hError::error::REVOKE_TIMEOUT.data());

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

		if (left.amount > 0) {
			/* find from pks table by pk id */
			// eosio::check(hasPK(tItr->pid), hError::error::NOT_FOUND_PK_RECORD.data());

			std::string memo;
			std::string_view xHashView = xHash;
			std::string_view acctView = tItr->account.to_string();

			int32_t maxSize =
					hStatus::status::inrevoke.size() + xHashView.size() + acctView.size() + tMemo::inrevoke::total - 1;
			memo.resize(maxSize);

			common::join(const_cast<char *>(memo.data()), tMemo::separator, \
            &hStatus::status::inrevoke, &xHashView, &acctView, &common::strEOF);

#ifdef _DEBUG_PRINT
			eosio::print("\t [inrevoke => quantity left memo:", memo, "]\t");
#endif

			// eosio.token's action [transfer] will notify user that user inrevoked by memo
			//htlc::account_t tokenAccountInfo;
			//eosio::check(getTokenAccountInfo(tItr->account, &tokenAccountInfo), hError::error::NOT_FOUND_TOKEN_ACCOUNT_RECORD.data());
//        eosio::action(eosio::permission_level{this->get_self(), hPermission::level::active}, tokenAccountInfo.code, tokenAccountInfo.action,
//            std::make_tuple(this->get_self(), tItr->user, left, memo)).send();

			eosio::action(eosio::permission_level{this->get_self(), hPermission::level::active}, tItr->account,
						  TRANSFER_NAME,
						  std::make_tuple(this->get_self(), tItr->user, left, memo)).send();
		} else {
			// notify user that user inrevoked when not enough quantity left to give back
			eosio::require_recipient(tItr->user);
		}

		if (fee.amount > 0) {
			// record fee for storeman, then storeman will get it by withdraw
#ifdef _DEBUG_PRINT
			eosio::print("\t [inrevoke => cost fee:", fee, "]\t");
#endif

			addFeeTo(tItr->pid, tItr->account, fee);
		}
#ifdef _DEBUG_PRINT
		eosio::print("\t[inrevoke => beginTime:", tItr->beginTime.sec_since_epoch(), ", lockedTime:", tItr->lockedTime, \
        ", status:", tItr->status, ", id:", tItr->id, ", user:", tItr->user, ", pid:", tItr->pid, \
        ", quantity:", tItr->quantity, ", left:", left, ", fee:", fee, ", xHash:", tItr->xHash, \
        ", wanAddr:", tItr->wanAddr, " ]\t");
#endif

		tItr = tXHashTable.erase(tItr);
		// tXHashTable.modify(tItr, get_self(), [&](auto &s) {
		//     s.status = hStatus::status::inrevoke;
		// });
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
		eosio::print("\t[outlock => storeman:", storeman, ", user:", user, ", account:", account, ", quantity:",
					 quantity\
, ", xHash:", xHash, ", pk:", pk, ", r:", r, ", s:", s, "]\t");
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
			eosio::check(totalAsset >= quantity, hError::error::NOE_ENOUGH_QUANTITY.data());

			/* pk asset should be more than (cross-quantity add all pendingAsset) */
			// eosio::asset outPendQuantity = quantity - quantity;
			eosio::asset outPendAsset(0, quantity.symbol);
			getOutPendAssetFrom(pkInfo.id, account, &outPendAsset);
#ifdef _DEBUG_PRINT
			eosio::print("\t[outlock => pend asset: ", outPendAsset, "]\t");
#endif
			eosio::check(totalAsset >= (outPendAsset + quantity), hError::error::NOE_ENOUGH_QUANTITY.data());

			outlockTx(pkInfo.id, user, account, quantity, xHashValue);

			eosio::require_recipient(user, storeman);
		}

		/* signature verification */
		{
			std::string_view storemanView = storeman.to_string();
			std::string_view userView = user.to_string();
			std::string_view acctView = account.to_string();
			std::string_view qView = quantity.to_string();
			std::string_view xHashView = xHash;

			int32_t maxSize =
					storemanView.size() + userView.size() + acctView.size() + qView.size() + xHashView.size() +
					tMemo::outlock::total - 1;

			verifySignature(hStatus::status::outlock, pk, r, s, maxSize, &storemanView, &userView, \
            &acctView, &qView, &xHashView, &common::strEOF);
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
			std::string memo;
			std::string_view xView = x;
			std::string_view acctView = tItr->account.to_string();

			int32_t maxSize =
					hStatus::status::outredeem.size() + xView.size() + acctView.size() + tMemo::outredeem::total - 1;
			memo.resize(maxSize);

			common::join(const_cast<char *>(memo.data()), tMemo::separator, &hStatus::status::outredeem, \
            &xView, &acctView, &common::strEOF);
#ifdef _DEBUG_PRINT
			eosio::print("\t [outredeem => memo: ", memo, "]\t");
#endif
			eosio::action(eosio::permission_level{this->get_self(), hPermission::level::active}, tItr->account,
						  TRANSFER_NAME,
						  std::make_tuple(this->get_self(), tItr->user, tItr->quantity, memo)).send();

			tItr = tXHashTable.erase(tItr);
			// tXHashTable.modify(tItr, get_self(), [&](auto &s) {
			//     s.status = hStatus::status::outredeem;
			// });
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
		eosio::require_recipient(tItr->user);
#ifdef _DEBUG_PRINT
		eosio::print("\t[outrevoke => beginTime:", tItr->beginTime.sec_since_epoch(), ", lockedTime:", tItr->lockedTime, \
        ", status:", tItr->status, ", id:", tItr->id, ", user:", tItr->user, ", pid:", tItr->pid, \
        ", quantity:", tItr->quantity, ", xHash:", tItr->xHash, ", account:", tItr->account, "]\t");
#endif

		tItr = tXHashTable.erase(tItr);
		// tXHashTable.modify(tItr, get_self(), [&](auto &s) {
		//     s.status = hStatus::status::outrevoke;
		// });
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

#ifdef _DEBUG_API

	ACTION htlc::printratio() {
		longlongs ll_table(get_self(), get_self().value);
		auto lItr = ll_table.find(hTable::key::ratio.value);
		eosio::check(lItr != ll_table.end(), hError::error::NOT_FOUND_RECORD.data());

#ifdef _DEBUG_PRINT
		eosio::print("\t[printratio => flag:", (*lItr).flag, ", value:", (*lItr).value, "]\t");
#endif
	}

#endif

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
			//if (_htlc.getTokenAccountInfo(eosio::name(code), &tokenAccountInfo) and action == eosio::name(tokenAccountInfo.action).value) {
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
