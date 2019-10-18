#include "htlc.eos.v.1.hpp"

#ifdef EOS_WAN_HTLC_H
#include <eosiolib/crypto.h>
#include <eosiolib/system.h>
#include <eosiolib/symbol.hpp>
#include <cstdlib>

namespace htlc {
ACTION htlc::kk(std::string x) {
    eosio::checksum256 xHashValue = hashX(x);
    eosio::print("\t[kk => x:", x.data(), ", sha256(x):", xHashValue, "]\t");
}

ACTION htlc::truncate(eosio::name table, std::string scope) {
    eosio::require_auth(get_self());

    switch (table.value) {
        case eosio::name(hTable::table::transfers).value: {
            transfers transfers_table(get_self(), eosio::name(scope).value);
            auto tItr = transfers_table.begin();
            while (tItr != transfers_table.end()) {
                tItr = transfers_table.erase(tItr);
            }
            break;
        }
        case eosio::name(hTable::table::assets).value: {
            uint64_t scopeValue = std::atoll(scope.data());
            assets asset_table(get_self(), scopeValue);
            auto aItr = asset_table.begin();
            while (aItr != asset_table.end()) {
                aItr = asset_table.erase(aItr);
            }
            break;
        }
        #ifdef USING_LISTENER
        case eosio::name(hTable::table::listens).value: {
            listens listen_table(get_self(), get_self().value);
            auto lItr = listen_table.begin();
            while (lItr != listen_table.end()) {
                lItr = listen_table.erase(lItr);
            }
            break;
        }
        #endif
        case eosio::name(hTable::table::pks).value: {
            pks pk_table(get_self(), eosio::name(scope).value);
            auto pItr = pk_table.begin();
            while (pItr != pk_table.end()) {
                pItr = pk_table.erase(pItr);
            }
            break;
        }
        case eosio::name(hTable::table::fees).value: {
            uint64_t scopeValue = std::atoll(scope.data());
            fees fee_table(get_self(), scopeValue);
            auto fItr = fee_table.begin();
            while (fItr != fee_table.end()) {
                fItr = fee_table.erase(fItr);
            }
            break;
        }
        case eosio::name(hTable::table::signer).value: {
            signer signer_table(get_self(), eosio::name(scope).value);
            auto sItr = signer_table.begin();
            while (sItr != signer_table.end()) {
                sItr = signer_table.erase(sItr);
            }
            break;
        }
        case eosio::name(hTable::table::debts).value: {
            debts debt_table(get_self(), eosio::name(scope).value);
            auto dItr = debt_table.begin();
            while (dItr != debt_table.end()) {
                dItr = debt_table.erase(dItr);
            }
            break;
        }
        default:
            eosio_assert(false, hError::error::INVALID_TABLE.data());
    }
}

ACTION htlc::regsig(eosio::name htlc, eosio::name code, eosio::name action) {

    eosio_assert(is_account(htlc) and htlc == get_self(), hError::error::INVALID_HTLC_ACCOUNT.data());
    eosio::require_auth(htlc);

    #ifdef _DEBUG_LEVEL_3
    eosio::print("\t[regsig => htlc:", htlc, ", code:", code, ", action:", action, "]\t");
    #endif
    signer sig_table(get_self(), get_self().value);
    auto dItr = sig_table.find(code.value);
    eosio_assert(dItr == sig_table.end(), hError::error::EXIST_SIGNATURE_RECORD.data());

    sig_table.emplace(get_self(), [&](auto &s) {
        s.code = code;
        s.action = action;
        #ifdef _DEBUG
        eosio::print("\t[register signature contract => code ", s.code, " and action ", s.action, "]\t");
        #endif
    });
}

ACTION htlc::updatesig(eosio::name htlc, eosio::name code, eosio::name nCode, eosio::name nAction) {

    eosio_assert(is_account(htlc) and htlc == get_self(), hError::error::INVALID_HTLC_ACCOUNT.data());
    eosio::require_auth(htlc);

    signer sig_table(get_self(), get_self().value);
    auto dItr = sig_table.find(code.value);
    eosio_assert(dItr != sig_table.end(), hError::error::NOT_FOUND_SIGNATURE_RECORD.data());

    sig_table.modify(dItr, get_self(), [&](auto &s) {
        s.code = nCode;
        s.action = nAction;
        #ifdef _DEBUG
        eosio::print("\t[update signature contract => code ", s.code, " and action ", s.action, "]\t");
        #endif
    });
}

ACTION htlc::unregsig(eosio::name htlc, eosio::name code) {

    eosio_assert(is_account(htlc) and htlc == get_self(), hError::error::INVALID_HTLC_ACCOUNT.data());
    eosio::require_auth(htlc);

    signer sig_table(get_self(), get_self().value);
    auto dItr = sig_table.find(code.value);
    eosio_assert(dItr != sig_table.end(), hError::error::NOT_FOUND_SIGNATURE_RECORD.data());

    dItr = sig_table.erase(dItr);
}

ACTION htlc::updatepk(eosio::name storeman, std::string npk, std::string pk, std::string r, std::string s) {

    eosio_assert(hasPK(pk), hError::error::NOT_FOUND_RECORD.data());
    eosio_assert(!isPkBusy(pk, "", hStatus::status::removepk), hError::error::BUSY_PK.data());
    eosio_assert(is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());
    eosio::require_auth(storeman);

    #ifdef _DEBUG_LEVEL_3
    eosio::print("\t[updatepk => storeman:", storeman, ", npk:", npk.data(), ", pk:", pk.data(),"]\t");
    #endif

    std::string_view storemanView = storeman.to_string();
    std::string_view npkView = npk;

    // make action data
    std::string actionData;
    std::string encodedActionData;
    int32_t maxSize = storemanView.size() + npkView.size() + hSig::updatePkIndex::total - 1;
    actionData.resize(maxSize);

    common::join(const_cast<char *>(actionData.data()), tMemo::separator, &storemanView, &npkView, &common::strEOF);
    crypto::base64::encode(const_cast<char *>(actionData.data()), actionData.size(), encodedActionData);
    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t[updatepk => base64 Data: ", actionData, "]\t");
    #endif

    /* for debug */
    #ifdef _DEBUG_LEVEL_1
    std::string decodedActionData;
    crypto::base64::decode(encodedActionData, decodedActionData);
    eosio::print("\t[updatepk => origin Data: ", actionData, "]\t");
    eosio::print("\t[updatepk => decode Data: ", decodedActionData, "]\t");
    #endif
    /* for debug end */

    // call signature contract to check mpc signature
    signature_t sigInfo;
    eosio_assert(getSignature(&sigInfo), hError::error::NOT_FOUND_SIGNATURE_RECORD.data());

   eosio::action(eosio::permission_level{this->get_self(), "active"_n}, sigInfo.code, sigInfo.action,
        std::make_tuple(this->get_self(), r, s, pk, encodedActionData, static_cast<std::string>(hStatus::status::updatepk))).send();
}

ACTION htlc::updtpk(eosio::name htlc, std::string r, std::string s, std::string pk, std::string msg, std::string memo) {

    eosio_assert(is_account(htlc) and htlc == get_self(), hError::error::INVALID_ACCOUNT.data());

    std::string actionData;
    crypto::base64::decode(msg, actionData);

    /* parse message */
    std::vector<std::string_view> v;
    common::split(actionData, tMemo::separator, v);

    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t[updtpk => msg info count: ", v.size(), "]\t");
    #endif
    eosio_assert(v.size() == hSig::updatePkIndex::total || v.size() == hSig::updatePkIndex::total - 1, \
        hError::error::INVALID_MEMO.data());

    eosio::name storeman = eosio::name(v[hSig::updatePkIndex::storeman]);
    std::string_view npkView = v[hSig::updatePkIndex::pk];

    /* sha256(pk) */
    capi_checksum256 pkHash;
    std::string_view pkView = pk;
    sha256(pkView.data(), pkView.size(), &pkHash);

    /* find from pks table by sha256(pk) */
    pks pk_table(get_self(), get_self().value);
    sha256(pkView.data(), pkView.size(), &pkHash);
    auto pkHashIndex = pk_table.get_index<eosio::name(hIndex::index::pkHash)>();
    auto pItr = pkHashIndex.find(pkHash.hash);
    eosio_assert(pItr != pkHashIndex.end(), hError::error::NOT_FOUND_RECORD.data());

    /* check unique pk */
    /* sha256(npk) */
    capi_checksum256 npkHash;
    sha256(npkView.data(), npkView.size(), &npkHash);
    auto npItr = pkHashIndex.find(npkHash.hash);
    eosio_assert(npItr == pkHashIndex.end(), hError::error::REDUPLICATIVE_PK_RECORD.data());

    pkHashIndex.modify(pItr, get_self(), [&](auto &s) {
        s.pk = static_cast<std::string>(npkView);
        s.pkHash = npkHash.hash;
        #ifdef _DEBUG
        eosio::print("\t[updtpk => update pk ", pk, " to ", static_cast<std::string>(npkView), "]\t");
        #endif
    });
    require_recipient(storeman);
}

ACTION htlc::removepk(eosio::name storeman, std::string pk, std::string r, std::string s) {

    eosio_assert(is_account(storeman) and storeman != get_self(), hError::error::INVALID_ACCOUNT.data());
    eosio::require_auth(storeman);

    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t[removepk => storeman:", storeman, ", pk:", pk.data(),"]\t");
    #endif

    eosio_assert(hasPK(pk), hError::error::NOT_FOUND_RECORD.data());
    eosio_assert(!isPkBusy(pk, "", hStatus::status::removepk), hError::error::BUSY_PK.data());

    std::string_view storemanView = storeman.to_string();
    // make action data
    std::string actionData;
    std::string encodedActionData;
    int32_t maxSize = storemanView.size() + hSig::removePkIndex::total - 1;
    actionData.resize(maxSize);

    common::join(const_cast<char *>(actionData.data()), tMemo::separator, &storemanView, &common::strEOF);
    crypto::base64::encode(const_cast<char *>(actionData.data()), actionData.size(), encodedActionData);
    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t[removepk => base64 Data: ", actionData, "]\t");
    #endif

    /* for debug */
    #ifdef _DEBUG_LEVEL_1
    std::string decodedActionData;
    crypto::base64::decode(encodedActionData, decodedActionData);
    eosio::print("\t[removepk => origin Data: ", actionData, "]\t");
    eosio::print("\t[removepk => decode Data: ", decodedActionData, "]\t");
    #endif
    /* for debug end */

    signature_t sigInfo;
    eosio_assert(getSignature(&sigInfo), hError::error::NOT_FOUND_SIGNATURE_RECORD.data());
   eosio::action(eosio::permission_level{this->get_self(), "active"_n}, sigInfo.code, sigInfo.action,
        std::make_tuple(this->get_self(), r, s, pk, encodedActionData, static_cast<std::string>(hStatus::status::removepk))).send();
}

ACTION htlc::rmpk(eosio::name htlc, std::string r, std::string s, std::string pk, std::string msg, std::string memo) {

    eosio_assert(is_account(htlc) and htlc == get_self(), hError::error::INVALID_ACCOUNT.data());

    std::string actionData;
    crypto::base64::decode(msg, actionData);
    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t[removepk => msg: ", actionData, "]\t");
    #endif

    /* parse message */
    std::vector<std::string_view> v;
    common::split(actionData, tMemo::separator, v);

    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t[rmpk => msg info count: ", v.size(), "]\t");
    #endif
    eosio_assert(v.size() == hSig::removePkIndex::total || v.size() == hSig::removePkIndex::total - 1, \
        hError::error::INVALID_MEMO.data());

    eosio::name storeman = eosio::name(v[hSig::removePkIndex::storeman]);

    /* sha256(pk) */
    capi_checksum256 pkHash;
    std::string_view pkView = pk;
    sha256(pkView.data(), pkView.size(), &pkHash);

    /* find from pks table by sha256(pk) */
    pks pk_table(get_self(), get_self().value);
    sha256(pkView.data(), pkView.size(), &pkHash);
    auto pkHashIndex = pk_table.get_index<eosio::name(hIndex::index::pkHash)>();
    auto pItr = pkHashIndex.find(pkHash.hash);
    eosio_assert(pItr != pkHashIndex.end(), hError::error::NOT_FOUND_RECORD.data());

    #ifdef _DEBUG
    eosio::print("\t[rmpk => pks => id:", pItr->id, ", pk:", pItr->pk, ", pkHash:", pItr->pkHash, "]\t");
    #endif

    fees fee_table(get_self(), pItr->id);
    eosio_assert(fee_table.begin() == fee_table.end(), hError::error::FEE_RECORD.data());

    eosio_assert(!isPkBusy(pItr->id, "", hStatus::status::removepk), hError::error::BUSY_PK.data());

    pItr = pkHashIndex.erase(pItr);
    require_recipient(storeman);
}

ACTION htlc::lockdebt(eosio::name storeman, eosio::asset quantity, std::string npk, std::string xHash, \
    std::string pk, std::string r, std::string s) {

    eosio_assert(is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());
    eosio::require_auth(storeman);

    #ifdef _DEBUG
    eosio::print("\t[lockdebt => storeman:", storeman, ", quantity:", quantity, \
        ", npk:", xHash.data(), ", xHash:", xHash.data(), "]\t");
    #endif

    /* sha256(pk) */
    std::string_view storemanView = storeman.to_string();
    std::string_view qView = quantity.to_string();
    std::string_view npkView = npk;
    std::string_view xHashView = xHash;
    std::string_view pkView = pk;

    #ifdef _DEBUG
    eosio::print("\t[lockdebt => storemanView: ", static_cast<std::string>(storemanView), \
        ", qView:", static_cast<std::string>(qView), \
        ", npkView:", static_cast<std::string>(npkView), \
        ", xHashView:", static_cast<std::string>(xHashView), "]\t");
    #endif

    htlc::pk_t pkInfo;
    eosio_assert(findPK(pk, &pkInfo), hError::error::NOT_FOUND_RECORD.data());

    /* check debts table by xHash */
    eosio::checksum256 xHashValue = parseXHash(xHash);
    /* should be no debt-record by xHash */
    debts debt_table(get_self(), get_self().value);
    auto dXHashIndex = debt_table.get_index<eosio::name(hIndex::index::xHash)>();
    auto dItr = dXHashIndex.find(xHashValue);
    eosio_assert(dItr == dXHashIndex.end(), hError::error::REDUPLICATIVE_XHASH.data());

    /* make action data */
    std::string actionData;
    std::string encodedActionData;
    int32_t maxSize = storemanView.size() + qView.size() + npkView.size() + xHashView.size() + hSig::lockDebtIndex::total - 1;
    actionData.resize(maxSize);

    common::join(const_cast<char *>(actionData.data()), tMemo::separator, &storemanView, &qView, &npkView, &xHashView, &common::strEOF);
    crypto::base64::encode(const_cast<char *>(actionData.data()), actionData.size(), encodedActionData);
    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t[lockdebt => base64 Data: ", actionData, "]\t");
    #endif

    /* for debug */
    // #ifdef _DEBUG_LEVEL_1
    #ifdef _DEBUG
    std::string decodedActionData;
    crypto::base64::decode(encodedActionData, decodedActionData);
    eosio::print("\t[lockdebt => origin Data: ", actionData, "]\t");
    eosio::print("\t[lockdebt => decode Data: ", decodedActionData, "]\t");
    #endif
    /* for debug end */

    /* wdr will get parameters by signature verify, so it should be decoded */
    signature_t sigInfo;
    eosio_assert(getSignature(&sigInfo), hError::error::NOT_FOUND_SIGNATURE_RECORD.data());

    eosio::action(eosio::permission_level{this->get_self(), "active"_n}, sigInfo.code, sigInfo.action,
        std::make_tuple(this->get_self(), r, s, pk, encodedActionData, static_cast<std::string>(hStatus::status::lockdebt))).send();
}

ACTION htlc::lkdebt(eosio::name htlc, std::string r, std::string s, std::string pk, std::string msg, std::string memo) {

    eosio_assert(is_account(htlc) and htlc == get_self(), hError::error::INVALID_ACCOUNT.data());

    /* decode message */
    std::string actionData;
    crypto::base64::decode(msg, actionData);
    // #ifdef _DEBUG_LEVEL_1
    #ifdef _DEBUG
    eosio::print("\t[lkdebt => msg: ", actionData, "]\t");
    #endif

    /* parse message */
    std::vector<std::string_view> v;
    common::split(actionData, tMemo::separator, v);

    // #ifdef _DEBUG_LEVEL_1
    #ifdef _DEBUG
    eosio::print("\t[lkdebt => msg info count: ", v.size(), "]\t");
    #endif
    eosio_assert(v.size() == hSig::lockDebtIndex::total, hError::error::INVALID_MEMO.data());

    eosio::name storeman = eosio::name(v[hSig::lockDebtIndex::storeman]);
    eosio::asset quantity = stringToAsset(v[hSig::lockDebtIndex::quantity]);
    std::string_view npkView = v[hSig::lockDebtIndex::pk];
    std::string_view xHashView = v[hSig::lockDebtIndex::xHash];
    #ifdef _DEBUG
    eosio::print("\t[lockdebt => storeman: ", storeman, ", quantity:", quantity, \
        ", npkView:", static_cast<std::string>(npkView), \
        ", xHashView:", static_cast<std::string>(xHashView), "]\t");
    #endif

    htlc::pk_t pkInfo;
    eosio_assert(findPK(pk, &pkInfo), hError::error::NOT_FOUND_RECORD.data());

    #ifdef _DEBUG
    eosio::print("\t[lkdebt => pks => id:", pkInfo.id, ", pk:", pkInfo.pk, ", pkHash:", pkInfo.pkHash, "]\t");
    #endif

    eosio::asset pkQuantity = quantity - quantity;
    getAsset(pkInfo.id, &pkQuantity);
    eosio_assert(pkQuantity >= quantity, hError::error::NOE_ENOUGH_QUANTITY.data());

    eosio::asset outPendQuantity = quantity - quantity;
    getOutPendAsset(pkInfo.id, &outPendQuantity);
    eosio_assert((outPendQuantity + quantity) <= pkQuantity, hError::error::NOE_ENOUGH_QUANTITY.data());

    /* check debts table by xHash */
    eosio::checksum256 xHashValue = parseXHash(xHashView);
    /* should be no debt-record by xHash */
    debts debt_table(get_self(), get_self().value);
    auto dXHashIndex = debt_table.get_index<eosio::name(hIndex::index::xHash)>();
    auto dItr = dXHashIndex.find(xHashValue);
    eosio_assert(dItr == dXHashIndex.end(), hError::error::REDUPLICATIVE_XHASH.data());

    lockHTLCTx(quantity, npkView, xHashView, pk, hStatus::status::lockdebt, true);
}

/// @notice               type        comment
/// @param storeman  name        storeman account name
/// @param xHash          string      hash of HTLC random number
/// @param x              string      HTLC random number
/// @param r              string      r for hSig
/// @param s              string      s for hSig
/// coin flow: htlc -> storeman
ACTION htlc::redeemdebt(eosio::name storeman, std::string x, std::string r, std::string s) {

    eosio_assert(is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());
    eosio::require_auth(storeman);

    /* check debts table by xHash */
    eosio::checksum256 xHashValue = hashX(x);
    debts debt_table(get_self(), get_self().value);
    auto dXHashIndex = debt_table.get_index<eosio::name(hIndex::index::xHash)>();
    auto dItr = dXHashIndex.find(xHashValue);
    #ifdef _DEBUG
    eosio::print("\t[redeemdebt => table status:", dItr->status, \
        ", lockdebt:", eosio::name(hStatus::status::lockdebt).value, "]\t");
    #endif
    eosio_assert(dItr != dXHashIndex.end() and \
        eosio::name(dItr->status).value == eosio::name(hStatus::status::lockdebt).value, \
        hError::error::NOT_FOUND_RECORD.data());

    // check lockedTime
    auto nowTime = eosio::time_point_sec(now());
    eosio_assert((dItr->beginTime + dItr->lockedTime) > nowTime, hError::error::REDEEM_TIMEOUT.data());
    #ifdef _DEBUG
    eosio::print("\t[redeemdebt => now:", nowTime.sec_since_epoch(), \
        ", beginTime: ", dItr->beginTime.sec_since_epoch(), ", lockedTime: ", dItr->lockedTime, "]\t");
    #endif

    /* check pks table */
    eosio_assert(hasPK(dItr->pid), hError::error::NOT_FOUND_RECORD.data());
    htlc::pk_t npkInfo;
    eosio_assert(findPK(dItr->npid, &npkInfo), hError::error::NOT_FOUND_RECORD.data());

    // make action data
    std::string actionData;
    std::string encodedActionData;
    std::string_view storemanView = storeman.to_string();
    std::string_view xView = x;
    int32_t maxSize = storemanView.size() + xView.size() + hSig::redeemIndex::total - 1;
    actionData.resize(maxSize);

    common::join(const_cast<char *>(actionData.data()), tMemo::separator, &storemanView, &xView, &common::strEOF);
    crypto::base64::encode(const_cast<char *>(actionData.data()), actionData.size(), encodedActionData);

    /* for debug */
    #ifdef _DEBUG
    std::string decodedActionData;
    crypto::base64::decode(encodedActionData, decodedActionData);
    eosio::print("\t[redeemdebt => origin Data:", actionData, "]\t");
    eosio::print("\t[redeemdebt => decode Data:", decodedActionData, "]\t");
    #endif
    /* for debug end */

    // call signature contract to check mpc signature
    signature_t sigInfo;
    eosio_assert(getSignature(&sigInfo), hError::error::NOT_FOUND_SIGNATURE_RECORD.data());

    eosio::action(eosio::permission_level{this->get_self(), "active"_n}, sigInfo.code, sigInfo.action,
        std::make_tuple(this->get_self(), r, s, npkInfo.pk, encodedActionData, static_cast<std::string>(hStatus::status::redeemdebt))).send();

}

ACTION htlc::rdmdebt(eosio::name htlc, std::string r, std::string s, std::string pk, std::string msg, std::string memo) {

    /* decode message */
    std::string actionData;
    crypto::base64::decode(msg, actionData);
    #ifdef _DEBUG
    eosio::print("\t[rdmdebt => encode Data:", msg, "]\t");
    eosio::print("\t[rdmdebt => decode Data:", actionData, "]\t");
    #endif

    /* parse message */
    std::vector<std::string_view> v;
    common::split(actionData, tMemo::separator, v);

    eosio::name storeman = eosio::name(v[hSig::redeemIndex::storeman]);
    std::string_view xView = v[hSig::redeemIndex::x];

    #ifdef _DEBUG
    eosio::print("\t [rdmdebt => storeman:", storeman, ", x:", static_cast<std::string>(xView), "]\t");
    #endif

    /* check storeman account */
    eosio_assert(is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());

    /* get pkHash => sha256(pk) */
    htlc::pk_t pkInfo;
    eosio_assert(findPK(pk, &pkInfo), hError::error::NOT_FOUND_RECORD.data());
    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t[redeemdebt => find pk:", pk, " => pks(id:", pkInfo.id, ", pk:", pkInfo.pk, ", pkHash:", pkInfo.pkHash, ")]\t");
    #endif

    eosio::checksum256 xHashValue = hashX(xView);
    /* check debts */
    debts debt_table(get_self(), get_self().value);
    auto dXHashIndex = debt_table.get_index<eosio::name(hIndex::index::xHash)>();
    auto dItr = dXHashIndex.find(xHashValue);
    #ifdef _DEBUG
    eosio::print("\t[rdmdebt => table status:", dItr->status, ", id:", dItr->id, \
        ", pid:", dItr->pid, ", npid:", dItr->npid, ", quantity:", dItr->quantity, \
        ", redeemdebt:", eosio::name(hStatus::status::redeemdebt).value, "]\t");
    #endif
    eosio_assert(dItr != dXHashIndex.end() and \
        eosio::name(dItr->status).value == eosio::name(hStatus::status::lockdebt).value and dItr->npid == pkInfo.id, \
        hError::error::NOT_FOUND_RECORD.data());
    eosio_assert(!existFee(dItr->pid, dItr->quantity.symbol.code()), hError::error::FEE_RECORD.data());

    #ifdef _DEBUG
    eosio::print("\t[rdmdebt => beginTime:", dItr->beginTime.sec_since_epoch(), ", lockedTime:", dItr->lockedTime, \
        ", status:", dItr->status, ", id:", dItr->id, ", pid:", dItr->pid, ", npid:", dItr->npid, \
        ", xHash:", dItr->xHash, ", quantity:", dItr->quantity, " ]\t");
    #endif

    /* clean pk from table pks if pk is not used */
    subAsset(dItr->pid, dItr->quantity);
    addAsset(dItr->npid, dItr->quantity);
    cleanPk(dItr->pid, dItr->quantity.symbol.code());

    /* delete row (by xHash) from table debts */
    dItr = dXHashIndex.erase(dItr);
    // dXHashIndex.modify(dItr, get_self(), [&](auto &s) {
    //     s.status = hStatus::status::redeemdebt;
    // });
}

ACTION htlc::revokedebt(eosio::name storeman, std::string xHash, std::string r, std::string s) {

    eosio_assert(is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());
    eosio::require_auth(storeman);

    /* check xHash */
    eosio::checksum256 xHashValue = parseXHash(xHash);
    #ifdef _DEBUG
    eosio::print("\t [Htlc contract => revokedebt running => storeman : ", storeman, \
        ", xHash: ", xHash, "]\t");
    #endif

    debts debt_table(get_self(), get_self().value);
    auto dXHashIndex = debt_table.get_index<eosio::name(hIndex::index::xHash)>();
    auto dItr = dXHashIndex.find(xHashValue);

    eosio_assert(dItr != dXHashIndex.end() and \
        eosio::name(dItr->status).value == eosio::name(hStatus::status::lockdebt).value, \
        hError::error::NOT_FOUND_RECORD.data());

    // check lockedTime
    auto nowTime = eosio::time_point_sec(now());
    eosio_assert((dItr->beginTime + dItr->lockedTime) < nowTime, hError::error::REVOKE_TIMEOUT.data());

    /* find from pks table by pk id */
    htlc::pk_t pkInfo;
    eosio_assert(findPK(dItr->pid, &pkInfo), hError::error::NOT_FOUND_RECORD.data());

    std::string actionData;
    std::string encodedActionData;
    std::string_view storemanView = storeman.to_string();
    std::string_view xHashView = xHash;
    int32_t maxSize = storemanView.size() + xHashView.size() + hSig::revokeIndex::total - 1;
    actionData.resize(maxSize);

    common::join(const_cast<char *>(actionData.data()), tMemo::separator, &storemanView, &xHashView, &common::strEOF);
    crypto::base64::encode(const_cast<char *>(actionData.data()), actionData.size(), encodedActionData);

    /* for debug */
    #ifdef _DEBUG_LEVEL_1
    std::string decodedActionData;
    crypto::base64::decode(encodedActionData, decodedActionData);
    eosio::print("\t[revokedebt => origin Data: ", actionData, "]\t");
    eosio::print("\t[revokedebt => decode Data: ", decodedActionData, "]\t");
    #endif
    /* for debug end */

    signature_t sigInfo;
    eosio_assert(getSignature(&sigInfo), hError::error::NOT_FOUND_SIGNATURE_RECORD.data());

    eosio::action(eosio::permission_level{this->get_self(), "active"_n}, sigInfo.code, sigInfo.action,
        std::make_tuple(this->get_self(), r, s, pkInfo.pk, encodedActionData, static_cast<std::string>(hStatus::status::revokedebt))).send();
}

ACTION htlc::rvkdebt(eosio::name htlc, std::string r, std::string s, std::string pk, std::string msg, std::string memo) {

    std::string actionData;
    crypto::base64::decode(msg, actionData);
    #ifdef _DEBUG
    eosio::print("\t[rvkdebt => encode Data: ", msg, "]\t");
    eosio::print("\t[rvkdebt => decode Data: ", actionData, "]\t");
    #endif

    /* parse message */
    std::vector<std::string_view> v;
    common::split(actionData, tMemo::separator, v);

    eosio::name storeman = eosio::name(v[hSig::revokeIndex::storeman]);
    std::string_view xHashView = v[hSig::revokeIndex::xHash];
    eosio_assert(is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());

    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t [Htlc contract => rvkdebt running => storeman:", storeman, \
        ", xHash: ", static_cast<std::string>(xHashView), "]\t");
    #endif

    eosio::checksum256 xHashValue = parseXHash(xHashView);
    debts debt_table(get_self(), get_self().value);
    auto dXHashIndex = debt_table.get_index<eosio::name(hIndex::index::xHash)>();
    auto dItr = dXHashIndex.find(xHashValue);
    eosio_assert(dItr != dXHashIndex.end() and \
        eosio::name(dItr->status).value == eosio::name(hStatus::status::lockdebt).value, \
        hError::error::NOT_FOUND_RECORD.data());

    dItr = dXHashIndex.erase(dItr);
    // dXHashIndex.modify(dItr, get_self(), [&](auto &s) {
    //     s.status = hStatus::status::revokedebt;
    // });
    #ifdef _DEBUG
    eosio::print("\t[rvkdebt => beginTime:", dItr->beginTime.sec_since_epoch(), ", lockedTime:", dItr->lockedTime, \
        ", status:", dItr->status, ", id:", dItr->id, ", pid:", dItr->pid, \
        ", npid:", dItr->npid, ", xHash:", dItr->xHash, ", sym:", dItr->quantity, "]\t");
    #endif
    return;
}

ACTION htlc::withdraw(eosio::name storeman, std::string sym, std::string pk, std::string r, std::string s) {
    eosio_assert(is_account(storeman) and storeman != get_self(), hError::error::INVALID_ACCOUNT.data());
    eosio::require_auth(storeman);

    /* sha256(pk) */
    capi_checksum256 pkHash;
    std::string_view pkView = pk;
    std::string_view storemanView = storeman.to_string();
    std::string_view symView = sym;

    htlc::pk_t pkInfo;
    eosio_assert(findPK(pkView, &pkInfo), hError::error::NOT_FOUND_RECORD.data());

    // make action data
    std::string actionData;
    std::string encodedActionData;
    int32_t maxSize = storemanView.size() + symView.size() + hSig::withdrawIndex::total - 1;

    // check sym and fee
    if (symView.empty()) {
        --maxSize;
        /* find fee from fees table by pk id */
        fees fee_table(get_self(), pkInfo.id);
        eosio_assert(fee_table.begin() != fee_table.end(), hError::error::NOT_FOUND_RECORD.data());
    } else {
        /* find fee from fees table by pk id */
        fees fee_table(get_self(), pkInfo.id);
        auto fItr = fee_table.find(eosio::symbol_code(symView).raw());
        eosio_assert(fItr != fee_table.end(), hError::error::NOT_FOUND_RECORD.data());
    }
    actionData.resize(maxSize);

    common::join(const_cast<char *>(actionData.data()), tMemo::separator, &storemanView, &symView, &common::strEOF);
    crypto::base64::encode(const_cast<char *>(actionData.data()), actionData.size(), encodedActionData);

    /* for debug */
    #ifdef _DEBUG
    std::string decodedActionData;
    crypto::base64::decode(encodedActionData, decodedActionData);
    eosio::print("\t[withdraw => origin Data:", actionData, "]\t");
    eosio::print("\t[withdraw => decode Data:", decodedActionData, "]\t");
    #endif
    /* for debug end */

    // call signature contract to check mpc signature
    signature_t sigInfo;
    eosio_assert(getSignature(&sigInfo), hError::error::NOT_FOUND_SIGNATURE_RECORD.data());

    eosio::action(eosio::permission_level{this->get_self(), "active"_n}, sigInfo.code, sigInfo.action,
        std::make_tuple(this->get_self(), r, s, pk, encodedActionData, static_cast<std::string>(hStatus::status::withdraw))).send();
}

ACTION htlc::wdr(eosio::name htlc, std::string r, std::string s, std::string pk, std::string msg, std::string memo) {

    eosio_assert(is_account(htlc) and htlc == get_self(), hError::error::INVALID_ACCOUNT.data());

    std::string actionData;
    crypto::base64::decode(msg, actionData);
    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t[wdr => encode Data:", msg, "]\t");
    eosio::print("\t[wdr => decode Data:", actionData, "]\t");
    #endif

    /* parse message */
    std::vector<std::string_view> v;
    common::split(actionData, tMemo::separator, v);

    #ifdef _DEBUG
    eosio::print("\t[wdr => msg info count:", v.size(), "]\t");
    #endif
    eosio_assert(v.size() == hSig::withdrawIndex::total || v.size() == hSig::withdrawIndex::total - 1, \
        hError::error::INVALID_MEMO.data());

    eosio::name storeman = eosio::name(v[hSig::withdrawIndex::storeman]);
    std::string_view symView;
    if (v.size() == hSig::withdrawIndex::total) {
        symView = v[hSig::withdrawIndex::sym];
    }

    htlc::pk_t pkInfo;
    eosio_assert(findPK(pk, &pkInfo), hError::error::NOT_FOUND_RECORD.data());

    #ifdef _DEBUG
    eosio::print("\t [Htlc contract => wdr running => storeman:", storeman, \
        ", pk:", pk, "]\t");
    #endif

    /* eosio::action_wrapper invoke end */
    eosio_assert(is_account(storeman) and storeman != get_self(), hError::error::INVALID_ACCOUNT.data());

    subFee(pkInfo.id, symView, storeman, "");

}

/// @notice                    type        comment
/// @param user                name        account name of user initiated the Tx
/// @param quantity            asset       exchange quantity
/// @param memo                string      status(6):xHash(64):wanAddr(42):storeman(65) => 179 bytes
/// coin flow: user -> htlc
ACTION htlc::inlock(eosio::name user, eosio::name htlc, eosio::asset quantity, std::string memo) {

    eosio_assert(is_account(user) and user != get_self(), hError::error::INVALID_USER_ACCOUNT.data());
    eosio_assert(is_account(htlc) and htlc == get_self(), hError::error::INVALID_HTLC_ACCOUNT.data());
    eosio_assert(quantity.is_valid() and quantity.amount > 0, hError::error::INVALID_QUANTITY.data());

    eosio::require_auth(user);

    #ifdef _DEBUG
    eosio::print("\t[inlock => memo:", memo, "]\t");
    #endif
    std::vector<std::string_view> v;
    common::split(memo, tMemo::separator, v);

    std::string_view xHashView = v[tMemo::index::xHash];
    std::string_view wanAddrView = v[tMemo::index::wanAddr];
    std::string_view pkView = v[tMemo::index::pk];

    eosio_assert(!isPkBusy(pkView, quantity.symbol.code(), hStatus::status::inlock), hError::error::BUSY_PK.data());

    #ifdef _DEBUG
    eosio::print("\t [Htlc contract => inlock running => user:", user, ", quantity:", quantity, \
        ", xHash:", static_cast<std::string>(xHashView), \
        ", wanAddr:", static_cast<std::string>(wanAddrView), \
        ", pk:", static_cast<std::string>(pkView), "]\t");
    #endif

    lockHTLCTx(user, quantity, xHashView, wanAddrView, pkView, hStatus::status::inlock, true);
}

/// @notice               type        comment
/// @param storeman  name        storeman account name
/// @param xHash          string      hash of HTLC random number
/// @param x              string      HTLC random number
/// @param r              string      r for hSig
/// @param s              string      s for hSig
/// coin flow: htlc -> storeman
ACTION htlc::inredeem(eosio::name storeman, std::string x, std::string r, std::string s) {

    eosio_assert(is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());
    eosio::require_auth(storeman);

    /* get record by xHash */
    eosio::checksum256 xHashValue = hashX(x);
    transfers transfers_table(get_self(), get_self().value);
    auto tXHashIndex = transfers_table.get_index<eosio::name(hIndex::index::xHash)>();
    auto tItr = tXHashIndex.find(xHashValue);
    eosio_assert(tItr != tXHashIndex.end() and \
        eosio::name(tItr->status).value == eosio::name(hStatus::status::inlock).value, \
        hError::error::NOT_FOUND_RECORD.data());
    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t[inredeem => status:", tItr->status, ", ", eosio::name(hStatus::status::inlock), "]\t");
    #endif

    /* check lockedTime */
    auto nowTime = eosio::time_point_sec(now());
    eosio_assert((tItr->beginTime + tItr->lockedTime) > nowTime, hError::error::REDEEM_TIMEOUT.data());

    /* find from pks table by pk id */
    htlc::pk_t pkInfo;
    eosio_assert(findPK(tItr->pid, &pkInfo), hError::error::NOT_FOUND_RECORD.data());
    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t[inredeem => pks(id:", pkInfo.id, ", pk:", pkInfo.pk, ", pkHash:", pkInfo.pkHash, ")]\t");
    #endif

    // make action data
    std::string actionData;
    std::string encodedActionData;
    std::string_view storemanView = storeman.to_string();
    std::string_view xView = x;
    int32_t maxSize = storemanView.size() + xView.size() + hSig::redeemIndex::total - 1;
    actionData.resize(maxSize);

    common::join(const_cast<char *>(actionData.data()), tMemo::separator, &storemanView, &xView, &common::strEOF);
    crypto::base64::encode(const_cast<char *>(actionData.data()), actionData.size(), encodedActionData);

    /* for debug */
    #ifdef _DEBUG_LEVEL_1
    std::string decodedActionData;
    crypto::base64::decode(encodedActionData, decodedActionData);
    eosio::print("\t[inredeem => origin Data:", actionData, "]\t");
    eosio::print("\t[inredeem => decode Data:", decodedActionData, "]\t");
    #endif
    /* for debug end */

    // call signature contract to check mpc signature
    signature_t sigInfo;
    eosio_assert(getSignature(&sigInfo), hError::error::NOT_FOUND_SIGNATURE_RECORD.data());

    eosio::action(eosio::permission_level{this->get_self(), "active"_n}, sigInfo.code, sigInfo.action,
        std::make_tuple(this->get_self(), r, s, pkInfo.pk, encodedActionData, static_cast<std::string>(hStatus::status::inredeem))).send();
}

ACTION htlc::inrdm(eosio::name htlc, std::string r, std::string s, std::string pk, std::string msg, std::string memo) {

    std::string actionData;
    crypto::base64::decode(msg, actionData);
    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t[inrdm => encode Data:", msg, "]\t");
    eosio::print("\t[inrdm => decode Data:", actionData, "]\t");
    #endif

    /* parse message */
    std::vector<std::string_view> v;
    common::split(actionData, tMemo::separator, v);

    eosio::name storeman = eosio::name(v[hSig::redeemIndex::storeman]);
    std::string_view xView = v[hSig::redeemIndex::x];
    eosio_assert(is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());

    #ifdef _DEBUG
    eosio::print("\t[inrdm => storeman:", storeman, ", x:", static_cast<std::string>(xView), "]\t");
    #endif

    eosio::checksum256 xHashValue = hashX(xView);
    transfers transfers_table(get_self(), get_self().value);
    auto tXHashIndex = transfers_table.get_index<eosio::name(hIndex::index::xHash)>();
    auto tItr = tXHashIndex.find(xHashValue);

    eosio_assert(tItr != tXHashIndex.end() and \
        eosio::name(tItr->status).value == eosio::name(hStatus::status::inlock).value, \
        hError::error::NOT_FOUND_RECORD.data());

    #ifdef _DEBUG
    eosio::print("\t [Htlc contract => inrdm add balance => pid: ", tItr->pid, \
        ", user: ", tItr->user, ", quantity: ", tItr->quantity, "]\t");
        #endif

    addAsset(tItr->pid, tItr->quantity);

    tItr = tXHashIndex.erase(tItr);
    // tXHashIndex.modify(tItr, get_self(), [&](auto &s) {
    //     s.status = hStatus::status::inredeem;
    // });
    #ifdef _DEBUG
    eosio::print("\t[inrdm => beginTime:", tItr->beginTime.sec_since_epoch(), ", lockedTime:", tItr->lockedTime, \
        ", status:", tItr->status, ", id:", tItr->id, ", pid:", tItr->pid, \
        ", quantity:", tItr->quantity, ", xHash:", tItr->xHash, ", wanAddr:", tItr->wanAddr, " ]\t");
    #endif
}

/// @notice               type        comment
/// @param user           name        account name of user initiated the Tx
/// @param xHash          string      hash of HTLC random number
/// coin flow: htlc -> user
ACTION htlc::inrevoke(eosio::name user, std::string xHash) {
    eosio_assert(is_account(user) and user != get_self(), hError::error::INVALID_USER_ACCOUNT.data());

    eosio::require_auth(user);
    eosio::checksum256 xHashValue = parseXHash(xHash);

    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t [inrevoke => user: ", user, ", xHash:", xHash, "]\t");
    #endif

    transfers transfers_table(get_self(), get_self().value);
    auto tXHashIndex = transfers_table.get_index<eosio::name(hIndex::index::xHash)>();
    auto tItr = tXHashIndex.find(xHashValue);

    eosio_assert(tItr != tXHashIndex.end() and \
        eosio::name(tItr->status).value == eosio::name(hStatus::status::inlock).value and \
        tItr->user == user, hError::error::NOT_FOUND_RECORD.data());

    // check lockedTime
    auto nowTime = eosio::time_point_sec(now());
    eosio_assert((tItr->beginTime + tItr->lockedTime) <= nowTime, hError::error::REVOKE_TIMEOUT.data());

    eosio::asset fee = (tItr->quantity * hFee::revokeRatio) / hFee::ratioPrecise;
    eosio::asset left = tItr->quantity - fee;
    #ifdef _DEBUG
    eosio::print("\t[inrevoke => fee:", fee, ", left:", left, "]\t");
    #endif

    eosio_assert(left.is_valid() and left <= tItr->quantity, hError::error::LEFT_OVERFLOW.data());
    eosio_assert(fee.is_valid() and fee <= tItr->quantity , hError::error::FEE_OVERFLOW.data());

    if (fee.amount == 0) {
        fee += left;
        left -= left;
    }

    if (left.amount > 0) {
        /* find from pks table by pk id */
        htlc::pk_t pkInfo;
        eosio_assert(findPK(tItr->pid, &pkInfo), hError::error::NOT_FOUND_RECORD.data());

        std::string memo;
        std::string_view xHashView = xHash;
        std::string_view wanAddrView = tItr->wanAddr;
        std::string_view pkView = pkInfo.pk;

        int32_t maxSize = hStatus::status::inrevoke.size() + xHashView.size() + wanAddrView.size() + pkView.size() + 3;
        memo.resize(maxSize);

        common::join(const_cast<char *>(memo.data()), tMemo::separator, \
            &hStatus::status::inrevoke, &xHashView, &wanAddrView, &pkView, &common::strEOF);

        #ifdef _DEBUG_LEVEL_1
        eosio::print("\t [inrevoke => quantity left memo:", memo, "]\t");
        #endif

        // eosio.token's action [transfer] will notify user that user inrevoked by memo
        eosio::action(eosio::permission_level{this->get_self(), "active"_n}, "eosio.token"_n, "transfer"_n,
            std::make_tuple(this->get_self(), tItr->user, left, memo)).send();
    } else {
        // notify user that user inrevoked when not enough quantity left to give back
        require_recipient(user);
    }

    if (fee.amount > 0) {
        // record fee for storeman, then storeman will get it by withdraw
        #ifdef _DEBUG_LEVEL_1
        eosio::print("\t [inrevoke => cost fee:", fee, "]\t");
        #endif

        addFee(tItr->pid, fee);

    }

    tItr = tXHashIndex.erase(tItr);
    // tXHashIndex.modify(tItr, get_self(), [&](auto &s) {
    //     s.status = hStatus::status::inrevoke;
    // });
    #ifdef _DEBUG
    eosio::print("\t[inrevoke => beginTime:", tItr->beginTime.sec_since_epoch(), ", lockedTime:", tItr->lockedTime, \
        ", status:", tItr->status, ", id:", tItr->id, ", user:", tItr->user, ", pid:", tItr->pid, \
        ", quantity:", tItr->quantity, ", left:", left, ", fee:", fee, ", xHash:", tItr->xHash, \
        ", wanAddr:", tItr->wanAddr, " ]\t");
    #endif
    return;
}

/// @notice               type        comment
/// @param user           name        account name of user initiated the Tx
/// @param storeman  name        storeman account name
/// @param quantity       asset       exchange quantity
/// @param memo           string      xHash:wanAddr:user:status
/// coin flow: storeman -> htlc
ACTION htlc::outlock(eosio::name storeman, eosio::name user, eosio::asset quantity, std::string xHash, \
    std::string wanAddr, std::string pk, std::string r, std::string s) {

    eosio_assert(is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());
    eosio_assert(is_account(user) and user != get_self(), hError::error::INVALID_USER_ACCOUNT.data());
    eosio_assert(quantity.is_valid() and quantity.amount > 0, hError::error::INVALID_QUANTITY.data());
    eosio::require_auth(storeman);
    eosio_assert(!isPkBusy(pk, quantity.symbol.code(), hStatus::status::outlock), hError::error::BUSY_PK.data());

    eosio::checksum256 xHashValue = parseXHash(xHash);

    transfers transfers_table(get_self(), get_self().value);
    auto tXHashIndex = transfers_table.get_index<eosio::name(hIndex::index::xHash)>();
    auto tItr = tXHashIndex.find(xHashValue);
    eosio_assert(tItr == tXHashIndex.end(), hError::error::REDUPLICATIVE_XHASH.data());

    // make aciton data
    std::string actionData;
    std::string encodedActionData;
    std::string_view storemanView = storeman.to_string();
    std::string_view userView = user.to_string();
    std::string_view qView = quantity.to_string();
    std::string_view xHashView = xHash;
    std::string_view wanAddrView = wanAddr;

    int32_t maxSize = storemanView.size() + userView.size() + qView.size() + xHashView.size() + wanAddr.size() + hSig::lockIndex::total - 1;
    actionData.resize(maxSize);

    /* storeman:user:quantity:xHash:wanAddr:pk */
    common::join(const_cast<char *>(actionData.data()), tMemo::separator, &storemanView, &userView, \
        &qView, &xHashView, &wanAddrView, &common::strEOF);
    crypto::base64::encode(const_cast<char *>(actionData.data()), actionData.size(), encodedActionData);

    /* for debug */
    #ifdef _DEBUG_LEVEL_1
    std::string decodedActionData;
    crypto::base64::decode(encodedActionData, decodedActionData);
    eosio::print("\t[outlock => origin Data: ", actionData, "]\t");
    eosio::print("\t[outlock => decode Data: ", decodedActionData, "]\t");
    #endif
    /* for debug end */

    // call signature contract to check mpc signature
    signature_t sigInfo;
    eosio_assert(getSignature(&sigInfo), hError::error::NOT_FOUND_SIGNATURE_RECORD.data());

    eosio::action(eosio::permission_level{this->get_self(), "active"_n}, sigInfo.code, sigInfo.action,
        std::make_tuple(this->get_self(), r, s, pk, encodedActionData, static_cast<std::string>(hStatus::status::outlock))).send();
}

ACTION htlc::outlk(eosio::name htlc, std::string r, std::string s, std::string pk, std::string msg, std::string memo) {

    eosio_assert(is_account(htlc) and htlc == get_self(), hError::error::INVALID_HTLC_ACCOUNT.data());

    /* parse message */
    std::string actionData;
    crypto::base64::decode(msg, actionData);
    #ifdef _DEBUG
    eosio::print("\t[outlk => encode Data: ", msg, "]\t");
    eosio::print("\t[outlk => decode Data: ", actionData, "]\t");
    #endif

    std::vector<std::string_view> v;
    common::split(actionData, tMemo::separator, v);

    /* parse quantity */
    eosio::asset quantity = stringToAsset(v[hSig::lockIndex::quantity]);
    eosio_assert(!isPkBusy(pk, quantity.symbol.code(), hStatus::status::outlock), hError::error::BUSY_PK.data());

    /* convert string to eosio::asset finished */

    eosio::name storeman = eosio::name(v[hSig::lockIndex::storeman]);
    eosio::name user = eosio::name(v[hSig::lockIndex::user]);
    std::string_view xHashView = v[hSig::lockIndex::xHash];
    std::string_view wanAddrView = v[hSig::lockIndex::wanAddr];

    eosio_assert(is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());
    eosio_assert(is_account(user) and user != get_self(), hError::error::INVALID_USER_ACCOUNT.data());
    eosio_assert(storeman != user, hError::error::SG_NOT_USER.data());
    eosio_assert(quantity.is_valid() and quantity.amount > 0, hError::error::INVALID_QUANTITY.data());

    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t [Htlc contract => outlk running => storeman: ", storeman, ", user: ", user, \
        ", quantity: ", quantity, ", xHash: ", static_cast<std::string>(xHashView), \
        ", wanAddr:", static_cast<std::string>(wanAddrView), " ]\t");
    #endif

    lockHTLCTx(user, quantity, xHashView, wanAddrView, pk, hStatus::status::outlock, false);

    // notify user that storeman locked
    require_recipient(user);
    // notify storeman locked
    require_recipient(storeman);

}

/// @notice               type        comment
/// @param user           name        account name of user initiated the Tx
/// @param storeman  name        storeman account name
/// @param xHash          string      hash of HTLC random number
/// @param x              string      HTLC random number
/// coin flow: htlc -> user
ACTION htlc::outredeem(eosio::name user, std::string x) {

    eosio_assert(is_account(user) and user != get_self(), hError::error::INVALID_USER_ACCOUNT.data());
    eosio::require_auth(user);

    #ifdef _DEBUG
    eosio::print("\t [outredeem => user:", user, ", x:", x, "]\t");
    #endif

    eosio::checksum256 xHashValue = hashX(x);
    transfers transfers_table(get_self(), get_self().value);
    auto tXHashIndex = transfers_table.get_index<eosio::name(hIndex::index::xHash)>();
    auto tItr = tXHashIndex.find(xHashValue);

    eosio_assert(tItr != tXHashIndex.end() and \
        eosio::name(tItr->status).value == eosio::name(hStatus::status::outlock).value and \
        tItr->user == user, hError::error::NOT_FOUND_RECORD.data());

    //  check lockedTime
    auto nowTime = eosio::time_point_sec(now());
    eosio_assert((tItr->beginTime + tItr->lockedTime) >= nowTime, hError::error::REDEEM_TIMEOUT.data());
    #ifdef _DEBUG
    eosio::print("\t[outredeem => now: ", nowTime.sec_since_epoch(), ", beginTime: ", tItr->beginTime.sec_since_epoch(), \
        ", lockedTime: ", tItr->lockedTime, "]\t");
    #endif

    /* pk asset should be more than cross-quantity */
    eosio::asset quantity = tItr->quantity - tItr->quantity;
    getAsset(tItr->pid, &quantity);
    eosio_assert(quantity >= tItr->quantity, hError::error::NOE_ENOUGH_QUANTITY.data());
    /* pk asset should be more than (cross-quantity add all pendingAsset) */
    eosio::asset outPendQuantity = tItr->quantity - tItr->quantity;
    getOutPendAsset(tItr->pid, &outPendQuantity);
    eosio_assert(quantity >= (outPendQuantity + tItr->quantity), hError::error::NOE_ENOUGH_QUANTITY.data());

    /*quota reduce*/
    subAsset(tItr->pid, tItr->quantity);
    /*end for quota reduce*/

    // make memo
    std::string memo;
    std::string_view xView = x;
    int32_t maxSize = hStatus::status::outredeem.size() + xView.size() + 1;
    memo.resize(maxSize);

    common::join(const_cast<char *>(memo.data()), tMemo::separator, &hStatus::status::outredeem, \
        &xView, &common::strEOF);
    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t [Htlc contract => outredeem running => memo: ", memo, "]\t");
    #endif

    // eosio.token's action [transfer] will notify user that user outredeemed by memo
    eosio::action(eosio::permission_level{this->get_self(), "active"_n}, "eosio.token"_n, "transfer"_n,
        std::make_tuple(this->get_self(), tItr->user, tItr->quantity, memo)).send();

    tItr = tXHashIndex.erase(tItr);
    // tXHashIndex.modify(tItr, get_self(), [&](auto &s) {
    //     s.status = hStatus::status::outredeem;
    // });
    #ifdef _DEBUG
    eosio::print("\t[outredeem => beginTime:", tItr->beginTime.sec_since_epoch(), ", lockedTime:", tItr->lockedTime, \
        ", status:", tItr->status, ", id:", tItr->id, ", user:", tItr->user, "\
        , quantity:", tItr->quantity, ", xHash:", tItr->xHash, ", wanAddr:", tItr->wanAddr, " ]\t");
    #endif
    return;
}

/// @notice               type        comment
/// @param storeman  name        storeman account name
/// @param xHash          string      hash of HTLC random number
/// coin flow: htlc -> storeman
ACTION htlc::outrevoke(eosio::name storeman, std::string xHash, std::string r, std::string s) {
    eosio_assert(is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());

    eosio::require_auth(storeman);
    eosio::checksum256 xHashValue = parseXHash(xHash);

    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t [Htlc contract => outrevoke running => storeman : ", storeman, ", xHash: ", xHash, "]\t");
    #endif

    transfers transfers_table(get_self(), get_self().value);

    auto tXHashIndex = transfers_table.get_index<eosio::name(hIndex::index::xHash)>();
    auto tItr = tXHashIndex.find(xHashValue);

    eosio_assert(tItr != tXHashIndex.end() and \
        eosio::name(tItr->status).value == eosio::name(hStatus::status::outlock).value, \
        hError::error::NOT_FOUND_RECORD.data());

    // check lockedTime
    auto nowTime = eosio::time_point_sec(now());
    eosio_assert((tItr->beginTime + tItr->lockedTime) < nowTime, hError::error::REVOKE_TIMEOUT.data());

    /* find from pks table by pk id */
    htlc::pk_t pkInfo;
    eosio_assert(findPK(tItr->pid, &pkInfo), hError::error::NOT_FOUND_RECORD.data());

    std::string actionData;
    std::string encodedActionData;
    std::string_view storemanView = storeman.to_string();
    std::string_view xHashView = xHash;
    int32_t maxSize = storemanView.size() + xHashView.size() + hSig::revokeIndex::total - 1;
    actionData.resize(maxSize);

    common::join(const_cast<char *>(actionData.data()), tMemo::separator, &storemanView, &xHashView, &common::strEOF);
    crypto::base64::encode(const_cast<char *>(actionData.data()), actionData.size(), encodedActionData);

    /* for debug */
    #ifdef _DEBUG_LEVEL_1
    std::string decodedActionData;
    crypto::base64::decode(encodedActionData, decodedActionData);
    eosio::print("\t[outrevoke => origin Data: ", actionData, "]\t");
    eosio::print("\t[outrevoke => decode Data: ", decodedActionData, "]\t");
    #endif
    /* for debug end */
    signature_t sigInfo;
    eosio_assert(getSignature(&sigInfo), hError::error::NOT_FOUND_SIGNATURE_RECORD.data());

    eosio::action(eosio::permission_level{this->get_self(), "active"_n}, sigInfo.code, sigInfo.action,
        std::make_tuple(this->get_self(), r, s, pkInfo.pk, encodedActionData, static_cast<std::string>(hStatus::status::outrevoke))).send();
}

ACTION htlc::outrvk(eosio::name htlc, std::string r, std::string s, std::string pk, std::string msg, std::string memo) {

    std::string actionData;
    crypto::base64::decode(msg, actionData);
    #ifdef _DEBUG
    eosio::print("\t[outrvk => encode Data: ", msg, "]\t");
    eosio::print("\t[outrvk => decode Data: ", actionData, "]\t");
    #endif

    /* parse message */
    std::vector<std::string_view> v;
    common::split(actionData, tMemo::separator, v);

    eosio::name storeman = eosio::name(v[hSig::revokeIndex::storeman]);
    std::string_view xHashView = v[hSig::revokeIndex::xHash];
    eosio_assert(is_account(storeman) and storeman != get_self(), hError::error::INVALID_SG_ACCOUNT.data());

    eosio::checksum256 xHashValue = parseXHash(xHashView);

    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t [Htlc contract => outrvk running => storeman:", storeman, \
        ", xHash: ", static_cast<std::string>(xHashView), "]\t");
    #endif

    transfers transfers_table(get_self(), get_self().value);
    // find xHash record
    auto tXHashIndex = transfers_table.get_index<eosio::name(hIndex::index::xHash)>();
    auto tItr = tXHashIndex.find(xHashValue);
    eosio_assert(tItr != tXHashIndex.end() and \
        eosio::name(tItr->status).value == eosio::name(hStatus::status::outlock).value, \
        hError::error::NOT_FOUND_RECORD.data());

    // notify user that storeman outrevoked
    require_recipient(tItr->user);

    tItr = tXHashIndex.erase(tItr);
    // tXHashIndex.modify(tItr, get_self(), [&](auto &s) {
    //     s.status = hStatus::status::outrevoke;
    // });
    #ifdef _DEBUG
    eosio::print("\t[outrvk => beginTime:", tItr->beginTime.sec_since_epoch(), ", lockedTime:", tItr->lockedTime, \
        ", status:", tItr->status, ", id:", tItr->id, ", user:", tItr->user, ", pid:", tItr->pid, \
        ", quantity:", tItr->quantity, ", xHash:", tItr->xHash, ", wanAddr:", tItr->wanAddr.data(), "]\t");
    #endif
    return;

}

ACTION htlc::leftlocktime(eosio::name from, eosio::name table, std::string xHash) {
    eosio_assert(is_account(from), hError::error::NOT_EXIST_ACCOUNT.data());
    eosio::require_auth(from);
    eosio::checksum256 xHashValue = parseXHash(xHash);

        switch (table.value) {
        case eosio::name(hTable::table::transfers).value: {
            transfers transfers_table(get_self(), get_self().value);
            auto tXHashIndex = transfers_table.get_index<eosio::name(hIndex::index::xHash)>();
            auto tItr = tXHashIndex.find(xHashValue);
            eosio_assert(tItr != tXHashIndex.end(), hError::error::NOT_FOUND_RECORD.data());

            auto nowTime = eosio::time_point_sec(now());
            auto leftTime = (tItr->beginTime + tItr->lockedTime) - nowTime;
            #ifdef _DEBUG
            eosio::print("\t[left lock time: ", (leftTime.count() > 0) ? leftTime.to_seconds() : 0, " s]\t");
            #endif
            break;
        }
        case eosio::name(hTable::table::debts).value: {
            debts debt_table(get_self(), get_self().value);
            auto dXHashIndex = debt_table.get_index<eosio::name(hIndex::index::xHash)>();
            auto dItr = dXHashIndex.find(xHashValue);
            eosio_assert(dItr != dXHashIndex.end(), hError::error::NOT_FOUND_RECORD.data());

            auto nowTime = eosio::time_point_sec(now());
            auto leftTime = (dItr->beginTime + dItr->lockedTime) - nowTime;
            #ifdef _DEBUG
            eosio::print("\t[left lock time: ", (leftTime.count() > 0) ? leftTime.to_seconds() : 0, " s]\t");
            #endif

            break;
        }
        default:
            eosio_assert(false, hError::error::INVALID_TABLE.data());
    }
}

eosio::checksum256 htlc::parseXHash(std::string_view xHashView) {
    eosio_assert(xHashView.size() == tMemo::mSize::xHash, hError::error::INVALID_X_OR_XHASH_SIZE.data());
    capi_checksum256 xHashValue = str2CapiChecksum256(xHashView);
    std::string_view xHashValueStr = toHexStr(xHashValue);
    eosio_assert(xHashView.compare(xHashValueStr) == 0, hError::error::INVALID_XHASH.data());
    return xHashValue.hash;
}

bool htlc::getSignature(void *sigInfo) {
    /* get the signature contract info */

    eosio_assert(sigInfo != nullptr, hError::error::INVALID_PARAM.data());
    signer sig_table(get_self(), get_self().value);
    if (sig_table.begin() == sig_table.end()) {
        return false;
    }

    auto dItr = sig_table.begin();
    static_cast<signature_t *>(sigInfo)->code = dItr->code;
    static_cast<signature_t *>(sigInfo)->action = dItr->action;
    return true;
}

#ifdef USING_LISTENER
bool htlc::getListenInfo(uint64_t code, void *listenInfo) {
    /* get the signature contract info */

    eosio_assert(listenInfo != nullptr, hError::error::INVALID_PARAM.data());
    listens listen_table(get_self(), get_self().value);
    auto lItr = listen_table.find(code);
    if (lItr == listen_table.end()) {
        return false;
    }

    static_cast<listen_t *>(listenInfo)->code = lItr->code;
    static_cast<listen_t *>(listenInfo)->action = lItr->action;
    return true;
}

bool htlc::getListenInfo(std::vector<listen_t> &v) {
    /* get the signature contract info */

    eosio_assert(listenInfo != nullptr, hError::error::INVALID_PARAM.data());
    listens listen_table(get_self(), get_self().value);
    if (listen_table.begin() == listen_table.end()) {
        return false;
    }

    auto lItr = listen_table.begin();
    do {
        v.push_back(*lItr);
    } while (lItr != listen_table.end());
    return true;
}
#endif

void htlc::cleanPk(uint64_t pid, eosio::symbol_code sym) {
    assets asset_table(get_self(), pid);
    auto aItr = asset_table.find(sym.raw());
    if (aItr != asset_table.end()) {
        return;
    }

    transfers transfers_table(get_self(), get_self().value);
    auto tPidIndex = transfers_table.get_index<eosio::name(hIndex::index::pid)>();
    auto tItr = tPidIndex.find(pid);
    // check if xHash exists
    if (tItr != tPidIndex.end()) {
        /* a certain token cross-chain exists, do not clear pk from table pks */
        return ;
    }

    /* clean pk from table pks */
    pks pk_table(get_self(), get_self().value);
    auto pItr = pk_table.find(pid);
    if (pItr != pk_table.end()) {
        pItr = pk_table.erase(pItr);
    }

}

uint64_t htlc::savePk(std::string_view pkView) {
    /* add table fees */
    uint64_t pid;
    capi_checksum256 pkHash;
    sha256(pkView.data(), pkView.size(), &pkHash);

    /* find from pks table by sha256(pk) */
    pks pk_table(get_self(), get_self().value);
    auto pkHashIndex = pk_table.get_index<eosio::name(hIndex::index::pkHash)>();
    auto pItr = pkHashIndex.find(pkHash.hash);

    /* add pk into pk-table if pk not exists in pk-table */
    if (pItr == pkHashIndex.end()) {
        pk_table.emplace(get_self(), [&](auto &s) {
            s.id = pk_table.available_primary_key();
            s.pk = static_cast<std::string>(pkView);
            s.pkHash = pkHash.hash;

            pid = s.id;
            #ifdef _DEBUG_LEVEL_2
            eosio::print("\t[savePk => add pks => id:", s.id, ", pk:", s.pk, ", pkHash:", s.pkHash, "]\t");
            #endif
        });
    } else {
        pid = pItr->id;
    }
    return pid;
}

bool htlc::findPK(std::string_view pkView, void *pkInfo) {
    /* get the pks contract info */
    eosio_assert(pkInfo != nullptr, hError::error::INVALID_PARAM.data());

    capi_checksum256 pkHash;
    sha256(pkView.data(), pkView.size(), &pkHash);

    /* find from pks table by sha256(pk) */
    pks pk_table(get_self(), get_self().value);
    auto pkHashIndex = pk_table.get_index<eosio::name(hIndex::index::pkHash)>();
    auto pItr = pkHashIndex.find(pkHash.hash);
    if (pItr == pkHashIndex.end()) {
        return false;
    }

    static_cast<pk_t *>(pkInfo)->id = pItr->id;
    static_cast<pk_t *>(pkInfo)->pkHash = pItr->pkHash;
    static_cast<pk_t *>(pkInfo)->pk = pItr->pk;

    return true;
}

bool htlc::findPK(uint64_t pid, void *pkInfo) {
    /* get the pks contract info */
    eosio_assert(pkInfo != nullptr, hError::error::INVALID_PARAM.data());

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

bool htlc::hasPK(std::string_view pkView) {
    capi_checksum256 pkHash;
    sha256(pkView.data(), pkView.size(), &pkHash);

    /* find from pks table by sha256(pk) */
    pks pk_table(get_self(), get_self().value);
    auto pkHashIndex = pk_table.get_index<eosio::name(hIndex::index::pkHash)>();
    auto pItr = pkHashIndex.find(pkHash.hash);
    return pItr != pkHashIndex.end();
}

bool htlc::hasPK(uint64_t pid) {
    /* find from pks table by pid */
    pks pk_table(get_self(), get_self().value);
    auto pItr = pk_table.find(pid);
    return pItr != pk_table.end();
}

bool htlc::isPkBusy(std::string_view pkView, eosio::symbol_code sym, std::string_view statusView) {
    bool isBusy = false;
    switch (eosio::name(statusView).value) {
        case eosio::name(hStatus::status::lockdebt).value: {
            htlc::pk_t pkInfo;
            eosio_assert(findPK(pkView, &pkInfo), hError::error::NOT_FOUND_RECORD.data());

            debts debt_table(get_self(), get_self().value);
            // check debts table if pid exists
            uint128_t symPidKey = common::makeU128(sym.raw(), pkInfo.id);
            auto dSymPidIndex = debt_table.get_index<eosio::name(hIndex::index::sym_pid)>();
            auto dItr = dSymPidIndex.find(symPidKey);
            isBusy = (dItr != dSymPidIndex.end());
            eosio::print("isPkBusy => pk lockdebt => symPidKey:", symPidKey, ", isBusy:", isBusy);

            break;
        }
        case eosio::name(hStatus::status::updatepk).value:
        case eosio::name(hStatus::status::removepk).value:
        case eosio::name(hStatus::status::inlock).value:
        case eosio::name(hStatus::status::outlock).value: {
            /* only check pks table if pk exists while outlock */
            htlc::pk_t pkInfo;
            if (findPK(pkView, &pkInfo)) {
                debts debt_table(get_self(), get_self().value);
                // check debts table if pid exists
                uint128_t symPidKey = common::makeU128(sym.raw(), pkInfo.id);
                auto dSymPidIndex = debt_table.get_index<eosio::name(hIndex::index::sym_pid)>();
                auto dItr = dSymPidIndex.find(symPidKey);
                isBusy = (dItr != dSymPidIndex.end());
                eosio::print("isPkBusy => pk inlock|outlock => symPidKey:", symPidKey, ", isBusy:", isBusy);
            }

            break;
        }
        default: {
            eosio_assert(false, hError::error::INVALID_STATUS.data());
            break;
        }
    }
    return isBusy;
}

bool htlc::isPkBusy(uint64_t pid, eosio::symbol_code sym, std::string_view statusView) {
    bool isBusy = false;
    switch (eosio::name(statusView).value) {
        case eosio::name(hStatus::status::lockdebt).value: {
            htlc::pk_t pkInfo;
            eosio_assert(findPK(pid, &pkInfo), hError::error::NOT_FOUND_RECORD.data());

            debts debt_table(get_self(), get_self().value);
            // check debts table if pid exists
            uint128_t symPidKey = common::makeU128(sym.raw(), pkInfo.id);
            auto dSymPidIndex = debt_table.get_index<eosio::name(hIndex::index::sym_pid)>();
            auto dItr = dSymPidIndex.find(symPidKey);
            isBusy = (dItr != dSymPidIndex.end());
            eosio::print("isPkBusy => pk lockdebt => symPidKey:", symPidKey, ", isBusy:", isBusy);

            break;
        }
        case eosio::name(hStatus::status::inlock).value:
        case eosio::name(hStatus::status::outlock).value: {
            htlc::pk_t pkInfo;
            /* only check pks table if pk exists while outlock */
            if (findPK(pid, &pkInfo)) {
                debts debt_table(get_self(), get_self().value);
                // check debts table if pid exists
                uint128_t symPidKey = common::makeU128(sym.raw(), pkInfo.id);
                auto dSymPidIndex = debt_table.get_index<eosio::name(hIndex::index::sym_pid)>();
                auto dItr = dSymPidIndex.find(symPidKey);
                isBusy = (dItr != dSymPidIndex.end());
                eosio::print("isPkBusy => pid inlock|outlock => symPidKey:", symPidKey, ", isBusy:", isBusy);
            }

            break;
        }
        default:
            eosio_assert(false, hError::error::INVALID_STATUS.data());
    }
    return isBusy;
}

bool htlc::isPkBusy(std::string_view pkView, std::string_view symView, std::string_view statusView) {
    bool isBusy = false;
    switch (eosio::name(statusView).value) {
        case eosio::name(hStatus::status::lockdebt).value: {
            htlc::pk_t pkInfo;
            eosio_assert(findPK(pkView, &pkInfo), hError::error::NOT_FOUND_RECORD.data());

            /* check fees table if exist by pk */
            fees fee_table(get_self(), pkInfo.id);
            eosio_assert(fee_table.begin() == fee_table.end(), hError::error::FEE_RECORD.data());

            transfers transfer_table(get_self(), get_self().value);
            if (symView.empty()) {
                // check debts table if pid exists
                auto tPidIndex = transfer_table.get_index<eosio::name(hIndex::index::pid)>();
                auto tItr = tPidIndex.find(pkInfo.id);
                isBusy = (tItr != tPidIndex.end());
                eosio::print("isPkBusy => pid lockdebt => pidKey:", pkInfo.id, ", isBusy:", isBusy);
            } else {
            debts debt_table(get_self(), get_self().value);
                // check debts table if pid exists
                uint128_t symPidKey = common::makeU128(eosio::symbol_code(symView).raw(), pkInfo.id);
                auto tSymPidIndex = transfer_table.get_index<eosio::name(hIndex::index::sym_pid)>();
                auto tItr = tSymPidIndex.find(symPidKey);
                isBusy = (tItr != tSymPidIndex.end());
                eosio::print("isPkBusy => pid lockdebt => symPidKey:", symPidKey, ", isBusy:", isBusy);
            }

            break;
        }
        default:
            eosio_assert(false, hError::error::INVALID_STATUS.data());
    }
    return isBusy;
}

bool htlc::isPkBusy(uint64_t pid, std::string_view symView, std::string_view statusView) {
    bool isBusy = false;
    switch (eosio::name(statusView).value) {
        case eosio::name(hStatus::status::lockdebt).value: {
            htlc::pk_t pkInfo;
            eosio_assert(findPK(pid, &pkInfo), hError::error::NOT_FOUND_RECORD.data());

            /* check fees table if exist by pk */
            fees fee_table(get_self(), pkInfo.id);
            eosio_assert(fee_table.begin() == fee_table.end(), hError::error::FEE_RECORD.data());

            transfers transfer_table(get_self(), get_self().value);
            if (symView.empty()) {
                // check debts table if pid exists
                auto tPidIndex = transfer_table.get_index<eosio::name(hIndex::index::pid)>();
                auto tItr = tPidIndex.find(pkInfo.id);
                isBusy = (tItr != tPidIndex.end());
                eosio::print("isPkBusy => pid lockdebt => pidKey:", pkInfo.id, ", isBusy:", isBusy);
            } else {
                // check debts table if pid exists
                uint128_t symPidKey = common::makeU128(eosio::symbol_code(symView).raw(), pkInfo.id);
                auto tSymPidIndex = transfer_table.get_index<eosio::name(hIndex::index::sym_pid)>();
                auto tItr = tSymPidIndex.find(symPidKey);
                isBusy = (tItr != tSymPidIndex.end());
                eosio::print("isPkBusy => pid lockdebt => symPidKey:", symPidKey, ", isBusy:", isBusy);
            }

            break;
        }
        default:
            eosio_assert(false, hError::error::INVALID_STATUS.data());
    }
    return isBusy;
}

void htlc::addAsset(uint64_t pid, const eosio::asset &quantity) {
    /* add table fees */

    assets asset_table(get_self(), pid);
    auto aItr = asset_table.find(quantity.symbol.code().raw());
    if (aItr == asset_table.end()) {
        asset_table.emplace(get_self(), [&](auto &s) {
            s.balance = quantity;
            #ifdef _DEBUG
            eosio::print("\t[addAsset => balance:", s.balance, "]\t");
            #endif
        });
    } else {
        asset_table.modify(aItr, get_self(), [&](auto &s) {
            s.balance += quantity;
            #ifdef _DEBUG
            eosio::print("\t[addAsset => balance:", s.balance, "]\t");
            #endif
        });
    }
}

void htlc::subAsset(uint64_t pid, const eosio::asset &quantity) {
    /* sub table fees */

    assets asset_table(get_self(), pid);
    auto aItr = asset_table.find(quantity.symbol.code().raw());
    eosio_assert(aItr != asset_table.end() and (aItr->balance >= quantity), hError::error::NOE_ENOUGH_QUANTITY.data());
    if (aItr->balance == quantity) {
        aItr = asset_table.erase(aItr);
    } else {
        asset_table.modify(aItr, get_self(), [&](auto &s) {
            s.balance -= quantity;
            #ifdef _DEBUG
            eosio::print("\t[subAsset => balance:", s.balance, "]\t");
            #endif
        });
    }
}

bool htlc::existFee(uint64_t pid, eosio::symbol_code sym) {
    /* add table fees */
    
    fees fee_table(get_self(), pid);
    auto fItr = fee_table.find(sym.raw());
    return (fItr != fee_table.end());
}

void htlc::addFee(uint64_t pid, const eosio::asset &fee) {
    /* add table fees */
    
    fees fee_table(get_self(), pid);
    auto fItr = fee_table.find(fee.symbol.code().raw());
    if (fItr == fee_table.end()) {
        fee_table.emplace(get_self(), [&](auto &s) {
            s.fee = fee;
            #ifdef _DEBUG
            eosio::print("\t[addFee => fee:", s.fee, "]\t");
            #endif
        });
    } else {
        fee_table.modify(fItr, get_self(), [&](auto &s) {
            s.fee += fee;
            #ifdef _DEBUG
            eosio::print("\t[addFee => fee:", s.fee, "]\t");
            #endif
        });
    }
}

void htlc::subFee(uint64_t pid, std::string_view symView, eosio::name to, std::string memo) {
    /* sub table fees */

    fees fee_table(get_self(), pid);
    if (symView.empty()) {
        auto fItr = fee_table.begin();
        while (fItr != fee_table.end()) {
            #ifdef _DEBUG
            eosio::print("\t[subFee => to:", to, ", fee:", fItr->fee, " ]\t");
            #endif

            // eosio.token's action [transfer] will notify user that user inrevoked by memo
            eosio::action(eosio::permission_level{this->get_self(), "active"_n}, "eosio.token"_n, "transfer"_n,
                std::make_tuple(this->get_self(), to, fItr->fee, memo)).send();
            fItr = fee_table.erase(fItr);
        }
    } else {
        auto fItr = fee_table.find(eosio::symbol_code(symView).raw());
        eosio_assert(fItr != fee_table.end(), hError::error::NOT_FOUND_RECORD.data());
        #ifdef _DEBUG
        eosio::print("\t[subFee => to:", to, ", fee:", fItr->fee, " ]\t");
        #endif

        // eosio.token's action [transfer] will notify user that user inrevoked by memo
        eosio::action(eosio::permission_level{this->get_self(), "active"_n}, "eosio.token"_n, "transfer"_n,
            std::make_tuple(this->get_self(), to, fItr->fee, memo)).send();

        fItr = fee_table.erase(fItr);
    }
}

void htlc::getAsset(uint64_t pid, eosio::asset *pQuantity) {
    eosio::asset balance = *pQuantity - *pQuantity;

    assets asset_table(get_self(), pid);
    auto aItr = asset_table.find(pQuantity->symbol.code().raw());

    if (aItr != asset_table.end()) {
        balance = aItr->balance;
    }
    pQuantity->set_amount(balance.amount);
    eosio::print("\t[getAsset => balance:", *pQuantity, "]\t");
}

void htlc::getPendDebtAsset(uint64_t pid, eosio::asset *pQuantity) {

    debts debt_table(get_self(), get_self().value);
    uint128_t symPidKey = common::makeU128(pQuantity->symbol.code().raw(), pid);
    auto dSymPidIndex = debt_table.get_index<eosio::name(hIndex::index::sym_pid)>();
    auto dItr = dSymPidIndex.find(symPidKey);
    #ifdef _DEBUG
    eosio::print("\t[getPendDebtAsset => pid: ", pid, " => symPidKey:", symPidKey, "]\t");
    #endif

    if (dItr != dSymPidIndex.end()) {
        eosio::asset lockedBalance = dItr->quantity - dItr->quantity;
        pQuantity->set_amount(lockedBalance.amount);

        do {
            lockedBalance += dItr->quantity;
            ++dItr;
        } while(dItr != dSymPidIndex.end());

        pQuantity->set_amount(lockedBalance.amount);
        #ifdef _DEBUG
        eosio::print("\t[getPendDebtAsset => balance:", lockedBalance, "]\t");
        #endif
    }
}

void htlc::getOutPendAsset(uint64_t pid, eosio::asset *pQuantity) {
    eosio::asset outlockBalance = *pQuantity - *pQuantity;
    eosio::asset debtBalance = outlockBalance;

    getPendAsset(pid, &outlockBalance, hStatus::status::outlock);
    getPendDebtAsset(pid, &debtBalance);

    eosio::asset totalBalance = outlockBalance + debtBalance;
    pQuantity->set_amount(totalBalance.amount);
}

void htlc::getPendAsset(uint64_t pid, eosio::asset *pQuantity, std::string_view statusView) {
    /* check if outlock asset overflow */
    uint128_t symPidKey = common::makeU128(pQuantity->symbol.code().raw(), pid);
    // uint128_t symPidKey = static_cast<uint128_t>(pQuantity->symbol.code().raw()) << 64 | static_cast<uint128_t>(static_cast<uint128_t>(pid));
    transfers transfers_table(get_self(), get_self().value);
    auto tSymPidIndex = transfers_table.get_index<eosio::name(hIndex::index::sym_pid)>();
    auto tItr = tSymPidIndex.find(symPidKey);
    #ifdef _DEBUG
    eosio::print("\t[getPendAsset => pid: ", pid, ", statusView:", static_cast<std::string>(statusView), \
        ", symPidKey:", symPidKey, "]\t");
    #endif

    if (tItr != tSymPidIndex.end()) {
        eosio::asset lockedBalance = tItr->quantity - tItr->quantity;
        pQuantity->set_amount(lockedBalance.amount);

        do {
            if (eosio::name(tItr->status).value == eosio::name(statusView).value) {
                lockedBalance += tItr->quantity;
            }
            ++tItr;
        } while(tItr != tSymPidIndex.end());
        pQuantity->set_amount(lockedBalance.amount);

        #ifdef _DEBUG
        eosio::print("\t[getPendAsset => balance:", lockedBalance, "]\t");
        #endif
    }
}

eosio::asset htlc::stringToAsset(std::string_view qStr) {
    /* parse quantity */
    std::vector<std::string_view> vQuantity;
    common::split(qStr, ' ', vQuantity);
    std::string_view qSym = vQuantity[1];
    std::vector<std::string_view> vQAmount;
    common::split(vQuantity[0], '.', vQAmount);
    uint64_t qInteger = std::atoll(vQAmount[0].data());
    uint64_t qDecimal = std::atoll(vQAmount[1].data());
    uint64_t qPrecision = vQAmount[1].size();
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

void htlc::confirmLock(uint64_t pid, std::string_view statusView, const eosio::name &user, const eosio::asset &quantity) {

    switch (eosio::name(statusView).value) {
        case eosio::name(hStatus::status::inlock).value: {
            break;
        }
        case eosio::name(hStatus::status::outlock).value: {
            /* check if pk outlock asset overflow */
            eosio::asset pkQuantity = quantity - quantity;
            getAsset(pid, &pkQuantity);
            eosio_assert(pkQuantity >= quantity, hError::error::NOE_ENOUGH_QUANTITY.data());

            eosio::asset outPendQuantity = quantity - quantity;
            getPendAsset(pid, &outPendQuantity, hStatus::status::outlock);
            eosio_assert((outPendQuantity + quantity) <= pkQuantity, \
                hError::error::NOE_ENOUGH_QUANTITY.data());

            break;
        }
        default:
            eosio_assert(false, hError::error::INVALID_STATUS.data());
    }

}

void htlc::lockHTLCTx(const eosio::name &user, const eosio::asset &quantity, std::string_view xHashView, std::string_view wanAddrView, \
    std::string_view pkView, std::string_view statusView, bool isOriginator) {

    uint64_t pid = savePk(pkView);
    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t[lockHTLCTx => pks => id:", pid, "]\t");
    #endif
    confirmLock(pid, statusView, user, quantity);

    eosio::checksum256 xHashValue = parseXHash(xHashView);

    transfers transfers_table(get_self(), get_self().value);
    // check if xHash exists
    auto tXHashIndex = transfers_table.get_index<eosio::name(hIndex::index::xHash)>();
    auto tItr = tXHashIndex.find(xHashValue);
    eosio_assert(tItr == tXHashIndex.end(), hError::error::REDUPLICATIVE_XHASH.data());

    transfers_table.emplace(get_self(), [&](auto &s) {
        s.beginTime = eosio::time_point_sec(now());
        s.lockedTime = isOriginator ? hTime::doubleLockedTime : hTime::lockedTime;
        s.status = static_cast<std::string>(statusView);
        s.id = transfers_table.available_primary_key();
        s.user = user;
        s.pid = pid;
        s.quantity = quantity;
        s.xHash = xHashValue;
        s.wanAddr = static_cast<std::string>(wanAddrView);

        #ifdef _DEBUG
        eosio::print("\t[lockHTLCTx => beginTime:", s.beginTime.sec_since_epoch(), ", lockedTime:", s.lockedTime, \
            ", status:", s.status, ", id:", s.id,", user:", s.user, ", pid:", s.pid, \
            ", quantity:", s.quantity, ", xHash:", s.xHash, ", wanAddr:", s.wanAddr, "]\t");
        #endif
    });
}

void htlc::lockHTLCTx(const eosio::asset &quantity, std::string_view npkView, \
            std::string_view xHashView, std::string_view pkView, \
            std::string_view statusView, bool isOriginator) {

    htlc::pk_t pkInfo;
    eosio_assert(findPK(pkView, &pkInfo), hError::error::NOT_FOUND_RECORD.data());

    uint64_t npid = savePk(npkView);

    #ifdef _DEBUG_LEVEL_1
    eosio::print("\t[lockHTLCTx => pks => id:", pkInfo.id, "]\t");
    eosio::print("\t[lockHTLCTx => pks => npid:", npid, "]\t");
    #endif

    eosio::checksum256 xHashValue = parseXHash(xHashView);

    debts debt_table(get_self(), get_self().value);
    // check if xHash exists
    auto dXHashIndex = debt_table.get_index<eosio::name(hIndex::index::xHash)>();
    auto dItr = dXHashIndex.find(xHashValue);
    eosio_assert(dItr == dXHashIndex.end(), hError::error::REDUPLICATIVE_XHASH.data());

    debt_table.emplace(get_self(), [&](auto &s) {
        s.beginTime = eosio::time_point_sec(now());
        s.lockedTime = isOriginator ? hTime::doubleLockedTime : hTime::lockedTime;
        s.status = static_cast<std::string>(statusView);
        s.id = debt_table.available_primary_key();
        s.pid = pkInfo.id;
        s.npid = npid;
        s.xHash = xHashValue;
        s.quantity = quantity;

        #ifdef _DEBUG
        eosio::print("\t[lockHTLCTx => beginTime:", s.beginTime.sec_since_epoch(), ", lockedTime:", s.lockedTime, \
            ", status:", s.status, ", id:", s.id, ", pid:", s.pid, \
            ", npid:", s.npid, ", xHash:", s.xHash, ", quantity:", s.quantity, "]\t");
        #endif
    });

}

extern "C" {
    void applySigAction(uint64_t receiver, uint64_t code, uint64_t action) {
        auto self = receiver;

        const hSig::sigDdata& unpackData = eosio::unpack_action_data<hSig::sigDdata>();
        eosio_assert(unpackData.from.value == self, hError::error::INVALID_ACTION_FILTER.data());
        #ifdef _DEBUG
        eosio::print("\t[applySigAction=> from->", unpackData.from, ", r->", unpackData.r.data(), \
            ", s->", unpackData.s.data(), ", pk->", unpackData.pk.data(), ", msg->", unpackData.msg.data(), \
            ", memo->", unpackData.memo.data(), "]\t");
        #endif

        switch (eosio::name(unpackData.memo).value) {
            case eosio::name(hStatus::status::inredeem).value: {
                /* eosio::execute_action invoke (inline action) */
                eosio::execute_action(eosio::name(self), eosio::name(code), &htlc::inrdm);
                /* eosio::execute_action invoke (inline action) end */
                break;
            }
            case eosio::name(hStatus::status::outlock).value: {
                /* eosio::execute_action invoke (inline action) */
                eosio::execute_action(eosio::name(self), eosio::name(code), &htlc::outlk);
                /* eosio::execute_action invoke (inline action) end */
                break;
            }
            case eosio::name(hStatus::status::outrevoke).value: {
                /* eosio::execute_action invoke (inline action) */
                eosio::execute_action(eosio::name(self), eosio::name(code), &htlc::outrvk);
                /* eosio::execute_action invoke (inline action) end */
                break;
            }
            case eosio::name(hStatus::status::withdraw).value: {

                /* eosio::execute_action invoke (inline action) */
                eosio::execute_action(eosio::name(self), eosio::name(code), &htlc::wdr);
                /* eosio::execute_action invoke (inline action) end */
                break;
            }
            case eosio::name(hStatus::status::lockdebt).value: {

                /* eosio::execute_action invoke (inline action) */
                eosio::execute_action(eosio::name(self), eosio::name(code), &htlc::lkdebt);
                /* eosio::execute_action invoke (inline action) end */
                break;
            }
            case eosio::name(hStatus::status::redeemdebt).value: {

                /* eosio::execute_action invoke (inline action) */
                eosio::execute_action(eosio::name(self), eosio::name(code), &htlc::rdmdebt);
                /* eosio::execute_action invoke (inline action) end */
                break;
            }
            case eosio::name(hStatus::status::revokedebt).value: {

                /* eosio::execute_action invoke (inline action) */
                eosio::execute_action(eosio::name(self), eosio::name(code), &htlc::rvkdebt);
                /* eosio::execute_action invoke (inline action) end */
                break;
            }
            case eosio::name(hStatus::status::updatepk).value: {

                /* eosio::execute_action invoke (inline action) */
                eosio::execute_action(eosio::name(self), eosio::name(code), &htlc::updtpk);
                /* eosio::execute_action invoke (inline action) end */
                break;
            }
            case eosio::name(hStatus::status::removepk).value: {

                /* eosio::execute_action invoke (inline action) */
                eosio::execute_action(eosio::name(self), eosio::name(code), &htlc::rmpk);
                /* eosio::execute_action invoke (inline action) end */
                break;
            }
            default: {
                eosio_assert(false, hError::error::INVALID_SIG_MEMO.data());
            }
        }
    }

    void applyTransferAction(uint64_t receiver, uint64_t code, uint64_t action) {
        auto self = receiver;
        /* eosio.token -> transfer */
        /* eosio.token call htlc */
        // unpack action arguments, need check if something wrong happened while eosio::unpack_action_data, would htlc rollback?
        const htlc::transfer_data& unpackData = eosio::unpack_action_data<htlc::transfer_data>();
        // eosio_assert(unpackData.to.value == self, "invalid calling");
        /* transfer(from, to, quantity, memo) */
        /* if to is htlc, need to process */
        if (unpackData.to.value == self) {
            #ifdef _DEBUG
            eosio::print("\t[applyTransferAction => from:", unpackData.from, ", to:", unpackData.to, \
                ", quantity:", unpackData.quantity, ", memo size:", unpackData.memo.size(), \
                ", tMemo::mSize::min:", tMemo::mSize::min, \
                ", tMemo::mSize::max:", tMemo::mSize::max, "]\t");
            #endif

            // optimize code for getting status
            std::string status;
            common::split(unpackData.memo, tMemo::separator, tMemo::index::status, status);
            #ifdef _DEBUG
            eosio::print("\t[parse memo for status:", status.data(), ", size:", status.size(), \
                ", status.value:", eosio::name(status).value, "]\t");
            #endif
            if(status.size() > 0){

                switch (eosio::name(status).value) {
                    case eosio::name(hStatus::status::inlock).value: {
                        /// memo max size <= 256 bytes by eosio.token transfer, status:xHash:wanAddr:pk
                        eosio_assert(unpackData.memo.size() >= tMemo::mSize::min and \
                            unpackData.memo.size() <= tMemo::mSize::max, hError::error::INVALID_MEMO.data());

                        eosio::execute_action(eosio::name(self), eosio::name(code), &htlc::inlock);
                        break;
                    }
                    // default: {
                    //     /* the action such as sellram will enter here, and will interrupt those actions, so delete */
                    //     eosio_assert(false, "invalid status, it should be one of [inlock, inredeem, inrevoke, outlock, outredeem, outrevoke]");
                    // }
                }
            }
        }
    }
}

extern "C" void apply(uint64_t receiver, uint64_t code, uint64_t action) {

    #ifdef _DEBUG
    eosio::print("\t[C Api => apply running => receiver:", eosio::name(receiver), ", code:", eosio::name(code), \
        ", action:", eosio::name(action), "]\t");
    #endif

    eosio_assert(action != "onerror"_n.value, hError::error::SYSTEM_ERROR.data());

    auto self = receiver;
    htlc::signature_t sigInfo;

    htlc _htlc(eosio::name(receiver), eosio::name(code), eosio::datastream<const char *>(nullptr, 0));
    #ifdef USING_LISTENER
    // if (_htlc.getSignature(&sigInfo) and code == sigInfo.code.value and action == sigInfo.action.value) {
    //     #ifdef _DEBUG
    //     eosio::print("signature => ACTION");
    //     #endif
    //     /* hSig verify trigger htlc action */
    //     /* inrdm outlk outrvk */
    //     /* Originator is storemanAgent */
    //     applySigAction(receiver, code, action);
    // } else {
    //     std::vector<htlc::listen_t> vListen;
    //     if (_htlc.getListenInfo(vListen)) {
    //         while 
    //         if (code == "eosio.token"_n.value and action == "transfer"_n.value) {
    //             #ifdef _DEBUG
    //             eosio::print("eosio.token => ACTION");
    //             #endif
    //             /* eosio.token transfer trigger htlc action */
    //             /* inlock */
    //             /* Originator is user wallet */
    //             applyTransferAction(receiver, code, action);
    //         }
    //     } else {
    //         #ifdef _DEBUG
    //         eosio::print("COMMON ACTION");
    //         #endif
    //         /* call common htlc action */
    //         switch (action) {
    //             EOSIO_DISPATCH_HELPER(htlc, (inredeem)(inrevoke)(outlock)(outredeem)(outrevoke)(withdraw)\
    //                 (lockdebt)(redeemdebt)(revokedebt)(regsig)(updatesig)(unregsig)(updatepk)(removepk)\
    //                 (truncate)(leftlocktime))
    //         }
    //     }
    // }
    #else
    if (_htlc.getSignature(&sigInfo) and code == sigInfo.code.value and action == sigInfo.action.value) {
        #ifdef _DEBUG
        eosio::print("signature => ACTION");
        #endif
        /* hSig verify trigger htlc action */
        /* inrdm outlk outrvk */
        /* Originator is storemanAgent */
        applySigAction(receiver, code, action);
    } else if (code == "eosio.token"_n.value and action == "transfer"_n.value) {
        #ifdef _DEBUG
        eosio::print("eosio.token => ACTION");
        #endif
        /* eosio.token transfer trigger htlc action */
        /* inlock */
        /* Originator is user wallet */
        applyTransferAction(receiver, code, action);
    } else {
        #ifdef _DEBUG
        eosio::print("COMMON ACTION");
        #endif
        /* call common htlc action */
        switch (action) {
            EOSIO_DISPATCH_HELPER(htlc, (inredeem)(inrevoke)(outlock)(outredeem)(outrevoke)(withdraw)\
                (lockdebt)(redeemdebt)(revokedebt)(regsig)(updatesig)(unregsig)(updatepk)(removepk)\
                (truncate)(leftlocktime)(kk))
        }
    }
    #endif
}

} // namespace htlc

#endif