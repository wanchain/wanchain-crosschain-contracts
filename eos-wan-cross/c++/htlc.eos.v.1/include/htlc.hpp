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

#define _DEBUG_HTLC
#define _DEBUG_PRINT
#define _DEBUG_API
// #define _SIGN_MSG_DETAIL

namespace htlc {

	//class [[eosio::contract("htlc.eos.v.1")]] htlc : public eosio::contract {
	class [[eosio::contract("htlc")]] htlc : public eosio::contract {
	public:
		using contract::contract;

#ifdef _DEBUG_API
		ACTION gethash(std::string value);
		ACTION truncate(eosio::name table, std::string scope);
		ACTION query(eosio::name table, std::string scope);
		ACTION leftlocktime(eosio::name table, std::string xHash);
#endif

		/// @notice                    type        comment
		/// @param user                name        account name of user initiated the Tx
		/// @param quantity            asset       exchange quantity
		/// @param memo                string      status(6):xHash(64):wanAddr(40):pk(130):eosTokenAccount(12) => 256 bytes
		// / @param memo                string      status(6):xHash(64):wanAddr(42):pk(130) => 245 bytes
		/// @param xHash               string      status(6):xHash(64):wanAddr(42):pk(130) => 245 bytes
		/// @param wanAddr             string      origin chain address(42)
		/// @param pk                  string      storemanAgent pk
		/// coin flow: user -> htlc
		/// memo max size <= 256 bytes by eosio.token transfer
		// ACTION inlock(eosio::name user, eosio::asset quantity, std::string xHash, std::string wanAddr, std::string pk);
		ACTION inlock(eosio::name user, eosio::name htlc, eosio::asset quantity, std::string memo);

		/// @notice               type        comment
		/// @param user           name        account name of user initiated the Tx
		/// @param storeman  name        storeman account name
		/// @param xHash          string      hash of HTLC random number
		/// @param x              string      HTLC random number
		ACTION inredeem(eosio::name storeman, std::string x, std::string r, std::string s);

		/// @notice               type        comment
		/// @param user           name        account name of user initiated the Tx
		/// @param xHash          string      hash of HTLC random number
		/// memo                  string      status(8):xHash(64):pk(130):eosTokenAccount(12) => 256 bytes
		ACTION inrevoke(std::string xHash);

		/// @notice               type        comment
		/// @param user           name        account name of user initiated the Tx
		/// @param storeman  name        storeman account name
		/// @param quantity       asset       exchange quantity
		/// @param memo           string      xHash:wanAddr:user:status
		/// TOKEN locked in htlc
		/// memo => xHash(64):wanAddr(42):r(65):s(65):status(7) => 247Bytes
		ACTION outlock(eosio::name storeman, eosio::name user, eosio::name account, eosio::asset quantity, \
                    std::string xHash, std::string pk, std::string r, std::string s);

		/// @notice               type        comment
		/// @param user           name        account name of user initiated the Tx
		/// @param storeman  name        storeman account name
		/// @param xHash          string      hash of HTLC random number
		/// @param x              string      HTLC random number
		ACTION outredeem(eosio::name user, std::string x);

		/// @notice               type        comment
		/// @param xHash          string      hash of HTLC random number
		ACTION outrevoke(std::string xHash);


		/// @param sym          string      precision,symbol_code
		ACTION withdraw(eosio::name storeman, std::string account, std::string sym, std::string pk, std::string r, std::string s);

		/* signature contract */
		ACTION regsig(eosio::name code, eosio::name action);
		ACTION updatesig(eosio::name code, eosio::name nCode, eosio::name nAction);
		ACTION unregsig(eosio::name code);

		/* updatePK */
		ACTION updatepk(eosio::name storeman, std::string npk, std::string pk, std::string r, std::string s);

		ACTION removepk(eosio::name storeman, std::string pk, std::string r, std::string s);

		/* debt storeman like inlock */
		/// memo => xHash(64):wanAddr(42):r(65):s(65):status(7) => 247Bytes
		ACTION lockdebt(eosio::name storeman, eosio::name account, eosio::asset quantity, std::string npk, std::string xHash, std::string pk, std::string r, std::string s);

		ACTION redeemdebt(eosio::name storeman, std::string x, std::string r, std::string s);

		ACTION revokedebt(std::string xHash, std::string r, std::string s);

		ACTION setratio(uint64_t ratio);
#ifdef _DEBUG_API
		ACTION printratio();
#endif

		struct transfer_data {
			eosio::name            from;
			eosio::name            to;
			eosio::asset           quantity;
			std::string            memo;
		};

		/* only one record */
		TABLE signature_t {
				eosio::name                  code;
				eosio::name                  action;

				uint64_t primary_key() const { return code.value; }
		};
		inline bool getSignature(void *sigInfo);

	private:

		/*****************************************TABLE*****************************************/
		/* TABLE transfers
		** one record for an cross-tx, and the record will be clean while InBound/OutBound
		** eg
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
		** eg
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
		** scope code.value from TABLE accounts
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
		/***************************************************************************************/

		inline eosio::checksum256 parseXHash(std::string_view xHashView);

		inline eosio::symbol stringToSymbol(std::string_view symStr);
		inline eosio::asset stringToAsset(std::string_view qStr);

		inline void getRatio(uint64_t &ratio);

		void cleanTokens(uint64_t codeId);

		void savePk(std::string_view pkView, const eosio::checksum256 &pkHash, void *pkInfo);
		bool findPK(std::string_view pkView, void *pkInfo);
		bool findPK(const eosio::checksum256 &pkHash, void *pkInfo);
		bool findPK(uint64_t pid, void *pkInfo);
		bool hasPK(uint64_t pid);
		void cleanPk(uint64_t pid);

		bool isPkInHtlc(uint64_t pid);

		bool isPkDebt(uint64_t pid);
		bool isPkDebt(std::string_view pkView);
		bool isPkDebt(std::string_view pkView, const eosio::name &account, const eosio::symbol &sym);
		bool isPkDebt(uint64_t pid, const eosio::name &account, const eosio::symbol &sym);

		bool isNPkDebt(uint64_t pid);
		bool isNPkDebt(std::string_view pkView);
		bool isNPkDebt(std::string_view pkView, const eosio::name &account, const eosio::symbol &sym);
		bool isNPkDebt(uint64_t pid, const eosio::name &account, const eosio::symbol &sym);

		void verifySignature(std::string_view statusView, std::string &pk, std::string &r, std::string &s, \
            uint64_t size, std::string_view *msg, ...);

		void addAssetTo(uint64_t pid, const eosio::name &account, const eosio::asset &quantity);
		void subAssetFrom(uint64_t pid, const eosio::name &account, const eosio::asset &quantity);

		void getOutPendAssetFrom(uint64_t pid, const eosio::name &account, eosio::asset *pQuantity);
		void getPendDebtAssetFrom(uint64_t pid, const eosio::name &account, eosio::asset *pQuantity);
		void getHtlcPendAssetFrom(uint64_t pid, const eosio::name &account, eosio::asset *pQuantity, std::string_view status);
		void getAssetFrom(uint64_t pid, const eosio::name &account, eosio::asset *pQuantity);
		bool existAsset(uint64_t pid);
		bool existAsset(uint64_t pid, const eosio::name &account, const eosio::symbol &sym);

		bool existFee(uint64_t pid);
		bool existFee(uint64_t pid, const eosio::name &account, const eosio::symbol &sym);
		void addFeeTo(uint64_t pid, const eosio::name &account, const eosio::asset &fee);
		void issueFeeFrom(uint64_t pid, eosio::name to, std::string_view acctView, std::string_view symView, std::string_view memo);

		void inlockTx(uint64_t pid, const eosio::name &user, const eosio::name &account, const eosio::asset &quantity, \
            const eosio::checksum256 &xHashValue, std::string_view wanAddrView);
		void outlockTx(uint64_t pid, const eosio::name &user, const eosio::name &account, const eosio::asset &quantity, \
            const eosio::checksum256 &xHashValue);
		void lockDebtTx(uint64_t npid, uint64_t pid, const eosio::name &account, const eosio::asset &quantity, \
            const eosio::checksum256 &xHashValue);

		void hexStrToUint256(std::string_view hexStr, internal::Uint256_t &outValue) {
			common::str2Hex(hexStr, (char *)outValue.data, sizeof(outValue));
		}

		bool hexStrToChecksum256(std::string_view hexStr, const eosio::checksum256 &outValue) {
			if (hexStr.size() != 64)
				return false;

			std::string_view hex{"0123456789abcdef"};
			for (int i = 0; i < 32; i++) {
				auto d1 = hex.find(hexStr[2*i]);
				auto d2 = hex.find(hexStr[2*i+1]);
				if (d1 == std::string_view::npos || d2 == std::string_view::npos)
					return false;

				// checksum256 is composed of little endian int128_t
				uint8_t idx = i / 16 * 16 + 15 - (i % 16);
				reinterpret_cast <char *>(const_cast<eosio::checksum256::word_t *>(outValue.data()))[idx] = (d1 << 4)  + d2;
				// static_cast<char *>(const_cast<eosio::checksum256::word_t *>(outValue.data()))[idx] = (d1 << 4)  + d2;
				// reinterpret_cast<char *>(outValue.data())[idx] = (d1 << 4)  + d2;
			}
			return true;
		}

		/* hex string to  checksum256 */
		inline eosio::checksum256 hexStrToChecksum256(std::string_view hex_str, bool needHash = false) {
			eosio::checksum256 hexValue;
#ifdef _DEBUG_PRINT
			eosio::print("\t[hexStrToChecksum256=> init:", hexValue, ", size:", sizeof(hexValue.get_array()), "]\t");
#endif
			common::str2Hex(hex_str, (char *)hexValue.data(), sizeof(hexValue.get_array()));
			if (!needHash) {
#ifdef _DEBUG_PRINT
				eosio::print("\t[hexStrToChecksum256=> before convertEndian:", hexValue, "]\t");
#endif
				// eosio::checksum256 result = convertEndian(hexValue);
#ifdef _DEBUG_PRINT
				eosio::print("\t[hexStrToChecksum256=> finaly:", hexValue, "]\t");
#endif
				return hexValue;
			}
			// eosio::checksum256 result = convertEndian(hexValue);
			return eosio::sha256((char *)hexValue.data(), sizeof(hexValue.get_array()));
			// return hexValue;
		}

		/* x-hex-string to xHash eosio::checksum256 */
		inline eosio::checksum256 hashHexMsg(std::string_view hexView) {
			internal::Uint256_t hexValue;
			hexStrToUint256(hexView, hexValue);
			eosio::checksum256 hashValue = eosio::sha256((char *)hexValue.data, sizeof(hexValue));
#ifdef _DEBUG_PRINT
			eosio::print("\t[hashHexMsg=>hexView:", static_cast<std::string>(hexView), ", hashValue:", hashValue,"]\t");
#endif
			return hashValue;
		}

		/* x-hex-string to xHash eosio::checksum256 */
		inline eosio::checksum256 hashMsg(std::string_view msgView) {
			return eosio::sha256((char *)msgView.data(), msgView.size());
		}

		inline std::string Uint256ToHexStr(const internal::Uint256_t &value) {
			return common::toHexStr((char *) value.data, sizeof(value));
			// eosio::checksum256 result = convertEndian(value);
			// return common::toHexStr((char *) result.data(), sizeof(result.get_array()));
		}
		inline std::string checksum256ToHexStr(const eosio::checksum256 &value) {
			return common::toHexStr((char *) value.data(), sizeof(value.get_array()));
			// eosio::checksum256 result = convertEndian(value);
			// return common::toHexStr((char *) result.data(), sizeof(result.get_array()));
		}
	};

};
#endif

