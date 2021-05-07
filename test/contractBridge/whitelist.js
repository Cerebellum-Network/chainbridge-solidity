/**
 * Copyright 2020 ChainSafe Systems
 * SPDX-License-Identifier: LGPL-3.0-only
 */

const TruffleAssert = require('truffle-assertions');

const BridgeContract = artifacts.require("Bridge");
const TestWhitelistContract = artifacts.require("TestWhitelist");

contract('Bridge - [whitelist]', async accounts => {
    const chainID = 1;
    const initialRelayers = accounts.slice(0, 3);
    const initialRelayerThreshold = 2;

    const adminAccount = accounts[0];
    const genericAccount = accounts[3];
    const testAccount = accounts[4];

    let BridgeInstance;
    let ADMIN_ROLE;
    let WHITELISTER_ROLE;

    beforeEach(async () => {
        BridgeInstance = await BridgeContract.new(chainID, initialRelayers, initialRelayerThreshold, 0, 100);
        ADMIN_ROLE = BridgeInstance.DEFAULT_ADMIN_ROLE;
        WHITELISTER_ROLE = BridgeInstance.WHITELISTER_ROLE;
    });

    // Testing whitelist methods

    it('should be disabled by default', async () => {
        assert.isFalse(await BridgeInstance.isWhitelistEnabled());
    });

    it('should enable whitelist', async () => {
        const enableTx = await BridgeInstance.enableWhitelist();
        TruffleAssert.eventEmitted(enableTx, 'Enabled');
        assert.isTrue(await BridgeInstance.isWhitelistEnabled());
    });

    it('should disable whitelist', async () => {
        await BridgeInstance.enableWhitelist();
        const disableTx = await BridgeInstance.disableWhitelist();
        TruffleAssert.eventEmitted(disableTx, 'Disabled');
        assert.isFalse(await BridgeInstance.isWhitelistEnabled());
    });

    it('should add address to whitelist', async () => {
        assert.isFalse(await BridgeInstance.isWhitelisted(testAccount));
        const addTx = await BridgeInstance.addToWhitelist(testAccount);
        TruffleAssert.eventEmitted(addTx, 'AddressAdded');
        assert.isTrue(await BridgeInstance.isWhitelisted(testAccount));
    });

    it('should remove address from whitelist', async () => {
        await BridgeInstance.addToWhitelist(testAccount);
        const removeTx = await BridgeInstance.removeFromWhitelist(testAccount);
        TruffleAssert.eventEmitted(removeTx, 'AddressRemoved');
        assert.isFalse(await BridgeInstance.isWhitelisted(testAccount));
    });

    it('should require admin or whitelist role to enable whitelist', async () => {
        await TruffleAssert.reverts(BridgeInstance.enableWhitelist({from: genericAccount}),
            "Sender doesn't have Whitelister or Admin role")
    });

    it('should allow admin to enable whitelist', async () => {
        await BridgeInstance.grantRole(ADMIN_ROLE, genericAccount);
        await TruffleAssert.passes(BridgeInstance.enableWhitelist({from: genericAccount}))
    });

    it('should allow whitelister to enable whitelist', async () => {
        await BridgeInstance.grantRole(WHITELISTER_ROLE, genericAccount);
        await TruffleAssert.passes(BridgeInstance.enableWhitelist({from: genericAccount}))
    });

    it('should require admin or whitelist role to disable whitelist', async () => {
        await TruffleAssert.reverts(BridgeInstance.disableWhitelist({from: genericAccount}),
            "Sender doesn't have Whitelister or Admin role")
    });

    it('should allow admin to disable whitelist', async () => {
        await BridgeInstance.enableWhitelist();
        await BridgeInstance.grantRole(ADMIN_ROLE, genericAccount);
        await TruffleAssert.passes(BridgeInstance.disableWhitelist({from: genericAccount}))
    });

    it('should allow whitelister to disable whitelist', async () => {
        await BridgeInstance.enableWhitelist();
        await BridgeInstance.grantRole(WHITELISTER_ROLE, genericAccount);
        await TruffleAssert.passes(BridgeInstance.disableWhitelist({from: genericAccount}))
    });

    it('should require admin or whitelist role to add to whitelist', async () => {
        await TruffleAssert.reverts(BridgeInstance.addToWhitelist(testAccount, {from: genericAccount}),
            "Sender doesn't have Whitelister or Admin role")
    });

    it('should allow admin to add to whitelist', async () => {
        await BridgeInstance.grantRole(ADMIN_ROLE, genericAccount);
        await TruffleAssert.passes(BridgeInstance.addToWhitelist(testAccount, {from: genericAccount}))
    });

    it('should allow whitelister to add to whitelist', async () => {
        await BridgeInstance.grantRole(WHITELISTER_ROLE, genericAccount);
        await TruffleAssert.passes(BridgeInstance.addToWhitelist(testAccount, {from: genericAccount}))
    });

    it('should require admin or whitelist role to remove from whitelist', async () => {
        await TruffleAssert.reverts(BridgeInstance.removeFromWhitelist(testAccount, {from: genericAccount}),
            "Sender doesn't have Whitelister or Admin role")
    });

    it('should allow admin to remove from whitelist', async () => {
        await BridgeInstance.addToWhitelist(testAccount);
        await BridgeInstance.grantRole(ADMIN_ROLE, genericAccount);
        await TruffleAssert.passes(BridgeInstance.removeFromWhitelist(testAccount, {from: genericAccount}))
    });

    it('should allow whitelister to remove from whitelist', async () => {
        await BridgeInstance.addToWhitelist(testAccount);
        await BridgeInstance.grantRole(WHITELISTER_ROLE, genericAccount);
        await TruffleAssert.passes(BridgeInstance.removeFromWhitelist(testAccount, {from: genericAccount}))
    });

    it('should revert if whitelist is already enabled', async () => {
        await BridgeInstance.enableWhitelist();
        await TruffleAssert.reverts(BridgeInstance.enableWhitelist(),
            "Whitelist is already enabled")
    });

    it('should revert if whitelist is already disabled', async () => {
        await TruffleAssert.reverts(BridgeInstance.disableWhitelist(),
            "Whitelist is already disabled")
    });

    it('should revert if address is already added to whitelist', async () => {
        await BridgeInstance.addToWhitelist(testAccount);
        await TruffleAssert.reverts(BridgeInstance.addToWhitelist(testAccount),
            "Address to add is already whitelisted")
    });

    it('should revert if address already removed from whitelist', async () => {
        await BridgeInstance.addToWhitelist(testAccount);
        await BridgeInstance.removeFromWhitelist(testAccount);
        await TruffleAssert.reverts(BridgeInstance.removeFromWhitelist(testAccount),
            "Address to remove is not whitelisted")
    });

    it('should access modified method (when disabled)', async () => {
        const TestInstance = await TestWhitelistContract.new();
        await TruffleAssert.passes(await TestInstance.testWhitelist({from: genericAccount}))
    });

    it('should not access modified method if not whitelisted (when enabled)', async () => {
        const TestInstance = await TestWhitelistContract.new();
        await TestInstance.enableWhitelist()
        // Admin should be whitelisted too
        await TruffleAssert.reverts(TestInstance.testWhitelist({from: adminAccount}),
            "Sender address is not whitelisted")
        await TruffleAssert.reverts(TestInstance.testWhitelist({from: genericAccount}),
            "Sender address is not whitelisted")
    });

    it('should access modified method if whitelisted (when enabled)', async () => {
        const TestInstance = await TestWhitelistContract.new();
        await TestInstance.enableWhitelist()
        await TestInstance.addToWhitelist(genericAccount);
        await TruffleAssert.passes(await TestInstance.testWhitelist({from: genericAccount}))
    });
});
