#!/usr/bin/env bash

eosio-cpp -I . src/Schnorr.verification.cpp src/Utils.cpp src/FieldInt.cpp src/CurvePoint.cpp src/Uint256.cpp -o schnorr.verification.wasm -abigen
