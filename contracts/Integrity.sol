// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.17 <0.9.0;

import "./Topology.sol";

/**
 * @title Integrity, A library that validates condition integrity, and
 * adherence to the expected input structure and rules.
 * @author Cristóvão Honorato - <cristovao.honorato@gnosis.io>
 */
library Integrity {
    error UnsuitableRootNode();

    error NotBFS();

    error UnsuitableParameterType(uint256 index);

    error UnsuitableCompValue(uint256 index);

    error UnsupportedOperator(uint256 index);

    error UnsuitableParent(uint256 index);

    error UnsuitableChildCount(uint256 index);

    error UnsuitableChildTypeTree(uint256 index);

    function enforce(ConditionFlat[] memory conditions) external pure {
        _root(conditions);
        for (uint256 i = 0; i < conditions.length; ++i) {
            _node(conditions[i], i);
        }
        _tree(conditions);
    }

    function _root(ConditionFlat[] memory conditions) private pure {
        uint256 count;

        for (uint256 i; i < conditions.length; ++i) {
            if (conditions[i].parent == i) ++count;
        }
        if (count != 1 || conditions[0].parent != 0) {
            revert UnsuitableRootNode();
        }
    }

    function _node(ConditionFlat memory condition, uint256 index) private pure {
        uint8 operator = condition.operator;
        uint8 _type = condition.paramType;
        bytes memory compValue = condition.compValue;
        if (operator == OPERATOR_PASS) {
            if (condition.compValue.length != 0) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator >= OPERATOR_AND && operator <= OPERATOR_NOR) {
            if (_type != ABI_TYPE_NONE) {
                revert UnsuitableParameterType(index);
            }
            if (condition.compValue.length != 0) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator == OPERATOR_MATCHES) {
            if (
                _type != ABI_TYPE_TUPLE &&
                _type != ABI_TYPE_ARRAY &&
                _type != ABI_TYPE_CALLDATA &&
                _type != ABI_TYPE_ABI_ENCODED
            ) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 0) {
                revert UnsuitableCompValue(index);
            }
        } else if (
            operator == OPERATOR_ARRAY_SOME ||
            operator == OPERATOR_ARRAY_EVERY ||
            operator == OPERATOR_ARRAY_SUBSET
        ) {
            if (_type != ABI_TYPE_ARRAY) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 0) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator == OPERATOR_EQUAL_TO_AVATAR) {
            if (_type != ABI_TYPE_STATIC) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 0) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator == OPERATOR_EQUAL_TO) {
            if (
                _type != ABI_TYPE_STATIC &&
                _type != ABI_TYPE_DYNAMIC &&
                _type != ABI_TYPE_TUPLE &&
                _type != ABI_TYPE_ARRAY
            ) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length == 0 || compValue.length % 32 != 0) {
                revert UnsuitableCompValue(index);
            }
        } else if (
            operator == OPERATOR_GREATER_THAN ||
            operator == OPERATOR_LESS_THAN ||
            operator == OPERATOR_SIGNED_INT_GREATER_THAN ||
            operator == OPERATOR_SIGNED_INT_LESS_THAN
        ) {
            if (_type != ABI_TYPE_STATIC) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 32) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator == OPERATOR_BITMASK) {
            if (_type != ABI_TYPE_STATIC && _type != ABI_TYPE_DYNAMIC) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 32) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator == OPERATOR_CUSTOM) {
            if (compValue.length != 32) {
                revert UnsuitableCompValue(index);
            }
        } else if (operator == OPERATOR_WITHIN_ALLOWANCE) {
            if (_type != ABI_TYPE_STATIC) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 32) {
                revert UnsuitableCompValue(index);
            }
        } else if (
            operator == OPERATOR_ETHER_WITHIN_ALLOWANCE ||
            operator == OPERATOR_CALL_WITHIN_ALLOWANCE
        ) {
            if (_type != ABI_TYPE_NONE) {
                revert UnsuitableParameterType(index);
            }
            if (compValue.length != 32) {
                revert UnsuitableCompValue(index);
            }
        } else {
            revert UnsupportedOperator(index);
        }
    }

    function _tree(ConditionFlat[] memory conditions) private pure {
        uint256 length = conditions.length;
        // check BFS
        for (uint256 i = 1; i < length; ++i) {
            if (conditions[i - 1].parent > conditions[i].parent) {
                revert NotBFS();
            }
        }

        for (uint256 i = 0; i < length; ++i) {
            if (
                (conditions[i].operator == OPERATOR_ETHER_WITHIN_ALLOWANCE ||
                    conditions[i].operator == OPERATOR_CALL_WITHIN_ALLOWANCE) &&
                conditions[conditions[i].parent].paramType != ABI_TYPE_CALLDATA
            ) {
                revert UnsuitableParent(i);
            }
        }

        Topology.Bounds[] memory childrenBounds = Topology.childrenBounds(
            conditions
        );

        for (uint256 i = 0; i < conditions.length; i++) {
            ConditionFlat memory condition = conditions[i];
            Topology.Bounds memory childBounds = childrenBounds[i];

            if (condition.paramType == ABI_TYPE_NONE) {
                if (
                    (condition.operator == OPERATOR_ETHER_WITHIN_ALLOWANCE ||
                        condition.operator == OPERATOR_CALL_WITHIN_ALLOWANCE) &&
                    childBounds.length != 0
                ) {
                    revert UnsuitableChildCount(i);
                }
                if (
                    (condition.operator >= OPERATOR_AND &&
                        condition.operator <= OPERATOR_NOR)
                ) {
                    if (childBounds.length == 0) {
                        revert UnsuitableChildCount(i);
                    }
                }
            } else if (
                condition.paramType == ABI_TYPE_STATIC ||
                condition.paramType == ABI_TYPE_DYNAMIC
            ) {
                if (childBounds.length != 0) {
                    revert UnsuitableChildCount(i);
                }
            } else if (
                condition.paramType == ABI_TYPE_TUPLE ||
                condition.paramType == ABI_TYPE_CALLDATA ||
                condition.paramType == ABI_TYPE_ABI_ENCODED
            ) {
                if (childBounds.length == 0) {
                    revert UnsuitableChildCount(i);
                }
            } else {
                assert(condition.paramType == ABI_TYPE_ARRAY);

                if (childBounds.length == 0) {
                    revert UnsuitableChildCount(i);
                }

                if (
                    (condition.operator == OPERATOR_ARRAY_SOME ||
                        condition.operator == OPERATOR_ARRAY_EVERY) &&
                    childBounds.length != 1
                ) {
                    revert UnsuitableChildCount(i);
                } else if (
                    condition.operator == OPERATOR_ARRAY_SUBSET &&
                    childBounds.length > 256
                ) {
                    revert UnsuitableChildCount(i);
                }
            }
        }

        for (uint256 i = 0; i < conditions.length; i++) {
            ConditionFlat memory condition = conditions[i];
            if (
                ((condition.operator >= OPERATOR_AND &&
                    condition.operator <= OPERATOR_NOR) ||
                    condition.paramType == ABI_TYPE_ARRAY) &&
                childrenBounds[i].length > 1
            ) {
                _compatibleSiblingTypes(conditions, i, childrenBounds);
            }
        }

        AbiTypeTree[] memory typeTree = Topology.typeTree(
            conditions,
            0,
            childrenBounds
        );

        if (typeTree[0]._type != ABI_TYPE_CALLDATA) {
            revert UnsuitableRootNode();
        }
    }

    function _compatibleSiblingTypes(
        ConditionFlat[] memory conditions,
        uint256 index,
        Topology.Bounds[] memory childrenBounds
    ) private pure {
        uint256 start = childrenBounds[index].start;
        uint256 end = childrenBounds[index].end;

        for (uint256 j = start + 1; j < end; ++j) {
            if (
                !_isTypeMatch(conditions, start, j, childrenBounds) &&
                !_isTypeEquivalent(conditions, start, j, childrenBounds)
            ) {
                revert UnsuitableChildTypeTree(index);
            }
        }
    }

    function _isTypeMatch(
        ConditionFlat[] memory conditions,
        uint256 i,
        uint256 j,
        Topology.Bounds[] memory childrenBounds
    ) private pure returns (bool) {
        return
            typeTreeId(Topology.typeTree(conditions, i, childrenBounds), 0) ==
            typeTreeId(Topology.typeTree(conditions, j, childrenBounds), 0);
    }

    function _isTypeEquivalent(
        ConditionFlat[] memory conditions,
        uint256 i,
        uint256 j,
        Topology.Bounds[] memory childrenBounds
    ) private pure returns (bool) {
        uint8 leftType = Topology
        .typeTree(conditions, i, childrenBounds)[0]._type;
        return
            (leftType == ABI_TYPE_CALLDATA || leftType == ABI_TYPE_ABI_ENCODED) &&
            Topology.typeTree(conditions, j, childrenBounds)[0]._type ==
            ABI_TYPE_DYNAMIC;
    }

    function typeTreeId(
        AbiTypeTree[] memory typeTree,
        uint256 index
    ) private pure returns (bytes32) {
        AbiTypeTree memory node = typeTree[index];
        uint256 childCount = node.fields.length;
        if (childCount > 0) {
            bytes32[] memory ids = new bytes32[](childCount);
            for (uint256 i = 0; i < childCount; ++i) {
                ids[i] = typeTreeId(typeTree, node.fields[i]);
            }

            return keccak256(abi.encodePacked(node._type, "-", ids));
        } else {
            return bytes32(uint256(node._type));
        }
    }
}
