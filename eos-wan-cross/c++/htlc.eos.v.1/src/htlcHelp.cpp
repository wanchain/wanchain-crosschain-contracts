namespace htlc {

	/*
	** notice               		type          comment
	** param ratio          		uint64_t&     output parameter, revoke ratio
	*/
	void htlc::getRatio(uint64_t &ratio) {
		longlongs ll_table(get_self(), get_self().value);
		auto lItr = ll_table.find(hTable::key::ratio.value);
		if (lItr == ll_table.end()) {
			ratio = 0;
		} else {
			ratio = (*lItr).value;
		}
	}

	/*
	** notice               		type          comment
	** param xHashView      		string_view   hash of HTLC random number
	*/
	eosio::checksum256 htlc::parseXHash(std::string_view xHashView) {
		eosio::check(xHashView.size() == hLimit::xHash, hError::error::INVALID_XHASH.data());
		internal::Uint256_t xHashValue;
		hexStrToUint256(xHashView, xHashValue);
		std::string_view xHashValueStr = Uint256ToHexStr(xHashValue);
		eosio::check(xHashView.compare(xHashValueStr) == 0, hError::error::INVALID_XHASH.data());
		return xHashValue.data;
	}

	/*
	** notice               		type          comment
	** param symStr         		string_view   symbol string
	*/
	eosio::symbol htlc::stringToSymbol(std::string_view symStr) {
		/* parse quantity */
		std::vector <std::string_view> vSymbol;
		common::split(symStr, hSymbol::separator, vSymbol);
		eosio::check(hSymbol::item::total == vSymbol.size(), "invalid symbol");

		std::string_view precisionView = vSymbol[hSymbol::item::precision];
		std::string_view symCodeView = vSymbol[hSymbol::item::symCode];
		uint64_t precision = std::atoll(precisionView.data());
		eosio::symbol sym(eosio::symbol_code(symCodeView), precision);

		return sym;
	}

	/*
	** notice               		type          comment
	** param qStr           		string_view   quantity string
	*/
	eosio::asset htlc::stringToAsset(std::string_view qStr) {
		/* parse quantity */
		std::vector <std::string_view> vQuantity;
		common::split(qStr, hAsset::separator, vQuantity);
		eosio::check(hAsset::item::total == vQuantity.size(), "invalid asset");

		std::string_view qSym = vQuantity[hAsset::item::symCode];
		std::vector <std::string_view> vQAmount;
		common::split(vQuantity[hAsset::item::value], hAsset::dot, vQAmount);
		eosio::check(hAsset::item::total >= vQAmount.size(), "invalid asset");

		uint64_t qInteger = std::atoll(vQAmount[hAsset::amount::integer].data());
		uint64_t qDecimal =
				vQAmount.size() == hAsset::amount::total ? std::atoll(vQAmount[hAsset::amount::decimal].data()) : 0;
		uint64_t qPrecision = vQAmount.size() == hAsset::amount::decimal ? vQAmount[1].size() : 0;
		uint64_t count = qPrecision;
		uint64_t p10 = 1;

		while (count > 0) {
			p10 *= 10;
			--count;
		}

		uint64_t qAmount = qInteger * p10 + qDecimal;
		eosio::asset quantity(qAmount, eosio::symbol(eosio::symbol_code(qSym), qPrecision));
		return quantity;
	}

	/*
	** notice               		type        comment
	** param sigInfo         		void*       output paramter, signature verification info
	*/
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

	/*
	** notice               		type          comment
	** param pkView         		string_view   PK of storeman
	** param pkHash         		checksum256&  hash of PK
	** param pkInfo         		void*         output parameter, PK info
	*/
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
		});
	}

	/*
	** notice               		type          comment
	** param pkView         		string_view   PK of storeman
	** param pkInfo         		void*         output parameter, PK info
	*/
	bool htlc::findPK(std::string_view pkView, void *pkInfo) {
		/* get the pks contract info */
		eosio::check(pkInfo != nullptr, hError::error::INVALID_PARAM.data());


		eosio::checksum256 pkHash = hashMsg(pkView);
		return findPK(pkHash, pkInfo);

		// /* find from pks table by hashMsg(pk) */
		// pks pk_table(get_self(), get_self().value);
		// auto pkHashTable = pk_table.get_index<hTable::key::pkHash>();
		// auto pItr = pkHashTable.find(pkHash);
		// if (pItr == pkHashTable.end()) {
		// 	return false;
		// }

		// static_cast<pk_t *>(pkInfo)->id = pItr->id;
		// static_cast<pk_t *>(pkInfo)->pkHash = pItr->pkHash;
		// static_cast<pk_t *>(pkInfo)->pk = pItr->pk;

		// return true;
	}

	/*
	** notice               		type          comment
	** param pkHash         		checksum256&  hash of PK
	** param pkInfo         		void*         output parameter, PK info
	*/
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

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	** param pkInfo         		void*         output parameter, PK info
	*/
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

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	*/
	bool htlc::hasPK(uint64_t pid) {
		/* find from pks table by pid */
		pks pk_table(get_self(), get_self().value);
		auto pItr = pk_table.find(pid);
		return pItr != pk_table.end();
	}

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	*/
	void htlc::cleanPk(uint64_t pid) {
		if (existAsset(pid) or existFee(pid) or isPkInHtlc(pid) or isPkDebt(pid)) {
			return;
		}

		/* clean pk from table pks */
		pks pk_table(get_self(), get_self().value);
		auto pItr = pk_table.find(pid);
		if (pItr != pk_table.end()) {
			pItr = pk_table.erase(pItr);
		}
	}

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	*/
	bool htlc::isPkInHtlc(uint64_t pid) {
		bool isBusy = false;

		transfers transfers_table(get_self(), get_self().value);
		auto tPidIndex = transfers_table.get_index<hTable::key::pid>();
		auto tItr = tPidIndex.find(pid);

		isBusy = (tItr != tPidIndex.end());
		return isBusy;
	}

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	*/
	bool htlc::isPkDebt(uint64_t pid) {
		bool isBusy = false;

		debts debt_table(get_self(), get_self().value);
		// check debts table if pid exists
		auto dPidIndex = debt_table.get_index<hTable::key::pid>();
		auto dItr = dPidIndex.find(pid);
		isBusy = (dItr != dPidIndex.end());
		return isBusy;
	}

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	** param account        		name&         token account
	** param sym            		symbol&       token symbol
	*/
	bool htlc::isPkDebt(uint64_t pid, const eosio::name &account, const eosio::symbol &sym) {
		bool isBusy = false;

		debts debt_table(get_self(), get_self().value);
		// check debts table if pid exists
		uint128_t pidAcctKey = common::makeU128(pid, account.value);
		auto dPidAcctIndex = debt_table.get_index<hTable::key::pid_acct>();
		auto dItr = dPidAcctIndex.find(pidAcctKey);

		while(dItr != dPidAcctIndex.end()){
			if (sym.raw() == dItr->quantity.symbol.raw()) {
				isBusy = true;
				break;
			}
			++dItr;
		}
		return isBusy;
	}

	/*
	** notice               		type                           comment
	** param statusView     		statusView                     status
	** param pk             		uint64_t                       PK of storeman
	** param r              		string&                        signature
	** param s              		string&                        signature
	** param v              		vector<std::string_view>&      the messages
	*/
	void htlc::verifySignature(std::string_view statusView, std::string &pk, std::string &r, std::string &s, std::vector<std::string_view> &v) {
		/* signature verification */
		// make action data
		std::string actionData;
		std::string encodedActionData;

		actionData = common::join(v, tMemo::separator);

		crypto::base64::encode(const_cast<char *>(actionData.data()), actionData.size(), encodedActionData);

		// call signature contract to check mpc signature
		signature_t sigInfo;
		eosio::check(getSignature(&sigInfo), hError::error::NOT_FOUND_SIGNATURE_RECORD.data());

		eosio::action(eosio::permission_level{this->get_self(), hPermission::level::active}, sigInfo.code,
					  sigInfo.action,
					  std::make_tuple(this->get_self(), r, s, pk, encodedActionData,
									  static_cast<std::string>(statusView))).send();
	}

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	** param account        		name&         token account
	** param quantity       		asset&        token quantity
	*/
	void htlc::addAssetTo(uint64_t pid, const eosio::name &account, const eosio::asset &quantity) {
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
			});
		} else {
			aSymAcctIndex.modify(aItr, get_self(), [&](auto &s) {
				s.balance += quantity;
			});
		}
	}

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	** param account        		name&         token account
	** param quantity       		asset&        token quantity
	*/
	void htlc::subAssetFrom(uint64_t pid, const eosio::name &account, const eosio::asset &quantity) {
		/* sub table assets */
		uint128_t symAcctKey = common::makeU128(quantity.symbol.raw(), account.value);
		assets asset_table(get_self(), pid);
		auto aSymAcctIndex = asset_table.get_index<hTable::key::sym_acct>();
		auto aItr = aSymAcctIndex.find(symAcctKey);
		eosio::check(aItr != aSymAcctIndex.end() and (aItr->balance >= quantity),
					 hError::error::NOE_ENOUGH_QUANTITY.data());

		if (aItr->balance == quantity) {
			aItr = aSymAcctIndex.erase(aItr);
		} else {
			aSymAcctIndex.modify(aItr, get_self(), [&](auto &s) {
				s.balance -= quantity;
			});
		}
	}

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	** param account        		name&         token account
	** param pQuantity      		asset*        output parameter, token quantity
	*/
	void htlc::getAssetFrom(uint64_t pid, const eosio::name &account, eosio::asset *pQuantity) {
		eosio::asset balance(0, (*pQuantity).symbol);

		uint128_t symAcctKey = common::makeU128((*pQuantity).symbol.raw(), account.value);
		assets asset_table(get_self(), pid);
		auto aSymAcctIndex = asset_table.get_index<hTable::key::sym_acct>();
		auto aItr = aSymAcctIndex.find(symAcctKey);

		if (aItr != aSymAcctIndex.end()) {
			balance = aItr->balance;
		}
		(*pQuantity).set_amount(balance.amount);
	}

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	** param account        		name&         token account
	** param pQuantity      		asset*        output parameter, token quantity
	*/
	void htlc::getPendDebtAssetFrom(uint64_t pid, const eosio::name &account, eosio::asset *pQuantity) {

		debts debt_table(get_self(), get_self().value);
		uint128_t pidAcctKey = common::makeU128(pid, account.value);
		auto dPidAcctIndex = debt_table.get_index<hTable::key::pid_acct>();
		auto dItr = dPidAcctIndex.find(pidAcctKey);

		eosio::asset lockedBalance(0, (*pQuantity).symbol);
		while (dItr != dPidAcctIndex.end()) {
			if (dItr->quantity.symbol == (*pQuantity).symbol) {
				lockedBalance += dItr->quantity;
			}
			++dItr;
		}
		pQuantity->set_amount(lockedBalance.amount);
	}

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	** param account        		name&         token account
	** param pQuantity      		asset*        output parameter, token quantity
	*/
	void htlc::getOutPendAssetFrom(uint64_t pid, const eosio::name &account, eosio::asset *pQuantity) {
		eosio::asset debtBalance(0, (*pQuantity).symbol);
		eosio::asset outlockBalance(0, (*pQuantity).symbol);

		getHtlcPendAssetFrom(pid, account, &outlockBalance, hStatus::status::outlock);
		getPendDebtAssetFrom(pid, account, &debtBalance);

		eosio::asset totalBalance = outlockBalance + debtBalance;
		pQuantity->set_amount(totalBalance.amount);
	}

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	** param account        		name&         token account
	** param pQuantity      		asset*        output parameter, token quantity
	** param status         		string_view   the identified status
	*/
	void htlc::getHtlcPendAssetFrom(uint64_t pid, const eosio::name &account, eosio::asset *pQuantity,
									std::string_view statusView) {
		/* check if outlock asset overflow */
		uint128_t pidAcctKey = common::makeU128(pid, account.value);
		transfers transfers_table(get_self(), get_self().value);
		auto tPidAcctIndex = transfers_table.get_index<hTable::key::pid_acct>();
		auto tItr = tPidAcctIndex.find(pidAcctKey);
		eosio::asset lockedBalance(0, (*pQuantity).symbol);
		eosio::name status = eosio::name(statusView);

		while (tItr != tPidAcctIndex.end()) {
			if (eosio::name(tItr->status) == status and tItr->quantity.symbol == (*pQuantity).symbol) {
				lockedBalance += tItr->quantity;
			}
			++tItr;
		}
		(*pQuantity).set_amount(lockedBalance.amount);

	}

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	*/
	bool htlc::existAsset(uint64_t pid) {
		/* check if asset exists */
		assets asset_table(get_self(), pid);
		return (asset_table.begin() != asset_table.end());
	}

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	** param account        		name&         token account
	** param sym            		symbol&       token symbol
	*/
	bool htlc::existAsset(uint64_t pid, const eosio::name &account, const eosio::symbol &sym) {
		/* check if asset exists */
		assets asset_table(get_self(), pid);
		uint128_t symAcctKey = common::makeU128(sym.raw(), account.value);
		auto aSymAcctIndex = asset_table.get_index<hTable::key::sym_acct>();
		auto aItr = aSymAcctIndex.find(symAcctKey);
		return (aItr != aSymAcctIndex.end());
	}

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	*/
	bool htlc::existFee(uint64_t pid) {
		/* check if fees exists */
		fees fee_table(get_self(), pid);
		return (fee_table.begin() != fee_table.end());
	}

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	** param account        		name&         token account
	** param sym            		symbol&       token symbol
	*/
	bool htlc::existFee(uint64_t pid, const eosio::name &account, const eosio::symbol &sym) {
		/* check if fees exists */

		fees fee_table(get_self(), pid);
		uint128_t symAcctKey = common::makeU128(sym.raw(), account.value);
		auto fSymAcctIndex = fee_table.get_index<hTable::key::sym_acct>();
		auto fItr = fSymAcctIndex.find(symAcctKey);
		return (fItr != fSymAcctIndex.end());
	}

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	** param account        		name&         token account
	** param fee            		asset&        token quantity
	*/
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
			});
		} else {
			fSymAcctIndex.modify(fItr, get_self(), [&](auto &s) {
				s.fee += fee;
			});
		}
	}

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	** param to             		name&         token receiver
	** param acctView       		string_view   token account, may be empty string
	** param symView        		string_view   token symbol, may be empty string
	** param memo           		string_view   memo for issue fee
	*/
	void htlc::issueFeeFrom(uint64_t pid, eosio::name to, std::string_view acctView, std::string_view symView,
							std::string_view memoView) {
		/* sub table fees */

		fees fee_table(get_self(), pid);

		if (acctView.empty()) {
			auto fItr = fee_table.begin();
			while (fItr != fee_table.end()) {
				auto account = fItr->account;
				auto fee = fItr->fee;
				fItr = fee_table.erase(fItr);

				// eosio.token's action [transfer] will notify user that user inrevoked by memo
				eosio::action(eosio::permission_level{this->get_self(), hPermission::level::active}, account,
							  TRANSFER_NAME,
							  std::make_tuple(this->get_self(), to, fee,
											  static_cast<std::string>(memoView))).send();
			}
			return;
		}

		eosio::name account = eosio::name(acctView);
		eosio::check(eosio::is_account(eosio::name(account)) and eosio::name(account) != get_self(),
					 hError::error::INVALID_TOKEN_ACCOUNT.data());

		if (symView.empty()) {
			auto fAcctIndex = fee_table.get_index<hTable::key::acct>();
			auto fItr = fAcctIndex.find(account.value);
			while (fItr != fAcctIndex.end()) {
				auto fee = fItr->fee;
				fItr = fAcctIndex.erase(fItr);

				eosio::action(eosio::permission_level{this->get_self(), hPermission::level::active}, account,
							  TRANSFER_NAME,
							  std::make_tuple(this->get_self(), to, fee,
											  static_cast<std::string>(memoView))).send();
			}
			return;
		}

		{
			eosio::symbol sym = stringToSymbol(symView);
			uint128_t symAcctKey = common::makeU128(sym.raw(), account.value);
			auto fSymAcctIndex = fee_table.get_index<hTable::key::sym_acct>();
			auto fItr = fSymAcctIndex.find(symAcctKey);
			eosio::check(fItr != fSymAcctIndex.end(), hError::error::NOT_FOUND_RECORD.data());

			// eosio.token's action [transfer] will notify user that user inrevoked by memo
			auto fee = fItr->fee;
			fItr = fSymAcctIndex.erase(fItr);

			eosio::action(eosio::permission_level{this->get_self(), hPermission::level::active}, account, TRANSFER_NAME,
						  std::make_tuple(this->get_self(), to, fee, static_cast<std::string>(memoView))).send();
			return;
		}
	}

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	** param user           		name&         account name of user initiated the Tx
	** param account        		name&         token account
	** param quantity       		asset&        token quantity
	** param xHashValue     		checksum256&  hash of HTLC random number
	** param wanAddrView    		string_view   wan address
	*/
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

		});
	}

	/*
	** notice               		type          comment
	** param pid            		uint64_t      id of PK
	** param user           		name&         account name of user initiated the Tx
	** param account        		name&         token account
	** param quantity       		asset&        token quantity
	** param xHashValue     		checksum256&  hash of HTLC random number
	*/
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
		});
	}

	/*
	** notice               		type          comment
	** param npid           		uint64_t      nid of PK
	** param pid            		uint64_t      id of PK
	** param account        		name&         token account
	** param quantity       		asset&        token quantity
	** param xHashValue     		checksum256&  hash of HTLC random number
	*/
	void htlc::lockDebtTx(uint64_t npid, uint64_t pid, const eosio::name &account, const eosio::asset &quantity, \
    const eosio::checksum256 &xHashValue) {

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
		});
	}

} // namespace htlc