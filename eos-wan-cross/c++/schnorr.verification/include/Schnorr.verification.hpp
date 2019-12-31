#include <eosio/eosio.hpp>
#include <eosio/crypto.hpp>
#include <string>
#include "CurvePoint.hpp"

using namespace eosio;
using namespace std;
using namespace bcl;

class [[eosio::contract("schnorr.verification")]] verifier : public contract
{
private:
    typedef vector<std::uint8_t> Bytes;

    static Bytes from_hex(const char *str)
    {
        Bytes result;
        size_t length = std::strlen(str);
        for (size_t i = 0; i < length; i += 2) {
            unsigned int temp;
            std::sscanf(&str[i], "%02x", &temp);
            result.push_back(static_cast<std::uint8_t>(temp));
        }
        return result;
    }

    static string to_hex(const checksum256 &hashed) 
    {
		// Construct variables
		string result;
		const char *hex_chars = "0123456789abcdef";
		const auto bytes = hashed.extract_as_byte_array();
		// Iterate hash and build result
		for (uint32_t i = 0; i < bytes.size(); ++i) {
			(result += hex_chars[(bytes.at(i) >> 4)]) += hex_chars[(bytes.at(i) & 0x0f)];
		}
		// Return string
		return result;
	}

public:
    using contract::contract;

    [[eosio::action]]
    void verify(name from, string randomPoint, string signature, string groupKey, string message, string memo);
};
