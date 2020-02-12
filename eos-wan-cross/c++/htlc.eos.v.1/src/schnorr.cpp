#include <eosio/crypto.hpp>

#include "../include/schnorr.hpp"
#include "../include/curvePoint.hpp"

namespace schnorr {
    details::Bytes from_hex(const char *str)
    {
        details::Bytes result;
        size_t length = std::strlen(str);
        for (size_t i = 0; i < length; i += 2) {
            unsigned int temp;
            std::sscanf(&str[i], "%02x", &temp);
            result.push_back(static_cast<std::uint8_t>(temp));
        }
        return result;
    }

    std::string to_hex(const eosio::checksum256 &hashed) 
    {
        // Construct variables
        std::string result;
        const char *hex_chars = "0123456789abcdef";
        const auto bytes = hashed.extract_as_byte_array();
        // Iterate hash and build result
        for (uint32_t i = 0; i < bytes.size(); ++i) {
            (result += hex_chars[(bytes.at(i) >> 4)]) += hex_chars[(bytes.at(i) & 0x0f)];
        }
        return result;
    }

    void verify(std::string &randomPoint, std::string &signature, std::string &groupKey, std::string &raw_msg)
    {
        const char *groupKeyX = (groupKey.substr(2, 64)).c_str();
        const char *groupKeyY = (groupKey.substr(66, 64)).c_str();
        const char *randomPointX = (randomPoint.substr(2, 64)).c_str();
        const char *randomPointY = (randomPoint.substr(66, 64)).c_str();
        
        bcl::CurvePoint R(randomPointX, randomPointY);
        bcl::CurvePoint PK(groupKeyX, groupKeyY);

        eosio::check(R.isOnCurve(), details::error::RANDOM_NOT_ON_CURVE.data());
        eosio::check(PK.isOnCurve(), details::error::PK_NOT_ON_CURVE.data());

        // inner hash
        // details::Bytes raw_msg_bytes = from_hex((const char*)raw_msg.c_str());
        // eosio::checksum256 hashed = eosio::sha256((const char*)raw_msg_bytes.data(), raw_msg_bytes.size());
        eosio::checksum256 hashed = eosio::sha256((const char*)raw_msg.data(), raw_msg.size());
        std::string message = to_hex(hashed);
        // eosio::print("message: ", message);

        // outer hash
        const std::string hash_input = message + randomPoint;
        details::Bytes hash_input_bytes = from_hex((const char*)hash_input.c_str());
        eosio::checksum256 m = eosio::sha256((const char*)hash_input_bytes.data(), hash_input_bytes.size());
        std::string result = to_hex(m);
        
        // left side: s*G
        bcl::CurvePoint left = bcl::CurvePoint::G;
        left.multiply(bcl::Uint256(signature.c_str()));
        left.normalize();
        eosio::check(left.isOnCurve(), details::error::LEFT_NOT_ON_CURVE.data());

        // right side: R + m*PK
        // m*PK
        PK.multiply(bcl::Uint256(result.c_str()));
        PK.normalize();

        // R + m*PK
        PK.add(R);
        PK.normalize();

        bcl::CurvePoint right = PK;
        eosio::check(right.isOnCurve(), details::error::RIGHT_NOT_ON_CURVE.data());

        bool ret = left == right;
        eosio::check(ret, details::error::INVALID_SIGNATURE.data());
    }

};// namespace schnorr