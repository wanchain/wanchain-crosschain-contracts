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

	ACTION htlc::printratio() {
		longlongs ll_table(get_self(), get_self().value);
		auto lItr = ll_table.find(hTable::key::ratio.value);
		eosio::check(lItr != ll_table.end(), hError::error::NOT_FOUND_RECORD.data());

#ifdef _DEBUG_PRINT
		eosio::print("\t[printratio => flag:", (*lItr).flag, ", value:", (*lItr).value, "]\t");
#endif
	}

#endif
} // namespace htlc
