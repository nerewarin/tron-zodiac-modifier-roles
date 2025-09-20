#!/usr/bin/env node

const TronWeb = require('tronweb');
const fetch = require('node-fetch');

// Configuration - adjust these for your friend's setup
const CONFIG = {
  fullHost: 'http://127.0.0.1:9090', // Change port if needed
  privateKey: '0000000000000000000000000000000000000000000000000000000000000001', // Test key
  timeout: 5000
};

class ChainIdDetector {
  constructor() {
    this.tronWeb = new TronWeb({
      fullHost: CONFIG.fullHost,
      privateKey: CONFIG.privateKey
    });
    this.results = [];
  }

  async logResult(method, result, error = null) {
    const status = error ? 'ERROR' : 'SUCCESS';
    const output = error ? error.message : JSON.stringify(result);
    console.log(`${method}: ${status} - ${output}`);
    this.results.push({ method, result, error, status });
  }

  async tryTronWebNodeInfo() {
    try {
      const nodeInfo = await this.tronWeb.trx.getNodeInfo();
      await this.logResult('TronWeb.getNodeInfo()', nodeInfo);
      
      // Try to extract chainId from different possible locations
      if (nodeInfo.config?.chainId) {
        await this.logResult('TronWeb.getNodeInfo().config.chainId', nodeInfo.config.chainId);
      }
      if (nodeInfo.config?.chainIdHex) {
        await this.logResult('TronWeb.getNodeInfo().config.chainIdHex', nodeInfo.config.chainIdHex);
      }
      if (nodeInfo.config?.chainIdNumber) {
        await this.logResult('TronWeb.getNodeInfo().config.chainIdNumber', nodeInfo.config.chainIdNumber);
      }
    } catch (error) {
      await this.logResult('TronWeb.getNodeInfo()', null, error);
    }
  }

  async tryTronWebChainParameters() {
    try {
      const chainParams = await this.tronWeb.trx.getChainParameters();
      await this.logResult('TronWeb.getChainParameters()', chainParams);
      
      // Look for chainId in parameters
      const chainIdParam = chainParams.find(param => 
        param.key && param.key.toLowerCase().includes('chainid')
      );
      if (chainIdParam) {
        await this.logResult('TronWeb.getChainParameters() - chainId param', chainIdParam);
      }
    } catch (error) {
      await this.logResult('TronWeb.getChainParameters()', null, error);
    }
  }

  async tryTronWebGetNowBlock() {
    try {
      const block = await this.tronWeb.trx.getNowBlock();
      await this.logResult('TronWeb.getNowBlock()', block);
      
      // Check if chainId is in block header
      if (block.block_header?.raw_data?.chainId) {
        await this.logResult('TronWeb.getNowBlock().chainId', block.block_header.raw_data.chainId);
      }
    } catch (error) {
      await this.logResult('TronWeb.getNowBlock()', null, error);
    }
  }

  async tryTronWebGetAccount() {
    try {
      const account = await this.tronWeb.trx.getAccount(this.tronWeb.address.fromPrivateKey(CONFIG.privateKey));
      await this.logResult('TronWeb.getAccount()', account);
    } catch (error) {
      await this.logResult('TronWeb.getAccount()', null, error);
    }
  }

  async tryRPCGetNodeInfo() {
    const response = await fetch(`${CONFIG.fullHost}/wallet/getnodeinfo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      await this.logResult('RPC /wallet/getnodeinfo', null, new Error(`HTTP ${response.status}: ${response.statusText}`));
      return;
    }
    
    try {
      const data = await response.json();
      await this.logResult('RPC /wallet/getnodeinfo', data);
      
      // Extract chainId from RPC response
      if (data.config?.chainId) {
        await this.logResult('RPC /wallet/getnodeinfo - config.chainId', data.config.chainId);
      }
    } catch (error) {
      await this.logResult('RPC /wallet/getnodeinfo', null, error);
    }
  }

  async tryRPCGetChainParameters() {
    const response = await fetch(`${CONFIG.fullHost}/wallet/getchainparameters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      await this.logResult('RPC /wallet/getchainparameters', null, new Error(`HTTP ${response.status}: ${response.statusText}`));
      return;
    }
    
    try {
      const data = await response.json();
      await this.logResult('RPC /wallet/getchainparameters', data);
      
      // Look for chainId parameter
      const chainIdParam = data.chainParameter?.find(param => 
        param.key && param.key.toLowerCase().includes('chainid')
      );
      if (chainIdParam) {
        await this.logResult('RPC /wallet/getchainparameters - chainId param', chainIdParam);
      }
    } catch (error) {
      await this.logResult('RPC /wallet/getchainparameters', null, error);
    }
  }

  async tryRPCGetNowBlock() {
    const response = await fetch(`${CONFIG.fullHost}/wallet/getnowblock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      await this.logResult('RPC /wallet/getnowblock', null, new Error(`HTTP ${response.status}: ${response.statusText}`));
      return;
    }
    
    try {
      const data = await response.json();
      await this.logResult('RPC /wallet/getnowblock', data);
      
      // Check for chainId in block
      if (data.block_header?.raw_data?.chainId) {
        await this.logResult('RPC /wallet/getnowblock - chainId', data.block_header.raw_data.chainId);
      }
    } catch (error) {
      await this.logResult('RPC /wallet/getnowblock', null, error);
    }
  }

  async tryEthChainId() {
    const response = await fetch(`${CONFIG.fullHost}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1
      })
    });
    
    if (!response.ok) {
      await this.logResult('RPC eth_chainId', null, new Error(`HTTP ${response.status}: ${response.statusText}`));
      return;
    }
    
    try {
      const data = await response.json();
      await this.logResult('RPC eth_chainId', data);
      
      if (data.result) {
        await this.logResult('RPC eth_chainId - result', data.result);
        await this.logResult('RPC eth_chainId - result (decimal)', parseInt(data.result, 16));
      }
    } catch (error) {
      await this.logResult('RPC eth_chainId', null, error);
    }
  }

  async tryEthNetVersion() {
    const response = await fetch(`${CONFIG.fullHost}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'net_version',
        params: [],
        id: 1
      })
    });
    
    if (!response.ok) {
      await this.logResult('RPC net_version', null, new Error(`HTTP ${response.status}: ${response.statusText}`));
      return;
    }
    
    try {
      const data = await response.json();
      await this.logResult('RPC net_version', data);
      
      if (data.result) {
        await this.logResult('RPC net_version - result', data.result);
      }
    } catch (error) {
      await this.logResult('RPC net_version', null, error);
    }
  }

  async tryTronWebIsConnected() {
    try {
      const isConnected = await this.tronWeb.isConnected();
      await this.logResult('TronWeb.isConnected()', isConnected);
    } catch (error) {
      await this.logResult('TronWeb.isConnected()', null, error);
    }
  }

  async runAllTests() {
    console.log('='.repeat(80));
    console.log('CHAIN ID DETECTION SCRIPT');
    console.log('='.repeat(80));
    console.log(`Testing against: ${CONFIG.fullHost}`);
    console.log(`Timeout: ${CONFIG.timeout}ms`);
    console.log('='.repeat(80));
    console.log();

    // TronWeb methods
    console.log('🔍 TRONWEB METHODS:');
    console.log('-'.repeat(40));
    await this.tryTronWebIsConnected();
    await this.tryTronWebNodeInfo();
    await this.tryTronWebChainParameters();
    await this.tryTronWebGetNowBlock();
    await this.tryTronWebGetAccount();
    console.log();

    // RPC methods
    console.log('🌐 RPC METHODS:');
    console.log('-'.repeat(40));
    await this.tryRPCGetNodeInfo();
    await this.tryRPCGetChainParameters();
    await this.tryRPCGetNowBlock();
    await this.tryEthChainId();
    await this.tryEthNetVersion();
    console.log();

    // Summary
    console.log('📊 SUMMARY:');
    console.log('-'.repeat(40));
    const successful = this.results.filter(r => r.status === 'SUCCESS');
    const failed = this.results.filter(r => r.status === 'ERROR');
    
    console.log(`Total methods tried: ${this.results.length}`);
    console.log(`Successful: ${successful.length}`);
    console.log(`Failed: ${failed.length}`);
    console.log();

    if (successful.length > 0) {
      console.log('✅ SUCCESSFUL METHODS:');
      successful.forEach(r => {
        console.log(`  ${r.method}: ${JSON.stringify(r.result)}`);
      });
    }

    if (failed.length > 0) {
      console.log();
      console.log('❌ FAILED METHODS:');
      failed.forEach(r => {
        console.log(`  ${r.method}: ${r.error.message}`);
      });
    }

    console.log();
    console.log('='.repeat(80));
  }
}

// Run the script
async function main() {
  const detector = new ChainIdDetector();
  await detector.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ChainIdDetector;