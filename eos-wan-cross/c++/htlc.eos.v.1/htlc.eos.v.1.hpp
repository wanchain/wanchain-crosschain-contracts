#ifndef EOS_WAN_HTLC_H
#define EOS_WAN_HTLC_H

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
    static constexpr eosio::name   TRANSFER_NAME="transfer"_n;
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
            static constexpr eosio::name active = eosio::name("active");
            static constexpr eosio::name token = eosio::name("token");
            static constexpr eosio::name sign = eosio::name("sign");
        } level;
    };

    namespace sysLimit {
        typedef struct account_t {
            static constexpr int32_t min = 1;
            static constexpr int32_t max = 12;
        } account;
    };

    namespace hLimit {
        static constexpr int xHash = 64;
        static constexpr int wanAddr = 40; // wan address without '0x'
        static constexpr int pk = 130; // pk
        static constexpr int status = 6; // inlock

        constexpr uint64_t ratioPrecise = 10000;

        #ifdef _DEBUG_HTLC
        constexpr time_t lockedTime = time_t(3600);
        #else
        constexpr time_t lockedTime = time_t(3600 * 36);
        #endif
        constexpr time_t doubleLockedTime = lockedTime * 2;
    }

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

    namespace hTable {
        typedef struct table_t {
            static constexpr eosio::name transfers = eosio::name("transfers");
            static constexpr eosio::name pks = eosio::name("pks");
            static constexpr eosio::name assets = eosio::name("assets");
            static constexpr eosio::name fees = eosio::name("fees");
            static constexpr eosio::name debts = eosio::name("debts");
            static constexpr eosio::name signer = eosio::name("signer");
            static constexpr eosio::name longlongs = eosio::name("longlongs");
        } table;

        typedef struct key_t {
            /* should less than 12 charapters */
            static constexpr eosio::name pid = eosio::name("pid");
            static constexpr eosio::name npid = eosio::name("npid");
            static constexpr eosio::name pkHash = eosio::name("pkhash");
            static constexpr eosio::name xHash = eosio::name("xhash");
            static constexpr eosio::name acct = eosio::name("acct");
            static constexpr eosio::name sym_acct = eosio::name("sym.acct");
            static constexpr eosio::name pid_acct = eosio::name("pid.acct");
            static constexpr eosio::name npid_acct = eosio::name("npid.acct");
            static constexpr eosio::name ratio = eosio::name("ratio");
        } key;
    };

    namespace hError {
        typedef struct error_t {
            static constexpr std::string_view NOT_FOUND_RECORD = "not found valid record";
            static constexpr std::string_view NOT_FOUND_PK_RECORD = "not found the pk record";
            static constexpr std::string_view NOT_FOUND_SIGNATURE_RECORD = "not found the signature record";
            static constexpr std::string_view NOT_FOUND_TOKEN_ACCOUNT_RECORD = "not found the token account record";
            static constexpr std::string_view NOT_FOUND_TOKEN_RECORD = "not found the token record";

            static constexpr std::string_view INVALID_HTLC_ACCOUNT = "invalid htlc account";
            static constexpr std::string_view INVALID_SG_ACCOUNT = "invalid storeman account";
            static constexpr std::string_view INVALID_USER_ACCOUNT = "invalid user account";
            static constexpr std::string_view INVALID_TOKEN_ACCOUNT = "invalid token account";

            #ifdef _DEBUG_API
            static constexpr std::string_view INVALID_TABLE = "invalid table";
            #endif

            static constexpr std::string_view INVALID_MEMO = "invalid memo";

            static constexpr std::string_view REDEEM_TIMEOUT = "redeem timeout, only can redeem in lockedTime";
            static constexpr std::string_view REVOKE_TIMEOUT = "only can revoke after lockedTime";

            static constexpr std::string_view INVALID_X = "invalid x";
            static constexpr std::string_view INVALID_XHASH = "invalid xHash";

            static constexpr std::string_view REDUPLICATIVE_RECORD = "reduplicative record";
            static constexpr std::string_view REDUPLICATIVE_XHASH = "reduplicative xHash";

            static constexpr std::string_view INVALID_PARAM = "Invalid parameter";
            static constexpr std::string_view INVALID_QUANTITY = "invalid quantity";
            static constexpr std::string_view INVALID_HEX_CHAR = "Invalid hex character";

            static constexpr std::string_view NOE_ENOUGH_QUANTITY = "not enough quantity";
            static constexpr std::string_view FEE_OVERFLOW = "asset fee overflow";
            static constexpr std::string_view LEFT_OVERFLOW = "asset left overflow";

            static constexpr std::string_view SYSTEM_ERROR = "onerror occured before htlc";

            static constexpr std::string_view EXIST_FEE_RECORD = "fee exists";
            static constexpr std::string_view EXIST_ASSET_RECORD = "asset exists";
            static constexpr std::string_view BUSY_PK = "pk is busy";

        } error;
    };

    // eosio.token transfer memo description
    namespace tMemo {
        constexpr char separator = ':';
        constexpr char outSeparator = '-';

        typedef struct inlock_t {
            static constexpr int status = 0;
            static constexpr int xHash = 1;
            static constexpr int wanAddr = 2;
            static constexpr int pk = 3;
            static constexpr int account = 4;
            static constexpr int total = 5;
        } inlock;

        typedef struct inredeem_t {
            #ifdef _SIGN_MSG_DETAIL
            static constexpr int storeman = 0;
            static constexpr int x = 1;
            #endif
            static constexpr int total = 2;
        } inredeem;

        typedef struct inrevoke_t {
            #ifdef _SIGN_MSG_DETAIL
            static constexpr int status = 0;
            static constexpr int xHash = 1;
            static constexpr int account = 2;
            #endif
            static constexpr int total = 3;
        } inrevoke;

        typedef struct outlock_t {
            #ifdef _SIGN_MSG_DETAIL
            static constexpr int storeman = 0;
            static constexpr int user = 1;
            static constexpr int account = 2;
            static constexpr int quantity = 3;
            static constexpr int xHash = 4;
            #endif
            static constexpr int total = 5;
        } outlock;

        typedef struct outredeem_t {
            #ifdef _SIGN_MSG_DETAIL
            static constexpr int status = 0;
            static constexpr int x = 1;
            static constexpr int account = 2;
            #endif
            static constexpr int total = 3;
        } outredeem;

        typedef struct lockDebt_t {
            #ifdef _SIGN_MSG_DETAIL
            static constexpr int storeman = 0;
            static constexpr int account = 1;
            static constexpr int quantity = 2;
            static constexpr int pk = 3;
            static constexpr int xHash = 4;
            #endif
            static constexpr int total = 5;
        } lockDebt;

        typedef struct redeemDebt_t {
            #ifdef _SIGN_MSG_DETAIL
            static constexpr int storeman = 0;
            static constexpr int x = 1;
            #endif
            static constexpr int total = 2;
        } redeemDebt;

        typedef struct revokeDebt_t {
            #ifdef _SIGN_MSG_DETAIL
            static constexpr int xHash = 0;
            #endif
            static constexpr int total = 1;
        } revokeDebt;

        typedef struct withdraw_t {
            #ifdef _SIGN_MSG_DETAIL
            static constexpr int storeman = 0;
            static constexpr int account = 1;
            static constexpr int sym = 2;
            #endif
            static constexpr int total = 3;
        } withdraw;

        typedef struct updatePk_t {
            #ifdef _SIGN_MSG_DETAIL
            static constexpr int storeman = 0;
            static constexpr int pk = 1;
            #endif
            static constexpr int total = 2;
        } updatePk;

        typedef struct removePk_t {
            #ifdef _SIGN_MSG_DETAIL
            static constexpr int storeman = 0;
            #endif
            static constexpr int total = 1;
        } removePk;

        typedef struct memo_size_t {
            struct inlock {
                static constexpr int min = 4 + hLimit::xHash + hLimit::wanAddr + hLimit::pk + sysLimit::account::min + sysLimit::account::min;
                static constexpr int max = 4 + hLimit::xHash + hLimit::wanAddr + hLimit::pk + sysLimit::account::max + sysLimit::account::max;
            };
        } size;
    };

    namespace hSymbol {
        constexpr char separator = ',';
        typedef struct item_t {
            static constexpr int precision = 0;
            static constexpr int symCode = 1;
            static constexpr int total = 2;
        } item;
    }

    namespace hAsset {
        constexpr char separator = ' ';
        constexpr char dot = '.';
        typedef struct item_t {
            static constexpr int value = 0;
            static constexpr int symCode = 1;
            static constexpr int total = 2;
        } item;

        typedef struct amount_t {
            static constexpr int integer = 0;
            static constexpr int decimal = 1;
            static constexpr int total = 2;
        } amount;
    }

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
        template<typename Type>
        inline void join(char *buf, char sep, Type msg, va_list &args) {
            Type tmp;

            // va_list args;
            // va_start(args, msg);
            strncpy(buf, msg->data(), msg->size());

            while(1) {
                tmp = va_arg(args, Type);
                if (tmp->empty()) {
                    break;
                } else {
                    *(buf + strlen(buf)) = sep;
                    strncpy((buf + strlen(buf)), tmp->data(), tmp->size());
                }
            }
            // va_end(args);
        }

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

        inline void split(std::string_view str, char separator, std::string_view::size_type index, std::string &outStr) {
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
            eosio::check(false, hError::error::INVALID_HEX_CHAR.data());
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
        }
        inline std::string checksum256ToHexStr(const eosio::checksum256 &value) {
            return common::toHexStr((char *) value.data(), sizeof(value.get_array()));
        }
    };

};

#endif //end EOS_WAN_HTLC_H