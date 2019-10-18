#ifndef EOS_WAN_HTLC_H
#define EOS_WAN_HTLC_H

#include <cstring>
#include <string_view>
#include <string>
#include <vector>
#include <map>

#include <eosiolib/eosio.hpp>
#include <eosiolib/asset.hpp>
#include <eosiolib/time.hpp>

// #define _DEBUG
// #define _DEBUG_LEVEL_1
// #define _DEBUG_LEVEL_2
// #define _DEBUG_LEVEL_3
// #define USING_LISTENER

namespace htlc {
    // if time_t is defined in namespace hash, using hTime::time_t in eosio contract table,
    // it will report "invalid type time_t" when query table,
    // so, all self-defined types define here, but not in other namespace
    // typedef unsigned long long time_t;
    typedef uint32_t time_t;

    namespace sysLimit {
        typedef struct account_size_t {
            static constexpr int32_t min = 1;
            static constexpr int32_t max = 12;
        } accountSize;
    };

    namespace hTime {
        constexpr time_t lockedTime = time_t(3600 * 36);
        constexpr time_t doubleLockedTime = lockedTime * 2;
    };

    namespace hFee {
        constexpr uint64_t ratioPrecise = 10000;
        constexpr uint64_t revokeRatio = 3;
    };

    // htlc status description
    namespace hStatus {
        typedef struct status_t {
            /* should less than 12 charapters */
            static constexpr std::string_view inlock = "inlock";
            static constexpr std::string_view inredeem = "inredeem";
            static constexpr std::string_view inrevoke = "inrevoke";
            static constexpr std::string_view outlock = "outlock";
            static constexpr std::string_view outredeem = "outredeem";
            static constexpr std::string_view outrevoke = "outrevoke";
            static constexpr std::string_view withdraw = "withdraw";
            static constexpr std::string_view updatepk = "updatepk";
            static constexpr std::string_view removepk = "removepk";
            static constexpr std::string_view lockdebt = "lockdebt";
            static constexpr std::string_view redeemdebt = "redeemdebt";
            static constexpr std::string_view revokedebt = "revokedebt";
        } status;
    };

    // htlc status description
    namespace hIndex {
        typedef struct index_t {
            /* should less than 12 charapters */
            static constexpr std::string_view sym = "sym";
            static constexpr std::string_view pid = "pid";
            static constexpr std::string_view npid = "npid";
            static constexpr std::string_view pkHash = "pkhash";
            static constexpr std::string_view user = "user";
            static constexpr std::string_view xHash = "xhash";
            static constexpr std::string_view sym_pid = "sym.pid";
            static constexpr std::string_view sym_status = "sym.status";
            static constexpr std::string_view action = "action";
        } index;
    };

    namespace hTable {
        typedef struct status_t {
            static constexpr std::string_view transfers = "transfers";
            static constexpr std::string_view pks = "pks";
            static constexpr std::string_view fees = "fees";
            static constexpr std::string_view assets = "assets";
            static constexpr std::string_view signer = "signer";
            static constexpr std::string_view debts = "debts";
            #ifdef USING_LISTENER
            static constexpr std::string_view listens = "listens";
            #endif
        } table;
    };

    namespace hError {
        typedef struct error_t {
            static constexpr std::string_view NOT_FOUND_RECORD = "not found valid record";
            static constexpr std::string_view REDUPLICATIVE_PK_RECORD = "reduplicative pk";
            static constexpr std::string_view EXIST_SIGNATURE_RECORD = "the signature record already exists";
            static constexpr std::string_view NOT_FOUND_SIGNATURE_RECORD = "not found the signature record";

            static constexpr std::string_view NOT_EXIST_ACCOUNT = "the account does not exist";
            static constexpr std::string_view INVALID_ACCOUNT = "invalid account";
            static constexpr std::string_view INVALID_HTLC_ACCOUNT = "invalid htlc account";
            static constexpr std::string_view INVALID_SG_ACCOUNT = "invalid storeman account";
            static constexpr std::string_view INVALID_USER_ACCOUNT = "invalid user account";
            static constexpr std::string_view SG_NOT_USER = "storeman should not be a user";

            static constexpr std::string_view INVALID_TABLE = "invalid table";

            static constexpr std::string_view INVALID_MEMO = "invalid memo";
            static constexpr std::string_view INVALID_SIG_MEMO = "invalid memo, it should be one of [inredeem, outlock, outrevoke, lockdebt, redeemdebt, revokedebt, updatepk, removepk]";

            static constexpr std::string_view REDEEM_TIMEOUT = "redeem timeout, only can redeem in lockedTime";
            static constexpr std::string_view REVOKE_TIMEOUT = "only can revoke after lockedTime";

            static constexpr std::string_view INVALID_X = "invalid x";
            static constexpr std::string_view INVALID_XHASH = "invalid xHash";
            static constexpr std::string_view INVALID_X_OR_XHASH_SIZE = "x or xHash should be a fixed size";
            static constexpr std::string_view REDUPLICATIVE_XHASH = "reduplicative xHash";

            static constexpr std::string_view INVALID_QUANTITY = "invalid quantity";
            static constexpr std::string_view NOE_ENOUGH_QUANTITY = "not enough quantity";
            static constexpr std::string_view FEE_OVERFLOW = "asset fee overflow";
            static constexpr std::string_view LEFT_OVERFLOW = "asset left overflow";

            static constexpr std::string_view INVALID_STATUS = "invalid status";
            static constexpr std::string_view INVALID_ACTION_FILTER = "invalid action filter";
            static constexpr std::string_view SYSTEM_ERROR = "onerror occured before htlc";

            static constexpr std::string_view INVALID_HEX_CHAR = "Invalid hex character";
            static constexpr std::string_view INVALID_PARAM = "Invalid parameter";

            static constexpr std::string_view NOT_HANDLED_RECORD = "unhandled transaction exists";
            static constexpr std::string_view DEBT_RECORD = "debt exists";
            static constexpr std::string_view FEE_RECORD = "fee exists";
            static constexpr std::string_view BUSY_PK = "pk is busy";
        } error;
    };

    // eosio.token transfer memo description
    namespace tMemo {
        constexpr char separator = ':';
        constexpr char outsep = '-';

        typedef struct memo_index_t {
            static constexpr int status = 0;
            static constexpr int xHash = 1;
            static constexpr int wanAddr = 2;
            static constexpr int pk = 3;
            static constexpr int total = 4;
        } index;

        typedef struct memo_size_t {
            static constexpr int xHash = 64;
            static constexpr int wanAddr = 42; // wan address with '0x'
            static constexpr int pk = 64; // pk
            static constexpr int status = 6; // inlock
            static constexpr int min = 3 + memo_size_t::xHash + memo_size_t::wanAddr + memo_size_t::pk + sysLimit::accountSize::min;
            static constexpr int max = 3 + memo_size_t::xHash + memo_size_t::wanAddr + memo_size_t::pk + sysLimit::accountSize::max;
        } mSize;

    };

    namespace hSig {

        typedef struct sigDdata_t {
            eosio::name            from;
            std::string            r;
            std::string            s;
            std::string            pk;
            std::string            msg;
            std::string            memo;
        } sigDdata;

        typedef struct redeemMsgIndex {
            static constexpr int storeman = 0;
            static constexpr int x = 1;
            static constexpr int total = 2;
        } redeemIndex;

        typedef struct lockMsgIndex {
            static constexpr int storeman = 0;
            static constexpr int user = 1;
            static constexpr int quantity = 2;
            static constexpr int xHash = 3;
            static constexpr int wanAddr = 4;
            static constexpr int total = 5;
        } lockIndex;

        typedef struct revokeMsgIndex {
            static constexpr int storeman = 0;
            static constexpr int xHash = 1;
            static constexpr int total = 2;
        } revokeIndex;

        typedef struct withdrawMsgIndex {
            static constexpr int storeman = 0;
            static constexpr int sym = 1;
            static constexpr int total = 2;
        } withdrawIndex;

        typedef struct updatePkMsgIndex {
            static constexpr int storeman = 0;
            static constexpr int pk = 1;
            static constexpr int total = 2;
        } updatePkIndex;

        typedef struct removePkMsgIndex {
            static constexpr int storeman = 0;
            static constexpr int total = 1;
        } removePkIndex;

        typedef struct lockDebtMsgIndex {
            static constexpr int storeman = 0;
            static constexpr int quantity = 1;
            static constexpr int pk = 2;
            static constexpr int xHash = 3;
            static constexpr int total = 4;
        } lockDebtIndex;

        typedef struct redeemDebtMsgIndex {
            static constexpr int storeman = 0;
            static constexpr int xHash = 1;
            static constexpr int x = 2;
            static constexpr int total = 3;
        } redeemDebtIndex;
    };

    namespace crypto {
        namespace base64 {
            static constexpr std::string_view base64Chars = 
                                            "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                                            "abcdefghijklmnopqrstuvwxyz"
                                            "0123456789+/";

            static inline bool isBase64(unsigned char c) {
                return (isalnum(c) || (c == '+') || (c == '/'));
            }

            inline void encode(char const* bytes2encode, int32_t inLen, std::string &out) {
                int i = 0;
                int j = 0;
                unsigned char char_array_3[3];
                unsigned char char_array_4[4];

                /**
                 * (origin) 6-bit => 1 byte (encoded)
                 * (origin) 3 bytes -> 24 bits => 4 bytes (encoded)
                */
                while (--inLen >= 0) {
                    char_array_3[i++] = *(bytes2encode++);
                    if (i == 3) {
                        char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
                        char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
                        char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
                        char_array_4[3] = char_array_3[2] & 0x3f;

                        for(i = 0; (i < 4) ; ++i) {
                            out += base64Chars[char_array_4[i]];
                        }
                        i = 0;
                    }
                }

                if (i)
                {
                    for(j = i; j < 3; j++)
                    char_array_3[j] = '\0';

                    char_array_4[0] = ( char_array_3[0] & 0xfc) >> 2;
                    char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
                    char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);

                    for (j = 0; (j < i + 1); j++)
                    out += base64Chars[char_array_4[j]];

                    while((i++ < 3))
                    out += '=';

                }

                return;
            }

            inline void decode(std::string_view encodedStr, std::string &out) {
                size_t inLen = encodedStr.size();
                int i = 0;
                int j = 0;
                int in_ = 0;
                unsigned char char_array_4[4], char_array_3[3];

                while (inLen-- && ( encodedStr[in_] != '=') && isBase64(encodedStr[in_])) {
                    char_array_4[i++] = encodedStr[in_]; in_++;
                    if (i ==4) {
                    for (i = 0; i <4; i++)
                        char_array_4[i] = base64Chars.find(char_array_4[i]) & 0xff;

                    char_array_3[0] = ( char_array_4[0] << 2       ) + ((char_array_4[1] & 0x30) >> 4);
                    char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);
                    char_array_3[2] = ((char_array_4[2] & 0x3) << 6) +   char_array_4[3];

                    for (i = 0; (i < 3); i++)
                        out += char_array_3[i];
                    i = 0;
                    }
                }

                if (i) {
                    for (j = 0; j < i; j++)
                    char_array_4[j] = base64Chars.find(char_array_4[j]) & 0xff;

                    char_array_3[0] = (char_array_4[0] << 2) + ((char_array_4[1] & 0x30) >> 4);
                    char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);

                    for (j = 0; (j < i - 1); j++) out += char_array_3[j];
                }

                return;
            }
        }
    };

    namespace common {
        constexpr std::string_view strEOF = "";

        /* arguments end with empty string ""*/
        inline void join(char *buf, char sep, const std::string_view *str, ...) {
            std::string_view *tmp;

            va_list args;
            va_start(args, str);
            strncpy(buf, str->data(), str->size());
            
            while(1) {
                tmp = va_arg(args, std::string_view *);
                if (tmp->empty()) {
                    break;
                } else {
                    *(buf + strlen(buf)) = sep;
                    strncpy((buf + strlen(buf)), tmp->data(), tmp->size());
                }
            }
            va_end(args);
        }

        inline void split(std::string_view str, char separator, std::vector<std::string_view>& v) {
            std::string_view::size_type i = 0;
            std::string_view::size_type j = 0;

            do {
                j = str.find(separator, i);
                if (j == std::string_view::npos) {
                    v.push_back(str.substr(i, str.size()));
                    break;
                } else {
                    v.push_back(str.substr(i, j - i));
                    i = ++j;
                }
            } while (j != std::string_view::npos);
        }

        inline void split(std::string_view str, char separator,std::string_view::size_type index, std::string &outStr) {
            std::string_view::size_type foundCount = 0;
            std::string_view::size_type startPos = 0;
            std::string_view::size_type endPos = 0;

            do {
                endPos = str.find(separator, startPos);
                if (foundCount == index) {
                    endPos = (endPos != std::string_view::npos) ? endPos : str.size() - startPos + 1;
                    
                    outStr = static_cast<std::string>(str.substr(startPos, endPos - startPos));
                    break;
                }
                ++foundCount;
                if (endPos != std::string_view::npos) {
                    startPos = ++endPos;
                }
            } while ((endPos != std::string_view::npos));
        }

        inline uint8_t hex_from_hex_char(char c) {
            if (c >= '0' && c <= '9') return c - '0';
            if (c >= 'a' && c <= 'f') return c - 'a' + 10;
            if (c >= 'A' && c <= 'F') return c - 'A' + 10;
            eosio_assert(false, hError::error::INVALID_HEX_CHAR.data());
            return 0;
        }

        /* hex-string to hex */
        inline size_t str2Hex(std::string_view hex_str, char *out_data, size_t out_data_len) {
            auto i = hex_str.begin();
            uint8_t *out_pos = (uint8_t *)out_data;
            uint8_t *out_end = out_pos + out_data_len;
            while (i != hex_str.end() && out_end != out_pos) {
                *out_pos = hex_from_hex_char((char) (*i)) << 4;
                ++i;
                if (i != hex_str.end()) {
                    *out_pos |= hex_from_hex_char((char) (*i));
                    ++i;
                }
                ++out_pos;
            }
            return out_pos - (uint8_t *) out_data;
        }

        inline std::string toHexStr(const char *d, uint32_t s) {
            std::string r;
            const char *to_hex = "0123456789abcdef";
            uint8_t *c = (uint8_t *) d;
            for (uint32_t i = 0; i < s; ++i) {
                (r += to_hex[(c[i] >> 4)]) += to_hex[(c[i] & 0x0f)];
            }
            return r;
        }
        inline uint128_t makeU128(uint64_t h, uint64_t l) {
            // return static_cast<uint128_t>(h) << 64 | static_cast<uint128_t>(l);
            return static_cast<uint128_t>(h) << 64 | l;
        }
    };

    class [[eosio::contract("htlc.eos.v.1")]] htlc : public eosio::contract {
    public:
        using contract::contract;

        struct transfer_data {
            eosio::name            from;
            eosio::name            to;
            eosio::asset           quantity;
            std::string            memo;
        };

        /// @notice                    type        comment
        /// @param user                name        account name of user initiated the Tx
        /// @param quantity            asset       exchange quantity
        /// @param memo                string      status(6):xHash(64):wanAddr(42):pk(130) => 245 bytes
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
        ACTION inrdm(eosio::name htlc, std::string r, std::string s, std::string pk, std::string msg, std::string memo);

        /// @notice               type        comment
        /// @param user           name        account name of user initiated the Tx
        /// @param xHash          string      hash of HTLC random number
        ACTION inrevoke(eosio::name user, std::string xHash);

        /// @notice               type        comment
        /// @param user           name        account name of user initiated the Tx
        /// @param storeman  name        storeman account name
        /// @param quantity       asset       exchange quantity
        /// @param memo           string      xHash:wanAddr:user:status
        /// TOKEN locked in htlc
        /// memo => xHash(64):wanAddr(42):r(65):s(65):status(7) => 247Bytes
        ACTION outlock(eosio::name storeman, eosio::name user, eosio::asset quantity, std::string xHash, \
                    std::string wanAddr, std::string pk, std::string r, std::string s);
        ACTION outlk(eosio::name htlc, std::string r, std::string s, std::string pk, std::string msg, \
                    std::string memo);

        /// @notice               type        comment
        /// @param user           name        account name of user initiated the Tx
        /// @param storeman  name        storeman account name
        /// @param xHash          string      hash of HTLC random number
        /// @param x              string      HTLC random number
        ACTION outredeem(eosio::name user, std::string x);

        /// @notice               type        comment
        /// @param storeman  name        storeman account name
        /// @param xHash          string      hash of HTLC random number
        ACTION outrevoke(eosio::name storeman, std::string xHash, std::string r, std::string s);
        ACTION outrvk(eosio::name htlc, std::string r, std::string s, std::string pk, std::string msg, std::string memo);

        /// @notice               type        comment
        /// @param xHash          string      hash of HTLC random number
        ACTION leftlocktime(eosio::name from, eosio::name table, std::string xHash);

        ACTION truncate(eosio::name table, std::string scope);

        ACTION withdraw(eosio::name storeman, std::string sym, std::string pk, std::string r, std::string s);
        ACTION wdr(eosio::name htlc, std::string r, std::string s, std::string pk, std::string msg, std::string memo);

        /* signature contract */
        ACTION regsig(eosio::name htlc, eosio::name code, eosio::name action);
        ACTION updatesig(eosio::name htlc, eosio::name code, eosio::name nCode, eosio::name nAction);
        ACTION unregsig(eosio::name htlc, eosio::name code);

        /* updatePK */
        ACTION updatepk(eosio::name storeman, std::string npk, std::string pk, std::string r, std::string s);
        ACTION updtpk(eosio::name htlc, std::string r, std::string s, std::string pk, std::string msg, std::string memo);

        ACTION removepk(eosio::name storeman, std::string pk, std::string r, std::string s);
        ACTION rmpk(eosio::name htlc, std::string r, std::string s, std::string pk, std::string msg, std::string memo);

        /* debt storeman like inlock */
        ACTION lockdebt(eosio::name storeman, eosio::asset quantity, std::string npk, std::string xHash, std::string pk, std::string r, std::string s);
        ACTION lkdebt(eosio::name htlc, std::string r, std::string s, std::string pk, std::string msg, std::string memo);

        ACTION redeemdebt(eosio::name storeman, std::string x, std::string r, std::string s);
        ACTION rdmdebt(eosio::name htlc, std::string r, std::string s, std::string pk, std::string msg, std::string memo);

        ACTION revokedebt(eosio::name storeman, std::string xHash, std::string r, std::string s);
        ACTION rvkdebt(eosio::name htlc, std::string r, std::string s, std::string pk, std::string msg, std::string memo);

        ACTION kk(std::string x);

        #ifdef USING_LISTENER
        /* listen TOKEN the issue contract transfer */
        TABLE listen_t {
            eosio::name                  code;
            eosio::name                  action;

            uint64_t primary_key() const { return code.value; }
            uint64_t action_key() const { return action.value; }
        };
        bool getListenInfo(uint64_t code, void *listenInfo);
        bool getListenInfo(std::vector<listen_t *> &v);
        #endif

        /* only one record */
        TABLE signature_t {
            eosio::name                  code;
            eosio::name                  action;

            uint64_t primary_key() const { return code.value; }
        };
        bool getSignature(void *sigInfo);

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

            uint64_t primary_key() const { return id; }
            eosio::checksum256 xhash_key() const { return xHash; /* unique */ }
            uint64_t pid_key() const { return pid; }
            uint128_t sym_pid_key() const { 
                return static_cast<uint128_t>(quantity.symbol.code().raw()) << 64 | static_cast<uint128_t>(pid);
            }
            uint128_t sym_status_key() const { 
                return static_cast<uint128_t>(quantity.symbol.code().raw()) << 64 | \
                    static_cast<uint128_t>(eosio::name(status).value);
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
            eosio::asset                 balance;
            uint64_t primary_key() const { return balance.symbol.code().raw(); }
        };

        /* TABLE fees
        ** scope pk id from TABLE pks
        */
        TABLE fee_t {
            eosio::asset                 fee;
            uint64_t primary_key() const { return fee.symbol.code().raw(); }
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
            eosio::asset                 quantity;
            time_t                       lockedTime;
            eosio::time_point_sec        beginTime;
            std::string                  status;
            eosio::checksum256           xHash;

            uint64_t primary_key() const { return id; }
            uint64_t pid_key() const { return pid; }
            uint64_t npid_key() const { return npid; }
            uint64_t sym_key() const { return quantity.symbol.code().raw(); }
            uint128_t sym_pid_key() const { 
                /* unique */
                return static_cast<uint128_t>(quantity.symbol.code().raw()) << 64 | static_cast<uint128_t>(pid);
            }
            eosio::checksum256 xhash_key() const { return xHash; /* unique */ }
        };

        typedef eosio::multi_index<eosio::name(hTable::table::signer), signature_t> signer;
        #ifdef USING_LISTENER
        typedef eosio::multi_index<eosio::name(hTable::table::listens), listen_t
            , eosio::indexed_by<eosio::name(hIndex::index::action), \
                eosio::const_mem_fun<listen_t, uint64_t, &listen_t::action_key>>
        > listens;
        #endif

        typedef eosio::multi_index<eosio::name(hTable::table::fees), fee_t> fees;
        typedef eosio::multi_index<eosio::name(hTable::table::assets), asset_t> assets;

        typedef eosio::multi_index<eosio::name(hTable::table::pks), pk_t
            , eosio::indexed_by<eosio::name(hIndex::index::pkHash), \
                eosio::const_mem_fun<pk_t, eosio::checksum256, &pk_t::pkhash_key>>
        > pks;

        typedef eosio::multi_index<eosio::name(hTable::table::transfers), transfer_t
            , eosio::indexed_by<eosio::name(hIndex::index::xHash), \
                eosio::const_mem_fun<transfer_t, eosio::checksum256, &transfer_t::xhash_key>>
            , eosio::indexed_by<eosio::name(hIndex::index::pid), \
                eosio::const_mem_fun<transfer_t, uint64_t, &transfer_t::pid_key>>
            , eosio::indexed_by<eosio::name(hIndex::index::sym_pid), \
                eosio::const_mem_fun<transfer_t, uint128_t, &transfer_t::sym_pid_key>>
            , eosio::indexed_by<eosio::name(hIndex::index::sym_status), \
                eosio::const_mem_fun<transfer_t, uint128_t, &transfer_t::sym_status_key>>
        > transfers;

        typedef eosio::multi_index<eosio::name(hTable::table::debts), debt_t
            , eosio::indexed_by<eosio::name(hIndex::index::xHash), \
                eosio::const_mem_fun<debt_t, eosio::checksum256, &debt_t::xhash_key>>
            , eosio::indexed_by<eosio::name(hIndex::index::sym), \
                eosio::const_mem_fun<debt_t, uint64_t, &debt_t::sym_key>>
            , eosio::indexed_by<eosio::name(hIndex::index::pid), \
                eosio::const_mem_fun<debt_t, uint64_t, &debt_t::pid_key>>
            , eosio::indexed_by<eosio::name(hIndex::index::npid), \
                eosio::const_mem_fun<debt_t, uint64_t, &debt_t::npid_key>>
            , eosio::indexed_by<eosio::name(hIndex::index::sym_pid), \
                eosio::const_mem_fun<debt_t, uint128_t, &debt_t::sym_pid_key>>
        > debts;
        /***************************************************************************************/

        eosio::asset stringToAsset(std::string_view qStr);
        uint64_t savePk(std::string_view pkView);
        bool     findPK(std::string_view pkView, void *pkInfo);
        bool     findPK(uint64_t pid, void *pkInfo);
        bool     hasPK(std::string_view pkView);
        bool     hasPK(uint64_t pid);
        bool     isPkBusy(std::string_view pkView, eosio::symbol_code sym, std::string_view statusView);
        bool     isPkBusy(uint64_t pid, eosio::symbol_code sym, std::string_view statusView);
        bool     isPkBusy(std::string_view pkView, std::string_view symView, std::string_view statusView);
        bool     isPkBusy(uint64_t pid, std::string_view symView, std::string_view statusView);
        void     cleanPk(uint64_t pid, eosio::symbol_code sym);

        void getOutPendAsset(uint64_t pid, eosio::asset *pQuantity);
        void getPendDebtAsset(uint64_t pid, eosio::asset *pQuantity);
        void getPendAsset(uint64_t pid, eosio::asset *pQuantity, std::string_view status);
        void getAsset(uint64_t pid, eosio::asset *pQuantity);
        void addAsset(uint64_t pid, const eosio::asset &quantity);
        void subAsset(uint64_t pid, const eosio::asset &quantity);

        bool existFee(uint64_t pid, eosio::symbol_code sym);
        void addFee(uint64_t pid, const eosio::asset &quantity);
        void subFee(uint64_t pid, std::string_view symView, eosio::name to, std::string memo);
        void confirmLock(uint64_t pid, std::string_view statusView, const eosio::name &user, const eosio::asset &quantity);
        void lockHTLCTx(const eosio::name &user, const eosio::asset &quantity, std::string_view xHashView, \
            std::string_view wanAddrView, std::string_view pkView, \
            std::string_view statusView, bool isOriginator = false);
        void lockHTLCTx(const eosio::asset &quantity, std::string_view npkView, \
            std::string_view xHashView, std::string_view pkView, \
            std::string_view statusView, bool isOriginator = false);

        eosio::checksum256 parseXHash(std::string_view xHashView);

        /* hex string to  capi_checksum256 */
        capi_checksum256 str2CapiChecksum256(std::string_view hex_str) {
            capi_checksum256 hexValue;
            common::str2Hex(hex_str, (char *)hexValue.hash, sizeof(hexValue.hash));
            return hexValue;
        }

        /* x-hex-string to xHash eosio::checksum256 */
        eosio::checksum256 hashX(std::string_view xView) {
            capi_checksum256 hash;
            capi_checksum256 xValue = str2CapiChecksum256(xView);
            sha256((char *)xValue.hash, sizeof(xValue.hash), &hash);
            return hash.hash;
        }

        // toHexStr(xHashValue)
        std::string toHexStr(const capi_checksum256 &sha256) {
            return common::toHexStr((char *) sha256.hash, sizeof(sha256.hash));
        }
    };

};

#endif //end EOS_WAN_HTLC_H