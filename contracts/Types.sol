// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

/**
 * @title Types - a file that contains all of the type definitions used throughout
 * the TRON Zodiac Roles Mod.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 * @author Jan-Felix Schwarz  - <jan-felix.schwarz@gnosis.io>
 */

/**
 * @dev Represents the key type for ABI encoding
 * Using uint8 constants instead of enum for TronWeb compatibility
 */
uint8 constant ABI_TYPE_NONE = 0;
uint8 constant ABI_TYPE_STATIC = 1;
uint8 constant ABI_TYPE_DYNAMIC = 2;
uint8 constant ABI_TYPE_TUPLE = 3;
uint8 constant ABI_TYPE_ARRAY = 4;
uint8 constant ABI_TYPE_CALLDATA = 5; // AKA AbiEncodedWithSelector
uint8 constant ABI_TYPE_ABI_ENCODED = 6;

/**
 * @dev Structure representing an ABI type definition
 * @param key The type key indicating how this parameter should be encoded
 * @param fields Array of indices pointing to child types in the AbiType array
 */
struct AbiTypeTree {
    uint8 _type;
    uint256[] fields;
}

/**
 * @dev Structure that maps the location and size of a parameter in calldata
 * @param index The index of the parameter in the AbiType array
 * @param location The location of the parameter in calldata
 * @param size The size of the parameter in bytes
 * @param children Array of child payloads for complex types (tuples, arrays)
 */
struct Payload {
    uint256 index;
    uint256 location;
    uint256 size;
    Payload[] children;
}

// Operator constants for TronWeb compatibility
uint8 constant OPERATOR_PASS = 0;
uint8 constant OPERATOR_AND = 1;
uint8 constant OPERATOR_OR = 2;
uint8 constant OPERATOR_NOR = 3;
uint8 constant OPERATOR_PLACEHOLDER_04 = 4;
uint8 constant OPERATOR_MATCHES = 5;
uint8 constant OPERATOR_ARRAY_SOME = 6;
uint8 constant OPERATOR_ARRAY_EVERY = 7;
uint8 constant OPERATOR_ARRAY_SUBSET = 8;
uint8 constant OPERATOR_PLACEHOLDER_09 = 9;
uint8 constant OPERATOR_PLACEHOLDER_10 = 10;
uint8 constant OPERATOR_PLACEHOLDER_11 = 11;
uint8 constant OPERATOR_PLACEHOLDER_12 = 12;
uint8 constant OPERATOR_PLACEHOLDER_13 = 13;
uint8 constant OPERATOR_PLACEHOLDER_14 = 14;
uint8 constant OPERATOR_EQUAL_TO_AVATAR = 15;
uint8 constant OPERATOR_EQUAL_TO = 16;
uint8 constant OPERATOR_GREATER_THAN = 17;
uint8 constant OPERATOR_LESS_THAN = 18;
uint8 constant OPERATOR_SIGNED_INT_GREATER_THAN = 19;
uint8 constant OPERATOR_SIGNED_INT_LESS_THAN = 20;
uint8 constant OPERATOR_BITMASK = 21;
uint8 constant OPERATOR_CUSTOM = 22;
uint8 constant OPERATOR_PLACEHOLDER_23 = 23;
uint8 constant OPERATOR_PLACEHOLDER_24 = 24;
uint8 constant OPERATOR_PLACEHOLDER_25 = 25;
uint8 constant OPERATOR_PLACEHOLDER_26 = 26;
uint8 constant OPERATOR_PLACEHOLDER_27 = 27;
uint8 constant OPERATOR_WITHIN_ALLOWANCE = 28;
uint8 constant OPERATOR_ETHER_WITHIN_ALLOWANCE = 29;
uint8 constant OPERATOR_CALL_WITHIN_ALLOWANCE = 30;
uint8 constant OPERATOR_PLACEHOLDER_31 = 31;

enum ExecutionOptions {
    None,
    Send,
    DelegateCall,
    Both
}

enum Clearance {
    None,
    Target,
    Function
}

// This struct is a flattened version of Condition
// used for ABI encoding a scope config tree
// (ABI does not support recursive types)
struct ConditionFlat {
    uint8 parent;
    uint8 paramType;
    uint8 operator;
    bytes compValue;
}

struct Condition {
    uint8 paramType;
    uint8 operator;
    bytes32 compValue;
    Condition[] children;
}

struct TargetAddress {
    Clearance clearance;
    ExecutionOptions options;
}

struct Role {
    mapping(address => bool) members;
    mapping(address => TargetAddress) targets;
    mapping(bytes32 => bytes32) scopeConfig;
}

/// @notice The order of members in the `Allowance` struct is significant; members updated during accrual (`balance` and `timestamp`) should be stored in the same word.
/// @custom:member refill Amount added to balance after each period elapses.
/// @custom:member maxRefill Refilling stops when balance reaches this value.
/// @custom:member period Duration, in seconds, before a refill occurs. If set to 0, the allowance is for one-time use and won't be replenished.
/// @custom:member balance Remaining allowance available for use. Decreases with usage and increases after each refill by the specified refill amount.
/// @custom:member timestamp Timestamp when the last refill occurred.
struct Allowance {
    uint128 refill;
    uint128 maxRefill;
    uint64 period;
    uint128 balance;
    uint64 timestamp;
}

struct Consumption {
    bytes32 allowanceKey;
    uint128 balance;
    uint128 consumed;
}
