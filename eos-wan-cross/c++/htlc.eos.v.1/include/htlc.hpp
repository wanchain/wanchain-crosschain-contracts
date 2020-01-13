#ifndef __HTLC_CONTRACT_H
#define __HTLC_CONTRACT_H

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

	class [[eosio::contract("htlc")]] htlc : public eosio::contract {
	public:
		using contract::contract;

#ifdef _DEBUG_API
		ACTION gethash(std::string value);
		ACTION truncate(eosio::name table, std::string scope);
		ACTION query(eosio::name table, std::string scope);
		ACTION leftlocktime(eosio::name table, std::string xHash);
		ACTION printratio();
#endif

		/// @notice                    type        comment
		/// @param user                name        account name of user initiated the Tx
		/// @param htlc                name        account name of htlc initiated the Tx
		/// @param quantity            asset       exchange quantity
		/// @param memo                string      status(6):xHash(64):wanAddr(40):pk(130):eosTokenAccount(12) => 256 bytes
		ACTION inlock(eosio::name user, eosio::name htlc, eosio::asset quantity, std::string memo);

		/// @notice               		type        comment
		/// @param x              		string      HTLC random number
		ACTION inredeem(std::string x);

		/// @notice               		type        comment
		/// @param xHash          		string      hash of HTLC random number
		ACTION inrevoke(std::string xHash);

		/// @notice               		type        comment
		/// @param user           		name        account name of user initiated the Tx
		/// @param account        		name        token account
		/// @param quantity       		asset       exchange quantity
		/// @param xHash          		string      hash of HTLC random number
		/// @param pk             		string      PK of storeman
		/// @param r              		string      signature
		/// @param s              		string      signature
		ACTION outlock(eosio::name user, eosio::name account, eosio::asset quantity, \
                    std::string xHash, std::string pk, std::string r, std::string s);

		/// @notice               		type        comment
		/// @param user           		name        account name of user initiated the Tx
		/// @param x              		string      HTLC random number
		ACTION outredeem(eosio::name user, std::string x);

		/// @notice               		type        comment
		/// @param xHash          		string      hash of HTLC random number
		ACTION outrevoke(std::string xHash);

		/// @notice               		type        comment
		/// @param account        		string      token account
		/// @param sym            		string      token symbol, format: precision,symbol_code
		/// @param pk             		string      PK of storeman
		/// @param timeStamp      		string      the timestamp to check if receiver expired
		/// @param receiver       		string      account of the receiver
		/// @param r              		string      signature
		/// @param s              		string      signature
		ACTION withdraw(std::string account, std::string sym, std::string pk, std::string timeStamp, \
						eosio::name receiver,std::string r,std::string s);
		
		/* signature verification */
		/// @notice               		type        comment
		/// @param code           		name        the signature verification account
		/// @param action         		name        the signature verification action
		ACTION regsig(eosio::name code, eosio::name action);

		/// @notice               		type        comment
		/// @param code           		name        the signature verification account
		/// @param nCode          		name        the new signature verification account
		/// @param nAction        		name        the new signature verification action
		ACTION updatesig(eosio::name code, eosio::name nCode, eosio::name nAction);

		/// @notice               		type        comment
		/// @param code           		name        the signature verification account
		ACTION unregsig(eosio::name code);

		/* inBound debt */
		/// @notice               		type        comment
		/// @param npk            		string      PK of storeman that the debt receiver
		/// @param account        		name        token account
		/// @param quantity       		asset       exchange quantity
		/// @param xHash          		string      hash of HTLC random number
		/// @param pk             		string      PK of storeman
		/// @param r              		string      signature
		/// @param s              		string      signature
		ACTION lockdebt(std::string npk, eosio::name account, eosio::asset quantity,  std::string xHash, std::string pk, std::string r, std::string s);

		/// @notice               		type        comment
		/// @param x              		string      HTLC random number
		ACTION redeemdebt(std::string x);

		/// @notice               		type        comment
		/// @param xHash          		string      hash of HTLC random number
		ACTION revokedebt(std::string xHash);

		/// @notice               		type        comment
		/// @param ratio          		uint64_t    revoke ratio
		ACTION setratio(uint64_t ratio);


		struct transfer_data {
			eosio::name            from;
			eosio::name            to;
			eosio::asset           quantity;
			std::string            memo;
		};

		/* TABLE signer
		** record the signature verification info,  only one record
		*/
		TABLE signature_t {
				eosio::name                  code;
				eosio::name                  action;

				uint64_t primary_key() const { return code.value; }
		};
		/*
		** notice               		type        comment
		** param sigInfo         		void*       output paramter, signature verification info
		*/
		inline bool getSignature(void *sigInfo);

	private:

		/*****************************************TABLE*****************************************/
		/* TABLE transfers
		** one record for an cross-tx, and the record will be clean while InBound/OutBound
		** eg:
		** inlock   -> TABLE transfers add item (status is inlock, its unique index is xHash)
		** inredeem -> TABLE transfers remove item (status is inlock, its unique index is xHash)
		*/
		TABLE transfer_t {
				uint64_t                     id;
				uint64_t                     pid;
				eosio::asset                 quantity;
				eosio::name                  user;
				time_t                       lockedTime;
				eosio::time_point_sec        beginTime;
				std::string                  status;
				eosio::checksum256           xHash;
				std::string                  wanAddr;
				eosio::name                  account;

				uint64_t primary_key() const { return id; }
				eosio::checksum256 xhash_key() const { return xHash; /* unique */ }
				uint64_t pid_key() const { return pid; }
				uint128_t sym_pid_key() const {
					return static_cast<uint128_t>(quantity.symbol.raw()) << 64 | static_cast<uint128_t>(pid);
				}
				uint128_t sym_status_key() const {
					return static_cast<uint128_t>(quantity.symbol.raw()) << 64 | \
                    static_cast<uint128_t>(eosio::name(status).value);
				}
				uint128_t sym_acct_key() const {
					return static_cast<uint128_t>(quantity.symbol.raw()) << 64 | \
                    static_cast<uint128_t>(account.value);
				}
				uint128_t pid_acct_key() const {
					return static_cast<uint128_t>(pid) << 64 | \
                    static_cast<uint128_t>(account.value);
				}
		};

		/* TABLE pks
		*/
		TABLE pk_t {
				uint64_t                     id;
				eosio::checksum256           pkHash;
				std::string                  pk;

				uint64_t primary_key() const { return id; }
				eosio::checksum256 pkhash_key() const { return pkHash; /* unique */ }
		};

		/* TABLE assets
		** scope pk id from TABLE pks
		*/
		TABLE asset_t {
				uint64_t                     id;
				eosio::name                  account;
				eosio::asset                 balance;

				uint64_t primary_key() const { return id; }
				uint64_t acct_key() const { return account.value; }
				uint64_t sym_key() const { return balance.symbol.raw(); }
				uint128_t sym_acct_key() const {
					return static_cast<uint128_t>(balance.symbol.raw()) << 64 | static_cast<uint128_t>(account.value);
				}
		};

		/* TABLE fees
		** scope pk id from TABLE pks
		*/
		TABLE fee_t {
				uint64_t                     id;
				eosio::asset                 fee;
				eosio::name                  account;
				uint64_t primary_key() const { return id; }
				uint64_t acct_key() const { return account.value; }
				uint64_t sym_key() const { return fee.symbol.raw(); }
				uint128_t sym_acct_key() const {
					return static_cast<uint128_t>(fee.symbol.raw()) << 64 | static_cast<uint128_t>(account.value);
				}
		};

		/* TABLE debts
		** one record for an cross-debt-tx, and the record will be clean while redeemdebt/revokedebt
		** eg:
		** lockdebt   -> TABLE debts add item (status is lockdebt, its unique index is xHash)
		** redeemdebt -> TABLE debts remove item (status is lockdebt, its unique index is xHash)
		*/
		TABLE debt_t {
				uint64_t                     id;
				uint64_t                     pid;
				uint64_t                     npid;
				eosio::name                  account;
				eosio::asset                 quantity;
				eosio::time_point_sec        beginTime;
				time_t                       lockedTime;
				eosio::checksum256           xHash;
				std::string                  status;

				uint64_t primary_key() const { return id; }
				uint64_t pid_key() const { return pid; }
				uint64_t npid_key() const { return npid; }
				uint128_t sym_pid_key() const {
					/* unique */
					return static_cast<uint128_t>(quantity.symbol.raw()) << 64 | static_cast<uint128_t>(pid);
				}
				uint128_t npid_acct_key() const {
					return static_cast<uint128_t>(npid) << 64 | \
                    static_cast<uint128_t>(account.value);
				}
				uint128_t pid_acct_key() const {
					return static_cast<uint128_t>(pid) << 64 | \
                    static_cast<uint128_t>(account.value);
				}
				eosio::checksum256 xhash_key() const { return xHash; /* unique */ }
		};

		/* TABLE tokens
		*/
		TABLE num64_t {
				eosio::name             flag;
				uint64_t                value;

				uint64_t primary_key() const { return flag.value; }
		};

		typedef eosio::multi_index<hTable::table::signer, signature_t> signer;

		typedef eosio::multi_index<hTable::table::longlongs, num64_t> longlongs;

		typedef eosio::multi_index<hTable::table::fees, fee_t
		, eosio::indexed_by<hTable::key::acct, \
                eosio::const_mem_fun<fee_t, uint64_t, &fee_t::acct_key>>
		, eosio::indexed_by<hTable::key::sym_acct, \
                eosio::const_mem_fun<fee_t, uint128_t, &fee_t::sym_acct_key>>
		> fees;

		typedef eosio::multi_index<hTable::table::assets, asset_t
		, eosio::indexed_by<hTable::key::sym_acct, \
                eosio::const_mem_fun<asset_t, uint128_t, &asset_t::sym_acct_key>>
		> assets;

		typedef eosio::multi_index<hTable::table::pks, pk_t
		, eosio::indexed_by<hTable::key::pkHash, \
                eosio::const_mem_fun<pk_t, eosio::checksum256, &pk_t::pkhash_key>>
		> pks;

		typedef eosio::multi_index<hTable::table::transfers, transfer_t
		, eosio::indexed_by<hTable::key::xHash, \
                eosio::const_mem_fun<transfer_t, eosio::checksum256, &transfer_t::xhash_key>>
		, eosio::indexed_by<hTable::key::pid, \
                eosio::const_mem_fun<transfer_t, uint64_t, &transfer_t::pid_key>>
		, eosio::indexed_by<hTable::key::pid_acct, \
                eosio::const_mem_fun<transfer_t, uint128_t, &transfer_t::pid_acct_key>>
		> transfers;

		typedef eosio::multi_index<hTable::table::debts, debt_t
		, eosio::indexed_by<hTable::key::xHash, \
                eosio::const_mem_fun<debt_t, eosio::checksum256, &debt_t::xhash_key>>
		, eosio::indexed_by<hTable::key::pid, \
                eosio::const_mem_fun<debt_t, uint64_t, &debt_t::pid_key>>
		, eosio::indexed_by<hTable::key::npid, \
                eosio::const_mem_fun<debt_t, uint64_t, &debt_t::npid_key>>
		, eosio::indexed_by<hTable::key::pid_acct, \
                eosio::const_mem_fun<debt_t, uint128_t, &debt_t::pid_acct_key>>
		, eosio::indexed_by<hTable::key::npid_acct, \
                eosio::const_mem_fun<debt_t, uint128_t, &debt_t::npid_acct_key>>
		> debts;

		/******************************internal function*******************************************************/

		/*
		** notice               		type          comment
		** param xHashView      		string_view   hash of HTLC random number
		*/
		inline eosio::checksum256 parseXHash(std::string_view xHashView);

		/*
		** notice               		type          comment
		** param symStr         		string_view   symbol string
		*/
		inline eosio::symbol stringToSymbol(std::string_view symStr);

		/*
		** notice               		type          comment
		** param qStr           		string_view   quantity string
		*/
		inline eosio::asset stringToAsset(std::string_view qStr);

		/*
		** notice               		type          comment
		** param ratio          		uint64_t&     output parameter, revoke ratio
		*/
		inline void getRatio(uint64_t &ratio);

		/*
		** notice               		type          comment
		** param pkView         		string_view   PK of storeman
		** param pkHash         		checksum256&  hash of PK
		** param pkInfo         		void*         output parameter, PK info
		*/
		void 	savePk(std::string_view pkView, const eosio::checksum256 &pkHash, void *pkInfo);
		/*
		** notice               		type          comment
		** param pkView         		string_view   PK of storeman
		** param pkInfo         		void*         output parameter, PK info
		*/
		bool 	findPK(std::string_view pkView, void *pkInfo);
		/*
		** notice               		type          comment
		** param pkHash         		checksum256&  hash of PK
		** param pkInfo         		void*         output parameter, PK info
		*/
		bool 	findPK(const eosio::checksum256 &pkHash, void *pkInfo);
		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		** param pkInfo         		void*         output parameter, PK info
		*/
		bool 	findPK(uint64_t pid, void *pkInfo);
		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		*/
		bool 	hasPK(uint64_t pid);
		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		*/
		void 	cleanPk(uint64_t pid);

		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		*/
		bool 	isPkInHtlc(uint64_t pid);

		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		*/
		bool 	isPkDebt(uint64_t pid);
		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		** param account        		name&         token account
		** param sym            		symbol&       token symbol
		*/
		bool 	isPkDebt(uint64_t pid, const eosio::name &account, const eosio::symbol &sym);

		/*
		** notice               		type                           comment
		** param statusView     		statusView                     status
		** param pk             		uint64_t                       PK of storeman
		** param r              		string&                        signature
		** param s              		string&                        signature
		** param v              		vector<std::string_view>&      the messages
		*/
		void	verifySignature(std::string_view statusView, std::string &pk, std::string &r, std::string &s, std::vector<std::string_view> &v);

		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		** param account        		name&         token account
		** param quantity       		asset&        token quantity
		*/
		void 	addAssetTo(uint64_t pid, const eosio::name &account, const eosio::asset &quantity);
		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		** param account        		name&         token account
		** param quantity       		asset&        token quantity
		*/
		void 	subAssetFrom(uint64_t pid, const eosio::name &account, const eosio::asset &quantity);

		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		** param account        		name&         token account
		** param pQuantity      		asset*        output parameter, token quantity
		*/
		void 	getOutPendAssetFrom(uint64_t pid, const eosio::name &account, eosio::asset *pQuantity);
		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		** param account        		name&         token account
		** param pQuantity      		asset*        output parameter, token quantity
		*/
		void 	getPendDebtAssetFrom(uint64_t pid, const eosio::name &account, eosio::asset *pQuantity);
		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		** param account        		name&         token account
		** param pQuantity      		asset*        output parameter, token quantity
		** param status         		string_view   the identified status
		*/
		void 	getHtlcPendAssetFrom(uint64_t pid, const eosio::name &account, eosio::asset *pQuantity, std::string_view status);
		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		** param account        		name&         token account
		** param pQuantity      		asset*        output parameter, token quantity
		*/
		void 	getAssetFrom(uint64_t pid, const eosio::name &account, eosio::asset *pQuantity);
		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		*/
		bool 	existAsset(uint64_t pid);
		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		** param account        		name&         token account
		** param sym            		symbol&       token symbol
		*/
		bool 	existAsset(uint64_t pid, const eosio::name &account, const eosio::symbol &sym);

		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		*/
		bool 	existFee(uint64_t pid);
		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		** param account        		name&         token account
		** param sym            		symbol&       token symbol
		*/
		bool 	existFee(uint64_t pid, const eosio::name &account, const eosio::symbol &sym);
		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		** param account        		name&         token account
		** param fee            		asset&        token quantity
		*/
		void 	addFeeTo(uint64_t pid, const eosio::name &account, const eosio::asset &fee);
		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		** param to             		name&         token receiver
		** param acctView       		string_view   token account, may be empty string
		** param symView        		string_view   token symbol, may be empty string
		** param memo           		string_view   memo for issue fee
		*/
		void 	issueFeeFrom(uint64_t pid, eosio::name to, std::string_view acctView, std::string_view symView, std::string_view memo);

		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		** param user           		name&         account name of user initiated the Tx
		** param account        		name&         token account
		** param quantity       		asset&        token quantity
		** param xHashValue     		checksum256&  hash of HTLC random number
		** param wanAddrView    		string_view   wan address
		*/
		void 	inlockTx(uint64_t pid, const eosio::name &user, const eosio::name &account, const eosio::asset &quantity, \
            		const eosio::checksum256 &xHashValue, std::string_view wanAddrView);
		/*
		** notice               		type          comment
		** param pid            		uint64_t      id of PK
		** param user           		name&         account name of user initiated the Tx
		** param account        		name&         token account
		** param quantity       		asset&        token quantity
		** param xHashValue     		checksum256&  hash of HTLC random number
		*/
		void 	outlockTx(uint64_t pid, const eosio::name &user, const eosio::name &account, const eosio::asset &quantity, \
            		const eosio::checksum256 &xHashValue);
		/*
		** notice               		type          comment
		** param npid           		uint64_t      nid of PK
		** param pid            		uint64_t      id of PK
		** param account        		name&         token account
		** param quantity       		asset&        token quantity
		** param xHashValue     		checksum256&  hash of HTLC random number
		*/
		void 	lockDebtTx(uint64_t npid, uint64_t pid, const eosio::name &account, const eosio::asset &quantity, \
            		const eosio::checksum256 &xHashValue);

		/*
		** notice               		type          comment
		** param hexStr         		string_view   hex string
		** param outValue       		Uint256_t&    output parameter, hex number
		*/
		void 	hexStrToUint256(std::string_view hexStr, internal::Uint256_t &outValue) {
			common::str2Hex(hexStr, (char *)outValue.data, sizeof(outValue));
		}

		/*
		** notice               		type          comment
		** param hexView        		string_view   hex string
		*/
		inline 	eosio::checksum256 hashHexMsg(std::string_view hexView) {
			internal::Uint256_t hexValue;
			hexStrToUint256(hexView, hexValue);
			eosio::checksum256 hashValue = eosio::sha256((char *)hexValue.data, sizeof(hexValue));
#ifdef _DEBUG_PRINT
			eosio::print("\t[hashHexMsg=>hexView:", static_cast<std::string>(hexView), ", hashValue:", hashValue,"]\t");
#endif
			return hashValue;
		}

		/*
		** notice               		type          comment
		** param msgView        		string_view   message string need to hash
		*/
		inline 	eosio::checksum256 hashMsg(std::string_view msgView) {
			return eosio::sha256((char *)msgView.data(), msgView.size());
		}

		/*
		** notice               		type          comment
		** param value          		Uint256_t&    hex number
		*/
		inline 	std::string Uint256ToHexStr(const internal::Uint256_t &value) {
			return common::toHexStr((char *) value.data, sizeof(value));
		}
	};

};
#endif

