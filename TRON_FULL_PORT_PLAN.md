# TRON Full Port Plan - Zodiac Roles Modifier

## 🎯 **Objective**
Complete port of [zodiac-modifier-roles](https://github.com/gnosisguild/zodiac-modifier-roles) to TRON Virtual Machine (TVM) with full functionality.

## 📋 **Contract-by-Contract Porting Strategy**

Based on the [official contracts list](https://github.com/gnosisguild/zodiac-modifier-roles#contracts), we'll port each contract individually with its tests.

### **Main Contracts to Port**
| Contract | Description | Priority | Status |
|----------|-------------|----------|--------|
| **Roles** | Main roles modifier contract | 1 | 🔄 In Progress |
| **Integrity** | Library contract for condition integrity checks | 2 | ⏳ Pending |
| **Packer** | Library contract for optimized condition storage | 3 | ⏳ Pending |
| **MultiSendUnwrapper** | Transaction unwrapper for Safe's MultiSend | 4 | ⏳ Pending |
| ~~AvatarIsOwnerOfERC721~~ | ~~Custom condition for NFT positions~~ | ❌ | **Skipped** |

## 📋 **Phase 1: Foundation Contracts**

### **1.1 Types.sol** ⏳ **PENDING**
**File**: `contracts/Types.sol`
- [ ] Port all enums: `AbiType`, `Operator`, `ExecutionOptions`, `Clearance`
- [ ] Port all structs: `AbiTypeTree`, `Payload`, `ConditionFlat`, `Condition`, `TargetAddress`, `Role`, `Allowance`, `Consumption`
- [ ] **TRON Adaptations**: Update `Ether` → `TRX` in comments
- [ ] **Tests**: Port type validation tests
- [ ] **Status**: ⏳ Ready to start

### **1.2 _Core.sol** ⏳ **PENDING**
**File**: `contracts/_Core.sol`
- [ ] Port base `Core` contract inheriting from `Modifier`
- [ ] Port role and allowance mappings
- [ ] Port abstract functions: `_store()`, `_load()`, `_accruedAllowance()`, `_key()`
- [ ] **TRON Adaptations**: Update address handling for TRON format
- [ ] **Tests**: Port core functionality tests
- [ ] **Status**: ⏳ Depends on Types.sol

### **1.3 Supporting Contracts** ⏳ **PENDING**
**Files**: `contracts/Consumptions.sol`, `contracts/Integrity.sol`, `contracts/WriteOnce.sol`
- [ ] Port consumption tracking logic
- [ ] Port integrity checking system  
- [ ] Port write-once storage pattern
- [ ] **Tests**: Port supporting contract tests
- [ ] **Status**: ⏳ Depends on Types.sol

## 📋 **Phase 2: Permission System Contracts**

### **2.1 PermissionBuilder.sol** ⏳ **PENDING**
**File**: `contracts/PermissionBuilder.sol`
- [ ] Port `_store()` implementation for building permission trees
- [ ] Port condition flattening and tree building logic
- [ ] Port ABI type tree construction
- [ ] **Tests**: Port permission builder tests
- [ ] **Status**: ⏳ Depends on Types.sol and _Core.sol

### **2.2 PermissionChecker.sol** ⏳ **PENDING**
**File**: `contracts/PermissionChecker.sol`
- [ ] Port all 30+ operators (And, Or, EqualTo, GreaterThan, etc.)
- [ ] Port condition evaluation logic
- [ ] Port parameter validation
- [ ] **TRON Adaptations**: Update `EtherWithinAllowance` → `TRXWithinAllowance`
- [ ] **Tests**: Port all operator tests (30+ test files)
- [ ] **Status**: ⏳ Depends on Types.sol

### **2.3 PermissionLoader.sol** ⏳ **PENDING**
**File**: `contracts/PermissionLoader.sol`
- [ ] Port `_load()` implementation for loading permissions
- [ ] Port condition decoding logic
- [ ] Port ABI type tree loading
- [ ] **Tests**: Port permission loader tests
- [ ] **Status**: ⏳ Depends on Types.sol and _Core.sol

### **2.4 AllowanceTracker.sol** ⏳ **PENDING**
**File**: `contracts/AllowanceTracker.sol`
- [ ] Port allowance management system
- [ ] Port time-based refill logic
- [ ] Port balance tracking and consumption
- [ ] **TRON Adaptations**: Replace ETH references with TRX
- [ ] **Tests**: Port allowance tracking tests
- [ ] **Status**: ⏳ Depends on Types.sol

## 📋 **Phase 3: Supporting Infrastructure**

### **3.1 AbiDecoder.sol** ⏳ **PENDING**
**File**: `contracts/AbiDecoder.sol`
- [ ] Port ABI decoding functionality
- [ ] Port parameter extraction logic
- [ ] Port type validation
- [ ] **Tests**: Port ABI decoder tests
- [ ] **Status**: ⏳ Depends on Types.sol

### **3.2 Topology.sol** ⏳ **PENDING**
**File**: `contracts/Topology.sol`
- [ ] Port topology management for complex conditions
- [ ] Port tree traversal logic
- [ ] Port condition validation
- [ ] **Tests**: Port topology tests
- [ ] **Status**: ⏳ Depends on Types.sol

### **3.3 Packer System** ⏳ **PENDING**
**Files**: `contracts/packers/Packer.sol`, `contracts/packers/BufferPacker.sol`
- [ ] Port optimized storage packing
- [ ] Port buffer management
- [ ] Port data compression
- [ ] **Tests**: Port packer tests
- [ ] **Status**: ⏳ Depends on Types.sol

### **3.4 MultiSendUnwrapper** ⏳ **PENDING**
**File**: `contracts/periphery/MultiSendUnwrapper.sol`
- [ ] Port transaction unwrapping for Safe's MultiSend
- [ ] Port batch transaction parsing logic
- [ ] Port validation for MultiSend format
- [ ] **TRON Adaptations**: Update for TRON Safe MultiSend compatibility
- [ ] **Tests**: Port MultiSendUnwrapper tests
- [ ] **Status**: ⏳ Depends on Types.sol

## 📋 **Phase 4: Main Roles Contract**

### **4.1 Roles.sol** 🔄 **IN PROGRESS**
**File**: `contracts/Roles.sol`
- [ ] Replace current simplified version
- [ ] Inherit from all 4 systems: `AllowanceTracker`, `PermissionBuilder`, `PermissionChecker`, `PermissionLoader`
- [ ] Port all original functions with proper authorization
- [ ] **TRON Adaptations**: Update `Ether` → `TRX`, fix data structures
- [ ] **Tests**: Port comprehensive Roles tests
- [ ] **Status**: 🔄 Currently has simplified version

## 📋 **Phase 5: TRON-Specific Adaptations**

### **5.1 Address Format** ⏳ **PENDING**
- [ ] Update all address handling to use TRON Base58Check format
- [ ] Implement proper address validation
- [ ] Update `_key()` function for TRON addresses
- [ ] **Status**: ⏳ Apply to all contracts

### **5.2 Currency Model** ⏳ **PENDING**
- [ ] Replace all `Ether` references with `TRX`
- [ ] Update allowance system for TRON's energy model
- [ ] Consider USDT fee integration
- [ ] **Status**: ⏳ Apply to relevant contracts

### **5.3 Signing System** ⏳ **PENDING**
- [ ] Replace EIP-712 with TIP-712 for TRON
- [ ] Update signature verification logic
- [ ] **Status**: ⏳ Apply to signing-related contracts

## 🎯 **Contract-by-Contract Workflow**

For each contract:
1. **Port Contract** - Copy and adapt from original
2. **Port Tests** - Copy and adapt test suite
3. **Run Tests** - Ensure all tests pass
4. **Update Plan** - Mark contract as completed
5. **Move to Next** - Start next contract

## 📊 **Current Status**

| Contract | Status | Tests | Dependencies |
|----------|--------|-------|--------------|
| Types.sol | ⏳ Ready | ⏳ Pending | None |
| _Core.sol | ⏳ Pending | ⏳ Pending | Types.sol |
| Roles.sol | 🔄 In Progress | ✅ Partial | All others |
| Integrity.sol | ⏳ Pending | ⏳ Pending | Types.sol |
| Packer.sol | ⏳ Pending | ⏳ Pending | Types.sol |
| MultiSendUnwrapper.sol | ⏳ Pending | ⏳ Pending | Types.sol |

## 🚀 **Next Steps**

1. **Start with Types.sol** - Foundation for everything else
2. **Port and test each contract individually**
3. **Update status as we complete each one**
4. **Focus on core functionality first, then TRON adaptations**

This approach ensures we have a working system at each step and can validate our progress incrementally.
