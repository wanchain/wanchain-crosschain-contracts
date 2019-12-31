#!/usr/bin/env bash

# replace this with your own associated public key
PK=EOS5qcuysV9KcJjG2toE34Zq9wS5jLNgqhWgvzntt9C7Ce6dbjTSR

cleos wallet unlock
# cleos create account eosio test $PK -p eosio@active
# cleos create account eosio sch.verify $PK -p eosio@active


# for remote nodeos 
cleos -u http://192.168.1.58:8888 system newaccount eosio --transfer testtesttest $PK $PK --stake-net "100.0000 EOS" --stake-cpu "100.0000 EOS" --buy-ram-kbytes 8192

cleos -u http://192.168.1.58:8888 system newaccount eosio --transfer schnorr.veri $PK $PK --stake-net "100.0000 EOS" --stake-cpu "100.0000 EOS" --buy-ram-kbytes 8192