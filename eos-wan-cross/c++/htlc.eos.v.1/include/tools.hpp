#ifndef __HTLC_TOOLS_H
#define __HTLC_TOOLS_H

using namespace std;
namespace htlc {

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
};
#endif