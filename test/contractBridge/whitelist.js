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

    const adminAccount = accounts[0]
    const genericAccount = accounts[3]
    const testAccount = accounts[4]

    let BridgeInstance;
    let ADMIN_ROLE;
    let WHITELISTER_ROLE;

    beforeEach(async () => {
        BridgeInstance = await BridgeContract.new(chainID, initialRelayers, initialRelayerThreshold, 0, 100);
        ADMIN_ROLE = await BridgeInstance.DEFAULT_ADMIN_ROLE()
        WHITELISTER_ROLE = await BridgeInstance.WHITELISTER_ROLE()
    });

    // Testing whitelist methods

    it('should enable/disable whitelist and emit events', async () => {
        assert.isFalse(await BridgeInstance.isWhitelistEnabled());
        const enableTx = await BridgeInstance.enableWhitelist();
        TruffleAssert.eventEmitted(enableTx, 'WhitelistEnabled');
        assert.isTrue(await BridgeInstance.isWhitelistEnabled());
        const disableTx = await BridgeInstance.disableWhitelist();
        TruffleAssert.eventEmitted(disableTx, 'WhitelistDisabled');
        assert.isFalse(await BridgeInstance.isWhitelistEnabled());
    });

    it('should add/remove whitelisted address and emit events', async () => {
        assert.isFalse(await BridgeInstance.isWhitelisted(testAccount));
        const addTx = await BridgeInstance.addToWhitelist(testAccount);
        TruffleAssert.eventEmitted(addTx, 'WhitelistAddressAdded');
        assert.isTrue(await BridgeInstance.isWhitelisted(testAccount));
        const removeTx = await BridgeInstance.removeFromWhitelist(testAccount);
        TruffleAssert.eventEmitted(removeTx, 'WhitelistAddressRemoved');
        assert.isFalse(await BridgeInstance.isWhitelisted(testAccount));
    });

    it('should require admin or whitelist role to enable/disable whitelist', async () => {
        assert.isTrue(await BridgeInstance.hasRole(ADMIN_ROLE, adminAccount));
        await TruffleAssert.passes(BridgeInstance.enableWhitelist({from: adminAccount}))
        await TruffleAssert.passes(BridgeInstance.disableWhitelist({from: adminAccount}))

        assert.isFalse(await BridgeInstance.hasRole(WHITELISTER_ROLE, genericAccount));
        await TruffleAssert.reverts(BridgeInstance.enableWhitelist({from: genericAccount}),
            "Sender doesn't have Whitelister or Admin role")
        await TruffleAssert.reverts(BridgeInstance.disableWhitelist({from: genericAccount}),
            "Sender doesn't have Whitelister or Admin role")

        await BridgeInstance.grantRole(WHITELISTER_ROLE, genericAccount);
        await TruffleAssert.passes(BridgeInstance.enableWhitelist({from: genericAccount}))
        await TruffleAssert.passes(BridgeInstance.disableWhitelist({from: genericAccount}))
    });

    it('should require admin or whitelist role to operate whitelist', async () => {
        assert.isTrue(await BridgeInstance.hasRole(ADMIN_ROLE, adminAccount));
        await TruffleAssert.passes(BridgeInstance.addToWhitelist(testAccount, {from: adminAccount}))
        await TruffleAssert.passes(BridgeInstance.removeFromWhitelist(testAccount, {from: adminAccount}))

        assert.isFalse(await BridgeInstance.hasRole(WHITELISTER_ROLE, genericAccount));
        await TruffleAssert.reverts(BridgeInstance.addToWhitelist(testAccount, {from: genericAccount}),
            "Sender doesn't have Whitelister or Admin role")
        await TruffleAssert.reverts(BridgeInstance.removeFromWhitelist(testAccount, {from: genericAccount}),
            "Sender doesn't have Whitelister or Admin role")

        await BridgeInstance.grantRole(WHITELISTER_ROLE, genericAccount);
        await TruffleAssert.passes(BridgeInstance.addToWhitelist(testAccount, {from: genericAccount}))
        await TruffleAssert.passes(BridgeInstance.removeFromWhitelist(testAccount, {from: genericAccount}))
    });

    it('should revert if whitelist is already enabled/disabled', async () => {
        await TruffleAssert.reverts(BridgeInstance.disableWhitelist(),
            "Whitelist is already disabled")
        await BridgeInstance.enableWhitelist();
        await TruffleAssert.reverts(BridgeInstance.enableWhitelist(),
            "Whitelist is already enabled")
    });

    it('should revert if whitelisted address already added/removed', async () => {
        await TruffleAssert.reverts(BridgeInstance.removeFromWhitelist(testAccount),
            "Address to remove is not whitelisted")
        await BridgeInstance.addToWhitelist(testAccount);
        await TruffleAssert.reverts(BridgeInstance.addToWhitelist(testAccount),
            "Address to add is already whitelisted")
    });

    it('should apply whitelisting by adding custom modifier to a method', async () => {
        const TestInstance = await TestWhitelistContract.new();
        await TruffleAssert.passes(await TestInstance.testWhitelist({from: adminAccount}))
        await TestInstance.grantRole(WHITELISTER_ROLE, genericAccount);
        await TruffleAssert.passes(await TestInstance.testWhitelist({from: genericAccount}))
        await TruffleAssert.passes(await TestInstance.testWhitelist({from: testAccount}))

        await TestInstance.enableWhitelist()

        await TruffleAssert.reverts(TestInstance.testWhitelist({from: adminAccount}),
            "Sender address is not whitelisted")
        await TruffleAssert.reverts(TestInstance.testWhitelist({from: genericAccount}),
            "Sender address is not whitelisted")
        await TruffleAssert.reverts(TestInstance.testWhitelist({from: testAccount}),
            "Sender address is not whitelisted")

        await TestInstance.addToWhitelist(adminAccount);
        await TruffleAssert.passes(await TestInstance.testWhitelist({from: adminAccount}))
        await TestInstance.addToWhitelist(genericAccount);
        await TruffleAssert.passes(await TestInstance.testWhitelist({from: genericAccount}))
        await TestInstance.addToWhitelist(testAccount);
        await TruffleAssert.passes(await TestInstance.testWhitelist({from: testAccount}))

        await TestInstance.removeFromWhitelist(adminAccount);
        await TruffleAssert.reverts(TestInstance.testWhitelist({from: adminAccount}),
            "Sender address is not whitelisted")
        await TestInstance.removeFromWhitelist(genericAccount);
        await TruffleAssert.reverts(TestInstance.testWhitelist({from: genericAccount}),
            "Sender address is not whitelisted")
        await TestInstance.removeFromWhitelist(testAccount);
        await TruffleAssert.reverts(TestInstance.testWhitelist({from: testAccount}),
            "Sender address is not whitelisted")

        await TestInstance.disableWhitelist()

        await TruffleAssert.passes(await TestInstance.testWhitelist({from: adminAccount}))
        await TruffleAssert.passes(await TestInstance.testWhitelist({from: genericAccount}))
        await TruffleAssert.passes(await TestInstance.testWhitelist({from: testAccount}))
    });
});
