#ifndef __CRYPTO_SCHNORR_H
#define __CRYPTO_SCHNORR_H
#include <string>
#include <vector>
#include <string_view>
#include <eosio/eosio.hpp>

namespace schnorr {

    namespace details {
        typedef std::vector<std::uint8_t> Bytes;

        typedef struct error_t {
            static constexpr std::string_view INVALID_SIGNATURE     = "Invalid signature";
            static constexpr std::string_view RIGHT_NOT_ON_CURVE    = "Right result is not on curve";
            static constexpr std::string_view LEFT_NOT_ON_CURVE     = "Left result is not on curve";
            static constexpr std::string_view PK_NOT_ON_CURVE       = "PK is not on curve";
            static constexpr std::string_view RANDOM_NOT_ON_CURVE   = "Random point is not on curve";
        } error;
    };

    details::Bytes from_hex(const char *str);
    std::string to_hex(const eosio::checksum256 &hashed);
    void verify(std::string &randomPoint, std::string &signature, std::string &groupKey, std::string &message);
};
#endif