set(PROJECT_NAME htlc)
set(CMAKE_SYSTEM_NAME Generic)
set(CMAKE_C_COMPILER_WORKS 1)
set(CMAKE_CXX_COMPILER_WORKS 1)

find_package(eosio.cdt)

cmake_minimum_required(VERSION 3.5)
project(${PROJECT_NAME} VERSION 1.0)

add_contract(${PROJECT_NAME} ${PROJECT_NAME} src/htlc.cpp)

set_target_properties(${PROJECT_NAME}.wasm
   PROPERTIES
   RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/build")