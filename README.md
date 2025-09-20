# Zodiac Roles Modifier for TRON

This is a TRON port of the Zodiac Roles Modifier, providing granular, role-based access control for TRON Safe accounts.

## Overview

The TRON Roles Modifier allows you to:
- Define roles with specific permissions
- Assign modules to roles  
- Control which target addresses each role can interact with
- Execute transactions through role-based authorization

## Quick Start

### 1. Install Dependencies
```bash
yarn install
```

### 2. Set Up Environment
Create a `.env` file with your TRON private key:
```bash
# Create .env file
echo "PRIVATE_KEY=your_actual_private_key_here" > .env
```

**⚠️ Security Note:** Never commit your private key to version control. The `.env` file is already in `.gitignore`.

**Example .env file:**
```bash
# TRON Private Key for deployment and testing
PRIVATE_KEY=your_actual_private_key_here

# Optional: TronScan API Key for contract verification
# Note: Not required for Nile/Shasta testnets, only needed for mainnet
# Get your API key from: https://tronscan.org/#/apikey
# TRONSCAN_API_KEY=your_tronscan_api_key_here

# Optional: Network-specific private keys
# PRIVATE_KEY_NILE=your_nile_private_key_here
# PRIVATE_KEY_SHASTA=your_shasta_private_key_here
# PRIVATE_KEY_MAINNET=your_mainnet_private_key_here

# Optional: TRON Full Node URL (defaults to Nile testnet)
# TRON_FULL_NODE=https://nile.trongrid.io
```

**🔑 TronScan API Key (Optional for Testnets):**
- **Nile/Shasta Testnets**: No API key required (as per [TRON Developer docs](https://developers.tron.network/reference/select-network))
- **Mainnet**: API key recommended for higher rate limits
- Get API key from: [TronScan API Keys](https://tronscan.org/#/apikey)

### 3. Compile Contracts
```bash
yarn build
```

### 4. Run Tests
```bash
yarn test
```

### 5. Deploy to TRON Networks

#### Deploy to Nile Testnet
```bash
yarn deploy:nile
```

#### Deploy to Shasta Testnet
```bash
yarn deploy:shasta
```

#### Deploy to Mainnet
```bash
yarn deploy:mainnet
```

### 6. Contract Verification

Contracts are automatically verified on TronScan during deployment if you have a TronScan API key configured.

#### Manual Verification
If automatic verification fails or you want to verify manually:

```bash
# Verify the deployed contract
yarn verify:nile

# Or verify with custom parameters
yarn verify <contract-address> Roles
```

#### Verification Status
Check verification status on TronScan:
- **Nile Testnet**: https://nile.tronscan.org/#/contract/THBVL3AArJYMbnBKd4y3tKuEkvRSrMzKN6
- **Shasta Testnet**: https://shasta.tronscan.org/#/contract/YOUR_CONTRACT_ADDRESS
- **Mainnet**: https://tronscan.org/#/contract/YOUR_CONTRACT_ADDRESS

## TRON-Specific Features

This full Zodiac Roles implementation has been adapted for TRON with:

- **Complete Permission System**: Full granular role-based access control with complex conditions
- **TRON Compatibility**: Works with TRON Safe and TRX transfers
- **Enum Compatibility**: Fixed enum issues for TronWeb compatibility
- **TronBox Integration**: Native TRON deployment and testing

## About the Roles Modifier

This modifier allows avatars to enforce granular, role-based, permissions for attached modules.

Modules that have been granted a role are able to unilaterally make calls to any approved addresses, approved functions, and using approved parameters.

The interface mirrors the relevant parts of the Safe's interface, so this contract can be placed between Safe modules and the Safe itself to enforce role-based permissions.

The contracts have been developed with [Solidity 0.8.24](https://github.com/ethereum/solidity/releases/tag/v0.8.24) targeting evm version cancun for TRON compatibility.

## Features

- Create multiple roles
- Assign roles to addresses
- Allow roles access to call, delegate call, and/or send to address
- Scope which functions a role can call on given address
- Define conditions on function parameters

## Flow

- Define a role by setting targets, functions, and parameters that it can call
- Assign the role to an address with `assignRoles()`
- Address can now trigger the safe to call those targets, functions, and parameters via `execTransactionWithRole()`

## Usage

### 1. Deploy the Module
```javascript
const roles = await Roles.new(owner, avatar, target);
```

### 2. Generate Role Keys
```javascript
// Generate role keys using keccak256 hash
const ROLE_KEY = "0x" + web3.utils.keccak256("MY_ROLE").slice(2);
const ADMIN_ROLE = "0x" + web3.utils.keccak256("ADMIN").slice(2);
```

### 3. Enable Module and Assign Roles
```javascript
// Enable a module (e.g., another Zodiac module)
await roles.enableModule(moduleAddress, { from: owner });

// Assign roles to the module
await roles.assignRoles(
  moduleAddress,
  [ROLE_KEY, ADMIN_ROLE],
  [true, false], // module has ROLE_KEY, not ADMIN_ROLE
  { from: owner }
);

// Set default role for the module
await roles.setDefaultRole(moduleAddress, ROLE_KEY, { from: owner });
```

### 4. Configure Permissions
```javascript
// Allow role to call specific target
await roles.scopeTarget(ROLE_KEY, targetAddress, { from: owner });

// Allow role to call specific function on target
await roles.scopeFunction(
  ROLE_KEY,
  targetAddress,
  functionSelector,
  { from: owner }
);

// Set execution options (call, delegatecall, or both)
await roles.scopeExecutionOptions(
  ROLE_KEY,
  targetAddress,
  ExecutionOptions.Both, // Allow both call and delegatecall
  { from: owner }
);
```

### 5. Execute Transactions
```javascript
// Using default role (set with setDefaultRole)
await roles.execTransactionFromModule(
  targetAddress,
  value,
  data,
  operation,
  { from: moduleAddress }
);

// Using specific role
await roles.execTransactionWithRole(
  targetAddress,
  value,
  data,
  operation,
  ROLE_KEY,
  { from: moduleAddress }
);
```

## Integration with TRON Safe

1. Deploy the TRON Safe contract
2. Deploy this Roles module
3. Enable the Roles module on the Safe
4. Configure roles and permissions
5. Other modules can now execute transactions through role-based authorization

## Security Model

- **Role-based Access**: Modules must have specific roles to execute transactions
- **Target Restrictions**: Each role can only interact with pre-approved target addresses
- **Owner Control**: Only the owner can modify roles and permissions
- **Module Authorization**: Only enabled modules can execute transactions

## API Reference

### Core Functions

- `assignRoles(module, roleKeys, memberOf)`: Assign/revoke roles for a module
- `setDefaultRole(module, roleKey)`: Set default role for a module
- `scopeTarget(roleKey, target)`: Allow role to call specific target
- `scopeFunction(roleKey, target, functionSelector)`: Allow role to call specific function
- `scopeExecutionOptions(roleKey, target, options)`: Set execution options (call/delegatecall)
- `execTransactionFromModule(to, value, data, operation)`: Execute with default role
- `execTransactionWithRole(to, value, data, operation, roleKey)`: Execute with specific role

### View Functions

- `hasRole(module, roleKey)`: Check if module has role
- `isTargetAllowed(target, roleKey)`: Check if target is allowed for role
- `defaultRoles(module)`: Get default role for module
- `getTargetAllowance(roleKey, target)`: Get allowance for role-target combination

## Network Configuration

- **Mainnet**: https://api.trongrid.io
- **Nile Testnet**: https://nile.trongrid.io  
- **Shasta Testnet**: https://api.shasta.trongrid.io

## Development

### Console Access
```bash
yarn console
```

### Contract Verification
After deployment, verify contracts on TronScan using the deployment address.

## Differences from Ethereum Version

This TRON version is simplified compared to the full Zodiac Roles implementation:

- **No Complex Conditions**: Simplified to basic role and target permissions
- **No Allowance Tracking**: Removed complex allowance and consumption tracking
- **No ABI Decoding**: Simplified permission checking
- **TRON Optimized**: Designed specifically for TRON's energy model

## Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

## License

Created under the [LGPL-3.0+ license](LICENSE).
