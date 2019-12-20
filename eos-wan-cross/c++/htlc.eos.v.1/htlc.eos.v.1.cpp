#include "htlc.eos.v.1.hpp"

#ifdef EOS_WAN_HTLC_H
#include <eosio/system.hpp>
#include <cstdlib>

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
        case hTable::table::accounts.value: {
            accounts account_table(get_self(), eosio::name(scope).value);
            auto aItr = account_table.begin();
            while (aItr != account_table.end()) {
                aItr = account_table.erase(aItr);
            }
            break;
        }
        case hTable::table::tokens.value: {
            tokens token_table(get_self(), eosio::name(scope).value);
            auto tItr = token_table.begin();
            while (tItr != token_table.end()) {
                tItr = token_table.erase(tItr);
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
    eosio::require_auth(eosio::permission_level{get_self(), hPermission::level::sign});

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
    eosio::require_auth(eosio::permission_level{get_self(), hPermission::level::sign});

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
    eosio::require_auth(eosio::permission_level{get_self(), hPermission::level::sign});

    signer sig_table(get_self(), get_self().value);
    auto dItr = sig_table.find(code.value);
    eosio::check(dItr != sig_table.end(), hError::error::NOT_FOUND_SIGNATURE_RECORD.data());

    dItr = sig_table.erase(dItr);
}

/* register token contract info, by htlc-self */
ACTION htlc::regacct(eosio::name code, eosio::name action) {
    eosio::require_auth(eosio::permission_level{get_self(), hPermission::level::token});

    #ifdef _DEBUG_PRINT
    eosio::print("\t[regacct => code:", code, ", action:", action, "]\t");
    #endif
    accounts account_table(get_self(), get_self().value);
    auto aItr = account_table.find(code.value);
    eosio::check(aItr == account_table.end(), hError::error::REDUPLICATIVE_RECORD.data());

    account_table.emplace(get_self(), [&](auto &s) {
        s.code = code;
        s.action = action;
        #ifdef _DEBUG_PRINT
        eosio::print("\t[regacct => code ", s.code, " and action ", s.action, "]\t");
        #endif
    });
}

ACTION htlc::updateacct(eosio::name code, eosio::name nCode, eosio::name nAction) {
    eosio::require_auth(eosio::permission_level{get_self(), hPermission::level::token});

    accounts account_table(get_self(), get_self().value);
    auto aItr = account_table.find(code.value);
    eosio::check(aItr != account_table.end(), hError::error::NOT_FOUND_TOKEN_ACCOUNT_RECORD.data());

    account_table.modify(aItr, get_self(), [&](auto &s) {
        s.code = nCode;
        s.action = nAction;
        #ifdef _DEBUG_PRINT
        eosio::print("\t[updateacct => code ", s.code, " and action ", s.action, "]\t");
        #endif
    });
}

ACTION htlc::unregaccnt(eosio::name code) {
    eosio::require_auth(eosio::permission_level{get_self(), hPermission::level::token});

    accounts account_table(get_self(), get_self().value);
    auto tItr = account_table.find(code.value);
    eosio::check(tItr != account_table.end(), hError::error::NOT_FOUND_TOKEN_ACCOUNT_RECORD.data());

    cleanTokens(code.value);
    tItr = account_table.erase(tItr);
}

/* register token info */
ACTION htlc::regtoken(eosio::name code, eosio::symbol sym) {
    eosio::require_auth(eosio::permission_level{get_self(), hPermission::level::token});

    #ifdef _DEBUG_PRINT
    eosio::print("\t[regtoken => code:", code, ", action:", sym, "]\t");
    #endif

    tokens token_table(get_self(), code.value);
    auto tItr = token_table.find(sym.raw());
    eosio::check(tItr == token_table.end(), hError::error::REDUPLICATIVE_RECORD.data());

    token_table.emplace(get_self(), [&](auto &s) {
        s.sym = sym;
        #ifdef _DEBUG_PRINT
        eosio::print("\t[regtoken => symbol ", s.sym, "]\t");
        #endif
    });
}
// ACTION htlc::regtoken(eosio::name code, const vector<eosio::symbol>& syms) {
//     eosio::require_auth(eosio::permission_level{get_self(), hPermission::level::token});

//     #ifdef _DEBUG_PRINT
//     eosio::print("\t[regtoken => code:", code, ", action:", action, "]\t");
//     #endif

//     tokens token_table(get_self(), code.value);
//     std::for_each(syms.begin(), syms.end(), [](eosio::symbol *pSym) {
//         auto tItr = token_table.find((*pSym).value);
//         eosio::check(tItr == token_table.end(), hError::error::REDUPLICATIVE_RECORD.data());

//         token_table.emplace(get_self(), [&](auto &s) {
//             s.sym = *pSym;
//             #ifdef _DEBUG_PRINT
//             eosio::print("\t[register token => symbol ", s.sym, "]\t");
//             #endif
//         });
//     });
// }

ACTION htlc::updatetoken(eosio::name code, eosio::symbol sym, eosio::symbol nSym) {
    eosio::require_auth(eosio::permission_level{get_self(), hPermission::level::token});

    tokens token_table(get_self(), code.value);
    auto tItr = token_table.find(sym.raw());
    eosio::check(tItr != token_table.end(), hError::error::NOT_FOUND_TOKEN_RECORD.data());

    token_table.modify(tItr, get_self(), [&](auto &s) {
        s.sym = nSym;
        #ifdef _DEBUG_PRINT
        eosio::print("\t[update token => symbol ", s.sym, "]\t");
        #endif
    });
}

ACTION htlc::unregtoken(eosio::name code, eosio::symbol sym) {
    eosio::require_auth(eosio::permission_level{get_self(), hPermission::level::token});

    tokens token_table(get_self(), code.value);
    auto tItr = token_table.find(sym.raw());
    eosio::check(tItr != token_table.end(), hError::error::NOT_FOUND_TOKEN_RECORD.data());

    tItr = token_table.erase(tItr);
}
// ACTION htlc::unregtoken(eosio::name code, const vector<eosio::symbol>& syms) {
//     eosio::require_auth(eosio::permission_level{get_self(), hPermission::level::token});

//     tokens token_table(get_self(), code.value);
//     std::for_each(syms.begin(), syms.end(), [](eosio::symbol *pSym) {
//         auto tItr = token_table.find((*pSym).value);
//         eosio::check(tItr == token_table.end(), hError::error::NOT_FOUND_TOKEN_RECORD.data());

//         tItr = token_table.erase(tItr);
//     });
// }

/* pk modification, by storeman-self */
ACTION htlc::updatepk(eosio::name storeman, std::string npk, std::string pk, std::string r, std::string s) {
    #ifdef _DEBUG_PRINT
    eosio::print("\t[updatepk => storeman:", storeman, ", npk:", npk.data(), ", pk:", pk.data(),"]\t");
    #endif

    eosio::check(eosio::is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());
    eosio::require_auth(storeman);

    /* update PK */
    {
        /* hashMsg(pk) */
        eosio::checksum256 pkHash = hashMsg(pk);

        /* find from pks table by hashMsg(pk) */
        pks pk_table(get_self(), get_self().value);
        auto pkHashTable = pk_table.get_index<hTable::key::pkHash>();
        auto pItr = pkHashTable.find(pkHash);
        eosio::check(pItr != pkHashTable.end(), hError::error::NOT_FOUND_PK_RECORD.data());
        eosio::check(!isPkDebt(pItr->id) and !isNPkDebt(pItr->id), hError::error::BUSY_PK.data());

        /* check unique pk */
        eosio::checksum256 npkHash = hashMsg(npk);
        auto npItr = pkHashTable.find(npkHash);
        eosio::check(npItr == pkHashTable.end(), hError::error::REDUPLICATIVE_RECORD.data());

        pkHashTable.modify(pItr, get_self(), [&](auto &s) {
            s.pk = npk;
            s.pkHash = npkHash;
            #ifdef _DEBUG_PRINT
            eosio::print("\t[updatepk => update pk ", pk, " to ", npk, "]\t");
            #endif
        });
        eosio::require_recipient(storeman);
    }

    /* signature verification */
    {
        std::string_view storemanView = storeman.to_string();
        std::string_view npkView = npk;
        int32_t maxSize = storemanView.size() + npkView.size() + tMemo::updatePk::total - 1;
        verifySignature(hStatus::status::updatepk, pk, r, s, maxSize, &storemanView, &npkView, &common::strEOF);
    }
}

ACTION htlc::removepk(eosio::name storeman, std::string pk, std::string r, std::string s) {

    eosio::check(eosio::is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());
    eosio::require_auth(storeman);

    /* remove PK */
    {
        #ifdef _DEBUG_PRINT
        eosio::print("\t[removepk => storeman:", storeman, ", pk:", pk.data(),"]\t");
        #endif

        /* hashMsg(pk) */
        eosio::checksum256 pkHash = hashMsg(pk);

        /* find from pks table by hashMsg(pk) */
        pks pk_table(get_self(), get_self().value);
        auto pkHashTable = pk_table.get_index<hTable::key::pkHash>();
        auto pItr = pkHashTable.find(pkHash);
        eosio::check(pItr != pkHashTable.end(), hError::error::NOT_FOUND_PK_RECORD.data());
        eosio::check(!isPkDebt(pItr->id) and !isNPkDebt(pItr->id) and !isPkInHtlc(pItr->id), \
            hError::error::BUSY_PK.data());

        #ifdef _DEBUG_PRINT
        eosio::print("\t[removepk => pk => id:", pItr->id, ", pk:", pItr->pk, ", pkHash:", pItr->pkHash, "]\t");
        #endif

        eosio::check(!existAsset(pItr->id), hError::error::EXIST_ASSET_RECORD.data());
        eosio::check(!existFee(pItr->id), hError::error::EXIST_FEE_RECORD.data());

        pItr = pkHashTable.erase(pItr);
        eosio::require_recipient(storeman);
    }

    /* signature verification */
    {
        std::string_view storemanView = storeman.to_string();
        int32_t maxSize = storemanView.size() + tMemo::removePk::total - 1;
        verifySignature(hStatus::status::removepk, pk, r, s, maxSize, &storemanView, &common::strEOF);
    }
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
    eosio::check(existTokenAccount(account.value), hError::error::NOT_FOUND_TOKEN_ACCOUNT_RECORD.data());

    /* lockdebt */
    {

        htlc::pk_t pkInfo;
        eosio::check(findPK(pk, &pkInfo), hError::error::NOT_FOUND_PK_RECORD.data());
        #ifdef _DEBUG_PRINT
        eosio::print("\t[lockdebt => pk => id:", pkInfo.id, ", pk:", pkInfo.pk, ", pkHash:", pkInfo.pkHash, "]\t");
        #endif
        // eosio::check(!isNPkDebt(pkInfo.id, account, quantity.symbol), hError::error::BUSY_PK.data());

        htlc::pk_t npkInfo;
        eosio::checksum256 npkHash = hashMsg(npk);
        if(!findPK(npkHash, &npkInfo)) {
            savePk(npk, npkHash, &npkInfo);
        }
        #ifdef _DEBUG_PRINT
        eosio::print("\t[lockdebt => npk => id:", npkInfo.id, ", pk:", npkInfo.pk, ", pkHash:", npkInfo.pkHash, "]\t");
        #endif
        // eosio::check(!isPkDebt(npkInfo.id, account, quantity.symbol), hError::error::BUSY_PK.data());

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

        int32_t maxSize = storemanView.size() + acctView.size() + qView.size() + npkView.size() + xHashView.size() + tMemo::lockDebt::total - 1;
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
        eosio::print("\t[redeemdebt => beginTime:", dItr->beginTime.sec_since_epoch(), ", lockedTime:", dItr->lockedTime, \
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
        eosio::print("\t[redeemdebt => find pk id:", npkInfo.id, ", pk:", npkInfo.pk, ", pkHash:", npkInfo.pkHash, "]\t");
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

        verifySignature(hStatus::status::redeemdebt, npkInfo.pk, r, s, maxSize, &storemanView, &xView, &common::strEOF);
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
        eosio::print("\t[revokedebt => beginTime:", dItr->beginTime.sec_since_epoch(), ", lockedTime:", dItr->lockedTime, \
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
        int32_t maxSize = + xHashView.size() + tMemo::revokeDebt::total - 1;

        verifySignature(hStatus::status::revokedebt, pkInfo.pk, r, s, maxSize, &xHashView, &common::strEOF);
    }
}

/* withdraw fee, by storeman-self */
ACTION htlc::withdraw(eosio::name storeman, std::string account, std::string sym, std::string pk, std::string r, std::string s) {
    #ifdef _DEBUG_PRINT
    eosio::print("\t[withdraw => storeman:", storeman, ", account:", account, ", sym:", sym, ", pk:", pk, ", r:", r, ", s:", s, " ]\t");
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

        verifySignature(hStatus::status::withdraw, pk, r, s, maxSize, &storemanView, &acctView, &symView, &common::strEOF);
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
    std::vector<std::string_view> v;
    common::split(memo, tMemo::separator, v);

    eosio::name account = eosio::name(v[tMemo::inlock::account]);
    eosio::check(eosio::is_account(account) and account != get_self(), hError::error::INVALID_TOKEN_ACCOUNT.data());
    eosio::check(existTokenAccount(account.value), hError::error::NOT_FOUND_TOKEN_ACCOUNT_RECORD.data());

    std::string_view xHashView = v[tMemo::inlock::xHash];
    std::string_view wanAddrView = v[tMemo::inlock::wanAddr];
    std::string_view pkView = v[tMemo::inlock::pk];

    // eosio::check(xHashView.size() == hLimit::xHash, hError::error::INVALID_XHASH);
    // eosio::check(wanAddrView.size() == hLimit::wanAddr, hError::error::INVALID_WAN_ADDR);
    // eosio::check(and pkView.size() == hLimit::pk, hError::error::INVALID_PK);

    htlc::pk_t pkInfo;
    eosio::checksum256 pkHash = hashMsg(pkView);

    if(!findPK(pkHash, &pkInfo)) {
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
        eosio::print("\t[inredeem => beginTime:", tItr->beginTime.sec_since_epoch(), ", lockedTime:", tItr->lockedTime, \
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

        verifySignature(hStatus::status::inredeem, pkInfo.pk, r, s, maxSize, &storemanView, &xView, &common::strEOF);
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
    eosio::check(fee.is_valid() and fee.amount >= 0 and fee <= tItr->quantity , hError::error::FEE_OVERFLOW.data());
    eosio::asset left = tItr->quantity - fee;
    eosio::check(left.is_valid() and left.amount >= 0 and left <= tItr->quantity, hError::error::LEFT_OVERFLOW.data());
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

        int32_t maxSize = hStatus::status::inrevoke.size() + xHashView.size() + acctView.size() + tMemo::inrevoke::total - 1;
        memo.resize(maxSize);

        common::join(const_cast<char *>(memo.data()), tMemo::separator, \
            &hStatus::status::inrevoke, &xHashView, &acctView, &common::strEOF);

        #ifdef _DEBUG_PRINT
        eosio::print("\t [inrevoke => quantity left memo:", memo, "]\t");
        #endif

        // eosio.token's action [transfer] will notify user that user inrevoked by memo
        htlc::account_t tokenAccountInfo;
        eosio::check(getTokenAccountInfo(tItr->account, &tokenAccountInfo), hError::error::NOT_FOUND_TOKEN_ACCOUNT_RECORD.data());
        eosio::action(eosio::permission_level{this->get_self(), hPermission::level::active}, tokenAccountInfo.code, tokenAccountInfo.action,
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
    eosio::print("\t[outlock => storeman:", storeman, ", user:", user, ", account:", account, ", quantity:", quantity\
        , ", xHash:", xHash, ", pk:", pk, ", r:", r, ", s:", s, "]\t");
    #endif
    eosio::check(eosio::is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());
    // eosio::require_auth(storeman);
    eosio::require_auth(eosio::permission_level{storeman, hPermission::level::active});

    eosio::check(eosio::is_account(user) and user != get_self(), hError::error::INVALID_USER_ACCOUNT.data());
    eosio::check(quantity.is_valid() and quantity.amount > 0, hError::error::INVALID_QUANTITY.data());
    eosio::check(eosio::is_account(account) and account != get_self(), hError::error::INVALID_TOKEN_ACCOUNT.data());
    eosio::check(existTokenAccount(account.value), hError::error::NOT_FOUND_TOKEN_ACCOUNT_RECORD.data());
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

        int32_t maxSize = storemanView.size() + userView.size() + acctView.size() + qView.size() + xHashView.size() + tMemo::outlock::total - 1;

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
        eosio::print("\t[outredeem => beginTime:", tItr->beginTime.sec_since_epoch(), ", lockedTime:", tItr->lockedTime, \
            ", status:", tItr->status, ", id:", tItr->id, ", user:", tItr->user, ", account:", tItr->account, "\
            , quantity:", tItr->quantity, ", xHash:", tItr->xHash, ", wanAddr:", tItr->wanAddr, " ]\t");
        #endif

        //  check lockedTime
        auto nowTime = eosio::time_point_sec(eosio::current_time_point());
        eosio::check((tItr->beginTime + tItr->lockedTime) >= nowTime, hError::error::REDEEM_TIMEOUT.data());
        #ifdef _DEBUG_PRINT
        eosio::print("\t[outredeem => eosio::current_time_point: ", nowTime.sec_since_epoch(), ", beginTime: ", tItr->beginTime.sec_since_epoch(), \
            ", lockedTime: ", tItr->lockedTime, "]\t");
        #endif

        // /* pk asset should be more than cross-quantity */
        // // eosio::asset totalAsset = tItr->quantity - tItr->quantity;
        // eosio::asset totalAsset(0, tItr->quantity.symbol);
        // getAssetFrom(tItr->pid, tItr->account, &totalAsset);
        // #ifdef _DEBUG_PRINT
        // eosio::print("\t[outredeem => asset: ", totalAsset, "]\t");
        // #endif
        // eosio::check(totalAsset >= tItr->quantity, hError::error::NOE_ENOUGH_QUANTITY.data());

        // /* pk asset should be more than (cross-quantity add all pendingAsset) */
        // // eosio::asset outPendQuantity = tItr->quantity - tItr->quantity;
        // eosio::asset outPendAsset(0, tItr->quantity.symbol);
        // getOutPendAssetFrom(tItr->pid, tItr->account, &outPendAsset);
        // #ifdef _DEBUG_PRINT
        // eosio::print("\t[outredeem => pend asset: ", outPendAsset, "]\t");
        // #endif
        // eosio::check(totalAsset >= (outPendAsset), hError::error::NOE_ENOUGH_QUANTITY.data());

        /*quota reduce*/
        subAssetFrom(tItr->pid, tItr->account, tItr->quantity);
        /*end for quota reduce*/

        // make memo
        std::string memo;
        std::string_view xView = x;
        std::string_view acctView = tItr->account.to_string();

        int32_t maxSize = hStatus::status::outredeem.size() + xView.size() + acctView.size() + tMemo::outredeem::total - 1;
        memo.resize(maxSize);

        common::join(const_cast<char *>(memo.data()), tMemo::separator, &hStatus::status::outredeem, \
            &xView, &acctView, &common::strEOF);
        #ifdef _DEBUG_PRINT
        eosio::print("\t [outredeem => memo: ", memo, "]\t");
        #endif

        // eosio.token's action [transfer] will notify user that user outredeemed by memo
        htlc::account_t tokenAccountInfo;
        eosio::check(getTokenAccountInfo(tItr->account, &tokenAccountInfo), hError::error::NOT_FOUND_TOKEN_ACCOUNT_RECORD.data());
        eosio::action(eosio::permission_level{this->get_self(), hPermission::level::active}, tokenAccountInfo.code, tokenAccountInfo.action,
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
    longlongs ll_table(get_self(), get_self().value);
    auto lItr = ll_table.find(hTable::key::ratio.value);
    eosio::check(lItr == ll_table.end(), hError::error::REDUPLICATIVE_RECORD.data());

    ll_table.emplace(get_self(), [&](auto &s) {
        s.flag = hTable::key::ratio;
        s.value = ratio;
        #ifdef _DEBUG_PRINT
        eosio::print("\t[setratio => flag:", s.flag, ", value:", s.value, "]\t");
        #endif
    });
}

ACTION htlc::updateratio(uint64_t ratio) {
    longlongs ll_table(get_self(), get_self().value);
    auto lItr = ll_table.find(hTable::key::ratio.value);
    eosio::check(lItr == ll_table.end(), hError::error::REDUPLICATIVE_RECORD.data());

    ll_table.modify(lItr, get_self(), [&](auto &s) {
        s.value = ratio;
        #ifdef _DEBUG_PRINT
        eosio::print("\t[updateratio => flag:", s.flag, ", value:", s.value, "]\t");
        #endif
    });
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

/* ACTION ABOVE*/

void htlc::getRatio(uint64_t &ratio) {
    longlongs ll_table(get_self(), get_self().value);
    auto lItr = ll_table.find(hTable::key::ratio.value);
    if(lItr == ll_table.end()) {
        ratio = 0;
    } else {
        ratio = (*lItr).value;
    }
}

eosio::checksum256 htlc::parseXHash(std::string_view xHashView) {
    #ifdef _DEBUG_PRINT
    eosio::print("\t[parseXHash => xHashView:", static_cast<std::string>(xHashView), ", size:", xHashView.size(),"]\t");
    #endif
    eosio::check(xHashView.size() == hLimit::xHash, hError::error::INVALID_XHASH.data());
    internal::Uint256_t xHashValue;
    hexStrToUint256(xHashView, xHashValue);
    std::string_view xHashValueStr = Uint256ToHexStr(xHashValue);
    #ifdef _DEBUG_PRINT
    eosio::print("\t[parseXHash=> xHashValue:", (eosio::checksum256)xHashValue.data, ", xHashValueStr:", static_cast<std::string>(xHashValueStr),"]\t");
    #endif
    eosio::check(xHashView.compare(xHashValueStr) == 0, hError::error::INVALID_XHASH.data());
    return xHashValue.data;
}

eosio::symbol htlc::stringToSymbol(std::string_view symStr) {
    /* parse quantity */
    std::vector<std::string_view> vSymbol;
    common::split(symStr, hSymbol::separator, vSymbol);
    eosio::check(hSymbol::item::total == vSymbol.size(), "invalid symbol");

    std::string_view precisionView = vSymbol[hSymbol::item::precision];
    std::string_view symCodeView = vSymbol[hSymbol::item::symCode];
    uint64_t precision = std::atoll(precisionView.data());
    eosio::symbol sym(eosio::symbol_code(symCodeView), precision);

    return sym;
}

eosio::asset htlc::stringToAsset(std::string_view qStr) {
    /* parse quantity */
    std::vector<std::string_view> vQuantity;
    common::split(qStr, hAsset::separator, vQuantity);
    eosio::check(hAsset::item::total == vQuantity.size(), "invalid asset");

    std::string_view qSym = vQuantity[hAsset::item::symCode];
    std::vector<std::string_view> vQAmount;
    common::split(vQuantity[hAsset::item::value], hAsset::dot, vQAmount);
    eosio::check(hAsset::item::total >= vQAmount.size(), "invalid asset");

    uint64_t qInteger = std::atoll(vQAmount[hAsset::amount::integer].data());
    uint64_t qDecimal = vQAmount.size() == hAsset::amount::total ? std::atoll(vQAmount[hAsset::amount::decimal].data()) : 0;
    uint64_t qPrecision = vQAmount.size() == hAsset::amount::decimal ? vQAmount[1].size() : 0;
    uint64_t count = qPrecision;
    uint64_t p10 = 1;

    while (count > 0) {
        p10 *=10;
        --count;
    }

    uint64_t qAmount = qInteger * p10 + qDecimal;
    eosio::asset quantity(qAmount, eosio::symbol(eosio::symbol_code(qSym), qPrecision));
    return quantity;
}

bool htlc::getSignature(void *sigInfo) {
    /* get the signature contract info */

    eosio::check(sigInfo != nullptr, hError::error::INVALID_PARAM.data());
    signer sig_table(get_self(), get_self().value);
    if (sig_table.begin() == sig_table.end()) {
        return false;
    }

    auto sItr = sig_table.begin();
    static_cast<signature_t *>(sigInfo)->code = sItr->code;
    static_cast<signature_t *>(sigInfo)->action = sItr->action;
    return true;
}

bool htlc::existTokenAccount(uint64_t code) {
    /* get the signature contract info */

    accounts account_table(get_self(), get_self().value);
    auto tItr = account_table.find(code);
    return !(tItr == account_table.end());
}

bool htlc::getTokenAccountInfo(eosio::name code, void *tokenAccountInfo) {
    /* get the signature contract info */

    eosio::check(tokenAccountInfo != nullptr, hError::error::INVALID_PARAM.data());
    accounts account_table(get_self(), get_self().value);
    auto tItr = account_table.find(code.value);
    if (tItr == account_table.end()) {
        return false;
    }

    static_cast<account_t *>(tokenAccountInfo)->code = tItr->code;
    static_cast<account_t *>(tokenAccountInfo)->action = tItr->action;
    return true;
}

bool htlc::getTokenAccountInfo(std::vector<account_t *> &v) {
    /* get the signature contract info */

    accounts account_table(get_self(), get_self().value);
    if (account_table.begin() == account_table.end()) {
        return false;
    }

    auto tItr = account_table.begin();
    do {
        v.push_back(const_cast<account_t *>(&(*tItr)));
    } while (tItr != account_table.end());
    return true;
}

void htlc::cleanTokens(uint64_t cid) {
    tokens token_table(get_self(), cid);

    /* clean token from table tokens */
    auto tItr = token_table.begin();
    while (tItr != token_table.end()) {
        tItr = token_table.erase(tItr);
    }
}

void htlc::savePk(std::string_view pkView, const eosio::checksum256 &pkHash, void *pkInfo) {
    /* add table fees */
    pks pk_table(get_self(), get_self().value);
    pk_table.emplace(get_self(), [&](auto &s) {
        s.id = pk_table.available_primary_key();
        s.pk = static_cast<std::string>(pkView);
        s.pkHash = pkHash;

        if (nullptr != pkInfo) {
            static_cast<pk_t *>(pkInfo)->id = s.id;
            static_cast<pk_t *>(pkInfo)->pkHash = s.pkHash;
            static_cast<pk_t *>(pkInfo)->pk = s.pk;
        }

        #ifdef _DEBUG_PRINT
        eosio::print("\t[savePk => add pks => id:", s.id, ", pk:", s.pk, ", pkHash:", s.pkHash, "]\t");
        #endif
    });
}

bool htlc::findPK(std::string_view pkView, void *pkInfo) {
    /* get the pks contract info */
    eosio::check(pkInfo != nullptr, hError::error::INVALID_PARAM.data());


    eosio::checksum256 pkHash = hashMsg(pkView);

    /* find from pks table by hashMsg(pk) */
    pks pk_table(get_self(), get_self().value);
    auto pkHashTable = pk_table.get_index<hTable::key::pkHash>();
    auto pItr = pkHashTable.find(pkHash);
    if (pItr == pkHashTable.end()) {
        return false;
    }

    static_cast<pk_t *>(pkInfo)->id = pItr->id;
    static_cast<pk_t *>(pkInfo)->pkHash = pItr->pkHash;
    static_cast<pk_t *>(pkInfo)->pk = pItr->pk;

    return true;
}

bool htlc::findPK(const eosio::checksum256 &pkHash, void *pkInfo) {
    /* get the pks contract info */
    eosio::check(pkInfo != nullptr, hError::error::INVALID_PARAM.data());

    /* find from pks table by hashMsg(pk) */
    pks pk_table(get_self(), get_self().value);
    auto pkHashTable = pk_table.get_index<hTable::key::pkHash>();
    auto pItr = pkHashTable.find(pkHash);
    if (pItr == pkHashTable.end()) {
        return false;
    }

    static_cast<pk_t *>(pkInfo)->id = pItr->id;
    static_cast<pk_t *>(pkInfo)->pkHash = pItr->pkHash;
    static_cast<pk_t *>(pkInfo)->pk = pItr->pk;

    return true;
}

bool htlc::findPK(uint64_t pid, void *pkInfo) {
    /* get the pks contract info */
    eosio::check(pkInfo != nullptr, hError::error::INVALID_PARAM.data());

    /* find from pks table by pid */
    pks pk_table(get_self(), get_self().value);
    auto pItr = pk_table.find(pid);
    if (pItr == pk_table.end()) {
        return false;
    }

    static_cast<pk_t *>(pkInfo)->id = pItr->id;
    static_cast<pk_t *>(pkInfo)->pkHash = pItr->pkHash;
    static_cast<pk_t *>(pkInfo)->pk = pItr->pk;

    return true;
}

bool htlc::hasPK(uint64_t pid) {
    /* find from pks table by pid */
    pks pk_table(get_self(), get_self().value);
    auto pItr = pk_table.find(pid);
    return pItr != pk_table.end();
}

void htlc::cleanPk(uint64_t pid) {
    if (existAsset(pid) or existFee(pid) or isPkInHtlc(pid) or isPkDebt(pid) or isNPkDebt(pid)) {
        return;
    }

    /* clean pk from table pks */
    pks pk_table(get_self(), get_self().value);
    auto pItr = pk_table.find(pid);
    if (pItr != pk_table.end()) {
        pItr = pk_table.erase(pItr);
    }
}

// using for update pk
bool htlc::isPkInHtlc(uint64_t pid) {
    bool isBusy = false;

    transfers transfers_table(get_self(), get_self().value);
    auto tPidIndex = transfers_table.get_index<hTable::key::pid>();
    auto tItr = tPidIndex.find(pid);

    isBusy = (tItr != tPidIndex.end());

    #ifdef _DEBUG_PRINT
    eosio::print("isPkInHtlc => pk:", pid, ", isBusy:", isBusy);
    #endif

    return isBusy;
}

// using for update pk
bool htlc::isPkDebt(uint64_t pid) {
    bool isBusy = false;

    debts debt_table(get_self(), get_self().value);
    // check debts table if pid exists
    auto dPidIndex = debt_table.get_index<hTable::key::pid>();
    auto dItr = dPidIndex.find(pid);
    isBusy = (dItr != dPidIndex.end());

    if (!isBusy) {
        auto dNPidIndex = debt_table.get_index<hTable::key::npid>();
        auto dItr = dNPidIndex.find(pid);
        isBusy = (dItr != dNPidIndex.end());
    }
    #ifdef _DEBUG_PRINT
    eosio::print("isPkDebt => pk:", pid, ", isBusy:", isBusy);
    #endif

    return isBusy;
}

// using for update pk
bool htlc::isPkDebt(std::string_view pkView) {
    htlc::pk_t pkInfo;
    eosio::check(findPK(pkView, &pkInfo), hError::error::NOT_FOUND_PK_RECORD.data());

    // /* check fees table if exist by pk */
    // fees fee_table(get_self(), pkInfo.id);
    // eosio::check(fee_table.begin() == fee_table.end(), hError::error::EXIST_FEE_RECORD.data());

    return isPkDebt(pkInfo.id);
}

// using for update pk
bool htlc::isPkDebt(uint64_t pid, const eosio::name &account, const eosio::symbol &sym) {
    bool isBusy = false;

    debts debt_table(get_self(), get_self().value);
    // check debts table if pid exists
    uint128_t pidAcctKey = common::makeU128(pid, account.value);
    auto dPidAcctIndex = debt_table.get_index<hTable::key::pid_acct>();
    auto dItr = dPidAcctIndex.find(pidAcctKey);

    do {
        if (sym.raw() == dItr->quantity.symbol.raw()) {
            isBusy = true;
            break;
        }
    } while(dItr != dPidAcctIndex.end());
    #ifdef _DEBUG_PRINT
    eosio::print("isPkDebt => pk:", pid, ", isBusy:", isBusy);
    #endif

    return isBusy;
}

// using for update pk
bool htlc::isPkDebt(std::string_view pkView, const eosio::name &account, const eosio::symbol &sym) {
    htlc::pk_t pkInfo;
    eosio::check(findPK(pkView, &pkInfo), hError::error::NOT_FOUND_PK_RECORD.data());

    // /* check fees table if exist by pk */
    // fees fee_table(get_self(), pkInfo.id);
    // eosio::check(fee_table.begin() == fee_table.end(), hError::error::EXIST_FEE_RECORD.data());

    return isPkDebt(pkInfo.id, account, sym);
}

// using for update pk
bool htlc::isNPkDebt(uint64_t pid) {
    bool isBusy = false;

    debts debt_table(get_self(), get_self().value);
    // check debts table if pid exists
    auto dPidIndex = debt_table.get_index<hTable::key::pid>();
    auto dItr = dPidIndex.find(pid);
    isBusy = (dItr != dPidIndex.end());

    if (!isBusy) {
        auto dNPidIndex = debt_table.get_index<hTable::key::npid>();
        auto dItr = dNPidIndex.find(pid);
        isBusy = (dItr != dNPidIndex.end());
    }
    #ifdef _DEBUG_PRINT
    eosio::print("isNPkDebt => pk:", pid, ", isBusy:", isBusy);
    #endif

    return isBusy;
}

// using for update pk
bool htlc::isNPkDebt(std::string_view pkView) {
    htlc::pk_t pkInfo;
    eosio::check(findPK(pkView, &pkInfo), hError::error::NOT_FOUND_PK_RECORD.data());

    // /* check fees table if exist by pk */
    // fees fee_table(get_self(), pkInfo.id);
    // eosio::check(fee_table.begin() == fee_table.end(), hError::error::EXIST_FEE_RECORD.data());

    return isNPkDebt(pkInfo.id);
}

// using for update pk
bool htlc::isNPkDebt(uint64_t pid, const eosio::name &account, const eosio::symbol &sym) {
    bool isBusy = false;

    debts debt_table(get_self(), get_self().value);
    // check debts table if pid exists
    uint128_t pidAcctKey = common::makeU128(pid, account.value);
    auto dNPidAcctIndex = debt_table.get_index<hTable::key::npid_acct>();
    auto dItr = dNPidAcctIndex.find(pidAcctKey);
    do {
        if (sym.raw() == dItr->quantity.symbol.raw()) {
            isBusy = true;
            break;
        }
    } while(dItr != dNPidAcctIndex.end());
    #ifdef _DEBUG_PRINT
    eosio::print("isNPkDebt => pk:", pid, ", isBusy:", isBusy);
    #endif

    return isBusy;
}

// using for update pk
bool htlc::isNPkDebt(std::string_view pkView, const eosio::name &account, const eosio::symbol &sym) {
    htlc::pk_t pkInfo;
    eosio::check(findPK(pkView, &pkInfo), hError::error::NOT_FOUND_PK_RECORD.data());

    // /* check fees table if exist by pk */
    // fees fee_table(get_self(), pkInfo.id);
    // eosio::check(fee_table.begin() == fee_table.end(), hError::error::EXIST_FEE_RECORD.data());

    return isNPkDebt(pkInfo.id, account, sym);
}

void htlc::verifySignature(std::string_view statusView, std::string &pk, std::string &r, std::string &s, \
    uint64_t size, std::string_view *msg, ...) {

    /* signature verification */
    // make action data
    std::string actionData;
    std::string encodedActionData;
    actionData.resize(size);

    va_list args;
    va_start(args, msg);
    common::join<std::string_view *>(const_cast<char *>(actionData.data()), tMemo::separator, msg, args);
    va_end(args);

    crypto::base64::encode(const_cast<char *>(actionData.data()), actionData.size(), encodedActionData);
    #ifdef _DEBUG_PRINT
    eosio::print("\t[verifySignature => base64 Data: ", actionData, "]\t");
    #endif

    /* for debug */
    #ifdef _DEBUG_PRINT
    std::string decodedActionData;
    crypto::base64::decode(encodedActionData, decodedActionData);
    eosio::print("\t[verifySignature => origin Data: ", actionData, "]\t");
    eosio::print("\t[verifySignature => decode Data: ", decodedActionData, "]\t");
    #endif
    /* for debug end */

    // call signature contract to check mpc signature
    signature_t sigInfo;
    eosio::check(getSignature(&sigInfo), hError::error::NOT_FOUND_SIGNATURE_RECORD.data());

    eosio::action(eosio::permission_level{this->get_self(), hPermission::level::active}, sigInfo.code, sigInfo.action,
        std::make_tuple(this->get_self(), r, s, pk, encodedActionData,static_cast<std::string>(statusView))).send();
}

void htlc::addAssetTo(uint64_t pid, const eosio::name &account,const eosio::asset &quantity) {
    /* add table assets */
    uint128_t symAcctKey = common::makeU128(quantity.symbol.raw(), account.value);
    assets asset_table(get_self(), pid);
    auto aSymAcctIndex = asset_table.get_index<hTable::key::sym_acct>();
    auto aItr = aSymAcctIndex.find(symAcctKey);

    if (aItr == aSymAcctIndex.end()) {
        asset_table.emplace(get_self(), [&](auto &s) {
            s.id = asset_table.available_primary_key();
            s.balance = quantity;
            s.account = account;
            #ifdef _DEBUG_PRINT
            eosio::print("\t[addAssetTo => balance:", s.balance, ", account:", s.account, ", id:", s.id, "]\t");
            #endif
        });
    } else {
        aSymAcctIndex.modify(aItr, get_self(), [&](auto &s) {
            s.balance += quantity;
            #ifdef _DEBUG_PRINT
            eosio::print("\t[addAssetTo => balance:", s.balance, ", account:", s.account, ", id:", s.id, "]\t");
            #endif
        });
    }
}

void htlc::subAssetFrom(uint64_t pid, const eosio::name &account, const eosio::asset &quantity) {
    /* sub table assets */
    uint128_t symAcctKey = common::makeU128(quantity.symbol.raw(), account.value);
    assets asset_table(get_self(), pid);
    auto aSymAcctIndex = asset_table.get_index<hTable::key::sym_acct>();
    auto aItr = aSymAcctIndex.find(symAcctKey);
    eosio::check(aItr != aSymAcctIndex.end() and (aItr->balance >= quantity), hError::error::NOE_ENOUGH_QUANTITY.data());

    if (aItr->balance == quantity) {
        aItr = aSymAcctIndex.erase(aItr);
    } else {
        aSymAcctIndex.modify(aItr, get_self(), [&](auto &s) {
            s.balance -= quantity;
            #ifdef _DEBUG_PRINT
            eosio::print("\t[subAssetFrom => balance:", s.balance, "]\t");
            #endif
        });
    }
}

void htlc::getAssetFrom(uint64_t pid, const eosio::name &account, eosio::asset *pQuantity) {
    eosio::asset balance = *pQuantity;

    uint128_t symAcctKey = common::makeU128((*pQuantity).symbol.raw(), account.value);
    assets asset_table(get_self(), pid);
    auto aSymAcctIndex = asset_table.get_index<hTable::key::sym_acct>();
    auto aItr = aSymAcctIndex.find(symAcctKey);

    if (aItr != aSymAcctIndex.end()) {
        balance = aItr->balance;
    }
    (*pQuantity).set_amount(balance.amount);
    #ifdef _DEBUG_PRINT
    eosio::print("\t[getAssetFrom => balance:", *pQuantity, "]\t");
    #endif
}

void htlc::getPendDebtAssetFrom(uint64_t pid, const eosio::name &account, eosio::asset *pQuantity) {

    debts debt_table(get_self(), get_self().value);
    uint128_t pidAcctKey = common::makeU128(pid, account.value);
    auto dPidAcctIndex = debt_table.get_index<hTable::key::pid_acct>();
    auto dItr = dPidAcctIndex.find(pidAcctKey);
    #ifdef _DEBUG_PRINT
    eosio::print("\t[getPendDebtAssetFrom => account: ", account, " pid: ", pid, " => pidAcctKey:", pidAcctKey, "]\t");
    #endif

    if (dItr != dPidAcctIndex.end()) {
        eosio::asset lockedBalance = *pQuantity;

        do {
            if (dItr->quantity.symbol == (*pQuantity).symbol) {
                lockedBalance += dItr->quantity;
                ++dItr;
            }
        } while(dItr != dPidAcctIndex.end());

        pQuantity->set_amount(lockedBalance.amount);
        #ifdef _DEBUG_PRINT
        eosio::print("\t[getPendDebtAssetFrom => balance:", lockedBalance, "]\t");
        #endif
    }
}

void htlc::getOutPendAssetFrom(uint64_t pid, const eosio::name &account, eosio::asset *pQuantity) {
    eosio::asset debtBalance(0, (*pQuantity).symbol);
    eosio::asset outlockBalance(0, (*pQuantity).symbol);

    getHtlcPendAssetFrom(pid, account, &outlockBalance, hStatus::status::outlock);
    getPendDebtAssetFrom(pid, account, &debtBalance);

    eosio::asset totalBalance = outlockBalance + debtBalance;
    pQuantity->set_amount(totalBalance.amount);
}

void htlc::getHtlcPendAssetFrom(uint64_t pid, const eosio::name &account, eosio::asset *pQuantity, std::string_view statusView) {
    /* check if outlock asset overflow */
    uint128_t pidAcctKey = common::makeU128(pid, account.value);
    transfers transfers_table(get_self(), get_self().value);
    auto tPidAcctIndex = transfers_table.get_index<hTable::key::pid_acct>();
    auto tItr = tPidAcctIndex.find(pidAcctKey);
    #ifdef _DEBUG_PRINT
    eosio::print("\t[getHtlcPendAssetFrom => pid: ", pid, ", statusView:", static_cast<std::string>(statusView), \
        ", pidAcctKey:", pidAcctKey, "]\t");
    #endif

    if (tItr != tPidAcctIndex.end()) {
        eosio::asset lockedBalance = *pQuantity;
        eosio::name status = eosio::name(statusView);

        do {
            if (eosio::name(tItr->status) == status and tItr->quantity.symbol == (*pQuantity).symbol) {
                lockedBalance += tItr->quantity;
            }
            ++tItr;
        } while(tItr != tPidAcctIndex.end());
        (*pQuantity).set_amount(lockedBalance.amount);

        #ifdef _DEBUG_PRINT
        eosio::print("\t[getHtlcPendAssetFrom => balance:", lockedBalance, "]\t");
        #endif
    }
}

bool htlc::existAsset(uint64_t pid) {
    /* check if asset exists */
    assets asset_table(get_self(), pid);
    return (asset_table.begin() != asset_table.end());
}

bool htlc::existAsset(uint64_t pid, const eosio::name &account, const eosio::symbol &sym) {
    /* check if asset exists */
    assets asset_table(get_self(), pid);
    uint128_t symAcctKey = common::makeU128(sym.raw(), account.value);
    auto aSymAcctIndex = asset_table.get_index<hTable::key::sym_acct>();
    auto aItr = aSymAcctIndex.find(symAcctKey);
    return (aItr != aSymAcctIndex.end());
}

bool htlc::existFee(uint64_t pid) {
    /* check if fees exists */
    fees fee_table(get_self(), pid);
    return (fee_table.begin() != fee_table.end());
}

bool htlc::existFee(uint64_t pid, const eosio::name &account, const eosio::symbol &sym) {
    /* check if fees exists */
    
    fees fee_table(get_self(), pid);
    uint128_t symAcctKey = common::makeU128(sym.raw(), account.value);
    auto fSymAcctIndex = fee_table.get_index<hTable::key::sym_acct>();
    auto fItr = fSymAcctIndex.find(symAcctKey);
    return (fItr != fSymAcctIndex.end());
}

void htlc::addFeeTo(uint64_t pid, const eosio::name &account, const eosio::asset &fee) {
    /* add table fees */
    
    fees fee_table(get_self(), pid);
    uint128_t symAcctKey = common::makeU128(fee.symbol.raw(), account.value);
    auto fSymAcctIndex = fee_table.get_index<hTable::key::sym_acct>();
    auto fItr = fSymAcctIndex.find(symAcctKey);

    if (fItr == fSymAcctIndex.end()) {
        fee_table.emplace(get_self(), [&](auto &s) {
            s.id = fee_table.available_primary_key();
            s.account = account;
            s.fee = fee;
            #ifdef _DEBUG_PRINT
            eosio::print("\t[addFeeTo => fee:", s.fee, "]\t");
            #endif
        });
    } else {
        fSymAcctIndex.modify(fItr, get_self(), [&](auto &s) {
            s.fee += fee;
            #ifdef _DEBUG_PRINT
            eosio::print("\t[addFeeTo => fee:", s.fee, "]\t");
            #endif
        });
    }
}

void htlc::issueFeeFrom(uint64_t pid, eosio::name to, std::string_view acctView, std::string_view symView, std::string_view memoView) {
    /* sub table fees */

    fees fee_table(get_self(), pid);

    if (acctView.empty()) {
        auto fItr = fee_table.begin();
        while (fItr != fee_table.end()) {
            #ifdef _DEBUG_PRINT
            eosio::print("\t[issueFeeFrom => pk:", pid, ", to:", to, ", account:", fItr->account, ", fee:", fItr->fee, " ]\t");
            #endif

            // eosio.token's action [transfer] will notify user that user inrevoked by memo
            account_t tokenAccountInfo;
            eosio::check(getTokenAccountInfo(fItr->account, &tokenAccountInfo), hError::error::NOT_FOUND_TOKEN_ACCOUNT_RECORD.data());

            eosio::action(eosio::permission_level{this->get_self(), hPermission::level::active}, tokenAccountInfo.code, tokenAccountInfo.action,
                std::make_tuple(this->get_self(), to, fItr->fee, static_cast<std::string>(memoView))).send();
            fItr = fee_table.erase(fItr);
        }
        return;
    }

    eosio::name account = eosio::name(acctView);
    eosio::check(eosio::is_account(eosio::name(account)) and eosio::name(account) != get_self(), hError::error::INVALID_TOKEN_ACCOUNT.data());

    account_t tokenAccountInfo;
    eosio::check(getTokenAccountInfo(account, &tokenAccountInfo), hError::error::NOT_FOUND_TOKEN_ACCOUNT_RECORD.data());

    if (symView.empty()) {
        auto fAcctIndex = fee_table.get_index<hTable::key::acct>();
        auto fItr = fAcctIndex.find(account.value);
        while (fItr != fAcctIndex.end()) {
            #ifdef _DEBUG_PRINT
            eosio::print("\t[issueFeeFrom => pk:", pid, ", to:", to, ", account:", fItr->account, ", fee:", fItr->fee, "]\t");
            #endif
            eosio::action(eosio::permission_level{this->get_self(), hPermission::level::active}, tokenAccountInfo.code, tokenAccountInfo.action,
                std::make_tuple(this->get_self(), to, fItr->fee, static_cast<std::string>(memoView))).send();
            fItr = fAcctIndex.erase(fItr);
        }
        return;
    }

    {
        eosio::symbol sym = stringToSymbol(symView);
        uint128_t symAcctKey = common::makeU128(sym.raw(), account.value);
        auto fSymAcctIndex = fee_table.get_index<hTable::key::sym_acct>();
        auto fItr = fSymAcctIndex.find(symAcctKey);
        eosio::check(fItr != fSymAcctIndex.end(), hError::error::NOT_FOUND_RECORD.data());
        #ifdef _DEBUG_PRINT
            eosio::print("\t[issueFeeFrom => pk:", pid, ", to:", to, ", account:", fItr->account, ", fee:", fItr->fee, " ]\t");
        #endif

        // eosio.token's action [transfer] will notify user that user inrevoked by memo
        eosio::action(eosio::permission_level{this->get_self(), hPermission::level::active}, tokenAccountInfo.code, tokenAccountInfo.action,
            std::make_tuple(this->get_self(), to, fItr->fee, static_cast<std::string>(memoView))).send();
        fItr = fSymAcctIndex.erase(fItr);

        return;
    }
}

void htlc::inlockTx(uint64_t pid, const eosio::name &user, const eosio::name &account, const eosio::asset &quantity, \
    const eosio::checksum256 &xHashValue, std::string_view wanAddrView) {

    transfers transfers_table(get_self(), get_self().value);
    // check if xHash exists
    auto tXHashTable = transfers_table.get_index<hTable::key::xHash>();
    auto tItr = tXHashTable.find(xHashValue);
    eosio::check(tItr == tXHashTable.end(), hError::error::REDUPLICATIVE_XHASH.data());

    transfers_table.emplace(get_self(), [&](auto &s) {
        s.beginTime = eosio::time_point_sec(eosio::current_time_point());
        s.lockedTime = hLimit::doubleLockedTime;
        s.status = static_cast<std::string>(hStatus::status::inlock);
        s.id = transfers_table.available_primary_key();
        s.user = user;
        s.pid = pid;
        s.quantity = quantity;
        s.xHash = xHashValue;
        s.wanAddr = static_cast<std::string>(wanAddrView);
        s.account = account;

        #ifdef _DEBUG_PRINT
        eosio::print("\t[inlockTx => beginTime:", s.beginTime.sec_since_epoch(), ", lockedTime:", s.lockedTime, \
            ", status:", s.status, ", id:", s.id,", user:", s.user, ", pid:", s.pid, ", quantity:", s.quantity, \
            ", xHash:", s.xHash, ", wanAddr:", s.wanAddr, ", account:", s.account, "]\t");
        #endif
    });
}

void htlc::outlockTx(uint64_t pid, const eosio::name &user, const eosio::name &account, const eosio::asset &quantity, \
    const eosio::checksum256 &xHashValue) {

    transfers transfers_table(get_self(), get_self().value);
    // check if xHash exists
    auto tXHashTable = transfers_table.get_index<hTable::key::xHash>();
    auto tItr = tXHashTable.find(xHashValue);
    eosio::check(tItr == tXHashTable.end(), hError::error::REDUPLICATIVE_XHASH.data());

    transfers_table.emplace(get_self(), [&](auto &s) {
        s.beginTime = eosio::time_point_sec(eosio::current_time_point());
        s.lockedTime = hLimit::lockedTime;
        s.status = static_cast<std::string>(hStatus::status::outlock);
        s.id = transfers_table.available_primary_key();
        s.user = user;
        s.pid = pid;
        s.quantity = quantity;
        s.xHash = xHashValue;
        s.account = account;

        #ifdef _DEBUG_PRINT
        eosio::print("\t[outlockTx => beginTime:", s.beginTime.sec_since_epoch(), ", lockedTime:", s.lockedTime, \
            ", status:", s.status, ", id:", s.id,", user:", s.user, ", pid:", s.pid, \
            ", quantity:", s.quantity, ", xHash:", s.xHash, ", account:", s.account, "]\t");
        #endif
    });
}

void htlc::lockDebtTx(uint64_t npid, uint64_t pid, const eosio::name &account, const eosio::asset &quantity, \
    const eosio::checksum256 &xHashValue) {

    #ifdef _DEBUG_PRINT
    eosio::print("\t[lockDebtTx => pk => pid:", pid, ", npid:", npid, "]\t");
    #endif

    debts debt_table(get_self(), get_self().value);
    // check if xHash exists
    auto dXHashTable = debt_table.get_index<hTable::key::xHash>();
    auto dItr = dXHashTable.find(xHashValue);
    eosio::check(dItr == dXHashTable.end(), hError::error::REDUPLICATIVE_XHASH.data());

    debt_table.emplace(get_self(), [&](auto &s) {
        s.beginTime = eosio::time_point_sec(eosio::current_time_point());
        s.lockedTime = hLimit::doubleLockedTime;
        s.status = static_cast<std::string>(hStatus::status::lockdebt);
        s.id = debt_table.available_primary_key();
        s.pid = pid;
        s.npid = npid;
        s.xHash = xHashValue;
        s.quantity = quantity;
        s.account = account;

        #ifdef _DEBUG_PRINT
        eosio::print("\t[lockDebtTx => beginTime:", s.beginTime.sec_since_epoch(), ", lockedTime:", s.lockedTime, \
            ", status:", s.status, ", id:", s.id, ", pid:", s.pid,", npid:", s.npid, \
            ", account:", s.account, ", xHash:", s.xHash, ", quantity:", s.quantity, "]\t");
        #endif
    });

}

extern "C" {

    void applyTransferAction(uint64_t receiver, uint64_t code, uint64_t action) {
        auto self = receiver;
        /* eosio.token -> transfer */
        /* eosio.token call htlc */
        // unpack action arguments, need check if something wrong happened while eosio::unpack_action_data, would htlc rollback?
        const htlc::transfer_data& unpackData = eosio::unpack_action_data<htlc::transfer_data>();
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
            if(status.size() > 0){

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
}

extern "C" void apply(uint64_t receiver, uint64_t code, uint64_t action) {

    #ifdef _DEBUG_PRINT
    eosio::print("\t[C Api => apply running => receiver:", eosio::name(receiver), ", code:", eosio::name(code), \
        ", action:", eosio::name(action), "]\t");
    #endif

    eosio::check(action != "onerror"_n.value, hError::error::SYSTEM_ERROR.data());

    auto self = receiver;
    htlc::signature_t sigInfo;
    htlc::account_t tokenAccountInfo;

    htlc _htlc(eosio::name(receiver), eosio::name(code), eosio::datastream<const char *>(nullptr, 0));
    if (_htlc.getTokenAccountInfo(eosio::name(code), &tokenAccountInfo) and action == eosio::name(tokenAccountInfo.action).value) {
        #ifdef _DEBUG_PRINT
        eosio::print(tokenAccountInfo.code, " => ACTION");
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
                (lockdebt)(redeemdebt)(revokedebt)(regsig)(updatesig)(unregsig)(updatepk)(removepk)\
                (regacct)(updateacct)(unregaccnt)(regtoken)(updatetoken)(unregtoken)(setratio)(updateratio)\
                (printratio)(truncate)(leftlocktime)(gethash))
            #else
            EOSIO_DISPATCH_HELPER(htlc, (inredeem)(inrevoke)(outlock)(outredeem)(outrevoke)(withdraw)\
                (lockdebt)(redeemdebt)(revokedebt)(regsig)(updatesig)(unregsig)(updatepk)(removepk)\
                (regacct)(updateacct)(unregaccnt)(regtoken)(updatetoken)(unregtoken)(setratio)(updateratio))
            #endif
        }
    }
}

} // namespace htlc

#endif